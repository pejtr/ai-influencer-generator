import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { SUBSCRIPTION_TIERS, CREDIT_PACKS } from "./stripe/products";

// Mock the database functions
vi.mock("./db", () => ({
  getUserById: vi.fn(),
  getUserCreditBalance: vi.fn(),
  updateUserCredits: vi.fn(),
  deductUserCredits: vi.fn(),
  deductCreditsHybrid: vi.fn(),
  addPaidCredits: vi.fn(),
  createGeneration: vi.fn(),
  updateGeneration: vi.fn(),
  getUserGenerations: vi.fn(),
  deleteGeneration: vi.fn(),
  getGenerationById: vi.fn(),
  createCreditTransaction: vi.fn(),
  getUserCreditTransactions: vi.fn(),
  createAffiliate: vi.fn(),
  getAffiliateByUserId: vi.fn(),
  getAffiliateByCode: vi.fn(),
  getAffiliateCommissions: vi.fn(),
  getAdminMetrics: vi.fn(),
  getAllUsers: vi.fn(),
  getUserCount: vi.fn(),
  getGenerationCount: vi.fn(),
}));

// Import mocked functions
import { getUserById, getUserCreditBalance, getUserCreditTransactions } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("credits.getBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user credits and tier for authenticated user", async () => {
    const mockUser = {
      id: 1,
      credits: 25,
      tier: "pro",
      creditBalance: 50,
      freeCreditsToday: 5,
      monthlyCreditsRemaining: 400,
    };
    
    const mockBalance = {
      freeCreditsToday: 5,
      paidCredits: 50,
      subscriptionCredits: 400,
      totalAvailable: 455,
      tier: "pro",
    };
    
    vi.mocked(getUserCreditBalance).mockResolvedValue(mockBalance);
    vi.mocked(getUserById).mockResolvedValue(mockUser as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credits.getBalance();

    expect(result.credits).toBe(455);
    expect(result.tier).toBe("pro");
    expect(result.freeCreditsToday).toBe(5);
    expect(result.subscriptionCredits).toBe(400);
    expect(result.paidCredits).toBe(50);
    expect(getUserCreditBalance).toHaveBeenCalledWith(1);
  });

  it("returns default values when user not found", async () => {
    vi.mocked(getUserCreditBalance).mockResolvedValue(null);
    vi.mocked(getUserById).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credits.getBalance();

    expect(result.credits).toBe(0);
    expect(result.tier).toBe("free");
    expect(result.freeCreditsToday).toBe(0);
    expect(result.subscriptionCredits).toBe(0);
    expect(result.paidCredits).toBe(0);
  });
});

describe("credits.getTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user credit transactions", async () => {
    const mockTransactions = [
      { id: 1, userId: 1, amount: -1, type: "generation", createdAt: new Date() },
      { id: 2, userId: 1, amount: 50, type: "purchase", createdAt: new Date() },
    ];
    
    vi.mocked(getUserCreditTransactions).mockResolvedValue(mockTransactions as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credits.getTransactions();

    expect(result).toEqual(mockTransactions);
    expect(getUserCreditTransactions).toHaveBeenCalledWith(1, 50);
  });
});

describe("credits.getPricing", () => {
  it("returns pricing tiers and credit packs", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credits.getPricing();

    expect(result.tiers).toBeDefined();
    expect(result.tiers).toEqual(SUBSCRIPTION_TIERS);
    expect(result.creditPacks).toBeDefined();
    expect(result.creditPacks).toEqual(CREDIT_PACKS);
  });

  it("is accessible without authentication (public procedure)", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credits.getPricing();

    expect(result.tiers).toBeDefined();
    expect(result.creditPacks).toBeDefined();
  });

  it("returns correct tier structure for hybrid model", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credits.getPricing();

    // Check free tier
    expect(result.tiers.free.priceMonthly).toBe(0);
    expect(result.tiers.free.monthlyCredits).toBe(0);
    expect(result.tiers.free.dailyFreeCredits).toBe(5);

    // Check pro tier
    expect(result.tiers.pro.priceMonthly).toBe(1999);
    expect(result.tiers.pro.monthlyCredits).toBe(500);

    // Check creator tier
    expect(result.tiers.creator.priceMonthly).toBe(4999);
    expect(result.tiers.creator.monthlyCredits).toBe(1500);
  });
});
