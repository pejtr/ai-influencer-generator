import { describe, it, expect } from "vitest";
import { calculateFanScore, suggestPpvPrice } from "./creatorToolsDb";

describe("Fan Scoring Algorithm", () => {
  it("should return score 0 for completely inactive fan", () => {
    const result = calculateFanScore({
      totalMessages: 0,
      totalTips: 0,
      totalPurchases: 0,
      lifetimeSpend: 0,
      daysSinceLastActive: 999,
      avgResponseTime: 0,
    });
    expect(result.score).toBe(0);
    expect(result.tier).toBe("dormant");
  });

  it("should classify whale correctly", () => {
    const result = calculateFanScore({
      totalMessages: 50,
      totalTips: 10,
      totalPurchases: 20,
      lifetimeSpend: 200,
      daysSinceLastActive: 1,
      avgResponseTime: 30,
    });
    expect(result.tier).toBe("whale");
    expect(result.score).toBeGreaterThan(70);
  });

  it("should classify new fan correctly", () => {
    const result = calculateFanScore({
      totalMessages: 2,
      totalTips: 0,
      totalPurchases: 0,
      lifetimeSpend: 0,
      daysSinceLastActive: 1,
      avgResponseTime: 0,
    });
    expect(result.tier).toBe("new");
    expect(result.score).toBeLessThan(30);
  });

  it("should classify regular fan correctly", () => {
    const result = calculateFanScore({
      totalMessages: 20,
      totalTips: 2,
      totalPurchases: 5,
      lifetimeSpend: 50,
      daysSinceLastActive: 3,
      avgResponseTime: 60,
    });
    expect(result.tier).toBe("regular");
    expect(result.score).toBeGreaterThan(30);
  });

  it("should classify casual fan correctly", () => {
    const result = calculateFanScore({
      totalMessages: 10,
      totalTips: 0,
      totalPurchases: 1,
      lifetimeSpend: 5,
      daysSinceLastActive: 5,
      avgResponseTime: 120,
    });
    expect(result.tier).toBe("casual");
  });

  it("should classify dormant fan when inactive > 30 days", () => {
    const result = calculateFanScore({
      totalMessages: 100,
      totalTips: 20,
      totalPurchases: 30,
      lifetimeSpend: 500,
      daysSinceLastActive: 45,
      avgResponseTime: 10,
    });
    expect(result.tier).toBe("dormant");
  });

  it("should cap score at 100", () => {
    const result = calculateFanScore({
      totalMessages: 1000,
      totalTips: 100,
      totalPurchases: 100,
      lifetimeSpend: 10000,
      daysSinceLastActive: 0,
      avgResponseTime: 5,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should not go below 0", () => {
    const result = calculateFanScore({
      totalMessages: 0,
      totalTips: 0,
      totalPurchases: 0,
      lifetimeSpend: 0,
      daysSinceLastActive: 100,
      avgResponseTime: 0,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe("PPV Price Optimizer", () => {
  it("should suggest higher price for whale fans", () => {
    const result = suggestPpvPrice({
      engagementScore: 90,
      lifetimeSpend: 500,
      totalPurchases: 30,
      spendingTier: "whale",
    }, "image", 10);
    expect(result.suggestedPrice).toBeGreaterThan(10);
    expect(result.confidence).toBeGreaterThan(50);
    expect(result.reasoning).toContain("High-value");
  });

  it("should suggest lower price for dormant fans", () => {
    const result = suggestPpvPrice({
      engagementScore: 10,
      lifetimeSpend: 5,
      totalPurchases: 1,
      spendingTier: "dormant",
    }, "image", 10);
    expect(result.suggestedPrice).toBeLessThan(10);
    expect(result.reasoning).toContain("re-engagement");
  });

  it("should suggest higher price for video content", () => {
    const imageResult = suggestPpvPrice({
      engagementScore: 50,
      lifetimeSpend: 30,
      totalPurchases: 5,
      spendingTier: "regular",
    }, "image", 10);
    const videoResult = suggestPpvPrice({
      engagementScore: 50,
      lifetimeSpend: 30,
      totalPurchases: 5,
      spendingTier: "regular",
    }, "video", 10);
    expect(videoResult.suggestedPrice).toBeGreaterThan(imageResult.suggestedPrice);
  });

  it("should apply introductory pricing for new fans", () => {
    const result = suggestPpvPrice({
      engagementScore: 20,
      lifetimeSpend: 0,
      totalPurchases: 0,
      spendingTier: "new",
    }, "image", 10);
    expect(result.suggestedPrice).toBeLessThan(10);
    expect(result.reasoning).toContain("introductory");
  });

  it("should increase price for proven buyers", () => {
    const newBuyer = suggestPpvPrice({
      engagementScore: 50,
      lifetimeSpend: 30,
      totalPurchases: 2,
      spendingTier: "regular",
    }, "image", 10);
    const provenBuyer = suggestPpvPrice({
      engagementScore: 50,
      lifetimeSpend: 30,
      totalPurchases: 15,
      spendingTier: "regular",
    }, "image", 10);
    expect(provenBuyer.suggestedPrice).toBeGreaterThan(newBuyer.suggestedPrice);
  });

  it("should cap confidence at 95", () => {
    const result = suggestPpvPrice({
      engagementScore: 95,
      lifetimeSpend: 1000,
      totalPurchases: 50,
      spendingTier: "whale",
    }, "video", 10);
    expect(result.confidence).toBeLessThanOrEqual(95);
  });

  it("should handle gallery content type", () => {
    const imageResult = suggestPpvPrice({
      engagementScore: 50,
      lifetimeSpend: 30,
      totalPurchases: 5,
      spendingTier: "regular",
    }, "image", 10);
    const galleryResult = suggestPpvPrice({
      engagementScore: 50,
      lifetimeSpend: 30,
      totalPurchases: 5,
      spendingTier: "regular",
    }, "gallery", 10);
    expect(galleryResult.suggestedPrice).toBeGreaterThan(imageResult.suggestedPrice);
  });
});
