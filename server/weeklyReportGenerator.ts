/**
 * Weekly Report Generator.
 * Aggregates PWA analytics, A/B test results, mobile engagement, and generation metrics
 * into a formatted report and sends it via the notifyOwner helper.
 */

import { notifyOwner } from "./_core/notification";
import { getWeeklyReportData, getPwaABTestByVariant } from "./db";
import {
  type WeeklyReportData,
  generateRecommendations,
  formatReportForNotification,
} from "../shared/weeklyReport";
import {
  calculateABTestSignificance,
  type VariantStats,
} from "../shared/abTestStats";

/**
 * Build the weekly report data object without sending it.
 * Used by both the scheduled send and the export endpoints.
 */
export async function generateAndBuildReport(): Promise<WeeklyReportData | null> {
  try {
    const rawData = await getWeeklyReportData();
    if (!rawData || !rawData.summary) {
      return null;
    }

    const { summary, platforms, sessionEnds, pageViews } = rawData;

    // Build event map
    const eventMap = new Map((summary as any[]).map(s => [s.eventType, Number(s.count)]));

    // PWA Metrics
    const totalInstalls = eventMap.get("app_installed") || 0;
    const promptsShown = eventMap.get("install_prompt_shown") || 0;
    const installRate = promptsShown > 0 ? (totalInstalls / promptsShown) * 100 : 0;
    const offlineSessions = eventMap.get("offline_session_start") || 0;
    const notifEnabled = eventMap.get("notification_permission_granted") || 0;
    const notifShown = eventMap.get("notification_shown") || 0;
    const notifClicked = eventMap.get("notification_clicked") || 0;
    const notifCTR = notifShown > 0 ? (notifClicked / notifShown) * 100 : 0;
    const swRegs = eventMap.get("sw_registered") || 0;

    // A/B Test Results
    const abData = await getPwaABTestByVariant(7);
    let abResults = {
      totalImpressions: eventMap.get("ab_variant_assigned") || 0,
      bestVariant: null as string | null,
      bestConversionRate: 0,
      isSignificant: false,
      pValue: 1,
    };

    if (abData && abData.length > 0) {
      const variantMap = new Map<string, { impressions: number; clicks: number; dismissals: number }>();
      for (const row of abData) {
        const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        const variantId = meta?.variantId || "unknown";
        if (!variantMap.has(variantId)) {
          variantMap.set(variantId, { impressions: 0, clicks: 0, dismissals: 0 });
        }
        const stats = variantMap.get(variantId)!;
        if (row.eventType === "ab_variant_assigned") stats.impressions += Number(row.count);
        else if (row.eventType === "ab_install_clicked") stats.clicks += Number(row.count);
        else if (row.eventType === "ab_dismiss_clicked") stats.dismissals += Number(row.count);
      }

      const variants: VariantStats[] = [];
      Array.from(variantMap.entries()).forEach(([variantId, stats]) => {
        if (stats.impressions === 0) return;
        variants.push({
          variantId,
          impressions: stats.impressions,
          conversions: stats.clicks,
          dismissals: stats.dismissals,
          conversionRate: stats.clicks / stats.impressions,
        });
      });

      if (variants.length >= 2) {
        const significance = calculateABTestSignificance(variants, 0.95);
        abResults.isSignificant = significance.isSignificant;
        abResults.pValue = significance.pValue;
        abResults.bestVariant = significance.winner;
        const best = variants.sort((a, b) => b.conversionRate - a.conversionRate)[0];
        if (best) abResults.bestConversionRate = best.conversionRate;
      }
    }

    // Generation Metrics
    const genStarted = eventMap.get("generation_started") || 0;
    const genCompleted = eventMap.get("generation_completed") || 0;
    const genFailed = eventMap.get("generation_failed") || 0;

    // Session duration & scroll depth
    let totalDuration = 0;
    let totalScrollDepth = 0;
    let sessionCount = 0;
    if (sessionEnds) {
      for (const row of sessionEnds as any[]) {
        const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        if (meta?.sessionDuration) {
          totalDuration += Number(meta.sessionDuration);
          sessionCount++;
        }
        if (meta?.maxScrollDepth) {
          totalScrollDepth += Number(meta.maxScrollDepth);
        }
      }
    }

    // Top pages
    const topPages: { url: string; views: number }[] = [];
    if (pageViews) {
      for (const row of pageViews as any[]) {
        const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        if (meta?.url) {
          topPages.push({ url: meta.url, views: Number(row.count) });
        }
      }
    }
    topPages.sort((a, b) => b.views - a.views);

    // Platform breakdown
    const platformBreakdown = platforms
      ? (platforms as any[]).map(p => ({ platform: p.platform || "unknown", count: Number(p.count) }))
      : [];

    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const reportData: WeeklyReportData = {
      period: {
        start: weekAgo.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
      pwaMetrics: {
        totalInstalls,
        installRate,
        offlineSessions,
        notificationsEnabled: notifEnabled,
        notificationCTR: notifCTR,
        swRegistrations: swRegs,
      },
      abTestResults: abResults,
      mobileEngagement: {
        totalSessions: eventMap.get("session_start") || 0,
        avgSessionDuration: sessionCount > 0 ? totalDuration / sessionCount : 0,
        avgScrollDepth: sessionCount > 0 ? totalScrollDepth / sessionCount : 0,
        totalTouchInteractions: eventMap.get("touch_interaction") || 0,
        topPages,
        platformBreakdown,
      },
      generationMetrics: {
        totalStarted: genStarted,
        totalCompleted: genCompleted,
        totalFailed: genFailed,
        successRate: genStarted > 0 ? (genCompleted / genStarted) * 100 : 0,
      },
      recommendations: [],
    };

    reportData.recommendations = generateRecommendations(reportData);

    return reportData;
  } catch (error) {
    console.error("[WeeklyReport] Error building report:", error);
    return null;
  }
}

/**
 * Generate and send the weekly report.
 * Called by the scheduled task every Monday.
 */
export async function generateAndSendWeeklyReport(): Promise<boolean> {
  try {
    console.log("[WeeklyReport] Generating weekly report...");

    const reportData = await generateAndBuildReport();
    if (!reportData) {
      console.warn("[WeeklyReport] No data available for report");
      return false;
    }

    // Format and send
    const reportText = formatReportForNotification(reportData);
    const sent = await notifyOwner({
      title: `Weekly PWA Report: ${reportData.period.start} — ${reportData.period.end}`,
      content: reportText,
    });

    if (sent) {
      console.log("[WeeklyReport] Report sent successfully");
    } else {
      console.warn("[WeeklyReport] Failed to send report via notification");
    }

    return sent;
  } catch (error) {
    console.error("[WeeklyReport] Error generating report:", error);
    return false;
  }
}
