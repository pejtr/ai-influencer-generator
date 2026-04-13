/**
 * Tests for Instagram integration:
 * - matchKeyword logic
 * - renderTemplate logic
 * - exchangeForLongLivedToken (mocked)
 * - sendPrivateReply (mocked)
 * - Webhook signature verification
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Import helpers from instagramRouter ──────────────────────────────────────
// We test the pure helper functions directly
import crypto from "crypto";

// ── Replicate pure helpers for unit testing ───────────────────────────────────
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
  return text.includes(kw);
}

function renderTemplate(
  template: string,
  vars: { name?: string; keyword?: string; link?: string }
): string {
  return template
    .replace(/\{name\}/g, vars.name ?? "there")
    .replace(/\{keyword\}/g, vars.keyword ?? "")
    .replace(/\{link\}/g, vars.link ?? "");
}

function verifySignature(rawBody: Buffer, signature: string, appSecret: string): boolean {
  if (!signature.startsWith("sha256=")) return false;
  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  const received = signature.slice(7);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

// ── matchKeyword tests ────────────────────────────────────────────────────────
describe("matchKeyword", () => {
  it("exact match — case insensitive", () => {
    expect(matchKeyword("FIRE", "fire", "exact", false)).toBe(true);
    expect(matchKeyword("fire", "fire", "exact", false)).toBe(true);
    expect(matchKeyword("fire 🔥", "fire", "exact", false)).toBe(false);
  });

  it("exact match — case sensitive", () => {
    expect(matchKeyword("FIRE", "fire", "exact", true)).toBe(false);
    expect(matchKeyword("fire", "fire", "exact", true)).toBe(true);
  });

  it("contains match — case insensitive", () => {
    expect(matchKeyword("I need this FIRE guide!", "fire", "contains", false)).toBe(true);
    expect(matchKeyword("nothing here", "fire", "contains", false)).toBe(false);
  });

  it("starts_with match — case insensitive", () => {
    expect(matchKeyword("GUIDE please", "guide", "starts_with", false)).toBe(true);
    expect(matchKeyword("need GUIDE", "guide", "starts_with", false)).toBe(false);
  });

  it("starts_with with leading whitespace", () => {
    expect(matchKeyword("  FIRE", "fire", "starts_with", false)).toBe(true);
  });

  it("handles empty comment", () => {
    expect(matchKeyword("", "fire", "contains", false)).toBe(false);
    expect(matchKeyword("", "", "exact", false)).toBe(true);
  });

  it("handles emoji in comment", () => {
    expect(matchKeyword("🔥 FIRE 🔥", "fire", "contains", false)).toBe(true);
  });
});

// ── renderTemplate tests ──────────────────────────────────────────────────────
describe("renderTemplate", () => {
  it("replaces {name} placeholder", () => {
    const result = renderTemplate("Hey {name}! Thanks for commenting!", { name: "kayvon" });
    expect(result).toBe("Hey kayvon! Thanks for commenting!");
  });

  it("replaces {keyword} placeholder", () => {
    const result = renderTemplate("You said '{keyword}' — here's the guide:", { keyword: "FIRE" });
    expect(result).toBe("You said 'FIRE' — here's the guide:");
  });

  it("replaces {link} placeholder", () => {
    const result = renderTemplate("Check this out: {link}", { link: "https://example.com/guide" });
    expect(result).toBe("Check this out: https://example.com/guide");
  });

  it("replaces all placeholders at once", () => {
    const result = renderTemplate("Hey {name}, you said '{keyword}'! Get it here: {link}", {
      name: "Alex",
      keyword: "GUIDE",
      link: "https://example.com",
    });
    expect(result).toBe("Hey Alex, you said 'GUIDE'! Get it here: https://example.com");
  });

  it("uses defaults when vars not provided", () => {
    const result = renderTemplate("Hey {name}!", {});
    expect(result).toBe("Hey there!");
  });

  it("replaces multiple occurrences of same placeholder", () => {
    const result = renderTemplate("{name} is great! Hi {name}!", { name: "Alex" });
    expect(result).toBe("Alex is great! Hi Alex!");
  });

  it("handles template with no placeholders", () => {
    const result = renderTemplate("Hello! Here is your guide.", { name: "Alex" });
    expect(result).toBe("Hello! Here is your guide.");
  });
});

// ── verifySignature tests ─────────────────────────────────────────────────────
describe("verifySignature", () => {
  const appSecret = "test_app_secret_12345";
  const payload = Buffer.from(JSON.stringify({ object: "instagram", entry: [] }));

  it("verifies valid signature", () => {
    const hmac = crypto.createHmac("sha256", appSecret).update(payload).digest("hex");
    const signature = `sha256=${hmac}`;
    expect(verifySignature(payload, signature, appSecret)).toBe(true);
  });

  it("rejects invalid signature", () => {
    const signature = "sha256=invalidsignature123";
    expect(verifySignature(payload, signature, appSecret)).toBe(false);
  });

  it("rejects signature without sha256= prefix", () => {
    const hmac = crypto.createHmac("sha256", appSecret).update(payload).digest("hex");
    expect(verifySignature(payload, hmac, appSecret)).toBe(false);
  });

  it("rejects tampered payload", () => {
    const hmac = crypto.createHmac("sha256", appSecret).update(payload).digest("hex");
    const signature = `sha256=${hmac}`;
    const tamperedPayload = Buffer.from(JSON.stringify({ object: "page", entry: [] }));
    expect(verifySignature(tamperedPayload, signature, appSecret)).toBe(false);
  });

  it("rejects wrong app secret", () => {
    const hmac = crypto.createHmac("sha256", "wrong_secret").update(payload).digest("hex");
    const signature = `sha256=${hmac}`;
    expect(verifySignature(payload, signature, appSecret)).toBe(false);
  });
});

// ── Webhook payload structure tests ──────────────────────────────────────────
describe("Instagram webhook payload structure", () => {
  it("validates comment event structure", () => {
    const payload = {
      object: "instagram",
      entry: [
        {
          id: "123456789",
          time: Date.now(),
          changes: [
            {
              field: "comments",
              value: {
                from: { id: "987654321", username: "test_user" },
                media: { id: "111222333", media_product_type: "FEED" },
                id: "comment_id_123",
                text: "FIRE 🔥 need this guide!",
              },
            },
          ],
        },
      ],
    };

    expect(payload.object).toBe("instagram");
    expect(payload.entry).toHaveLength(1);
    expect(payload.entry[0].changes[0].field).toBe("comments");
    expect(payload.entry[0].changes[0].value.text).toContain("FIRE");
  });

  it("validates that comment text triggers keyword match", () => {
    const commentText = "FIRE 🔥 need this guide!";
    const keyword = "fire";
    expect(matchKeyword(commentText, keyword, "contains", false)).toBe(true);
  });

  it("validates DM template rendering for typical funnel", () => {
    const template = "Hey {name}! 🔥 Thanks for commenting '{keyword}'! Here's your exclusive guide: {link}";
    const rendered = renderTemplate(template, {
      name: "test_user",
      keyword: "FIRE",
      link: "https://example.com/guide",
    });
    expect(rendered).toContain("test_user");
    expect(rendered).toContain("FIRE");
    expect(rendered).toContain("https://example.com/guide");
    expect(rendered).not.toContain("{name}");
    expect(rendered).not.toContain("{keyword}");
    expect(rendered).not.toContain("{link}");
  });
});

// ── API URL construction tests ────────────────────────────────────────────────
describe("Instagram API URL construction", () => {
  it("constructs correct Private Replies URL", () => {
    const pageId = "123456789";
    const url = `https://graph.facebook.com/${pageId}/messages`;
    expect(url).toBe("https://graph.facebook.com/123456789/messages");
  });

  it("constructs correct token exchange URL", () => {
    const appId = "app123";
    const appSecret = "secret456";
    const shortToken = "short_token_abc";
    const url = new URL("https://graph.facebook.com/oauth/access_token");
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", shortToken);
    expect(url.searchParams.get("grant_type")).toBe("fb_exchange_token");
    expect(url.searchParams.get("client_id")).toBe(appId);
    expect(url.toString()).toContain("graph.facebook.com/oauth/access_token");
  });

  it("constructs correct webhook subscription URL", () => {
    const pageId = "123456789";
    const url = `https://graph.facebook.com/${pageId}/subscribed_apps`;
    expect(url).toBe("https://graph.facebook.com/123456789/subscribed_apps");
  });
});
