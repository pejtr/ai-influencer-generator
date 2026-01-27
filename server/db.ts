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

// ============ HYBRID CREDIT SYSTEM ============

import { getCreditsToDeduct, getTierDailyCredits, getTierMonthlyCredits, TierName } from './stripe/products';

// Get user's current credit balance (all sources)
export async function getUserCreditBalance(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    creditBalance: users.creditBalance,
    freeCreditsToday: users.freeCreditsToday,
    lastFreeCreditsReset: users.lastFreeCreditsReset,
    monthlyCreditsRemaining: users.monthlyCreditsRemaining,
    monthlyCreditsTotal: users.monthlyCreditsTotal,
    lastMonthlyReset: users.lastMonthlyReset,
    tier: users.tier,
  }).from(users).where(eq(users.id, userId)).limit(1);
  
  if (result.length === 0) return null;
  
  const user = result[0];
  const now = new Date();
  
  // Check if free credits need reset (midnight UTC)
  const lastReset = new Date(user.lastFreeCreditsReset);
  const needsFreeReset = lastReset.toDateString() !== now.toDateString();
  
  let freeCreditsToday = user.freeCreditsToday;
  if (needsFreeReset) {
    freeCreditsToday = getTierDailyCredits(user.tier as TierName);
    await db.update(users).set({
      freeCreditsToday,
      lastFreeCreditsReset: now,
    }).where(eq(users.id, userId));
  }
  
  return {
    freeCreditsToday,
    paidCredits: user.creditBalance,
    subscriptionCredits: user.monthlyCreditsRemaining,
    totalAvailable: freeCreditsToday + user.creditBalance + user.monthlyCreditsRemaining,
    tier: user.tier,
  };
}

// Deduct credits using priority: free > subscription > paid
export async function deductCreditsHybrid(userId: number, amount: number): Promise<{ success: boolean; source: string; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, source: 'none', error: 'Database not available' };
  
  const balance = await getUserCreditBalance(userId);
  if (!balance) return { success: false, source: 'none', error: 'User not found' };
  
  if (balance.totalAvailable < amount) {
    return { success: false, source: 'none', error: 'Insufficient credits' };
  }
  
  const deduction = getCreditsToDeduct(
    balance.freeCreditsToday,
    balance.subscriptionCredits,
    balance.paidCredits,
    amount
  );
  
  // Update user credits
  await db.update(users).set({
    freeCreditsToday: balance.freeCreditsToday - deduction.free,
    monthlyCreditsRemaining: balance.subscriptionCredits - deduction.subscription,
    creditBalance: balance.paidCredits - deduction.paid,
  }).where(eq(users.id, userId));
  
  // Determine primary source for tracking
  let source = 'free';
  if (deduction.subscription > 0) source = 'subscription';
  if (deduction.paid > 0) source = 'paid';
  
  return { success: true, source };
}

// Add paid credits to user balance
export async function addPaidCredits(userId: number, amount: number, description: string) {
  const db = await getDb();
  if (!db) return false;
  
  const user = await getUserById(userId);
  if (!user) return false;
  
  const balanceBefore = user.creditBalance || 0;
  const balanceAfter = balanceBefore + amount;
  
  await db.update(users).set({
    creditBalance: balanceAfter,
  }).where(eq(users.id, userId));
  
  // Log transaction
  await createCreditTransaction({
    userId,
    amount,
    type: 'credit_pack_purchase',
    description,
    balanceBefore,
    balanceAfter,
    creditSource: 'paid',
  });
  
  return true;
}

// Reset monthly subscription credits
export async function resetMonthlyCredits(userId: number, tier: TierName) {
  const db = await getDb();
  if (!db) return;
  
  const monthlyCredits = getTierMonthlyCredits(tier);
  
  await db.update(users).set({
    monthlyCreditsRemaining: monthlyCredits,
    monthlyCreditsTotal: monthlyCredits,
    lastMonthlyReset: new Date(),
  }).where(eq(users.id, userId));
  
  // Log transaction
  await createCreditTransaction({
    userId,
    amount: monthlyCredits,
    type: 'subscription_monthly',
    description: `Monthly ${tier.toUpperCase()} subscription credits`,
    balanceBefore: 0,
    balanceAfter: monthlyCredits,
    creditSource: 'subscription',
  });
}


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


// ============ FANVUE INTEGRATION ============

export async function updateUserFanvueTokens(
  userId: number,
  accessToken: string,
  refreshToken: string,
  fanvueUserId: string
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    fanvueAccessToken: accessToken,
    fanvueRefreshToken: refreshToken,
    fanvueUserId,
    fanvueConnectedAt: new Date(),
  }).where(eq(users.id, userId));
}

export async function disconnectUserFanvue(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    fanvueAccessToken: null,
    fanvueRefreshToken: null,
    fanvueUserId: null,
    fanvueConnectedAt: null,
  }).where(eq(users.id, userId));
}

export async function getUserFanvueTokens(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    accessToken: users.fanvueAccessToken,
    refreshToken: users.fanvueRefreshToken,
    fanvueUserId: users.fanvueUserId,
    connectedAt: users.fanvueConnectedAt,
  }).from(users).where(eq(users.id, userId)).limit(1);
  
  if (result.length === 0 || !result[0].accessToken) return null;
  return result[0];
}

// ============ SCHEDULED POSTS (VIP) ============

import { scheduledPosts, InsertScheduledPost, batchJobs, InsertBatchJob } from "../drizzle/schema";

export async function createScheduledPost(data: InsertScheduledPost) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(scheduledPosts).values(data);
  return result[0].insertId;
}

export async function getScheduledPostsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledPosts)
    .where(eq(scheduledPosts.userId, userId))
    .limit(limit)
    .orderBy(desc(scheduledPosts.scheduledAt));
}

export async function getScheduledPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateScheduledPost(id: number, data: Partial<InsertScheduledPost>) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledPosts).set(data).where(eq(scheduledPosts.id, id));
}

export async function deleteScheduledPost(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(scheduledPosts).where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.userId, userId)));
  return true;
}

export async function getPendingScheduledPosts() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(scheduledPosts)
    .where(and(
      eq(scheduledPosts.status, 'scheduled'),
      lte(scheduledPosts.scheduledAt, now)
    ))
    .orderBy(scheduledPosts.scheduledAt);
}

// ============ BATCH JOBS (VIP) ============

export async function createBatchJob(data: InsertBatchJob) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(batchJobs).values(data);
  return result[0].insertId;
}

export async function getBatchJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(batchJobs).where(eq(batchJobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBatchJobsByUserId(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batchJobs)
    .where(eq(batchJobs.userId, userId))
    .limit(limit)
    .orderBy(desc(batchJobs.createdAt));
}

export async function updateBatchJob(id: number, data: Partial<InsertBatchJob>) {
  const db = await getDb();
  if (!db) return;
  await db.update(batchJobs).set(data).where(eq(batchJobs.id, id));
}

export async function incrementBatchJobProgress(id: number, completed: boolean) {
  const db = await getDb();
  if (!db) return;
  if (completed) {
    await db.update(batchJobs).set({
      completedImages: sql`${batchJobs.completedImages} + 1`,
    }).where(eq(batchJobs.id, id));
  } else {
    await db.update(batchJobs).set({
      failedImages: sql`${batchJobs.failedImages} + 1`,
    }).where(eq(batchJobs.id, id));
  }
}

// ============ GENERATION WITH FANVUE TRACKING ============

export async function markGenerationPublished(generationId: number, fanvuePostId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(generations).set({
    publishedToFanvue: true,
    fanvuePostId,
  }).where(eq(generations.id, generationId));
}

export async function getUnpublishedGenerations(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generations)
    .where(and(
      eq(generations.userId, userId),
      eq(generations.status, 'completed'),
      eq(generations.publishedToFanvue, false)
    ))
    .limit(limit)
    .orderBy(desc(generations.createdAt));
}
