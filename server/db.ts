import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  generations, InsertGeneration,
  subscriptions, InsertSubscription,
  creditPurchases, InsertCreditPurchase,
  affiliates, InsertAffiliate,
  affiliateCommissions, InsertAffiliateCommission,
  creditTransactions, InsertCreditTransaction
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserCredits(userId: number, credits: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ credits }).where(eq(users.id, userId));
}

export async function updateUserTier(userId: number, tier: 'free' | 'basic' | 'premium' | 'vip', credits?: number) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { tier };
  if (credits !== undefined) {
    updateData.credits = credits;
  }
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function addUserCredits(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ 
    credits: sql`${users.credits} + ${amount}` 
  }).where(eq(users.id, userId));
}

export async function getUserByStripeCustomerId(customerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
}

export async function updateUserStripeSubscription(userId: number, stripeSubscriptionId: string | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ stripeSubscriptionId }).where(eq(users.id, userId));
}

export async function deductUserCredits(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return false;
  
  const user = await getUserById(userId);
  if (!user || user.credits < amount) return false;
  
  await db.update(users).set({ 
    credits: user.credits - amount,
    monthlyCreditsUsed: user.monthlyCreditsUsed + amount
  }).where(eq(users.id, userId));
  
  return true;
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count ?? 0;
}

// ============ GENERATION OPERATIONS ============

export async function createGeneration(data: InsertGeneration) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(generations).values(data);
  return result[0].insertId;
}

export async function updateGeneration(id: number, data: Partial<InsertGeneration>) {
  const db = await getDb();
  if (!db) return;
  await db.update(generations).set(data).where(eq(generations.id, id));
}

export async function getGenerationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserGenerations(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generations)
    .where(and(eq(generations.userId, userId), eq(generations.status, 'completed')))
    .limit(limit).offset(offset)
    .orderBy(desc(generations.createdAt));
}

export async function deleteGeneration(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(generations).where(and(eq(generations.id, id), eq(generations.userId, userId)));
  return true;
}

export async function getGenerationCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(generations);
  return result[0]?.count ?? 0;
}

// ============ SUBSCRIPTION OPERATIONS ============

export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(subscriptions).values(data);
  return result[0].insertId;
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscription(id: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set(data).where(eq(subscriptions.id, id));
}

// ============ CREDIT PURCHASE OPERATIONS ============

export async function createCreditPurchase(data: InsertCreditPurchase) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(creditPurchases).values(data);
  return result[0].insertId;
}

// ============ AFFILIATE OPERATIONS ============

export async function createAffiliate(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const affiliateCode = nanoid(8).toUpperCase();
  const result = await db.insert(affiliates).values({
    userId,
    affiliateCode,
  });
  
  // Update user with affiliate code
  await db.update(users).set({ affiliateCode }).where(eq(users.id, userId));
  
  return affiliateCode;
}

export async function getAffiliateByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAffiliateByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(affiliates).where(eq(affiliates.affiliateCode, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAffiliateEarnings(affiliateId: number, amount: number) {
  const db = await getDb();
  if (!db) return;
  
  const affiliate = await db.select().from(affiliates).where(eq(affiliates.id, affiliateId)).limit(1);
  if (affiliate.length === 0) return;
  
  const current = affiliate[0];
  await db.update(affiliates).set({
    totalEarnings: sql`${affiliates.totalEarnings} + ${amount}`,
    pendingEarnings: sql`${affiliates.pendingEarnings} + ${amount}`,
  }).where(eq(affiliates.id, affiliateId));
}

export async function createAffiliateCommission(data: InsertAffiliateCommission) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(affiliateCommissions).values(data);
  return result[0].insertId;
}

export async function getAffiliateCommissions(affiliateId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(affiliateCommissions)
    .where(eq(affiliateCommissions.affiliateId, affiliateId))
    .limit(limit)
    .orderBy(desc(affiliateCommissions.createdAt));
}

// ============ CREDIT TRANSACTION OPERATIONS ============

export async function createCreditTransaction(data: InsertCreditTransaction) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(creditTransactions).values(data);
  return result[0].insertId;
}

export async function getUserCreditTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .limit(limit)
    .orderBy(desc(creditTransactions.createdAt));
}

// ============ ADMIN METRICS ============

export async function getAdminMetrics() {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [genCount] = await db.select({ count: sql<number>`count(*)` }).from(generations);
  const [paidUsers] = await db.select({ count: sql<number>`count(*)` }).from(users)
    .where(sql`${users.tier} != 'free'`);
  
  const [monthlyGens] = await db.select({ count: sql<number>`count(*)` }).from(generations)
    .where(gte(generations.createdAt, startOfMonth));
  
  return {
    totalUsers: userCount?.count ?? 0,
    totalGenerations: genCount?.count ?? 0,
    paidUsers: paidUsers?.count ?? 0,
    monthlyGenerations: monthlyGens?.count ?? 0,
  };
}

// ============ TIER CREDIT LIMITS ============

export const TIER_CREDITS = {
  free: 5,
  starter: 50,
  pro: 300,
  business: 1000,
} as const;

export const TIER_PRICES = {
  starter: 9,
  pro: 29,
  business: 99,
} as const;

export const CREDIT_PACKS = [
  { credits: 100, price: 15 },
  { credits: 500, price: 60 },
  { credits: 1000, price: 100 },
] as const;


// ============ AFFILIATE LEADERBOARD & NETWORK STATS ============

export async function getAffiliateLeaderboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: affiliates.id,
      userId: affiliates.userId,
      totalReferrals: affiliates.totalReferrals,
      totalEarnings: affiliates.totalEarnings,
      userName: users.name,
    })
    .from(affiliates)
    .leftJoin(users, eq(affiliates.userId, users.id))
    .orderBy(desc(affiliates.totalEarnings))
    .limit(limit);
  
  return result;
}

export async function getAffiliateNetworkStats(affiliateId: number) {
  const db = await getDb();
  if (!db) {
    return {
      level1Count: 0,
      level2Count: 0,
      level3Count: 0,
      level1Earnings: 0,
      level2Earnings: 0,
      level3Earnings: 0,
    };
  }
  
  // Get counts by level from commissions
  const commissions = await db
    .select({
      level: affiliateCommissions.level,
      count: sql<number>`count(distinct ${affiliateCommissions.referredUserId})`,
      earnings: sql<number>`sum(${affiliateCommissions.amount})`,
    })
    .from(affiliateCommissions)
    .where(eq(affiliateCommissions.affiliateId, affiliateId))
    .groupBy(affiliateCommissions.level);
  
  const stats = {
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    level1Earnings: 0,
    level2Earnings: 0,
    level3Earnings: 0,
  };
  
  for (const row of commissions) {
    if (Number(row.level) === 1) {
      stats.level1Count = row.count;
      stats.level1Earnings = row.earnings || 0;
    } else if (Number(row.level) === 2) {
      stats.level2Count = row.count;
      stats.level2Earnings = row.earnings || 0;
    } else if (Number(row.level) === 3) {
      stats.level3Count = row.count;
      stats.level3Earnings = row.earnings || 0;
    }
  }
  
  return stats;
}
