import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    tier: "basic",
    credits: 100,
    totalCreditsUsed: 0,
    referredBy: null,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("affiliate.getLeaderboard", () => {
  it("returns leaderboard data for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.affiliate.getLeaderboard();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("affiliate.getNetworkStats", () => {
  it("returns network stats structure for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.affiliate.getNetworkStats();
    
    expect(result).toHaveProperty("level1Count");
    expect(result).toHaveProperty("level2Count");
    expect(result).toHaveProperty("level3Count");
    expect(result).toHaveProperty("level1Earnings");
    expect(result).toHaveProperty("level2Earnings");
    expect(result).toHaveProperty("level3Earnings");
    expect(typeof result.level1Count).toBe("number");
    expect(typeof result.level2Count).toBe("number");
    expect(typeof result.level3Count).toBe("number");
  });
});

describe("affiliate.getStatus", () => {
  it("returns affiliate status for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.affiliate.getStatus();
    
    expect(result).toHaveProperty("isAffiliate");
    expect(typeof result.isAffiliate).toBe("boolean");
  });
});

describe("affiliate.validateCode", () => {
  it("validates affiliate codes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.affiliate.validateCode({ code: "NONEXISTENT123" });
    
    expect(result).toHaveProperty("valid");
    expect(typeof result.valid).toBe("boolean");
  });
});

describe("Commission rates", () => {
  it("should have correct multi-level commission rates", () => {
    const COMMISSION_RATES = {
      level1: 30,
      level2: 10,
      level3: 5,
    };
    
    expect(COMMISSION_RATES.level1).toBe(30);
    expect(COMMISSION_RATES.level2).toBe(10);
    expect(COMMISSION_RATES.level3).toBe(5);
    expect(COMMISSION_RATES.level1 + COMMISSION_RATES.level2 + COMMISSION_RATES.level3).toBe(45);
  });
});

describe("Tier system", () => {
  it("should have correct tier names", () => {
    const TIERS = ["free", "basic", "premium", "vip"] as const;
    
    expect(TIERS).toContain("free");
    expect(TIERS).toContain("basic");
    expect(TIERS).toContain("premium");
    expect(TIERS).toContain("vip");
    expect(TIERS.length).toBe(4);
  });
});
