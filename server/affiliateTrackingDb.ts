import { eq, desc, and, sql, gte, lte, sum, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  affiliateClicks,
  affiliateDailyStats,
  affiliateCommissions,
  affiliatePayouts,
  affiliates,
  InsertAffiliateClick,
  InsertAffiliateDailyStat,
} from "../drizzle/schema";
import crypto from "crypto";

async function getDbOrThrow() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

// ── Click Tracking ─────────────────────────────────────────────────────────

export async function recordAffiliateClick(data: {
  affiliateCode: string;
  affiliateId?: number;
  referrerUrl?: string;
  landingPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ip?: string;
  userAgent?: string;
}) {
  const db = await getDbOrThrow();
  const ipHash = data.ip
    ? crypto.createHash("sha256").update(data.ip).digest("hex").slice(0, 16)
    : undefined;

  return db.insert(affiliateClicks).values({
    affiliateCode: data.affiliateCode,
    affiliateId: data.affiliateId,
    referrerUrl: data.referrerUrl,
    landingPage: data.landingPage,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    ipHash,
    userAgent: data.userAgent,
    converted: false,
  });
}

export async function markClickConverted(
  affiliateCode: string,
  convertedUserId: number
) {
  const db = await getDbOrThrow();
  // Mark the most recent unconverted click for this code as converted
  const [click] = await db
    .select({ id: affiliateClicks.id })
    .from(affiliateClicks)
    .where(
      and(
        eq(affiliateClicks.affiliateCode, affiliateCode),
        eq(affiliateClicks.converted, false)
      )
    )
    .orderBy(desc(affiliateClicks.createdAt))
    .limit(1);

  if (click) {
    await db
      .update(affiliateClicks)
      .set({ converted: true, convertedAt: new Date(), convertedUserId })
      .where(eq(affiliateClicks.id, click.id));
  }
}

export async function getClickStats(affiliateId: number, days = 30) {
  const db = await getDbOrThrow();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [stats] = await db
    .select({
      totalClicks: count(affiliateClicks.id),
      conversions: sql<number>`SUM(CASE WHEN ${affiliateClicks.converted} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(affiliateClicks)
    .where(
      and(
        eq(affiliateClicks.affiliateId, affiliateId),
        gte(affiliateClicks.createdAt, since)
      )
    );

  return {
    totalClicks: Number(stats?.totalClicks ?? 0),
    conversions: Number(stats?.conversions ?? 0),
    conversionRate:
      stats && Number(stats.totalClicks) > 0
        ? ((Number(stats.conversions) / Number(stats.totalClicks)) * 100).toFixed(1)
        : "0.0",
  };
}

export async function getClicksBySource(affiliateId: number, days = 30) {
  const db = await getDbOrThrow();
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db
    .select({
      utmSource: affiliateClicks.utmSource,
      utmMedium: affiliateClicks.utmMedium,
      clicks: count(affiliateClicks.id),
      conversions: sql<number>`SUM(CASE WHEN ${affiliateClicks.converted} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(affiliateClicks)
    .where(
      and(
        eq(affiliateClicks.affiliateId, affiliateId),
        gte(affiliateClicks.createdAt, since)
      )
    )
    .groupBy(affiliateClicks.utmSource, affiliateClicks.utmMedium)
    .orderBy(desc(count(affiliateClicks.id)))
    .limit(10);
}

// ── Daily Stats ────────────────────────────────────────────────────────────

export async function upsertDailyStat(data: {
  affiliateId: number;
  affiliateCode: string;
  date: string; // YYYY-MM-DD
  clicks?: number;
  uniqueClicks?: number;
  conversions?: number;
  revenue?: number;
  commissions?: number;
  level1Commissions?: number;
  level2Commissions?: number;
  level3Commissions?: number;
}) {
  const db = await getDbOrThrow();
  const existing = await db
    .select({ id: affiliateDailyStats.id })
    .from(affiliateDailyStats)
    .where(
      and(
        eq(affiliateDailyStats.affiliateId, data.affiliateId),
        eq(affiliateDailyStats.date, data.date)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(affiliateDailyStats)
      .set({
        clicks: sql`${affiliateDailyStats.clicks} + ${data.clicks ?? 0}`,
        uniqueClicks: sql`${affiliateDailyStats.uniqueClicks} + ${data.uniqueClicks ?? 0}`,
        conversions: sql`${affiliateDailyStats.conversions} + ${data.conversions ?? 0}`,
        revenue: sql`${affiliateDailyStats.revenue} + ${data.revenue ?? 0}`,
        commissions: sql`${affiliateDailyStats.commissions} + ${data.commissions ?? 0}`,
        level1Commissions: sql`${affiliateDailyStats.level1Commissions} + ${data.level1Commissions ?? 0}`,
        level2Commissions: sql`${affiliateDailyStats.level2Commissions} + ${data.level2Commissions ?? 0}`,
        level3Commissions: sql`${affiliateDailyStats.level3Commissions} + ${data.level3Commissions ?? 0}`,
      })
      .where(eq(affiliateDailyStats.id, existing[0].id));
  } else {
    return db.insert(affiliateDailyStats).values({
      affiliateId: data.affiliateId,
      affiliateCode: data.affiliateCode,
      date: data.date,
      clicks: data.clicks ?? 0,
      uniqueClicks: data.uniqueClicks ?? 0,
      conversions: data.conversions ?? 0,
      revenue: String(data.revenue ?? 0),
      commissions: String(data.commissions ?? 0),
      level1Commissions: String(data.level1Commissions ?? 0),
      level2Commissions: String(data.level2Commissions ?? 0),
      level3Commissions: String(data.level3Commissions ?? 0),
    });
  }
}

export async function getDailyStats(affiliateId: number, days = 30) {
  const db = await getDbOrThrow();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  return db
    .select()
    .from(affiliateDailyStats)
    .where(
      and(
        eq(affiliateDailyStats.affiliateId, affiliateId),
        gte(affiliateDailyStats.date, sinceStr)
      )
    )
    .orderBy(affiliateDailyStats.date);
}

export async function getAffiliateSummaryStats(affiliateId: number) {
  const db = await getDbOrThrow();

  // All-time commission totals from affiliates table
  const [affiliate] = await db
    .select({
      totalEarnings: affiliates.totalEarnings,
      pendingEarnings: affiliates.pendingEarnings,
      paidEarnings: affiliates.paidEarnings,
      earningsLevel1: affiliates.earningsLevel1,
      earningsLevel2: affiliates.earningsLevel2,
      earningsLevel3: affiliates.earningsLevel3,
      totalReferrals: affiliates.totalReferrals,
      activeReferrals: affiliates.activeReferrals,
      badge: affiliates.badge,
      commissionRateLevel1: affiliates.commissionRateLevel1,
      commissionRateLevel2: affiliates.commissionRateLevel2,
      commissionRateLevel3: affiliates.commissionRateLevel3,
    })
    .from(affiliates)
    .where(eq(affiliates.id, affiliateId))
    .limit(1);

  // This month's stats
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [monthStats] = await db
    .select({
      clicks: sql<number>`COALESCE(SUM(${affiliateDailyStats.clicks}), 0)`,
      conversions: sql<number>`COALESCE(SUM(${affiliateDailyStats.conversions}), 0)`,
      revenue: sql<number>`COALESCE(SUM(${affiliateDailyStats.revenue}), 0)`,
      commissions: sql<number>`COALESCE(SUM(${affiliateDailyStats.commissions}), 0)`,
    })
    .from(affiliateDailyStats)
    .where(
      and(
        eq(affiliateDailyStats.affiliateId, affiliateId),
        gte(affiliateDailyStats.date, monthStart)
      )
    );

  // Last 30 days clicks
  const clickStats = await getClickStats(affiliateId, 30);

  return {
    totalEarnings: Number(affiliate?.totalEarnings ?? 0),
    pendingEarnings: Number(affiliate?.pendingEarnings ?? 0),
    paidEarnings: Number(affiliate?.paidEarnings ?? 0),
    earningsLevel1: Number(affiliate?.earningsLevel1 ?? 0),
    earningsLevel2: Number(affiliate?.earningsLevel2 ?? 0),
    earningsLevel3: Number(affiliate?.earningsLevel3 ?? 0),
    totalReferrals: affiliate?.totalReferrals ?? 0,
    activeReferrals: affiliate?.activeReferrals ?? 0,
    badge: affiliate?.badge ?? "none",
    commissionRates: {
      level1: Number(affiliate?.commissionRateLevel1 ?? 30),
      level2: Number(affiliate?.commissionRateLevel2 ?? 10),
      level3: Number(affiliate?.commissionRateLevel3 ?? 5),
    },
    thisMonth: {
      clicks: Number(monthStats?.clicks ?? 0),
      conversions: Number(monthStats?.conversions ?? 0),
      revenue: Number(monthStats?.revenue ?? 0),
      commissions: Number(monthStats?.commissions ?? 0),
    },
    last30Days: clickStats,
  };
}

// ── Payouts ────────────────────────────────────────────────────────────────

export async function requestPayout(data: {
  affiliateId: number;
  amount: number;
  method: "stripe" | "paypal" | "bank";
  paypalEmail?: string;
  notes?: string;
}) {
  const db = await getDbOrThrow();

  // Check pending earnings
  const [affiliate] = await db
    .select({ pendingEarnings: affiliates.pendingEarnings, payoutThreshold: affiliates.payoutThreshold })
    .from(affiliates)
    .where(eq(affiliates.id, data.affiliateId))
    .limit(1);

  if (!affiliate) throw new Error("Affiliate not found");
  const pending = Number(affiliate.pendingEarnings);
  const threshold = Number(affiliate.payoutThreshold);

  if (pending < threshold) {
    throw new Error(`Minimum payout is $${threshold}. You have $${pending.toFixed(2)} pending.`);
  }
  if (data.amount > pending) {
    throw new Error(`Cannot request more than pending balance ($${pending.toFixed(2)})`);
  }

  return db.insert(affiliatePayouts).values({
    affiliateId: data.affiliateId,
    amount: String(data.amount),
    status: "pending",
    paypalEmail: data.paypalEmail ?? "",
  });
}

export async function getPayoutHistory(affiliateId: number) {
  const db = await getDbOrThrow();
  return db
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.affiliateId, affiliateId))
    .orderBy(desc(affiliatePayouts.createdAt))
    .limit(50);
}

export async function getCommissionHistory(affiliateId: number, limit = 50) {
  const db = await getDbOrThrow();
  return db
    .select()
    .from(affiliateCommissions)
    .where(eq(affiliateCommissions.affiliateId, affiliateId))
    .orderBy(desc(affiliateCommissions.createdAt))
    .limit(limit);
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function getAllPendingPayouts() {
  const db = await getDbOrThrow();
  return db
    .select({
      payout: affiliatePayouts,
      affiliate: {
        id: affiliates.id,
        affiliateCode: affiliates.affiliateCode,
        totalEarnings: affiliates.totalEarnings,
        pendingEarnings: affiliates.pendingEarnings,
      },
    })
    .from(affiliatePayouts)
    .innerJoin(affiliates, eq(affiliatePayouts.affiliateId, affiliates.id))
    .where(eq(affiliatePayouts.status, "pending"))
    .orderBy(desc(affiliatePayouts.createdAt));
}

export async function processPayoutRequest(
  payoutId: number,
  action: "approve" | "reject",
  adminNotes?: string
) {
  const db = await getDbOrThrow();

  const [payout] = await db
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.id, payoutId))
    .limit(1);

  if (!payout) throw new Error("Payout not found");

  if (action === "approve") {
    // Update payout status
    await db
      .update(affiliatePayouts)
      .set({ status: "completed", processedAt: new Date() })
      .where(eq(affiliatePayouts.id, payoutId));

    // Move from pending to paid in affiliate record
    await db
      .update(affiliates)
      .set({
        pendingEarnings: sql`${affiliates.pendingEarnings} - ${payout.amount}`,
        paidEarnings: sql`${affiliates.paidEarnings} + ${payout.amount}`,
      })
      .where(eq(affiliates.id, payout.affiliateId));
  } else {
    await db
      .update(affiliatePayouts)
      .set({ status: "failed", processedAt: new Date() })
      .where(eq(affiliatePayouts.id, payoutId));
  }

  return { success: true, action };
}

export async function getAllAffiliatesPerformance() {
  const db = await getDbOrThrow();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const affiliateList = await db
    .select({
      id: affiliates.id,
      affiliateCode: affiliates.affiliateCode,
      totalEarnings: affiliates.totalEarnings,
      pendingEarnings: affiliates.pendingEarnings,
      totalReferrals: affiliates.totalReferrals,
      activeReferrals: affiliates.activeReferrals,
      badge: affiliates.badge,
      status: affiliates.status,
      createdAt: affiliates.createdAt,
    })
    .from(affiliates)
    .orderBy(desc(affiliates.totalEarnings))
    .limit(100);

  return affiliateList;
}
