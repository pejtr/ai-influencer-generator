import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  generations, InsertGeneration,
  subscriptions, InsertSubscription,
  creditPurchases, InsertCreditPurchase,
  affiliates, InsertAffiliate,
  affiliateCommissions, InsertAffiliateCommission,
  creditTransactions, InsertCreditTransaction,
  // Chat Companion
  influencerPersonalities, InsertInfluencerPersonality,
  chatConversations, InsertChatConversation,
  chatMessages, InsertChatMessage,
  exclusiveContent, InsertExclusiveContent,
  contentPurchases, InsertContentPurchase,
  fanTips, InsertFanTip,
  creatorEarnings, InsertCreatorEarnings,
  pwaAnalytics, InsertPwaAnalytic,
  channelCosts, InsertChannelCost,
  funnelAlerts, InsertFunnelAlert,
  userTouchpoints, InsertUserTouchpoint
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


// ============ AI CHAT COMPANION ============

// Influencer Personalities
export async function createInfluencerPersonality(data: InsertInfluencerPersonality) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(influencerPersonalities).values(data);
  return result[0].insertId;
}

export async function getInfluencerPersonalityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(influencerPersonalities).where(eq(influencerPersonalities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInfluencerPersonalitiesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(influencerPersonalities)
    .where(eq(influencerPersonalities.userId, userId))
    .orderBy(desc(influencerPersonalities.createdAt));
}

export async function updateInfluencerPersonality(id: number, userId: number, data: Partial<InsertInfluencerPersonality>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(influencerPersonalities)
    .set(data)
    .where(and(eq(influencerPersonalities.id, id), eq(influencerPersonalities.userId, userId)));
  return true;
}

export async function deleteInfluencerPersonality(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(influencerPersonalities)
    .where(and(eq(influencerPersonalities.id, id), eq(influencerPersonalities.userId, userId)));
  return true;
}

export async function getActivePersonalities(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(influencerPersonalities)
    .where(eq(influencerPersonalities.isActive, true))
    .limit(limit)
    .orderBy(desc(influencerPersonalities.totalConversations));
}

// Chat Conversations
export async function createChatConversation(data: InsertChatConversation) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatConversations).values(data);
  return result[0].insertId;
}

export async function getChatConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getConversationByFanAndPersonality(fanUserId: number, personalityId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatConversations)
    .where(and(
      eq(chatConversations.fanUserId, fanUserId),
      eq(chatConversations.personalityId, personalityId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getConversationsByFanId(fanUserId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations)
    .where(eq(chatConversations.fanUserId, fanUserId))
    .orderBy(desc(chatConversations.lastMessageAt))
    .limit(limit);
}

export async function getConversationsByCreatorId(creatorUserId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations)
    .where(eq(chatConversations.creatorUserId, creatorUserId))
    .orderBy(desc(chatConversations.lastMessageAt))
    .limit(limit);
}

export async function updateChatConversation(id: number, data: Partial<InsertChatConversation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatConversations).set(data).where(eq(chatConversations.id, id));
}

export async function incrementConversationStats(conversationId: number, amountSpent: number = 0) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatConversations).set({
    messageCount: sql`${chatConversations.messageCount} + 1`,
    fanSpent: sql`${chatConversations.fanSpent} + ${amountSpent}`,
    lastMessageAt: new Date(),
  }).where(eq(chatConversations.id, conversationId));
}

// Chat Messages
export async function createChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatMessages).values(data);
  return result[0].insertId;
}

export async function getChatMessagesByConversationId(conversationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}

export async function getRecentChatMessages(conversationId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

// Exclusive Content
export async function createExclusiveContent(data: InsertExclusiveContent) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(exclusiveContent).values(data);
  return result[0].insertId;
}

export async function getExclusiveContentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(exclusiveContent).where(eq(exclusiveContent.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getExclusiveContentByCreatorId(creatorUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exclusiveContent)
    .where(eq(exclusiveContent.creatorUserId, creatorUserId))
    .orderBy(desc(exclusiveContent.createdAt));
}

export async function getActiveExclusiveContent(creatorUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exclusiveContent)
    .where(and(
      eq(exclusiveContent.creatorUserId, creatorUserId),
      eq(exclusiveContent.isActive, true)
    ))
    .orderBy(desc(exclusiveContent.createdAt));
}

export async function updateExclusiveContent(id: number, creatorUserId: number, data: Partial<InsertExclusiveContent>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(exclusiveContent)
    .set(data)
    .where(and(eq(exclusiveContent.id, id), eq(exclusiveContent.creatorUserId, creatorUserId)));
  return true;
}

export async function incrementContentSales(contentId: number, amount: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(exclusiveContent).set({
    totalSales: sql`${exclusiveContent.totalSales} + 1`,
    totalRevenue: sql`${exclusiveContent.totalRevenue} + ${amount}`,
  }).where(eq(exclusiveContent.id, contentId));
}

// Content Purchases
export async function createContentPurchase(data: InsertContentPurchase) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(contentPurchases).values(data);
  return result[0].insertId;
}

export async function getContentPurchasesByFanId(fanUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentPurchases)
    .where(eq(contentPurchases.fanUserId, fanUserId))
    .orderBy(desc(contentPurchases.purchasedAt));
}

export async function hasUserPurchasedContent(fanUserId: number, contentId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(contentPurchases)
    .where(and(
      eq(contentPurchases.fanUserId, fanUserId),
      eq(contentPurchases.contentId, contentId),
      eq(contentPurchases.status, 'completed')
    ))
    .limit(1);
  return result.length > 0;
}

// Fan Tips
export async function createFanTip(data: InsertFanTip) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(fanTips).values(data);
  return result[0].insertId;
}

export async function getTipsByCreatorId(creatorUserId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fanTips)
    .where(eq(fanTips.creatorUserId, creatorUserId))
    .orderBy(desc(fanTips.createdAt))
    .limit(limit);
}

// Creator Earnings
export async function getOrCreateCreatorEarnings(creatorUserId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(creatorEarnings)
    .where(eq(creatorEarnings.creatorUserId, creatorUserId))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create new earnings record
  await db.insert(creatorEarnings).values({ creatorUserId });
  const created = await db.select().from(creatorEarnings)
    .where(eq(creatorEarnings.creatorUserId, creatorUserId))
    .limit(1);
  
  return created.length > 0 ? created[0] : null;
}

export async function updateCreatorEarnings(
  creatorUserId: number, 
  earnings: number, 
  type: 'content' | 'tips' | 'messages'
) {
  const db = await getDb();
  if (!db) return;
  
  const updates: Record<string, unknown> = {
    totalEarnings: sql`${creatorEarnings.totalEarnings} + ${earnings}`,
    pendingEarnings: sql`${creatorEarnings.pendingEarnings} + ${earnings}`,
  };
  
  if (type === 'content') {
    updates.earningsFromContent = sql`${creatorEarnings.earningsFromContent} + ${earnings}`;
    updates.totalContentSold = sql`${creatorEarnings.totalContentSold} + 1`;
  } else if (type === 'tips') {
    updates.earningsFromTips = sql`${creatorEarnings.earningsFromTips} + ${earnings}`;
  } else if (type === 'messages') {
    updates.earningsFromMessages = sql`${creatorEarnings.earningsFromMessages} + ${earnings}`;
  }
  
  await db.update(creatorEarnings).set(updates).where(eq(creatorEarnings.creatorUserId, creatorUserId));
}

export async function incrementCreatorFans(creatorUserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(creatorEarnings).set({
    totalFans: sql`${creatorEarnings.totalFans} + 1`,
    totalConversations: sql`${creatorEarnings.totalConversations} + 1`,
  }).where(eq(creatorEarnings.creatorUserId, creatorUserId));
}

// Increment personality stats
export async function incrementPersonalityStats(personalityId: number, revenue: number = 0) {
  const db = await getDb();
  if (!db) return;
  await db.update(influencerPersonalities).set({
    messageCount: sql`${influencerPersonalities.messageCount} + 1`,
    totalRevenue: sql`${influencerPersonalities.totalRevenue} + ${revenue}`,
  }).where(eq(influencerPersonalities.id, personalityId));
}

export async function incrementPersonalityConversations(personalityId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(influencerPersonalities).set({
    totalConversations: sql`${influencerPersonalities.totalConversations} + 1`,
  }).where(eq(influencerPersonalities.id, personalityId));
}


// ============ PWA Analytics ============

export async function trackPwaEvent(data: {
  userId?: number;
  eventType: InsertPwaAnalytic["eventType"];
  metadata?: Record<string, unknown>;
  userAgent?: string;
  platform?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(pwaAnalytics).values({
    userId: data.userId ?? null,
    eventType: data.eventType,
    metadata: data.metadata ?? null,
    userAgent: data.userAgent ?? null,
    platform: data.platform ?? null,
  });
  return result[0].insertId;
}

export async function getPwaAnalyticsSummary(days: number = 30) {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    eventType: pwaAnalytics.eventType,
    count: sql<number>`COUNT(*)`,
  })
    .from(pwaAnalytics)
    .where(gte(pwaAnalytics.createdAt, since))
    .groupBy(pwaAnalytics.eventType);
  return rows;
}

export async function getPwaAnalyticsTrend(eventType: string, days: number = 30) {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    date: sql<string>`DATE(${pwaAnalytics.createdAt})`,
    count: sql<number>`COUNT(*)`,
  })
    .from(pwaAnalytics)
    .where(and(
      eq(pwaAnalytics.eventType, eventType as any),
      gte(pwaAnalytics.createdAt, since)
    ))
    .groupBy(sql`DATE(${pwaAnalytics.createdAt})`)
    .orderBy(sql`DATE(${pwaAnalytics.createdAt})`);
  return rows;
}

export async function getPwaABTestByVariant(days: number = 30) {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Get per-variant stats from metadata JSON
  const rows = await db.select({
    eventType: pwaAnalytics.eventType,
    metadata: pwaAnalytics.metadata,
    count: sql<number>`COUNT(*)`,
  })
    .from(pwaAnalytics)
    .where(and(
      sql`${pwaAnalytics.eventType} IN ('ab_variant_assigned', 'ab_install_clicked', 'ab_dismiss_clicked')`,
      gte(pwaAnalytics.createdAt, since)
    ))
    .groupBy(pwaAnalytics.eventType, sql`JSON_EXTRACT(${pwaAnalytics.metadata}, '$.variantId')`);
  return rows;
}

export async function getPwaTouchHeatmapData(days: number = 7) {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    metadata: pwaAnalytics.metadata,
    createdAt: pwaAnalytics.createdAt,
  })
    .from(pwaAnalytics)
    .where(and(
      eq(pwaAnalytics.eventType, 'touch_interaction' as any),
      gte(pwaAnalytics.createdAt, since)
    ))
    .limit(5000);
  return rows;
}

export async function getWeeklyReportData() {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Get all events from last 7 days
  const summary = await db.select({
    eventType: pwaAnalytics.eventType,
    count: sql<number>`COUNT(*)`,
  })
    .from(pwaAnalytics)
    .where(gte(pwaAnalytics.createdAt, since))
    .groupBy(pwaAnalytics.eventType);

  // Get platform breakdown
  const platforms = await db.select({
    platform: pwaAnalytics.platform,
    count: sql<number>`COUNT(*)`,
  })
    .from(pwaAnalytics)
    .where(gte(pwaAnalytics.createdAt, since))
    .groupBy(pwaAnalytics.platform);

  // Get session metadata for duration/scroll calculations
  const sessionEnds = await db.select({
    metadata: pwaAnalytics.metadata,
  })
    .from(pwaAnalytics)
    .where(and(
      eq(pwaAnalytics.eventType, 'session_end' as any),
      gte(pwaAnalytics.createdAt, since)
    ))
    .limit(1000);

  // Get page view data for top pages
  const pageViews = await db.select({
    metadata: pwaAnalytics.metadata,
    count: sql<number>`COUNT(*)`,
  })
    .from(pwaAnalytics)
    .where(and(
      eq(pwaAnalytics.eventType, 'page_view' as any),
      gte(pwaAnalytics.createdAt, since)
    ))
    .groupBy(sql`JSON_EXTRACT(${pwaAnalytics.metadata}, '$.url')`)
    .limit(10);

  return { summary, platforms, sessionEnds, pageViews };
}

export async function getScrollDepthData(days: number = 30) {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    metadata: pwaAnalytics.metadata,
    createdAt: pwaAnalytics.createdAt,
  })
    .from(pwaAnalytics)
    .where(and(
      eq(pwaAnalytics.eventType, 'scroll_depth' as any),
      gte(pwaAnalytics.createdAt, since)
    ))
    .limit(10000);
  return rows;
}

export async function getABTestVariantStats() {
  const db = await getDb();
  if (!db) return null;
  // Get all-time variant stats for auto-optimization
  const rows = await db.select({
    eventType: pwaAnalytics.eventType,
    metadata: pwaAnalytics.metadata,
    count: sql<number>`COUNT(*)`,
  })
    .from(pwaAnalytics)
    .where(
      sql`${pwaAnalytics.eventType} IN ('ab_variant_assigned', 'ab_install_clicked', 'ab_dismiss_clicked')`
    )
    .groupBy(pwaAnalytics.eventType, sql`JSON_EXTRACT(${pwaAnalytics.metadata}, '$.variantId')`);
  return rows;
}

export async function getPwaAnalyticsByPlatform(days: number = 30) {
  const db = await getDb();
  if (!db) return null;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    platform: pwaAnalytics.platform,
    eventType: pwaAnalytics.eventType,
    count: sql<number>`COUNT(*)`,
  })
    .from(pwaAnalytics)
    .where(gte(pwaAnalytics.createdAt, since))
    .groupBy(pwaAnalytics.platform, pwaAnalytics.eventType);
  return rows;
}


// ============================================
// COHORT ANALYSIS QUERIES
// ============================================

/**
 * Get all users with their registration dates for cohort grouping.
 */
export async function getCohortUsers() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: users.id,
    createdAt: users.createdAt,
    tier: users.tier,
  }).from(users).orderBy(users.createdAt);
  return rows;
}

/**
 * Get user activity data for cohort retention analysis.
 * Activity = any generation, login (lastSignedIn), or credit transaction.
 * Returns one row per user per day they were active.
 */
export async function getCohortActivityData(sinceDate: Date) {
  const db = await getDb();
  if (!db) return [];

  // Combine multiple activity sources into a unified activity stream
  // 1. Generations (most important - shows product usage)
  const genActivity = await db.select({
    userId: generations.userId,
    date: sql<Date>`DATE(${generations.createdAt})`.as("date"),
    revenue: sql<number>`0`.as("revenue"),
    generations: sql<number>`COUNT(*)`.as("generations"),
  })
    .from(generations)
    .where(gte(generations.createdAt, sinceDate))
    .groupBy(generations.userId, sql`DATE(${generations.createdAt})`);

  // 2. Credit purchases (revenue tracking)
  const purchaseActivity = await db.select({
    userId: creditPurchases.userId,
    date: sql<Date>`DATE(${creditPurchases.createdAt})`.as("date"),
    revenue: sql<number>`SUM(CAST(${creditPurchases.amountPaid} AS DECIMAL(10,2)))`.as("revenue"),
    generations: sql<number>`0`.as("generations"),
  })
    .from(creditPurchases)
    .where(and(
      gte(creditPurchases.createdAt, sinceDate),
      eq(creditPurchases.status, "completed")
    ))
    .groupBy(creditPurchases.userId, sql`DATE(${creditPurchases.createdAt})`);

  // 3. PWA session starts (engagement tracking)
  const sessionActivity = await db.select({
    userId: pwaAnalytics.userId,
    date: sql<Date>`DATE(${pwaAnalytics.createdAt})`.as("date"),
    revenue: sql<number>`0`.as("revenue"),
    generations: sql<number>`0`.as("generations"),
  })
    .from(pwaAnalytics)
    .where(and(
      gte(pwaAnalytics.createdAt, sinceDate),
      eq(pwaAnalytics.eventType, "session_start"),
      sql`${pwaAnalytics.userId} IS NOT NULL`
    ))
    .groupBy(pwaAnalytics.userId, sql`DATE(${pwaAnalytics.createdAt})`);

  // Merge all activities
  const activityMap = new Map<string, { userId: number; date: Date; revenue: number; generations: number }>();

  const mergeActivity = (rows: { userId: number | null; date: Date; revenue: number; generations: number }[]) => {
    for (const row of rows) {
      if (!row.userId) continue;
      const key = `${row.userId}-${row.date}`;
      const existing = activityMap.get(key);
      if (existing) {
        existing.revenue += Number(row.revenue) || 0;
        existing.generations += Number(row.generations) || 0;
      } else {
        activityMap.set(key, {
          userId: row.userId,
          date: new Date(row.date),
          revenue: Number(row.revenue) || 0,
          generations: Number(row.generations) || 0,
        });
      }
    }
  };

  mergeActivity(genActivity);
  mergeActivity(purchaseActivity);
  mergeActivity(sessionActivity);

  return Array.from(activityMap.values());
}

/**
 * Get subscription revenue data per user per period for cohort revenue tracking.
 */
export async function getCohortSubscriptionRevenue(sinceDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    userId: subscriptions.userId,
    date: sql<Date>`DATE(${subscriptions.currentPeriodStart})`.as("date"),
    tier: subscriptions.tier,
  })
    .from(subscriptions)
    .where(and(
      gte(subscriptions.currentPeriodStart, sinceDate),
      eq(subscriptions.status, "active")
    ));

  // Map subscription tier to approximate monthly revenue
  const tierRevenue: Record<string, number> = {
    pro: 19.99,
    creator: 49.99,
  };

  return rows.map(r => ({
    userId: r.userId,
    date: new Date(r.date),
    revenue: tierRevenue[r.tier] || 0,
    generations: 0,
  }));
}


// ============================================
// CONVERSION FUNNEL QUERIES
// ============================================

/**
 * Get funnel raw data for a given date range.
 * Returns counts for each funnel step: visits, signups, generations, paid users.
 */
export async function getFunnelData(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;

  // 1. Visits: unique sessions (session_start events or page_view for anonymous)
  const visitRows = await db.select({
    count: sql<number>`COUNT(DISTINCT COALESCE(${pwaAnalytics.userId}, ${pwaAnalytics.id}))`,
  })
    .from(pwaAnalytics)
    .where(and(
      sql`${pwaAnalytics.eventType} IN ('session_start', 'page_view')`,
      gte(pwaAnalytics.createdAt, startDate),
      lte(pwaAnalytics.createdAt, endDate),
    ));
  const visits = Number(visitRows[0]?.count ?? 0);

  // 2. Signups: users registered in this period
  const signupRows = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(users)
    .where(and(
      gte(users.createdAt, startDate),
      lte(users.createdAt, endDate),
    ));
  const signups = Number(signupRows[0]?.count ?? 0);

  // 3. First Generation: unique users who generated at least 1 completed image
  //    (users who registered in this period AND generated)
  const genRows = await db.select({
    count: sql<number>`COUNT(DISTINCT ${generations.userId})`,
  })
    .from(generations)
    .where(and(
      gte(generations.createdAt, startDate),
      lte(generations.createdAt, endDate),
      eq(generations.status, "completed"),
    ));
  const generationUsers = Number(genRows[0]?.count ?? 0);

  // 4. Paid Conversions: unique users who made a purchase (credit pack or subscription)
  const creditPurchaseRows = await db.select({
    count: sql<number>`COUNT(DISTINCT ${creditPurchases.userId})`,
  })
    .from(creditPurchases)
    .where(and(
      gte(creditPurchases.createdAt, startDate),
      lte(creditPurchases.createdAt, endDate),
      eq(creditPurchases.status, "completed"),
    ));

  const subscriptionRows = await db.select({
    count: sql<number>`COUNT(DISTINCT ${subscriptions.userId})`,
  })
    .from(subscriptions)
    .where(and(
      gte(subscriptions.createdAt, startDate),
      lte(subscriptions.createdAt, endDate),
    ));

  // Combine unique paid users (union of credit purchasers + subscribers)
  const paidUsers = Number(creditPurchaseRows[0]?.count ?? 0) + Number(subscriptionRows[0]?.count ?? 0);

  return {
    visits,
    signups,
    generations: generationUsers,
    paidUsers,
  };
}

/**
 * Get daily funnel trend data for charting.
 */
export async function getFunnelTrend(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  // Daily signups
  const dailySignups = await db.select({
    date: sql<string>`DATE(${users.createdAt})`.as("date"),
    count: sql<number>`COUNT(*)`.as("count"),
  })
    .from(users)
    .where(and(
      gte(users.createdAt, startDate),
      lte(users.createdAt, endDate),
    ))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);

  // Daily generations (unique users)
  const dailyGens = await db.select({
    date: sql<string>`DATE(${generations.createdAt})`.as("date"),
    count: sql<number>`COUNT(DISTINCT ${generations.userId})`.as("count"),
  })
    .from(generations)
    .where(and(
      gte(generations.createdAt, startDate),
      lte(generations.createdAt, endDate),
      eq(generations.status, "completed"),
    ))
    .groupBy(sql`DATE(${generations.createdAt})`)
    .orderBy(sql`DATE(${generations.createdAt})`);

  // Daily visits
  const dailyVisits = await db.select({
    date: sql<string>`DATE(${pwaAnalytics.createdAt})`.as("date"),
    count: sql<number>`COUNT(DISTINCT COALESCE(${pwaAnalytics.userId}, ${pwaAnalytics.id}))`.as("count"),
  })
    .from(pwaAnalytics)
    .where(and(
      sql`${pwaAnalytics.eventType} IN ('session_start', 'page_view')`,
      gte(pwaAnalytics.createdAt, startDate),
      lte(pwaAnalytics.createdAt, endDate),
    ))
    .groupBy(sql`DATE(${pwaAnalytics.createdAt})`)
    .orderBy(sql`DATE(${pwaAnalytics.createdAt})`);

  // Merge into a unified daily trend
  const dateMap = new Map<string, { date: string; visits: number; signups: number; generations: number }>();

  for (const row of dailyVisits) {
    const d = String(row.date);
    dateMap.set(d, { date: d, visits: Number(row.count), signups: 0, generations: 0 });
  }
  for (const row of dailySignups) {
    const d = String(row.date);
    const existing = dateMap.get(d) || { date: d, visits: 0, signups: 0, generations: 0 };
    existing.signups = Number(row.count);
    dateMap.set(d, existing);
  }
  for (const row of dailyGens) {
    const d = String(row.date);
    const existing = dateMap.get(d) || { date: d, visits: 0, signups: 0, generations: 0 };
    existing.generations = Number(row.count);
    dateMap.set(d, existing);
  }

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}


// ============ Revenue Attribution & LTV ============

export async function getRevenueByChannel() {
  const db = await getDb();
  if (!db) return [];
  // Get user counts per channel
  const userCounts = await db.select({
    channel: users.acquisitionChannel,
    totalUsers: sql<number>`COUNT(*)`,
  }).from(users).groupBy(users.acquisitionChannel);

  // Get paid users per channel (users with at least one completed purchase or active subscription)
  const paidUsersByChannel = await db.select({
    channel: users.acquisitionChannel,
    paidUsers: sql<number>`COUNT(DISTINCT ${users.id})`,
  }).from(users)
    .leftJoin(creditPurchases, sql`${creditPurchases.userId} = ${users.id} AND ${creditPurchases.status} = 'completed'`)
    .leftJoin(subscriptions, sql`${subscriptions.userId} = ${users.id}`)
    .where(sql`${creditPurchases.id} IS NOT NULL OR ${subscriptions.id} IS NOT NULL`)
    .groupBy(users.acquisitionChannel);

  // Get credit pack revenue per channel
  const creditRevenue = await db.select({
    channel: users.acquisitionChannel,
    revenue: sql<number>`COALESCE(SUM(${creditPurchases.amountPaid}), 0)`,
    orderCount: sql<number>`COUNT(${creditPurchases.id})`,
  }).from(users)
    .leftJoin(creditPurchases, sql`${creditPurchases.userId} = ${users.id} AND ${creditPurchases.status} = 'completed'`)
    .groupBy(users.acquisitionChannel);

  // Get subscription revenue per channel (estimate from active subscriptions * price)
  const subRevenue = await db.select({
    channel: users.acquisitionChannel,
    revenue: sql<number>`COUNT(DISTINCT ${subscriptions.id}) * 19.99`, // Approximate monthly revenue
    subCount: sql<number>`COUNT(DISTINCT ${subscriptions.id})`,
  }).from(users)
    .leftJoin(subscriptions, sql`${subscriptions.userId} = ${users.id}`)
    .where(sql`${subscriptions.id} IS NOT NULL`)
    .groupBy(users.acquisitionChannel);

  // Get avg days to first purchase per channel
  const daysToFirstPurchase = await db.select({
    channel: users.acquisitionChannel,
    avgDays: sql<number>`COALESCE(AVG(DATEDIFF(${creditPurchases.createdAt}, ${users.createdAt})), 0)`,
  }).from(users)
    .innerJoin(creditPurchases, sql`${creditPurchases.userId} = ${users.id} AND ${creditPurchases.status} = 'completed'`)
    .groupBy(users.acquisitionChannel);

  // Get 30-day active users per channel
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeUsers30d = await db.select({
    channel: users.acquisitionChannel,
    activeCount: sql<number>`COUNT(DISTINCT ${users.id})`,
  }).from(users)
    .where(sql`${users.lastSignedIn} >= ${thirtyDaysAgo}`)
    .groupBy(users.acquisitionChannel);

  // Merge all data
  const channelMap = new Map<string, {
    channel: string;
    totalUsers: number;
    paidUsers: number;
    subscriptionRevenue: number;
    creditPackRevenue: number;
    totalOrders: number;
    avgDaysToFirstPurchase: number;
    activeUsersLast30d: number;
  }>();

  const channels = ["organic", "paid", "affiliate", "direct", "social"];
  channels.forEach(ch => {
    channelMap.set(ch, {
      channel: ch,
      totalUsers: 0,
      paidUsers: 0,
      subscriptionRevenue: 0,
      creditPackRevenue: 0,
      totalOrders: 0,
      avgDaysToFirstPurchase: 0,
      activeUsersLast30d: 0,
    });
  });

  userCounts.forEach(row => {
    const ch = row.channel || "direct";
    const entry = channelMap.get(ch);
    if (entry) entry.totalUsers = Number(row.totalUsers);
  });

  paidUsersByChannel.forEach(row => {
    const ch = row.channel || "direct";
    const entry = channelMap.get(ch);
    if (entry) entry.paidUsers = Number(row.paidUsers);
  });

  creditRevenue.forEach(row => {
    const ch = row.channel || "direct";
    const entry = channelMap.get(ch);
    if (entry) {
      entry.creditPackRevenue = Number(row.revenue);
      entry.totalOrders += Number(row.orderCount);
    }
  });

  subRevenue.forEach(row => {
    const ch = row.channel || "direct";
    const entry = channelMap.get(ch);
    if (entry) {
      entry.subscriptionRevenue = Number(row.revenue);
      entry.totalOrders += Number(row.subCount);
    }
  });

  daysToFirstPurchase.forEach(row => {
    const ch = row.channel || "direct";
    const entry = channelMap.get(ch);
    if (entry) entry.avgDaysToFirstPurchase = Number(row.avgDays);
  });

  activeUsers30d.forEach(row => {
    const ch = row.channel || "direct";
    const entry = channelMap.get(ch);
    if (entry) entry.activeUsersLast30d = Number(row.activeCount);
  });

  return Array.from(channelMap.values());
}

export async function getLtvTrendByChannel(days: number = 90) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get cumulative revenue per channel per week
  const weeklyRevenue = await db.select({
    channel: users.acquisitionChannel,
    week: sql<string>`DATE_FORMAT(${creditPurchases.createdAt}, '%Y-%m-%d')`,
    revenue: sql<number>`SUM(${creditPurchases.amountPaid})`,
    userCount: sql<number>`COUNT(DISTINCT ${users.id})`,
  }).from(creditPurchases)
    .innerJoin(users, sql`${users.id} = ${creditPurchases.userId}`)
    .where(sql`${creditPurchases.createdAt} >= ${startDate} AND ${creditPurchases.status} = 'completed'`)
    .groupBy(users.acquisitionChannel, sql`DATE_FORMAT(${creditPurchases.createdAt}, '%Y-%m-%d')`)
    .orderBy(sql`DATE_FORMAT(${creditPurchases.createdAt}, '%Y-%m-%d')`);

  return weeklyRevenue.map(row => ({
    date: String(row.week),
    channel: (row.channel || "direct") as string,
    revenue: Number(row.revenue),
    userCount: Number(row.userCount),
  }));
}

export async function updateUserAcquisitionChannel(userId: number, channel: string, utmSource?: string, utmMedium?: string, utmCampaign?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    acquisitionChannel: channel as any,
    utmSource: utmSource || null,
    utmMedium: utmMedium || null,
    utmCampaign: utmCampaign || null,
  }).where(eq(users.id, userId));
}

// ============================================================
// Funnel Alerts
// ============================================================

export async function getFunnelAlertHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(funnelAlerts).orderBy(desc(funnelAlerts.createdAt)).limit(limit);
}

export async function getUnacknowledgedAlerts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(funnelAlerts).where(eq(funnelAlerts.acknowledged, false)).orderBy(desc(funnelAlerts.createdAt));
}

export async function saveFunnelAlert(alert: InsertFunnelAlert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(funnelAlerts).values(alert);
  return result;
}

export async function acknowledgeFunnelAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  return db.update(funnelAlerts)
    .set({ acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() })
    .where(eq(funnelAlerts.id, alertId));
}

export async function getHistoricalFunnelRates(weeks: number = 4) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);
  
  // Get weekly signup counts
  const weeklySignups = await db.select({
    week: sql<string>`DATE_FORMAT(${users.createdAt}, '%Y-%u')`,
    count: sql<number>`COUNT(*)`,
  }).from(users).where(gte(users.createdAt, startDate)).groupBy(sql`DATE_FORMAT(${users.createdAt}, '%Y-%u')`);
  
  // Get weekly generation counts (unique users)
  const weeklyGenerations = await db.select({
    week: sql<string>`DATE_FORMAT(${generations.createdAt}, '%Y-%u')`,
    count: sql<number>`COUNT(DISTINCT ${generations.userId})`,
  }).from(generations).where(gte(generations.createdAt, startDate)).groupBy(sql`DATE_FORMAT(${generations.createdAt}, '%Y-%u')`);
  
  // Get weekly paid user counts
  const weeklyPaid = await db.select({
    week: sql<string>`DATE_FORMAT(${creditPurchases.createdAt}, '%Y-%u')`,
    count: sql<number>`COUNT(DISTINCT ${creditPurchases.userId})`,
  }).from(creditPurchases).where(gte(creditPurchases.createdAt, startDate)).groupBy(sql`DATE_FORMAT(${creditPurchases.createdAt}, '%Y-%u')`);
  
  // Get weekly visits
  const weeklyVisits = await db.select({
    week: sql<string>`DATE_FORMAT(${pwaAnalytics.createdAt}, '%Y-%u')`,
    count: sql<number>`COUNT(DISTINCT ${pwaAnalytics.userId})`,  // Count distinct users as proxy for sessions
  }).from(pwaAnalytics)
    .where(and(
      gte(pwaAnalytics.createdAt, startDate),
      sql`${pwaAnalytics.eventType} IN ('page_view', 'session_start')`
    ))
    .groupBy(sql`DATE_FORMAT(${pwaAnalytics.createdAt}, '%Y-%u')`);
  
  // Build weekly rates
  const weeks_set = new Set<string>();
  weeklyVisits.forEach(v => weeks_set.add(v.week));
  weeklySignups.forEach(v => weeks_set.add(v.week));
  
  const result: { stepId: string; rate: number; week: string }[] = [];
  
  for (const week of Array.from(weeks_set)) {
    const visits = weeklyVisits.find(v => v.week === week)?.count ?? 0;
    const signups = weeklySignups.find(v => v.week === week)?.count ?? 0;
    const gens = weeklyGenerations.find(v => v.week === week)?.count ?? 0;
    const paid = weeklyPaid.find(v => v.week === week)?.count ?? 0;
    
    if (visits > 0) result.push({ stepId: "signups", rate: (signups / visits) * 100, week });
    if (signups > 0) result.push({ stepId: "generations", rate: (gens / signups) * 100, week });
    if (gens > 0) result.push({ stepId: "paid", rate: (paid / gens) * 100, week });
  }
  
  return result;
}

// ============================================================
// Channel Cost Tracking
// ============================================================

export async function getChannelCosts(periodStart?: string, periodEnd?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(channelCosts);
  if (periodStart && periodEnd) {
    return db.select().from(channelCosts)
      .where(and(gte(channelCosts.period, periodStart), lte(channelCosts.period, periodEnd)))
      .orderBy(desc(channelCosts.period));
  }
  return db.select().from(channelCosts).orderBy(desc(channelCosts.period));
}

export async function addChannelCost(cost: InsertChannelCost) {
  const db = await getDb();
  if (!db) return null;
  return db.insert(channelCosts).values(cost);
}

export async function updateChannelCost(id: number, amount: number, description?: string) {
  const db = await getDb();
  if (!db) return null;
  return db.update(channelCosts)
    .set({ amount, description: description ?? undefined, updatedAt: new Date() })
    .where(eq(channelCosts.id, id));
}

export async function deleteChannelCost(id: number) {
  const db = await getDb();
  if (!db) return null;
  return db.delete(channelCosts).where(eq(channelCosts.id, id));
}

export async function getChannelCostSummary() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    channel: channelCosts.channel,
    totalAmount: sql<number>`SUM(${channelCosts.amount})`,
    periodCount: sql<number>`COUNT(DISTINCT ${channelCosts.period})`,
  }).from(channelCosts).groupBy(channelCosts.channel);
}

export async function getMonthlyCostTrend() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    period: channelCosts.period,
    channel: channelCosts.channel,
    totalAmount: sql<number>`SUM(${channelCosts.amount})`,
  }).from(channelCosts)
    .groupBy(channelCosts.period, channelCosts.channel)
    .orderBy(channelCosts.period);
}

// ============================================================
// User Touchpoints for Attribution
// ============================================================

export async function addUserTouchpoint(tp: InsertUserTouchpoint) {
  const db = await getDb();
  if (!db) return null;
  return db.insert(userTouchpoints).values(tp);
}

export async function getUserTouchpoints(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userTouchpoints)
    .where(eq(userTouchpoints.userId, userId))
    .orderBy(userTouchpoints.createdAt);
}

export async function getAllUserJourneys() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all touchpoints grouped by user
  const touchpoints = await db.select({
    userId: userTouchpoints.userId,
    channel: userTouchpoints.channel,
    eventType: userTouchpoints.eventType,
    createdAt: userTouchpoints.createdAt,
  }).from(userTouchpoints).orderBy(userTouchpoints.userId, userTouchpoints.createdAt);
  
  // Get user revenue
  const userRevenue = await db.select({
    userId: creditPurchases.userId,
    totalRevenue: sql<number>`SUM(${creditPurchases.amountPaid})`,  // amountPaid is the correct column
  }).from(creditPurchases).groupBy(creditPurchases.userId);
  
  // Also include subscription revenue
  const subRevenue = await db.select({
    userId: subscriptions.userId,
    totalRevenue: sql<number>`SUM(CASE WHEN ${subscriptions.tier} = 'pro' THEN 1999 WHEN ${subscriptions.tier} = 'creator' THEN 4999 ELSE 0 END)`,
  }).from(subscriptions).where(eq(subscriptions.status, "active")).groupBy(subscriptions.userId);
  
  // Merge revenue
  const revenueMap = new Map<number, number>();
  for (const r of userRevenue) {
    revenueMap.set(r.userId, (revenueMap.get(r.userId) || 0) + (r.totalRevenue || 0) / 100);
  }
  for (const r of subRevenue) {
    revenueMap.set(r.userId, (revenueMap.get(r.userId) || 0) + (r.totalRevenue || 0) / 100);
  }
  
  // Group touchpoints by user
  const journeyMap = new Map<number, typeof touchpoints>();
  for (const tp of touchpoints) {
    if (!journeyMap.has(tp.userId)) journeyMap.set(tp.userId, []);
    journeyMap.get(tp.userId)!.push(tp);
  }
  
  return Array.from(journeyMap).map(([userId, tps]) => ({
    userId,
    touchpoints: tps.map(tp => ({
      channel: tp.channel as "organic" | "paid" | "affiliate" | "direct" | "social",
      timestamp: new Date(tp.createdAt).getTime(),
      eventType: tp.eventType,
    })),
    revenue: revenueMap.get(userId) || 0,
  }));
}

export async function getNewCustomersPerChannel(startDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let query;
  if (startDate) {
    query = db.select({
      channel: users.acquisitionChannel,
      count: sql<number>`COUNT(*)`,
    }).from(users).where(gte(users.createdAt, startDate)).groupBy(users.acquisitionChannel);
  } else {
    query = db.select({
      channel: users.acquisitionChannel,
      count: sql<number>`COUNT(*)`,
    }).from(users).groupBy(users.acquisitionChannel);
  }
  
  return query;
}
