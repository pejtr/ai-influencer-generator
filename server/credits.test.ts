import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getUserById: vi.fn(),
  updateUserCredits: vi.fn(),
  deductUserCredits: vi.fn(),
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
  TIER_CREDITS: {
    free: 5,
    starter: 50,
    pro: 300,
    business: 1000,
  },
  TIER_PRICES: {
    free: 0,
    starter: 9,
    pro: 29,
    business: 99,
  },
  CREDIT_PACKS: [
    { credits: 100, price: 15 },
    { credits: 500, price: 60 },
    { credits: 1000, price: 100 },
  ],
}));

// Import mocked functions
import { getUserById, getUserCreditTransactions } from "./db";

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
      tier: "starter",
      monthlyCreditsUsed: 10,
    };
    
    vi.mocked(getUserById).mockResolvedValue(mockUser as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credits.getBalance();

    expect(result).toEqual({
      credits: 25,
      tier: "starter",
      monthlyCreditsUsed: 10,
    });
    expect(getUserById).toHaveBeenCalledWith(1);
  });

  it("returns default values when user not found", async () => {
    vi.mocked(getUserById).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.credits.getBalance();

    expect(result).toEqual({
      credits: 0,
      tier: "free",
      monthlyCreditsUsed: 0,
    });
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
    expect(result.tiers.free.credits).toBe(5);
    expect(result.tiers.free.price).toBe(0);
    expect(result.tiers.basic.credits).toBe(50);
    expect(result.tiers.basic.price).toBe(9);
    expect(result.tiers.premium.credits).toBe(300);
    expect(result.tiers.premium.price).toBe(29);
    expect(result.tiers.vip.credits).toBe(1000);
    expect(result.tiers.vip.price).toBe(99);

    expect(result.creditPacks).toBeDefined();
    expect(result.creditPacks.length).toBe(3);
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
});
