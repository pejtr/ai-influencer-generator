// Creator Tools DB Helpers
// Fan CRM, Mass Messaging, Content Vault, PPV Optimizer, Team Management, Social Traffic
import { eq, and, gte, lte, desc, asc, sql, like } from "drizzle-orm";
import {
  fanProfiles, InsertFanProfile,
  messageTemplates, InsertMessageTemplate,
  messageAutomations, InsertMessageAutomation,
  messageCampaigns, InsertMessageCampaign,
  contentVault, InsertContentVaultItem,
  ppvPriceHistory, InsertPpvPriceHistory,
  teamMembers, InsertTeamMember,
  socialTrafficEvents, InsertSocialTrafficEvent,
  dailyMetricSnapshots, InsertDailyMetricSnapshot,
  users, generations, creditPurchases, chatMessages, chatConversations,
  fanTips, contentPurchases as contentPurchasesTable
} from "../drizzle/schema";
import { getDb } from "./db";

async function getDbOrThrow() {
  const d = await getDb();
  if (!d) throw new Error('Database not available');
  return d;
}

// ============================================================
// FAN CRM & SCORING
// ============================================================

export async function createFanProfile(data: InsertFanProfile) {
  const d = await getDbOrThrow();
  const result = await d.insert(fanProfiles).values(data);
  return result[0].insertId;
}

export async function getFanProfile(fanUserId: number, creatorUserId: number) {
  const d = await getDbOrThrow();
  const rows = await d.select().from(fanProfiles)
    .where(and(eq(fanProfiles.fanUserId, fanUserId), eq(fanProfiles.creatorUserId, creatorUserId)));
  return rows[0] || null;
}

export async function getOrCreateFanProfile(fanUserId: number, creatorUserId: number) {
  let profile = await getFanProfile(fanUserId, creatorUserId);
  if (!profile) {
    await createFanProfile({ fanUserId, creatorUserId });
    profile = await getFanProfile(fanUserId, creatorUserId);
  }
  return profile!;
}

export async function updateFanProfile(id: number, data: Partial<InsertFanProfile>) {
  const d = await getDbOrThrow();
  await d.update(fanProfiles).set(data).where(eq(fanProfiles.id, id));
}

export async function getFansByCreator(creatorUserId: number, opts?: {
  spendingTier?: string;
  minScore?: number;
  isAtRisk?: boolean;
  sortBy?: 'engagementScore' | 'lifetimeSpend' | 'lastActiveAt' | 'createdAt';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}) {
  const d = await getDbOrThrow();
  const conditions = [eq(fanProfiles.creatorUserId, creatorUserId)];
  if (opts?.spendingTier) conditions.push(eq(fanProfiles.spendingTier, opts.spendingTier as any));
  if (opts?.minScore !== undefined) conditions.push(gte(fanProfiles.engagementScore, opts.minScore));
  if (opts?.isAtRisk !== undefined) conditions.push(eq(fanProfiles.isAtRisk, opts.isAtRisk));

  const sortField = opts?.sortBy === 'lifetimeSpend' ? fanProfiles.lifetimeSpend
    : opts?.sortBy === 'lastActiveAt' ? fanProfiles.lastActiveAt
    : opts?.sortBy === 'createdAt' ? fanProfiles.createdAt
    : fanProfiles.engagementScore;
  const sortFn = opts?.sortDir === 'asc' ? asc : desc;

  const rows = await d.select().from(fanProfiles)
    .where(and(...conditions))
    .orderBy(sortFn(sortField))
    .limit(opts?.limit || 50)
    .offset(opts?.offset || 0);

  const countResult = await d.select({ count: sql<number>`COUNT(*)` })
    .from(fanProfiles).where(and(...conditions));

  return { fans: rows, total: countResult[0]?.count || 0 };
}

export async function getFanCrmStats(creatorUserId: number) {
  const d = await getDbOrThrow();
  const totalFans = await d.select({ count: sql<number>`COUNT(*)` })
    .from(fanProfiles).where(eq(fanProfiles.creatorUserId, creatorUserId));
  const atRiskFans = await d.select({ count: sql<number>`COUNT(*)` })
    .from(fanProfiles).where(and(eq(fanProfiles.creatorUserId, creatorUserId), eq(fanProfiles.isAtRisk, true)));
  const whales = await d.select({ count: sql<number>`COUNT(*)` })
    .from(fanProfiles).where(and(eq(fanProfiles.creatorUserId, creatorUserId), eq(fanProfiles.spendingTier, "whale")));
  const totalSpend = await d.select({ total: sql<number>`COALESCE(SUM(${fanProfiles.lifetimeSpend}), 0)` })
    .from(fanProfiles).where(eq(fanProfiles.creatorUserId, creatorUserId));
  const avgScore = await d.select({ avg: sql<number>`COALESCE(AVG(${fanProfiles.engagementScore}), 0)` })
    .from(fanProfiles).where(eq(fanProfiles.creatorUserId, creatorUserId));
  const tierBreakdown = await d.select({
    tier: fanProfiles.spendingTier, count: sql<number>`COUNT(*)`
  }).from(fanProfiles).where(eq(fanProfiles.creatorUserId, creatorUserId)).groupBy(fanProfiles.spendingTier);

  return {
    totalFans: totalFans[0]?.count || 0,
    atRiskFans: atRiskFans[0]?.count || 0,
    whales: whales[0]?.count || 0,
    totalLifetimeSpend: Number(totalSpend[0]?.total) || 0,
    avgEngagementScore: Math.round(Number(avgScore[0]?.avg) || 0),
    tierBreakdown: tierBreakdown.map(t => ({ tier: t.tier, count: t.count })),
  };
}

// Fan scoring algorithm
export function calculateFanScore(metrics: {
  totalMessages: number; totalTips: number; totalPurchases: number;
  lifetimeSpend: number; daysSinceLastActive: number; avgResponseTime: number;
}): { score: number; tier: 'whale' | 'regular' | 'casual' | 'dormant' | 'new' } {
  let score = 0;
  score += Math.min(25, metrics.totalMessages * 0.5);
  score += Math.min(30, metrics.lifetimeSpend * 0.3);
  score += Math.min(15, metrics.totalTips * 3);
  score += Math.min(15, metrics.totalPurchases * 5);
  if (metrics.daysSinceLastActive > 30) score -= 15;
  else if (metrics.daysSinceLastActive > 14) score -= 10;
  else if (metrics.daysSinceLastActive > 7) score -= 5;
  else score += 15;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let tier: 'whale' | 'regular' | 'casual' | 'dormant' | 'new';
  if (metrics.daysSinceLastActive > 30) tier = 'dormant';
  else if (metrics.lifetimeSpend >= 100) tier = 'whale';
  else if (metrics.lifetimeSpend >= 20 || metrics.totalPurchases >= 3) tier = 'regular';
  else if (metrics.totalMessages >= 5) tier = 'casual';
  else tier = 'new';
  return { score, tier };
}

// ============================================================
// MESSAGE TEMPLATES
// ============================================================

export async function createMessageTemplate(data: InsertMessageTemplate) {
  const d = await getDbOrThrow();
  const result = await d.insert(messageTemplates).values(data);
  return result[0].insertId;
}

export async function getMessageTemplatesByCreator(creatorUserId: number, category?: string) {
  const d = await getDbOrThrow();
  const conditions = [eq(messageTemplates.creatorUserId, creatorUserId)];
  if (category) conditions.push(eq(messageTemplates.category, category as any));
  return d.select().from(messageTemplates).where(and(...conditions)).orderBy(desc(messageTemplates.updatedAt));
}

export async function getMessageTemplateById(id: number) {
  const d = await getDbOrThrow();
  const rows = await d.select().from(messageTemplates).where(eq(messageTemplates.id, id));
  return rows[0] || null;
}

export async function updateMessageTemplate(id: number, data: Partial<InsertMessageTemplate>) {
  const d = await getDbOrThrow();
  await d.update(messageTemplates).set(data).where(eq(messageTemplates.id, id));
}

export async function deleteMessageTemplate(id: number) {
  const d = await getDbOrThrow();
  await d.delete(messageTemplates).where(eq(messageTemplates.id, id));
}

// ============================================================
// MESSAGE AUTOMATIONS
// ============================================================

export async function createMessageAutomation(data: InsertMessageAutomation) {
  const d = await getDbOrThrow();
  const result = await d.insert(messageAutomations).values(data);
  return result[0].insertId;
}

export async function getAutomationsByCreator(creatorUserId: number) {
  const d = await getDbOrThrow();
  return d.select().from(messageAutomations)
    .where(eq(messageAutomations.creatorUserId, creatorUserId))
    .orderBy(desc(messageAutomations.updatedAt));
}

export async function getAutomationById(id: number) {
  const d = await getDbOrThrow();
  const rows = await d.select().from(messageAutomations).where(eq(messageAutomations.id, id));
  return rows[0] || null;
}

export async function updateAutomation(id: number, data: Partial<InsertMessageAutomation>) {
  const d = await getDbOrThrow();
  await d.update(messageAutomations).set(data).where(eq(messageAutomations.id, id));
}

export async function deleteAutomation(id: number) {
  const d = await getDbOrThrow();
  await d.delete(messageAutomations).where(eq(messageAutomations.id, id));
}

// ============================================================
// MASS MESSAGE CAMPAIGNS
// ============================================================

export async function createCampaign(data: InsertMessageCampaign) {
  const d = await getDbOrThrow();
  const result = await d.insert(messageCampaigns).values(data);
  return result[0].insertId;
}

export async function getCampaignsByCreator(creatorUserId: number) {
  const d = await getDbOrThrow();
  return d.select().from(messageCampaigns)
    .where(eq(messageCampaigns.creatorUserId, creatorUserId))
    .orderBy(desc(messageCampaigns.createdAt));
}

export async function getCampaignById(id: number) {
  const d = await getDbOrThrow();
  const rows = await d.select().from(messageCampaigns).where(eq(messageCampaigns.id, id));
  return rows[0] || null;
}

export async function updateCampaign(id: number, data: Partial<InsertMessageCampaign>) {
  const d = await getDbOrThrow();
  await d.update(messageCampaigns).set(data).where(eq(messageCampaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const d = await getDbOrThrow();
  await d.delete(messageCampaigns).where(eq(messageCampaigns.id, id));
}

// ============================================================
// CONTENT VAULT
// ============================================================

export async function createVaultItem(data: InsertContentVaultItem) {
  const d = await getDbOrThrow();
  const result = await d.insert(contentVault).values(data);
  return result[0].insertId;
}

export async function getVaultItemsByCreator(creatorUserId: number, opts?: {
  folder?: string; category?: string; contentType?: string; search?: string;
  sortBy?: 'createdAt' | 'salesCount' | 'totalRevenue' | 'viewCount';
  limit?: number; offset?: number;
}) {
  const d = await getDbOrThrow();
  const conditions = [eq(contentVault.creatorUserId, creatorUserId)];
  if (opts?.folder) conditions.push(eq(contentVault.folder, opts.folder));
  if (opts?.category) conditions.push(eq(contentVault.category, opts.category));
  if (opts?.contentType) conditions.push(eq(contentVault.contentType, opts.contentType as any));
  if (opts?.search) conditions.push(like(contentVault.title, `%${opts.search}%`));

  const sortField = opts?.sortBy === 'salesCount' ? contentVault.salesCount
    : opts?.sortBy === 'totalRevenue' ? contentVault.totalRevenue
    : opts?.sortBy === 'viewCount' ? contentVault.viewCount
    : contentVault.createdAt;

  const rows = await d.select().from(contentVault)
    .where(and(...conditions)).orderBy(desc(sortField))
    .limit(opts?.limit || 50).offset(opts?.offset || 0);

  const countResult = await d.select({ count: sql<number>`COUNT(*)` })
    .from(contentVault).where(and(...conditions));
  return { items: rows, total: countResult[0]?.count || 0 };
}

export async function getVaultItemById(id: number) {
  const d = await getDbOrThrow();
  const rows = await d.select().from(contentVault).where(eq(contentVault.id, id));
  return rows[0] || null;
}

export async function updateVaultItem(id: number, data: Partial<InsertContentVaultItem>) {
  const d = await getDbOrThrow();
  await d.update(contentVault).set(data).where(eq(contentVault.id, id));
}

export async function deleteVaultItem(id: number) {
  const d = await getDbOrThrow();
  await d.delete(contentVault).where(eq(contentVault.id, id));
}

export async function getVaultStats(creatorUserId: number) {
  const d = await getDbOrThrow();
  const stats = await d.select({
    totalItems: sql<number>`COUNT(*)`,
    totalSales: sql<number>`COALESCE(SUM(${contentVault.salesCount}), 0)`,
    totalRevenue: sql<number>`COALESCE(SUM(${contentVault.totalRevenue}), 0)`,
    totalViews: sql<number>`COALESCE(SUM(${contentVault.viewCount}), 0)`,
  }).from(contentVault).where(eq(contentVault.creatorUserId, creatorUserId));

  const byType = await d.select({
    type: contentVault.contentType, count: sql<number>`COUNT(*)`,
  }).from(contentVault).where(eq(contentVault.creatorUserId, creatorUserId)).groupBy(contentVault.contentType);

  const folders = await d.select({
    folder: contentVault.folder, count: sql<number>`COUNT(*)`,
  }).from(contentVault).where(eq(contentVault.creatorUserId, creatorUserId)).groupBy(contentVault.folder);

  return {
    totalItems: stats[0]?.totalItems || 0,
    totalSales: stats[0]?.totalSales || 0,
    totalRevenue: Number(stats[0]?.totalRevenue) || 0,
    totalViews: stats[0]?.totalViews || 0,
    byType: byType.map(t => ({ type: t.type, count: t.count })),
    folders: folders.filter(f => f.folder).map(f => ({ name: f.folder!, count: f.count })),
  };
}

export async function incrementVaultItemStats(id: number, field: 'viewCount' | 'salesCount' | 'timesSent') {
  const d = await getDbOrThrow();
  await d.update(contentVault).set({
    [field]: sql`${contentVault[field]} + 1`
  }).where(eq(contentVault.id, id));
}

// ============================================================
// PPV PRICE OPTIMIZATION
// ============================================================

export async function recordPpvPrice(data: InsertPpvPriceHistory) {
  const d = await getDbOrThrow();
  await d.insert(ppvPriceHistory).values(data);
}

export async function getPpvPriceHistoryForContent(contentId: number) {
  const d = await getDbOrThrow();
  return d.select().from(ppvPriceHistory)
    .where(eq(ppvPriceHistory.contentId, contentId))
    .orderBy(desc(ppvPriceHistory.createdAt)).limit(100);
}

export async function getPpvAcceptanceRate(contentId: number) {
  const d = await getDbOrThrow();
  const result = await d.select({
    total: sql<number>`COUNT(*)`,
    accepted: sql<number>`SUM(CASE WHEN ${ppvPriceHistory.wasAccepted} = 1 THEN 1 ELSE 0 END)`,
    avgPrice: sql<number>`AVG(${ppvPriceHistory.price})`,
    avgAcceptedPrice: sql<number>`AVG(CASE WHEN ${ppvPriceHistory.wasAccepted} = 1 THEN ${ppvPriceHistory.price} ELSE NULL END)`,
  }).from(ppvPriceHistory).where(eq(ppvPriceHistory.contentId, contentId));

  return {
    total: result[0]?.total || 0,
    accepted: result[0]?.accepted || 0,
    acceptanceRate: result[0]?.total ? Math.round((result[0].accepted / result[0].total) * 100) : 0,
    avgPrice: Number(result[0]?.avgPrice) || 0,
    avgAcceptedPrice: Number(result[0]?.avgAcceptedPrice) || 0,
  };
}

// PPV Price Optimizer Algorithm
export function suggestPpvPrice(fanProfile: {
  engagementScore: number; lifetimeSpend: number; totalPurchases: number; spendingTier: string;
}, contentType: string, basePrice: number): {
  suggestedPrice: number; confidence: number; reasoning: string;
} {
  let multiplier = 1.0;
  let confidence = 50;
  let reasoning = '';

  switch (fanProfile.spendingTier) {
    case 'whale': multiplier *= 1.5; confidence += 20; reasoning = 'High-value fan, premium pricing. '; break;
    case 'regular': multiplier *= 1.1; confidence += 10; reasoning = 'Regular spender, slight premium. '; break;
    case 'casual': multiplier *= 0.85; confidence += 5; reasoning = 'Casual fan, discount to encourage. '; break;
    case 'dormant': multiplier *= 0.6; confidence += 15; reasoning = 'Dormant fan, re-engagement discount. '; break;
    case 'new': multiplier *= 0.75; confidence += 10; reasoning = 'New fan, introductory pricing. '; break;
  }

  if (fanProfile.engagementScore > 80) { multiplier *= 1.2; reasoning += 'High engagement bonus. '; }
  else if (fanProfile.engagementScore < 30) { multiplier *= 0.9; reasoning += 'Low engagement discount. '; }

  if (contentType === 'video') multiplier *= 1.3;
  else if (contentType === 'gallery') multiplier *= 1.15;

  if (fanProfile.totalPurchases > 10) { multiplier *= 1.1; confidence += 10; reasoning += 'Proven buyer. '; }

  const suggestedPrice = Math.round(basePrice * multiplier * 100) / 100;
  confidence = Math.min(95, confidence);
  return { suggestedPrice, confidence, reasoning: reasoning.trim() };
}

// ============================================================
// TEAM MANAGEMENT
// ============================================================

export async function addTeamMember(data: InsertTeamMember) {
  const d = await getDbOrThrow();
  const result = await d.insert(teamMembers).values(data);
  return result[0].insertId;
}

export async function getTeamByCreator(creatorUserId: number) {
  const d = await getDbOrThrow();
  return d.select().from(teamMembers)
    .where(eq(teamMembers.creatorUserId, creatorUserId))
    .orderBy(desc(teamMembers.createdAt));
}

export async function getTeamMemberById(id: number) {
  const d = await getDbOrThrow();
  const rows = await d.select().from(teamMembers).where(eq(teamMembers.id, id));
  return rows[0] || null;
}

export async function updateTeamMember(id: number, data: Partial<InsertTeamMember>) {
  const d = await getDbOrThrow();
  await d.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function removeTeamMember(id: number) {
  const d = await getDbOrThrow();
  await d.delete(teamMembers).where(eq(teamMembers.id, id));
}

export async function getTeamPerformance(creatorUserId: number) {
  const d = await getDbOrThrow();
  const members = await d.select().from(teamMembers)
    .where(and(eq(teamMembers.creatorUserId, creatorUserId), eq(teamMembers.isActive, true)));
  return members.map(m => ({
    id: m.id, memberUserId: m.memberUserId, role: m.role,
    messagesSent: m.messagesSent, revenueGenerated: Number(m.revenueGenerated),
    avgResponseTime: m.avgResponseTime, activeConversations: m.activeConversations,
    lastActiveAt: m.lastActiveAt,
  }));
}

// ============================================================
// SOCIAL TRAFFIC ANALYTICS
// ============================================================

export async function trackSocialTraffic(data: InsertSocialTrafficEvent) {
  const d = await getDbOrThrow();
  await d.insert(socialTrafficEvents).values(data);
}

export async function getSocialTrafficStats(days: number = 30) {
  const d = await getDbOrThrow();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const byPlatform = await d.select({
    platform: socialTrafficEvents.platform,
    visits: sql<number>`COUNT(*)`,
    signups: sql<number>`SUM(CASE WHEN ${socialTrafficEvents.didSignup} = 1 THEN 1 ELSE 0 END)`,
    generations: sql<number>`SUM(CASE WHEN ${socialTrafficEvents.didGenerate} = 1 THEN 1 ELSE 0 END)`,
    purchases: sql<number>`SUM(CASE WHEN ${socialTrafficEvents.didPurchase} = 1 THEN 1 ELSE 0 END)`,
    revenue: sql<number>`COALESCE(SUM(${socialTrafficEvents.purchaseAmount}), 0)`,
    avgSessionDuration: sql<number>`AVG(${socialTrafficEvents.sessionDuration})`,
    avgPageViews: sql<number>`AVG(${socialTrafficEvents.pageViews})`,
  }).from(socialTrafficEvents)
    .where(gte(socialTrafficEvents.createdAt, since))
    .groupBy(socialTrafficEvents.platform);

  const dailyTrend = await d.select({
    date: sql<string>`DATE(${socialTrafficEvents.createdAt})`,
    platform: socialTrafficEvents.platform,
    visits: sql<number>`COUNT(*)`,
  }).from(socialTrafficEvents)
    .where(gte(socialTrafficEvents.createdAt, since))
    .groupBy(sql`DATE(${socialTrafficEvents.createdAt})`, socialTrafficEvents.platform)
    .orderBy(sql`DATE(${socialTrafficEvents.createdAt})`);

  return {
    byPlatform: byPlatform.map(p => ({
      platform: p.platform, visits: p.visits,
      signups: p.signups || 0, generations: p.generations || 0,
      purchases: p.purchases || 0, revenue: Number(p.revenue) || 0,
      signupRate: p.visits > 0 ? Math.round((p.signups || 0) / p.visits * 100) : 0,
      purchaseRate: p.visits > 0 ? Math.round((p.purchases || 0) / p.visits * 100) : 0,
      avgSessionDuration: Math.round(Number(p.avgSessionDuration) || 0),
      avgPageViews: Math.round((Number(p.avgPageViews) || 0) * 10) / 10,
    })),
    dailyTrend,
  };
}

// ============================================================
// DAILY METRIC SNAPSHOTS
// ============================================================

export async function saveDailySnapshot(data: InsertDailyMetricSnapshot) {
  const d = await getDbOrThrow();
  await d.delete(dailyMetricSnapshots).where(eq(dailyMetricSnapshots.date, data.date!));
  await d.insert(dailyMetricSnapshots).values(data);
}

export async function getDailySnapshots(days: number = 30) {
  const d = await getDbOrThrow();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceStr = since.toISOString().split('T')[0];
  return d.select().from(dailyMetricSnapshots)
    .where(gte(dailyMetricSnapshots.date, sinceStr))
    .orderBy(asc(dailyMetricSnapshots.date));
}

export async function getLatestSnapshot() {
  const d = await getDbOrThrow();
  const rows = await d.select().from(dailyMetricSnapshots)
    .orderBy(desc(dailyMetricSnapshots.date)).limit(1);
  return rows[0] || null;
}

export async function collectDailyMetrics(): Promise<InsertDailyMetricSnapshot> {
  const d = await getDbOrThrow();
  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today + 'T00:00:00Z');

  const totalUsersResult = await d.select({ count: sql<number>`COUNT(*)` }).from(users);
  const newUsersResult = await d.select({ count: sql<number>`COUNT(*)` }).from(users)
    .where(gte(users.createdAt, todayStart));
  const activeUsersResult = await d.select({ count: sql<number>`COUNT(DISTINCT ${users.id})` }).from(users)
    .where(gte(users.lastSignedIn, todayStart));
  const totalGensResult = await d.select({ count: sql<number>`COUNT(*)` }).from(generations)
    .where(gte(generations.createdAt, todayStart));
  const totalMsgsResult = await d.select({ count: sql<number>`COUNT(*)` }).from(chatMessages)
    .where(gte(chatMessages.createdAt, todayStart));
  const totalConvsResult = await d.select({ count: sql<number>`COUNT(DISTINCT ${chatConversations.id})` }).from(chatConversations)
    .where(gte(chatConversations.updatedAt, todayStart));
  const creditRevResult = await d.select({
    total: sql<number>`COALESCE(SUM(${creditPurchases.amountPaid}), 0)`
  }).from(creditPurchases)
    .where(and(gte(creditPurchases.createdAt, todayStart), eq(creditPurchases.status, 'completed')));
  const tipRevResult = await d.select({
    total: sql<number>`COALESCE(SUM(${fanTips.amount}), 0)`
  }).from(fanTips).where(gte(fanTips.createdAt, todayStart));
  const ppvRevResult = await d.select({
    total: sql<number>`COALESCE(SUM(${contentPurchasesTable.amount}), 0)`
  }).from(contentPurchasesTable).where(gte(contentPurchasesTable.purchasedAt, todayStart));

  return {
    date: today,
    totalUsers: totalUsersResult[0]?.count || 0,
    newUsers: newUsersResult[0]?.count || 0,
    activeUsers: activeUsersResult[0]?.count || 0,
    totalRevenue: Math.round((Number(creditRevResult[0]?.total) || 0) * 100),
    creditPackRevenue: Math.round((Number(creditRevResult[0]?.total) || 0) * 100),
    tipRevenue: Math.round((Number(tipRevResult[0]?.total) || 0) * 100),
    ppvRevenue: Math.round((Number(ppvRevResult[0]?.total) || 0) * 100),
    totalGenerations: totalGensResult[0]?.count || 0,
    totalMessages: totalMsgsResult[0]?.count || 0,
    totalConversations: totalConvsResult[0]?.count || 0,
  };
}
