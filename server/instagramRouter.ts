/**
 * Instagram Graph API Integration Router
 *
 * Handles:
 * 1. OAuth connection (Facebook Login → Page Access Token)
 * 2. tRPC procedures for managing Instagram connection
 * 3. Webhook endpoint registration (via Express, not tRPC)
 * 4. Private Replies DM sending
 *
 * API Reference:
 * - Private Replies: POST /<PAGE_ID>/messages with recipient.comment_id
 * - Webhooks: GET/POST /api/instagram/webhook
 * - Token Exchange: GET https://graph.facebook.com/oauth/access_token
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { instagramConnections, instagramDmLogs, funnelCampaigns, funnelKeywords, funnelMessages, funnelEvents } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaPageInfo {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
}

interface InstagramCommentWebhookEntry {
  id: string; // Page ID
  time: number;
  changes: Array<{
    field: "comments" | "live_comments";
    value: {
      from: { id: string; username: string };
      media: { id: string; media_product_type: string };
      id: string; // Comment ID
      text: string;
      ad_id?: string;
      ad_title?: string;
    };
  }>;
}

// ── Helper: Exchange short-lived token for long-lived ─────────────────────────
export async function exchangeForLongLivedToken(
  shortToken: string,
  appId: string,
  appSecret: string
): Promise<{ token: string; expiresIn: number }> {
  const url = new URL("https://graph.facebook.com/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  const data = (await res.json()) as MetaTokenResponse;
  return {
    token: data.access_token,
    expiresIn: data.expires_in ?? 5183944, // ~60 days default
  };
}

// ── Helper: Get Facebook Pages with Instagram accounts ────────────────────────
export async function getPagesWithInstagram(
  userAccessToken: string
): Promise<MetaPageInfo[]> {
  const url = new URL("https://graph.facebook.com/me/accounts");
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");
  url.searchParams.set("access_token", userAccessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch pages: ${err}`);
  }
  const data = await res.json() as { data: MetaPageInfo[] };
  return (data.data ?? []).filter((p) => p.instagram_business_account);
}

// ── Helper: Subscribe page to Instagram webhooks ──────────────────────────────
export async function subscribePageToWebhooks(
  pageId: string,
  pageAccessToken: string
): Promise<boolean> {
  const url = `https://graph.facebook.com/${pageId}/subscribed_apps`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscribed_fields: ["comments", "live_comments"],
      access_token: pageAccessToken,
    }),
  });
  if (!res.ok) return false;
  const data = await res.json() as { success?: boolean };
  return data.success === true;
}

// ── Helper: Send Private Reply DM ─────────────────────────────────────────────
export async function sendPrivateReply(
  pageId: string,
  pageAccessToken: string,
  commentId: string,
  messageText: string
): Promise<{ messageId: string; recipientId: string }> {
  const url = `https://graph.facebook.com/${pageId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text: messageText },
      access_token: pageAccessToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Private reply failed (${res.status}): ${err}`);
  }

  const data = await res.json() as { message_id: string; recipient_id: string };
  return {
    messageId: data.message_id,
    recipientId: data.recipient_id,
  };
}

// ── Helper: Match keyword against comment ─────────────────────────────────────
function matchKeyword(
  commentText: string,
  keyword: string,
  matchType: string,
  caseSensitive: boolean
): boolean {
  const text = caseSensitive ? commentText : commentText.toLowerCase();
  const kw = caseSensitive ? keyword : keyword.toLowerCase();
  if (matchType === "exact") return text.trim() === kw;
  if (matchType === "starts_with") return text.trimStart().startsWith(kw);
  return text.includes(kw); // contains (default)
}

// ── Helper: Render DM template ────────────────────────────────────────────────
function renderTemplate(
  template: string,
  vars: { name?: string; keyword?: string; link?: string }
): string {
  return template
    .replace(/\{name\}/g, vars.name ?? "there")
    .replace(/\{keyword\}/g, vars.keyword ?? "")
    .replace(/\{link\}/g, vars.link ?? "");
}

// ── Main webhook processor (called from Express route) ────────────────────────
export async function processInstagramWebhook(
  body: { object: string; entry: InstagramCommentWebhookEntry[] }
): Promise<void> {
  if (body.object !== "instagram") return;

  const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();

  for (const entry of body.entry) {
    const pageId = entry.id;

    // Find the connection for this page
    const [connection] = await db
      .select()
      .from(instagramConnections)
      .where(and(eq(instagramConnections.pageId, pageId), eq(instagramConnections.isActive, true)))
      .limit(1);

    if (!connection) {
      console.log(`[Instagram Webhook] No active connection for page ${pageId}`);
      continue;
    }

    for (const change of entry.changes) {
      if (change.field !== "comments" && change.field !== "live_comments") continue;

      const { from, id: commentId, text: commentText } = change.value;

      // Log comment detection event
      await db.insert(funnelEvents).values({
        campaignId: 0, // Will be updated when campaign matches
        userId: connection.userId,
        eventType: "comment_detected",
        commenterName: from.username,
        triggerKeyword: null,
        metadata: { commentId, commentText, pageId },
      }).catch(() => {}); // Non-critical

      // Find active campaigns for this user
      const campaigns = await db
        .select()
        .from(funnelCampaigns)
        .where(
          and(
            eq(funnelCampaigns.userId, connection.userId),
            eq(funnelCampaigns.status, "active"),
            eq(funnelCampaigns.platform, "instagram")
          )
        );

      for (const campaign of campaigns) {
        // Get keywords for this campaign
        const keywords = await db
          .select()
          .from(funnelKeywords)
          .where(eq(funnelKeywords.campaignId, campaign.id));

        // Find first matching keyword
        const matched = keywords.find((kw: typeof keywords[0]) =>
          matchKeyword(commentText, kw.keyword, kw.matchType, kw.caseSensitive)
        );

        if (!matched) continue;

        // Check if we already sent a DM for this comment (dedup)
        const existing = await db
          .select({ id: instagramDmLogs.id })
          .from(instagramDmLogs)
          .where(eq(instagramDmLogs.commentId, commentId))
          .limit(1);

        if (existing.length > 0) {
          console.log(`[Instagram Webhook] Already processed comment ${commentId}, skipping`);
          continue;
        }

        // Get initial DM message template
        const [message] = await db
          .select()
          .from(funnelMessages)
          .where(
            and(
              eq(funnelMessages.campaignId, campaign.id),
              eq(funnelMessages.messageType, "initial_dm"),
              eq(funnelMessages.isActive, true)
            )
          )
          .limit(1);

        if (!message) {
          console.log(`[Instagram Webhook] No active initial_dm message for campaign ${campaign.id}`);
          continue;
        }

        // Render the DM template
        const renderedDm = renderTemplate(message.content, {
          name: from.username,
          keyword: matched.keyword,
          link: "", // User sets their link in the template directly
        });

        // Send the Private Reply
        let dmStatus: "sent" | "failed" = "sent";
        let dmMessageId: string | undefined;
        let dmRecipientId: string | undefined;
        let dmError: string | undefined;

        try {
          const result = await sendPrivateReply(
            pageId,
            connection.pageAccessToken,
            commentId,
            renderedDm
          );
          dmMessageId = result.messageId;
          dmRecipientId = result.recipientId;
          console.log(`[Instagram Webhook] DM sent to ${from.username} (comment: ${commentId})`);
        } catch (err) {
          dmStatus = "failed";
          dmError = err instanceof Error ? err.message : String(err);
          console.error(`[Instagram Webhook] DM failed for comment ${commentId}:`, dmError);
        }

        // Log the DM attempt
        await db.insert(instagramDmLogs).values({
          userId: connection.userId,
          campaignId: campaign.id,
          commentId,
          commentText,
          commenterUsername: from.username,
          commenterInstagramId: from.id,
          triggerKeyword: matched.keyword,
          dmContent: renderedDm,
          messageId: dmMessageId,
          recipientId: dmRecipientId,
          status: dmStatus,
          errorMessage: dmError,
        });

        // Log funnel event
        if (dmStatus === "sent") {
          await db.insert(funnelEvents).values({
            campaignId: campaign.id,
            userId: connection.userId,
            eventType: "dm_sent",
            commenterName: from.username,
            triggerKeyword: matched.keyword,
            messageId: message.id,
            metadata: { commentId, dmMessageId },
          }).catch(() => {});

          // Update campaign counters
          await db
            .update(funnelCampaigns)
            .set({
              triggerCount: campaign.triggerCount + 1,
              dmSentCount: campaign.dmSentCount + 1,
            })
            .where(eq(funnelCampaigns.id, campaign.id))
            .catch(() => {});
        }

        // Only process first matching campaign per comment
        break;
      }
    }
  }
}

// ── tRPC Router ───────────────────────────────────────────────────────────────
export const instagramRouter = router({
  // Get current Instagram connection status
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();
    const [connection] = await db
      .select({
        id: instagramConnections.id,
        pageId: instagramConnections.pageId,
        pageName: instagramConnections.pageName,
        instagramAccountId: instagramConnections.instagramAccountId,
        instagramUsername: instagramConnections.instagramUsername,
        webhookSubscribed: instagramConnections.webhookSubscribed,
        tokenExpiresAt: instagramConnections.tokenExpiresAt,
        isActive: instagramConnections.isActive,
        createdAt: instagramConnections.createdAt,
      })
      .from(instagramConnections)
      .where(eq(instagramConnections.userId, ctx.user.id))
      .limit(1);

    return connection ?? null;
  }),

  // Exchange Facebook OAuth code for Page Access Token and save connection
  connectWithToken: protectedProcedure
    .input(z.object({
      userAccessToken: z.string().min(1),
      appId: z.string().min(1),
      appSecret: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();

      // Get pages with Instagram accounts
      const pages = await getPagesWithInstagram(input.userAccessToken).catch((err) => {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Failed to fetch pages: ${err.message}` });
      });

      if (pages.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No Facebook Pages with connected Instagram professional accounts found. Make sure your Instagram account is a Business or Creator account linked to a Facebook Page.",
        });
      }

      // Use first page (most common case) — UI can allow selection later
      const page = pages[0];

      // Exchange for long-lived token
      const { token: longLivedToken, expiresIn } = await exchangeForLongLivedToken(
        page.access_token,
        input.appId,
        input.appSecret
      ).catch((err) => {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Token exchange failed: ${err.message}` });
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      const verifyToken = crypto.randomBytes(32).toString("hex");

      // Upsert connection
      const existing = await db
        .select({ id: instagramConnections.id })
        .from(instagramConnections)
        .where(eq(instagramConnections.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(instagramConnections)
          .set({
            pageId: page.id,
            pageName: page.name,
            instagramAccountId: page.instagram_business_account?.id,
            instagramUsername: page.instagram_business_account?.username,
            pageAccessToken: longLivedToken,
            tokenExpiresAt: expiresAt,
            webhookVerifyToken: verifyToken,
            isActive: true,
          })
          .where(eq(instagramConnections.userId, ctx.user.id));
      } else {
        await db.insert(instagramConnections).values({
          userId: ctx.user.id,
          pageId: page.id,
          pageName: page.name,
          instagramAccountId: page.instagram_business_account?.id,
          instagramUsername: page.instagram_business_account?.username,
          pageAccessToken: longLivedToken,
          tokenExpiresAt: expiresAt,
          webhookVerifyToken: verifyToken,
          webhookSubscribed: false,
          isActive: true,
        });
      }

      // Try to subscribe to webhooks
      const subscribed = await subscribePageToWebhooks(page.id, longLivedToken).catch(() => false);

      if (subscribed) {
        await db
          .update(instagramConnections)
          .set({ webhookSubscribed: true })
          .where(eq(instagramConnections.userId, ctx.user.id));
      }

      return {
        success: true,
        pageName: page.name,
        instagramUsername: page.instagram_business_account?.username,
        webhookSubscribed: subscribed,
        webhookVerifyToken: verifyToken,
        pages: pages.map((p) => ({
          id: p.id,
          name: p.name,
          instagramUsername: p.instagram_business_account?.username,
        })),
      };
    }),

  // Save connection using Page Access Token directly (simpler flow)
  saveDirectToken: protectedProcedure
    .input(z.object({
      pageId: z.string().min(1),
      pageName: z.string().min(1),
      pageAccessToken: z.string().min(1),
      instagramAccountId: z.string().optional(),
      instagramUsername: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();
      const verifyToken = crypto.randomBytes(32).toString("hex");
      // Token expires in ~60 days
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      const existing = await db
        .select({ id: instagramConnections.id })
        .from(instagramConnections)
        .where(eq(instagramConnections.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(instagramConnections)
          .set({
            pageId: input.pageId,
            pageName: input.pageName,
            pageAccessToken: input.pageAccessToken,
            instagramAccountId: input.instagramAccountId,
            instagramUsername: input.instagramUsername,
            tokenExpiresAt: expiresAt,
            webhookVerifyToken: verifyToken,
            isActive: true,
          })
          .where(eq(instagramConnections.userId, ctx.user.id));
      } else {
        await db.insert(instagramConnections).values({
          userId: ctx.user.id,
          pageId: input.pageId,
          pageName: input.pageName,
          pageAccessToken: input.pageAccessToken,
          instagramAccountId: input.instagramAccountId,
          instagramUsername: input.instagramUsername,
          tokenExpiresAt: expiresAt,
          webhookVerifyToken: verifyToken,
          webhookSubscribed: false,
          isActive: true,
        });
      }

      // Try to subscribe to webhooks
      const subscribed = await subscribePageToWebhooks(input.pageId, input.pageAccessToken).catch(() => false);
      if (subscribed) {
        await db
          .update(instagramConnections)
          .set({ webhookSubscribed: true })
          .where(eq(instagramConnections.userId, ctx.user.id));
      }

      return {
        success: true,
        webhookSubscribed: subscribed,
        webhookVerifyToken: verifyToken,
        webhookCallbackUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL ? "https://ai-influencer.manus.space" : "https://ai-influencer.manus.space"}/api/instagram/webhook`,
      };
    }),

  // Disconnect Instagram
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();
    await db
      .update(instagramConnections)
      .set({ isActive: false })
      .where(eq(instagramConnections.userId, ctx.user.id));
    return { success: true };
  }),

  // Get DM logs for a campaign
  getDmLogs: protectedProcedure
    .input(z.object({
      campaignId: z.number().int().positive(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();
      const logs = await db
        .select()
        .from(instagramDmLogs)
        .where(
          and(
            eq(instagramDmLogs.userId, ctx.user.id),
            eq(instagramDmLogs.campaignId, input.campaignId)
          )
        )
        .orderBy(desc(instagramDmLogs.createdAt))
        .limit(input.limit);
      return logs;
    }),

  // Get overall DM stats
  getDmStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();
    const logs = await db
      .select()
      .from(instagramDmLogs)
      .where(eq(instagramDmLogs.userId, ctx.user.id));

    const total = logs.length;
    const sent = logs.filter((l: typeof logs[0]) => l.status === "sent").length;
    const failed = logs.filter((l: typeof logs[0]) => l.status === "failed").length;
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

    return { total, sent, failed, successRate };
  }),

  // Test DM sending (sends a test DM to verify the connection works)
  testDm: protectedProcedure
    .input(z.object({
      commentId: z.string().min(1, "Comment ID is required"),
      message: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();
      const [connection] = await db
        .select()
        .from(instagramConnections)
        .where(
          and(
            eq(instagramConnections.userId, ctx.user.id),
            eq(instagramConnections.isActive, true)
          )
        )
        .limit(1);

      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active Instagram connection found. Please connect your Instagram account first.",
        });
      }

      const result = await sendPrivateReply(
        connection.pageId,
        connection.pageAccessToken,
        input.commentId,
        input.message
      ).catch((err) => {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      });

      return { success: true, messageId: result.messageId, recipientId: result.recipientId };
    }),

  // Get webhook setup instructions
  getWebhookSetup: protectedProcedure.query(async ({ ctx }) => {
    const db = await (async () => { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; })();
    const [connection] = await db
      .select({
        webhookVerifyToken: instagramConnections.webhookVerifyToken,
        webhookSubscribed: instagramConnections.webhookSubscribed,
        pageName: instagramConnections.pageName,
        instagramUsername: instagramConnections.instagramUsername,
      })
      .from(instagramConnections)
      .where(eq(instagramConnections.userId, ctx.user.id))
      .limit(1);

    return {
      callbackUrl: "https://ai-influencer.manus.space/api/instagram/webhook",
      verifyToken: connection?.webhookVerifyToken ?? null,
      webhookSubscribed: connection?.webhookSubscribed ?? false,
      pageName: connection?.pageName ?? null,
      instagramUsername: connection?.instagramUsername ?? null,
      steps: [
        "Go to developers.facebook.com → Your App → Webhooks",
        "Add Instagram product if not added",
        "Set Callback URL to the value above",
        "Set Verify Token to the value above",
        "Subscribe to 'comments' and 'live_comments' fields",
        "Save and verify — the webhook will be confirmed automatically",
      ],
    };
  }),
});
