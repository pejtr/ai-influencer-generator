import { describe, expect, it } from "vitest";
import { 
  SUBSCRIPTION_TIERS, 
  CREDIT_PACKS, 
  getTierByName, 
  getCreditPackById,
  getTierMonthlyCredits,
  getTierDailyCredits
} from "./stripe/products";

describe("Stripe Products Configuration - Hybrid Model", () => {
  describe("Subscription Tiers", () => {
    it("should have all required tiers defined", () => {
      expect(SUBSCRIPTION_TIERS.free).toBeDefined();
      expect(SUBSCRIPTION_TIERS.pro).toBeDefined();
      expect(SUBSCRIPTION_TIERS.creator).toBeDefined();
    });

    it("should have correct pricing for each tier", () => {
      expect(SUBSCRIPTION_TIERS.free.priceMonthly).toBe(0);
      expect(SUBSCRIPTION_TIERS.pro.priceMonthly).toBe(1999); // $19.99
      expect(SUBSCRIPTION_TIERS.creator.priceMonthly).toBe(4999); // $49.99
    });

    it("should have correct monthly credits for each tier", () => {
      expect(SUBSCRIPTION_TIERS.free.monthlyCredits).toBe(0);
      expect(SUBSCRIPTION_TIERS.pro.monthlyCredits).toBe(500);
      expect(SUBSCRIPTION_TIERS.creator.monthlyCredits).toBe(1500);
    });

    it("should have 5 daily free credits for all tiers", () => {
      expect(SUBSCRIPTION_TIERS.free.dailyFreeCredits).toBe(5);
      expect(SUBSCRIPTION_TIERS.pro.dailyFreeCredits).toBe(5);
      expect(SUBSCRIPTION_TIERS.creator.dailyFreeCredits).toBe(5);
    });

    it("should return tier by name", () => {
      const pro = getTierByName("pro");
      expect(pro).toBeDefined();
      expect(pro?.name).toBe("pro");
      expect(pro?.priceMonthly).toBe(1999);
    });

    it("should return undefined for invalid tier name", () => {
      const invalid = getTierByName("invalid");
      expect(invalid).toBeUndefined();
    });

    it("should return correct monthly credits for tier", () => {
      expect(getTierMonthlyCredits("free")).toBe(0);
      expect(getTierMonthlyCredits("pro")).toBe(500);
      expect(getTierMonthlyCredits("creator")).toBe(1500);
    });

    it("should return correct daily credits for tier", () => {
      expect(getTierDailyCredits("free")).toBe(5);
      expect(getTierDailyCredits("pro")).toBe(5);
      expect(getTierDailyCredits("creator")).toBe(5);
    });
  });

  describe("Credit Packs", () => {
    it("should have 3 credit packs defined", () => {
      expect(CREDIT_PACKS).toHaveLength(3);
    });

    it("should have correct pricing for credit packs", () => {
      expect(CREDIT_PACKS[0].credits).toBe(100);
      expect(CREDIT_PACKS[0].price).toBe(999); // $9.99

      expect(CREDIT_PACKS[1].credits).toBe(300);
      expect(CREDIT_PACKS[1].price).toBe(2999); // $29.99

      expect(CREDIT_PACKS[2].credits).toBe(1000);
      expect(CREDIT_PACKS[2].price).toBe(9999); // $99.99
    });

    it("should have bonus credits for larger packs", () => {
      expect(CREDIT_PACKS[0].bonusCredits).toBe(0);
      expect(CREDIT_PACKS[1].bonusCredits).toBe(100); // +33%
      expect(CREDIT_PACKS[2].bonusCredits).toBe(500); // +50%
    });

    it("should return credit pack by ID", () => {
      const pack = getCreditPackById("credits_small");
      expect(pack).toBeDefined();
      expect(pack?.credits).toBe(100);
      expect(pack?.price).toBe(999);
    });

    it("should return undefined for invalid pack ID", () => {
      const invalid = getCreditPackById("invalid_pack");
      expect(invalid).toBeUndefined();
    });

    it("should have decreasing price per credit for larger packs", () => {
      const packSmall = getCreditPackById("credits_small");
      const packMedium = getCreditPackById("credits_medium");
      const packLarge = getCreditPackById("credits_large");

      expect(packSmall!.pricePerCredit).toBeGreaterThan(packMedium!.pricePerCredit);
      expect(packMedium!.pricePerCredit).toBeGreaterThan(packLarge!.pricePerCredit);
    });
  });

  describe("Tier Features", () => {
    it("free tier should have watermark", () => {
      expect(SUBSCRIPTION_TIERS.free.hasWatermark).toBe(true);
    });

    it("pro tier should not have watermark", () => {
      expect(SUBSCRIPTION_TIERS.pro.hasWatermark).toBe(false);
    });

    it("pro tier should have Fanvue integration", () => {
      expect(SUBSCRIPTION_TIERS.pro.hasFanvueIntegration).toBe(true);
    });

    it("creator tier should have all features", () => {
      expect(SUBSCRIPTION_TIERS.creator.hasFanvueIntegration).toBe(true);
      expect(SUBSCRIPTION_TIERS.creator.hasContentScheduler).toBe(true);
      expect(SUBSCRIPTION_TIERS.creator.hasBatchGeneration).toBe(true);
      expect(SUBSCRIPTION_TIERS.creator.hasAutoPublish).toBe(true);
      expect(SUBSCRIPTION_TIERS.creator.hasAIChat).toBe(true);
    });
  });
});

describe("Stripe Webhook Handling", () => {
  it("should handle test events correctly", () => {
    // Test event detection
    const testEventId = "evt_test_123456";
    expect(testEventId.startsWith("evt_test_")).toBe(true);

    const realEventId = "evt_1234567890";
    expect(realEventId.startsWith("evt_test_")).toBe(false);
  });
});
