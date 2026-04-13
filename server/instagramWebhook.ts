/**
 * Instagram Webhook Express Handler
 *
 * Registers two routes on the Express app:
 *   GET  /api/instagram/webhook  → webhook verification (hub.challenge)
 *   POST /api/instagram/webhook  → comment event processing → DM sending
 *
 * Security: verifies X-Hub-Signature-256 header using the Meta App Secret.
 * The App Secret must be set as INSTAGRAM_APP_SECRET environment variable.
 */

import { Express, Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import { instagramConnections } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { processInstagramWebhook } from "./instagramRouter";

// ── Signature verification ────────────────────────────────────────────────────
function verifySignature(rawBody: Buffer, signature: string, appSecret: string): boolean {
  if (!signature.startsWith("sha256=")) return false;
  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  const received = signature.slice(7); // Remove "sha256=" prefix
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

// ── Register Instagram webhook routes ─────────────────────────────────────────
export function registerInstagramWebhookRoutes(app: Express): void {
  /**
   * GET /api/instagram/webhook
   * Meta sends this to verify the webhook endpoint during setup.
   * We verify the hub.verify_token matches what we stored for any user,
   * then return hub.challenge.
   */
  app.get("/api/instagram/webhook", async (req: Request, res: Response) => {
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;

    if (mode !== "subscribe" || !token || !challenge) {
      console.log("[Instagram Webhook] Invalid verification request");
      return res.status(400).send("Bad Request");
    }

    try {
      // Check if any user has this verify token
      const db = await getDb();
      if (!db) {
        console.error("[Instagram Webhook] DB unavailable during verification");
        return res.status(500).send("Server Error");
      }

      const [connection] = await db
        .select({ id: instagramConnections.id })
        .from(instagramConnections)
        .where(
          and(
            eq(instagramConnections.webhookVerifyToken, token),
            eq(instagramConnections.isActive, true)
          )
        )
        .limit(1);

      if (!connection) {
        console.log(`[Instagram Webhook] Unknown verify token: ${token}`);
        return res.status(403).send("Forbidden");
      }

      console.log(`[Instagram Webhook] Verification successful for connection ${connection.id}`);
      return res.status(200).send(challenge);
    } catch (err) {
      console.error("[Instagram Webhook] Verification error:", err);
      return res.status(500).send("Server Error");
    }
  });

  /**
   * POST /api/instagram/webhook
   * Meta sends comment events here. We verify the signature, then process
   * the comment to check against funnel keywords and send DMs.
   *
   * IMPORTANT: This route must use express.raw() to preserve the raw body
   * for signature verification. Registered BEFORE express.json() in index.ts.
   */
  app.post(
    "/api/instagram/webhook",
    (req: Request, res: Response, next) => {
      // Collect raw body for signature verification
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        (req as Request & { rawBody?: Buffer }).rawBody = Buffer.concat(chunks);
        next();
      });
    },
    async (req: Request, res: Response) => {
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      const signature = req.headers["x-hub-signature-256"] as string;
      const appSecret = process.env.INSTAGRAM_APP_SECRET;

      // Verify signature if app secret is configured
      if (appSecret && rawBody && signature) {
        if (!verifySignature(rawBody, signature, appSecret)) {
          console.warn("[Instagram Webhook] Invalid signature — request rejected");
          return res.status(401).json({ error: "Invalid signature" });
        }
      } else if (appSecret && !signature) {
        console.warn("[Instagram Webhook] Missing X-Hub-Signature-256 header");
        return res.status(401).json({ error: "Missing signature" });
      }

      // Parse body
      let body: { object: string; entry: unknown[] };
      try {
        body = rawBody ? JSON.parse(rawBody.toString()) : req.body;
      } catch {
        return res.status(400).json({ error: "Invalid JSON" });
      }

      // Acknowledge receipt immediately (Meta requires < 20s response)
      res.status(200).json({ status: "ok" });

      // Process asynchronously (don't block the response)
      processInstagramWebhook(body as Parameters<typeof processInstagramWebhook>[0])
        .catch((err) => console.error("[Instagram Webhook] Processing error:", err));
    }
  );

  console.log("[Instagram Webhook] Routes registered: GET/POST /api/instagram/webhook");
}
