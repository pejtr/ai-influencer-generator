import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  funnelCampaigns,
  funnelKeywords,
  funnelMessages,
  funnelEvents,
} from "../drizzle/schema";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

// ── Keyword matching logic (shared with frontend simulation) ──────────────────
export function matchesKeyword(
  comment: string,
  keyword: string,
  matchType: "exact" | "contains" | "starts_with",
  caseSensitive: boolean
): boolean {
  const c = caseSensitive ? comment : comment.toLowerCase();
  const k = caseSensitive ? keyword : keyword.toLowerCase();
  if (matchType === "exact") return c === k;
  if (matchType === "starts_with") return c.startsWith(k);
  return c.includes(k);
}

// ── Template variable substitution ───────────────────────────────────────────
export function renderMessage(
  template: string,
  vars: { name?: string; keyword?: string; link?: string }
): string {
  return template
    .replace(/\{name\}/g, vars.name || "there")
    .replace(/\{keyword\}/g, vars.keyword || "")
    .replace(/\{link\}/g, vars.link || "");
}

export const commentFunnelRouter = router({
  // ── Campaigns ──────────────────────────────────────────────────────────────
  getCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const d = await db();
    return d
      .select()
      .from(funnelCampaigns)
      .where(eq(funnelCampaigns.userId, ctx.user.id))
      .orderBy(desc(funnelCampaigns.createdAt));
  }),

  createCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        platform: z.enum(["instagram", "tiktok", "youtube", "facebook", "twitter"]),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      await d.insert(funnelCampaigns).values({
        userId: ctx.user.id,
        name: input.name,
        platform: input.platform,
        description: input.description ?? null,
        status: "draft",
      });
      const [campaign] = await d
        .select()
        .from(funnelCampaigns)
        .where(eq(funnelCampaigns.userId, ctx.user.id))
        .orderBy(desc(funnelCampaigns.createdAt))
        .limit(1);
      return campaign;
    }),

  updateCampaign: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        status: z.enum(["active", "paused", "draft"]).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      const { id, ...updates } = input;
      await d
        .update(funnelCampaigns)
        .set(updates)
        .where(and(eq(funnelCampaigns.id, id), eq(funnelCampaigns.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteCampaign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      await d
        .delete(funnelEvents)
        .where(and(eq(funnelEvents.campaignId, input.id), eq(funnelEvents.userId, ctx.user.id)));
      await d
        .delete(funnelMessages)
        .where(and(eq(funnelMessages.campaignId, input.id), eq(funnelMessages.userId, ctx.user.id)));
      await d
        .delete(funnelKeywords)
        .where(and(eq(funnelKeywords.campaignId, input.id), eq(funnelKeywords.userId, ctx.user.id)));
      await d
        .delete(funnelCampaigns)
        .where(and(eq(funnelCampaigns.id, input.id), eq(funnelCampaigns.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Keywords ───────────────────────────────────────────────────────────────
  getKeywords: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const d = await db();
      return d
        .select()
        .from(funnelKeywords)
        .where(
          and(
            eq(funnelKeywords.campaignId, input.campaignId),
            eq(funnelKeywords.userId, ctx.user.id)
          )
        )
        .orderBy(funnelKeywords.createdAt);
    }),

  addKeyword: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        keyword: z.string().min(1).max(100),
        matchType: z.enum(["exact", "contains", "starts_with"]).default("contains"),
        caseSensitive: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      await d.insert(funnelKeywords).values({
        campaignId: input.campaignId,
        userId: ctx.user.id,
        keyword: input.keyword,
        matchType: input.matchType,
        caseSensitive: input.caseSensitive,
      });
      return { success: true };
    }),

  deleteKeyword: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      await d
        .delete(funnelKeywords)
        .where(and(eq(funnelKeywords.id, input.id), eq(funnelKeywords.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Messages ───────────────────────────────────────────────────────────────
  getMessages: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const d = await db();
      return d
        .select()
        .from(funnelMessages)
        .where(
          and(
            eq(funnelMessages.campaignId, input.campaignId),
            eq(funnelMessages.userId, ctx.user.id)
          )
        )
        .orderBy(funnelMessages.messageType, funnelMessages.delayMinutes);
    }),

  saveMessage: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        campaignId: z.number(),
        messageType: z.enum(["initial_dm", "follow_up", "conversion"]),
        content: z.string().min(1).max(2000),
        delayMinutes: z.number().min(0).max(10080).default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      if (input.id) {
        await d
          .update(funnelMessages)
          .set({
            content: input.content,
            messageType: input.messageType,
            delayMinutes: input.delayMinutes,
            isActive: input.isActive,
          })
          .where(
            and(eq(funnelMessages.id, input.id), eq(funnelMessages.userId, ctx.user.id))
          );
      } else {
        await d.insert(funnelMessages).values({
          campaignId: input.campaignId,
          userId: ctx.user.id,
          messageType: input.messageType,
          content: input.content,
          delayMinutes: input.delayMinutes,
          isActive: input.isActive,
        });
      }
      return { success: true };
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      await d
        .delete(funnelMessages)
        .where(and(eq(funnelMessages.id, input.id), eq(funnelMessages.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Simulation ─────────────────────────────────────────────────────────────
  simulateTrigger: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        commentText: z.string().min(1),
        commenterName: z.string().default("TestUser"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      // Get keywords for this campaign
      const keywords = await d
        .select()
        .from(funnelKeywords)
        .where(
          and(
            eq(funnelKeywords.campaignId, input.campaignId),
            eq(funnelKeywords.userId, ctx.user.id)
          )
        );

      // Find matching keyword
      const matched = keywords.find((kw) =>
        matchesKeyword(
          input.commentText,
          kw.keyword,
          kw.matchType as "exact" | "contains" | "starts_with",
          kw.caseSensitive
        )
      );

      if (!matched) {
        return { triggered: false, matchedKeyword: null, messages: [] };
      }

      // Get messages for this campaign
      const messages = await d
        .select()
        .from(funnelMessages)
        .where(
          and(
            eq(funnelMessages.campaignId, input.campaignId),
            eq(funnelMessages.userId, ctx.user.id),
            eq(funnelMessages.isActive, true)
          )
        )
        .orderBy(funnelMessages.messageType, funnelMessages.delayMinutes);

      const renderedMessages = messages.map((msg) => ({
        ...msg,
        rendered: renderMessage(msg.content, {
          name: input.commenterName,
          keyword: matched.keyword,
          link: "https://yourlink.com/guide",
        }),
      }));

      // Log simulation event
      await d.insert(funnelEvents).values({
        campaignId: input.campaignId,
        userId: ctx.user.id,
        eventType: "comment_detected",
        commenterName: input.commenterName,
        triggerKeyword: matched.keyword,
        metadata: { simulated: true, commentText: input.commentText },
      });

      // Update campaign trigger count
      await d
        .update(funnelCampaigns)
        .set({ triggerCount: sql`${funnelCampaigns.triggerCount} + 1` })
        .where(eq(funnelCampaigns.id, input.campaignId));

      return {
        triggered: true,
        matchedKeyword: matched.keyword,
        matchType: matched.matchType,
        messages: renderedMessages,
      };
    }),

  // ── Analytics ──────────────────────────────────────────────────────────────
  getCampaignAnalytics: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ ctx, input }) => {
      const d = await db();
      const events = await d
        .select()
        .from(funnelEvents)
        .where(
          and(
            eq(funnelEvents.campaignId, input.campaignId),
            eq(funnelEvents.userId, ctx.user.id)
          )
        )
        .orderBy(desc(funnelEvents.createdAt))
        .limit(100);

      const campaign = await d
        .select()
        .from(funnelCampaigns)
        .where(
          and(
            eq(funnelCampaigns.id, input.campaignId),
            eq(funnelCampaigns.userId, ctx.user.id)
          )
        )
        .limit(1);

      const byType = events.reduce(
        (acc, e) => {
          acc[e.eventType] = (acc[e.eventType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const keywordCounts = events
        .filter((e) => e.triggerKeyword)
        .reduce(
          (acc, e) => {
            const kw = e.triggerKeyword!;
            acc[kw] = (acc[kw] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

      const topKeywords = Object.entries(keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

      const conversionRate =
        byType["comment_detected"] > 0
          ? ((byType["converted"] || 0) / byType["comment_detected"]) * 100
          : 0;

      return {
        campaign: campaign[0] ?? null,
        totalTriggers: byType["comment_detected"] || 0,
        totalDmsSent: byType["dm_sent"] || 0,
        totalConversions: byType["converted"] || 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
        topKeywords,
        recentEvents: events.slice(0, 20),
      };
    }),

  getOverallStats: protectedProcedure.query(async ({ ctx }) => {
    const d = await db();
    const campaigns = await d
      .select()
      .from(funnelCampaigns)
      .where(eq(funnelCampaigns.userId, ctx.user.id));

    const totalTriggers = campaigns.reduce((s, c) => s + c.triggerCount, 0);
    const totalDms = campaigns.reduce((s, c) => s + c.dmSentCount, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversionCount, 0);
    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalTriggers,
      totalDms,
      totalConversions,
      overallConversionRate:
        totalTriggers > 0 ? Math.round((totalConversions / totalTriggers) * 1000) / 10 : 0,
    };
  }),
});
