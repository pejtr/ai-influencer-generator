import { describe, it, expect } from "vitest";
import { 
  SUBSCRIPTION_TIERS, 
  CREDIT_PACKS, 
  getTierByName, 
  getCreditPackById,
  getCreditPackBySlug,
  getTierDailyCredits,
  getTierMonthlyCredits,
  getCreditsToDeduct,
  TierName
} from "./stripe/products";

describe("Hybrid Credit Model - Products Configuration", () => {
  describe("Subscription Tiers", () => {
    it("should have free, pro, and creator tiers", () => {
      expect(SUBSCRIPTION_TIERS.free).toBeDefined();
      expect(SUBSCRIPTION_TIERS.pro).toBeDefined();
      expect(SUBSCRIPTION_TIERS.creator).toBeDefined();
    });

    it("free tier should have 0 price and 0 monthly credits", () => {
      const freeTier = SUBSCRIPTION_TIERS.free;
      expect(freeTier.priceMonthly).toBe(0);
      expect(freeTier.monthlyCredits).toBe(0);
    });

    it("pro tier should have $19.99 price and 500 monthly credits", () => {
      const proTier = SUBSCRIPTION_TIERS.pro;
      expect(proTier.priceMonthly).toBe(1999);
      expect(proTier.monthlyCredits).toBe(500);
    });

    it("creator tier should have $49.99 price and 1500 monthly credits", () => {
      const creatorTier = SUBSCRIPTION_TIERS.creator;
      expect(creatorTier.priceMonthly).toBe(4999);
      expect(creatorTier.monthlyCredits).toBe(1500);
    });

    it("getTierByName should return correct tier", () => {
      expect(getTierByName("free")).toEqual(SUBSCRIPTION_TIERS.free);
      expect(getTierByName("pro")).toEqual(SUBSCRIPTION_TIERS.pro);
      expect(getTierByName("creator")).toEqual(SUBSCRIPTION_TIERS.creator);
    });

    it("getTierByName should return undefined for invalid tier", () => {
      expect(getTierByName("invalid")).toBeUndefined();
    });
  });

  describe("Credit Packs", () => {
    it("should have small, medium, and large packs", () => {
      const small = CREDIT_PACKS.find(p => p.slug === "small");
      const medium = CREDIT_PACKS.find(p => p.slug === "medium");
      const large = CREDIT_PACKS.find(p => p.slug === "large");
      
      expect(small).toBeDefined();
      expect(medium).toBeDefined();
      expect(large).toBeDefined();
    });

    it("small pack should have 100 credits at $9.99 with no bonus", () => {
      const small = CREDIT_PACKS.find(p => p.slug === "small")!;
      expect(small.credits).toBe(100);
      expect(small.price).toBe(999);
      expect(small.bonusCredits).toBe(0);
      expect(small.totalCredits).toBe(100);
    });

    it("medium pack should have 300 credits + 100 bonus at $29.99", () => {
      const medium = CREDIT_PACKS.find(p => p.slug === "medium")!;
      expect(medium.credits).toBe(300);
      expect(medium.price).toBe(2999);
      expect(medium.bonusCredits).toBe(100);
      expect(medium.totalCredits).toBe(400);
    });

    it("large pack should have 1000 credits + 500 bonus at $99.99", () => {
      const large = CREDIT_PACKS.find(p => p.slug === "large")!;
      expect(large.credits).toBe(1000);
      expect(large.price).toBe(9999);
      expect(large.bonusCredits).toBe(500);
      expect(large.totalCredits).toBe(1500);
    });

    it("getCreditPackById should return correct pack", () => {
      const small = getCreditPackById("credits_small");
      expect(small).toBeDefined();
      expect(small?.slug).toBe("small");
    });

    it("getCreditPackBySlug should return correct pack", () => {
      const medium = getCreditPackBySlug("medium");
      expect(medium).toBeDefined();
      expect(medium?.id).toBe("credits_medium");
    });

    it("getCreditPackById should return undefined for invalid pack", () => {
      expect(getCreditPackById("invalid")).toBeUndefined();
    });
  });

  describe("Daily Free Credits", () => {
    it("all tiers should get 5 free daily credits", () => {
      expect(getTierDailyCredits("free")).toBe(5);
      expect(getTierDailyCredits("pro")).toBe(5);
      expect(getTierDailyCredits("creator")).toBe(5);
    });
  });

  describe("Monthly Subscription Credits", () => {
    it("free tier should get 0 monthly credits", () => {
      expect(getTierMonthlyCredits("free")).toBe(0);
    });

    it("pro tier should get 500 monthly credits", () => {
      expect(getTierMonthlyCredits("pro")).toBe(500);
    });

    it("creator tier should get 1500 monthly credits", () => {
      expect(getTierMonthlyCredits("creator")).toBe(1500);
    });
  });
});

describe("Hybrid Credit Model - Deduction Priority", () => {
  describe("getCreditsToDeduct", () => {
    it("should use free credits first", () => {
      const result = getCreditsToDeduct(5, 100, 50, 3);
      expect(result.free).toBe(3);
      expect(result.subscription).toBe(0);
      expect(result.paid).toBe(0);
    });

    it("should use subscription credits after free credits exhausted", () => {
      const result = getCreditsToDeduct(2, 100, 50, 5);
      expect(result.free).toBe(2);
      expect(result.subscription).toBe(3);
      expect(result.paid).toBe(0);
    });

    it("should use paid credits after subscription credits exhausted", () => {
      const result = getCreditsToDeduct(2, 3, 50, 10);
      expect(result.free).toBe(2);
      expect(result.subscription).toBe(3);
      expect(result.paid).toBe(5);
    });

    it("should handle case with no free credits", () => {
      const result = getCreditsToDeduct(0, 100, 50, 5);
      expect(result.free).toBe(0);
      expect(result.subscription).toBe(5);
      expect(result.paid).toBe(0);
    });

    it("should handle case with only paid credits", () => {
      const result = getCreditsToDeduct(0, 0, 50, 5);
      expect(result.free).toBe(0);
      expect(result.subscription).toBe(0);
      expect(result.paid).toBe(5);
    });

    it("should handle exact amount deduction", () => {
      const result = getCreditsToDeduct(5, 10, 15, 30);
      expect(result.free).toBe(5);
      expect(result.subscription).toBe(10);
      expect(result.paid).toBe(15);
    });

    it("should handle zero deduction", () => {
      const result = getCreditsToDeduct(5, 100, 50, 0);
      expect(result.free).toBe(0);
      expect(result.subscription).toBe(0);
      expect(result.paid).toBe(0);
    });
  });
});

describe("Hybrid Credit Model - Tier Features", () => {
  it("free tier should have watermark", () => {
    const freeTier = SUBSCRIPTION_TIERS.free;
    expect(freeTier.hasWatermark).toBe(true);
  });

  it("pro tier should not have watermark", () => {
    const proTier = SUBSCRIPTION_TIERS.pro;
    expect(proTier.hasWatermark).toBe(false);
  });

  it("pro tier should have Fanvue integration", () => {
    const proTier = SUBSCRIPTION_TIERS.pro;
    expect(proTier.hasFanvueIntegration).toBe(true);
  });

  it("creator tier should have batch generation", () => {
    const creatorTier = SUBSCRIPTION_TIERS.creator;
    expect(creatorTier.hasBatchGeneration).toBe(true);
  });

  it("creator tier should have content scheduler", () => {
    const creatorTier = SUBSCRIPTION_TIERS.creator;
    expect(creatorTier.hasContentScheduler).toBe(true);
  });

  it("only creator tier should have AI chat", () => {
    expect(SUBSCRIPTION_TIERS.free.hasAIChat).toBe(false);
    expect(SUBSCRIPTION_TIERS.pro.hasAIChat).toBe(false);
    expect(SUBSCRIPTION_TIERS.creator.hasAIChat).toBe(true);
  });

  it("creator tier should have max batch size of 30", () => {
    expect(SUBSCRIPTION_TIERS.creator.maxBatchSize).toBe(30);
  });

  it("pro tier should have max batch size of 5", () => {
    expect(SUBSCRIPTION_TIERS.pro.maxBatchSize).toBe(5);
  });
});

describe("Hybrid Credit Model - Value Calculation", () => {
  it("medium pack should offer better value than small", () => {
    const small = CREDIT_PACKS.find(p => p.slug === "small")!;
    const medium = CREDIT_PACKS.find(p => p.slug === "medium")!;
    
    const smallPricePerCredit = small.price / small.totalCredits;
    const mediumPricePerCredit = medium.price / medium.totalCredits;
    
    // Medium should be cheaper per credit
    expect(mediumPricePerCredit).toBeLessThan(smallPricePerCredit);
  });

  it("large pack should offer best value", () => {
    const small = CREDIT_PACKS.find(p => p.slug === "small")!;
    const large = CREDIT_PACKS.find(p => p.slug === "large")!;
    
    const smallPricePerCredit = small.price / small.totalCredits;
    const largePricePerCredit = large.price / large.totalCredits;
    
    // Large should be cheapest per credit
    expect(largePricePerCredit).toBeLessThan(smallPricePerCredit);
  });

  it("medium pack should be marked as popular", () => {
    const medium = CREDIT_PACKS.find(p => p.slug === "medium")!;
    expect(medium.popular).toBe(true);
  });
});
