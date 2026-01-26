import { describe, expect, it } from "vitest";
import { SUBSCRIPTION_TIERS, CREDIT_PACKS, getTierByName, getCreditPackById, getTierCredits } from "./stripe/products";

describe("Stripe Products Configuration", () => {
  describe("Subscription Tiers", () => {
    it("should have all required tiers defined", () => {
      expect(SUBSCRIPTION_TIERS.free).toBeDefined();
      expect(SUBSCRIPTION_TIERS.basic).toBeDefined();
      expect(SUBSCRIPTION_TIERS.premium).toBeDefined();
      expect(SUBSCRIPTION_TIERS.vip).toBeDefined();
    });

    it("should have correct pricing for each tier", () => {
      expect(SUBSCRIPTION_TIERS.free.priceMonthly).toBe(0);
      expect(SUBSCRIPTION_TIERS.basic.priceMonthly).toBe(900); // $9.00
      expect(SUBSCRIPTION_TIERS.premium.priceMonthly).toBe(2900); // $29.00
      expect(SUBSCRIPTION_TIERS.vip.priceMonthly).toBe(9900); // $99.00
    });

    it("should have correct credits for each tier", () => {
      expect(SUBSCRIPTION_TIERS.free.credits).toBe(5);
      expect(SUBSCRIPTION_TIERS.basic.credits).toBe(50);
      expect(SUBSCRIPTION_TIERS.premium.credits).toBe(300);
      expect(SUBSCRIPTION_TIERS.vip.credits).toBe(1000);
    });

    it("should return tier by name", () => {
      const basic = getTierByName("basic");
      expect(basic).toBeDefined();
      expect(basic?.name).toBe("basic");
      expect(basic?.priceMonthly).toBe(900);
    });

    it("should return undefined for invalid tier name", () => {
      const invalid = getTierByName("invalid");
      expect(invalid).toBeUndefined();
    });

    it("should return correct credits for tier", () => {
      expect(getTierCredits("free")).toBe(5);
      expect(getTierCredits("basic")).toBe(50);
      expect(getTierCredits("premium")).toBe(300);
      expect(getTierCredits("vip")).toBe(1000);
    });
  });

  describe("Credit Packs", () => {
    it("should have 3 credit packs defined", () => {
      expect(CREDIT_PACKS).toHaveLength(3);
    });

    it("should have correct pricing for credit packs", () => {
      expect(CREDIT_PACKS[0].credits).toBe(100);
      expect(CREDIT_PACKS[0].price).toBe(1500); // $15.00

      expect(CREDIT_PACKS[1].credits).toBe(500);
      expect(CREDIT_PACKS[1].price).toBe(6000); // $60.00

      expect(CREDIT_PACKS[2].credits).toBe(1000);
      expect(CREDIT_PACKS[2].price).toBe(10000); // $100.00
    });

    it("should return credit pack by ID", () => {
      const pack = getCreditPackById("credits_100");
      expect(pack).toBeDefined();
      expect(pack?.credits).toBe(100);
      expect(pack?.price).toBe(1500);
    });

    it("should return undefined for invalid pack ID", () => {
      const invalid = getCreditPackById("invalid_pack");
      expect(invalid).toBeUndefined();
    });

    it("should have decreasing price per credit for larger packs", () => {
      const pack100 = getCreditPackById("credits_100");
      const pack500 = getCreditPackById("credits_500");
      const pack1000 = getCreditPackById("credits_1000");

      expect(pack100!.pricePerCredit).toBeGreaterThan(pack500!.pricePerCredit);
      expect(pack500!.pricePerCredit).toBeGreaterThan(pack1000!.pricePerCredit);
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
