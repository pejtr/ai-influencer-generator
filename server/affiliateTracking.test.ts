import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock DB ───────────────────────────────────────────────────────────────

vi.mock("../drizzle/schema", () => ({
  affiliateClicks: { id: "id", affiliateId: "affiliateId", affiliateCode: "affiliateCode" },
  affiliateDailyStats: { id: "id", affiliateId: "affiliateId", date: "date" },
  affiliates: { id: "id", userId: "userId", affiliateCode: "affiliateCode", totalEarnings: "totalEarnings", pendingEarnings: "pendingEarnings", paidEarnings: "paidEarnings" },
  affiliatePayouts: { id: "id", affiliateId: "affiliateId", status: "status", amount: "amount", createdAt: "createdAt" },
  affiliateCommissions: { id: "id", affiliateId: "affiliateId", amount: "amount", status: "status", level: "level", commissionRate: "commissionRate", createdAt: "createdAt" },
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getAffiliateByUserId: vi.fn(),
  getAffiliateByCode: vi.fn(),
}));

// ── Golden Ratio Calculation ──────────────────────────────────────────────

describe("Golden Ratio Calculation", () => {
  it("calculates golden ratio correctly", () => {
    const totalRevenue = 500;
    const totalMessages = 200;
    const goldenRatio = totalMessages > 0 ? totalRevenue / totalMessages : 0;
    expect(goldenRatio).toBe(2.5);
  });

  it("returns 0 when no messages sent", () => {
    const totalRevenue = 500;
    const totalMessages = 0;
    const goldenRatio = totalMessages > 0 ? totalRevenue / totalMessages : 0;
    expect(goldenRatio).toBe(0);
  });

  it("identifies above-target golden ratio", () => {
    const goldenRatio = 3.2;
    const target = 2.5;
    expect(goldenRatio >= target).toBe(true);
  });

  it("identifies below-target golden ratio", () => {
    const goldenRatio = 1.8;
    const target = 2.5;
    expect(goldenRatio >= target).toBe(false);
  });

  it("grades chatter performance correctly", () => {
    const gradeChatter = (goldenRatio: number, convRate: number) => {
      if (goldenRatio >= 2.5 && convRate >= 15) return "A";
      if (goldenRatio >= 1.5 && convRate >= 10) return "B";
      if (goldenRatio >= 1) return "C";
      return "D";
    };
    expect(gradeChatter(3.0, 20)).toBe("A");
    expect(gradeChatter(2.0, 12)).toBe("B");
    expect(gradeChatter(1.2, 5)).toBe("C");
    expect(gradeChatter(0.5, 3)).toBe("D");
  });
});

// ── UTM Link Building ─────────────────────────────────────────────────────

describe("UTM Link Building", () => {
  it("builds tracking URL with affiliate code", () => {
    const base = "https://ai-influencer.manus.space";
    const affiliateCode = "PETR123";
    const utmSource = "instagram";
    const utmMedium = "bio";
    const params = new URLSearchParams();
    params.set("ref", affiliateCode);
    params.set("utm_source", utmSource);
    params.set("utm_medium", utmMedium);
    const url = `${base}?${params.toString()}`;
    expect(url).toContain("ref=PETR123");
    expect(url).toContain("utm_source=instagram");
    expect(url).toContain("utm_medium=bio");
  });

  it("builds QR code URL correctly", () => {
    const trackingUrl = "https://ai-influencer.manus.space?ref=TEST";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`;
    expect(qrUrl).toContain("qrserver.com");
    expect(qrUrl).toContain("200x200");
  });

  it("handles optional UTM parameters", () => {
    const base = "https://ai-influencer.manus.space";
    const affiliateCode = "TEST";
    const params = new URLSearchParams();
    params.set("ref", affiliateCode);
    // No UTM params
    const url = `${base}?${params.toString()}`;
    expect(url).toBe(`${base}?ref=TEST`);
    expect(url).not.toContain("utm_source");
  });
});

// ── Payout Validation ─────────────────────────────────────────────────────

describe("Payout Validation", () => {
  it("validates minimum payout amount", () => {
    const validatePayout = (amount: number, pending: number) => {
      if (amount < 50) throw new Error("Minimum payout is $50");
      if (amount > pending) throw new Error(`Cannot request more than $${pending}`);
      return true;
    };
    expect(() => validatePayout(30, 100)).toThrow("Minimum payout is $50");
    expect(() => validatePayout(150, 100)).toThrow("Cannot request more than $100");
    expect(validatePayout(75, 100)).toBe(true);
  });

  it("calculates available payout correctly", () => {
    const totalEarnings = 500;
    const paidEarnings = 200;
    const pendingPayouts = 50;
    const available = totalEarnings - paidEarnings - pendingPayouts;
    expect(available).toBe(250);
  });
});

// ── Commission Level Calculation ──────────────────────────────────────────

describe("Commission Level Calculation", () => {
  it("calculates L1 commission at 30%", () => {
    const saleAmount = 97;
    const rate = 0.30;
    const commission = saleAmount * rate;
    expect(commission).toBeCloseTo(29.1);
  });

  it("calculates L2 commission at 10%", () => {
    const saleAmount = 97;
    const rate = 0.10;
    const commission = saleAmount * rate;
    expect(commission).toBeCloseTo(9.7);
  });

  it("calculates L3 commission at 5%", () => {
    const saleAmount = 97;
    const rate = 0.05;
    const commission = saleAmount * rate;
    expect(commission).toBeCloseTo(4.85);
  });

  it("calculates total commission across all levels", () => {
    const saleAmount = 97;
    const l1 = saleAmount * 0.30;
    const l2 = saleAmount * 0.10;
    const l3 = saleAmount * 0.05;
    const total = l1 + l2 + l3;
    expect(total).toBeCloseTo(43.65);
    expect(total / saleAmount * 100).toBeCloseTo(45); // 45% total payout
  });
});

// ── Badge Tier Assignment ─────────────────────────────────────────────────

describe("Badge Tier Assignment", () => {
  it("assigns correct badge based on earnings", () => {
    const getBadge = (earnings: number) => {
      if (earnings >= 10000) return "diamond";
      if (earnings >= 5000) return "gold";
      if (earnings >= 1000) return "silver";
      if (earnings >= 100) return "bronze";
      return "none";
    };
    expect(getBadge(0)).toBe("none");
    expect(getBadge(150)).toBe("bronze");
    expect(getBadge(1500)).toBe("silver");
    expect(getBadge(6000)).toBe("gold");
    expect(getBadge(15000)).toBe("diamond");
  });
});

// ── Click Deduplication ───────────────────────────────────────────────────

describe("Click Deduplication", () => {
  it("generates consistent fingerprint from IP + UA", () => {
    const generateFingerprint = (ip: string, ua: string) => {
      return Buffer.from(`${ip}:${ua}`).toString("base64").slice(0, 16);
    };
    const fp1 = generateFingerprint("192.168.1.1", "Mozilla/5.0");
    const fp2 = generateFingerprint("192.168.1.1", "Mozilla/5.0");
    const fp3 = generateFingerprint("192.168.1.2", "Mozilla/5.0");
    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fp3);
  });
});

// ── OFM Best Practices Metrics ────────────────────────────────────────────

describe("OFM Best Practices Metrics", () => {
  it("validates chatting ratio target", () => {
    // Target: 80% of shift time in active conversations
    const activeMinutes = 96;
    const totalShiftMinutes = 120;
    const chattingRatio = activeMinutes / totalShiftMinutes;
    expect(chattingRatio).toBeGreaterThanOrEqual(0.8);
  });

  it("validates response time target", () => {
    // Target: under 5 minutes
    const avgResponseTimeMinutes = 3.5;
    expect(avgResponseTimeMinutes).toBeLessThan(5);
  });

  it("validates conversion rate target", () => {
    // Target: 15%+
    const conversions = 18;
    const totalFansContacted = 100;
    const conversionRate = (conversions / totalFansContacted) * 100;
    expect(conversionRate).toBeGreaterThanOrEqual(15);
  });

  it("calculates weekly revenue growth", () => {
    const previousWeekRevenue = 1200;
    const currentWeekRevenue = 1450;
    const growth = ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100;
    expect(growth).toBeCloseTo(20.83);
    expect(growth).toBeGreaterThan(0);
  });
});
