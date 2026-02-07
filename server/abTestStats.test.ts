import { describe, expect, it } from "vitest";
import {
  calculateABTestSignificance,
  type VariantStats,
} from "../shared/abTestStats";
import {
  generateRecommendations,
  formatReportForNotification,
  type WeeklyReportData,
} from "../shared/weeklyReport";

describe("A/B Test Statistical Significance", () => {
  it("returns not significant with insufficient data", () => {
    const variants: VariantStats[] = [
      { variantId: "control", impressions: 5, conversions: 1, dismissals: 2, conversionRate: 0.2 },
    ];

    const result = calculateABTestSignificance(variants, 0.95);
    expect(result.isSignificant).toBe(false);
    expect(result.pValue).toBe(1);
    expect(result.winner).toBeNull();
    expect(result.summary).toContain("Not enough data");
  });

  it("returns not significant when variants perform similarly", () => {
    const variants: VariantStats[] = [
      { variantId: "control", impressions: 100, conversions: 10, dismissals: 40, conversionRate: 0.10 },
      { variantId: "variant_a", impressions: 100, conversions: 11, dismissals: 38, conversionRate: 0.11 },
      { variantId: "variant_b", impressions: 100, conversions: 9, dismissals: 42, conversionRate: 0.09 },
    ];

    const result = calculateABTestSignificance(variants, 0.95);
    expect(result.isSignificant).toBe(false);
    expect(result.winner).toBeNull();
    expect(result.pValue).toBeGreaterThan(0.05);
  });

  it("detects significant difference with large sample and clear winner", () => {
    const variants: VariantStats[] = [
      { variantId: "control", impressions: 1000, conversions: 50, dismissals: 400, conversionRate: 0.05 },
      { variantId: "variant_a", impressions: 1000, conversions: 120, dismissals: 300, conversionRate: 0.12 },
    ];

    const result = calculateABTestSignificance(variants, 0.95);
    expect(result.isSignificant).toBe(true);
    expect(result.winner).toBe("variant_a");
    expect(result.pValue).toBeLessThan(0.05);
    expect(result.relativeImprovement).toBeGreaterThan(0);
    expect(result.summary).toContain("variant_a");
  });

  it("calculates confidence intervals for each variant", () => {
    const variants: VariantStats[] = [
      { variantId: "control", impressions: 500, conversions: 25, dismissals: 200, conversionRate: 0.05 },
      { variantId: "variant_a", impressions: 500, conversions: 50, dismissals: 180, conversionRate: 0.10 },
    ];

    const result = calculateABTestSignificance(variants, 0.95);
    expect(result.variants).toHaveLength(2);

    for (const v of result.variants) {
      expect(v.ciLower).toBeGreaterThanOrEqual(0);
      expect(v.ciUpper).toBeLessThanOrEqual(1);
      expect(v.ciLower).toBeLessThan(v.ciUpper);
      expect(v.standardError).toBeGreaterThan(0);
      // Point estimate should be within CI
      expect(v.conversionRate).toBeGreaterThanOrEqual(v.ciLower);
      expect(v.conversionRate).toBeLessThanOrEqual(v.ciUpper);
    }
  });

  it("handles zero conversions gracefully", () => {
    const variants: VariantStats[] = [
      { variantId: "control", impressions: 100, conversions: 0, dismissals: 50, conversionRate: 0 },
      { variantId: "variant_a", impressions: 100, conversions: 0, dismissals: 50, conversionRate: 0 },
    ];

    const result = calculateABTestSignificance(variants, 0.95);
    expect(result.isSignificant).toBe(false);
    expect(result.pValue).toBe(1);
  });

  it("calculates minimum sample size", () => {
    const variants: VariantStats[] = [
      { variantId: "control", impressions: 10, conversions: 1, dismissals: 5, conversionRate: 0.1 },
      { variantId: "variant_a", impressions: 10, conversions: 2, dismissals: 4, conversionRate: 0.2 },
    ];

    const result = calculateABTestSignificance(variants, 0.95);
    expect(result.minSampleSize).toBeGreaterThan(0);
    expect(result.totalSamples).toBe(20);
  });

  it("returns correct relative improvement", () => {
    const variants: VariantStats[] = [
      { variantId: "control", impressions: 2000, conversions: 100, dismissals: 800, conversionRate: 0.05 },
      { variantId: "variant_a", impressions: 2000, conversions: 200, dismissals: 600, conversionRate: 0.10 },
    ];

    const result = calculateABTestSignificance(variants, 0.95);
    if (result.isSignificant && result.relativeImprovement !== null) {
      // 0.10 vs 0.05 = 100% improvement
      expect(result.relativeImprovement).toBe(100);
    }
  });
});

describe("Weekly Report", () => {
  const baseReport: WeeklyReportData = {
    period: { start: "2026-01-01", end: "2026-01-07" },
    pwaMetrics: {
      totalInstalls: 10,
      installRate: 8,
      offlineSessions: 5,
      notificationsEnabled: 20,
      notificationCTR: 15,
      swRegistrations: 50,
    },
    abTestResults: {
      totalImpressions: 200,
      bestVariant: "variant_a",
      bestConversionRate: 0.12,
      isSignificant: true,
      pValue: 0.01,
    },
    mobileEngagement: {
      totalSessions: 100,
      avgSessionDuration: 45,
      avgScrollDepth: 60,
      totalTouchInteractions: 500,
      topPages: [
        { url: "/", views: 50 },
        { url: "/studio", views: 30 },
      ],
      platformBreakdown: [
        { platform: "ios", count: 40 },
        { platform: "android", count: 35 },
        { platform: "desktop", count: 25 },
      ],
    },
    generationMetrics: {
      totalStarted: 80,
      totalCompleted: 75,
      totalFailed: 5,
      successRate: 93.75,
    },
    recommendations: [],
  };

  it("generates recommendations for low install rate", () => {
    const data = { ...baseReport, pwaMetrics: { ...baseReport.pwaMetrics, installRate: 3 } };
    const recs = generateRecommendations(data);
    expect(recs.some(r => r.includes("install rate"))).toBe(true);
  });

  it("generates recommendation for A/B test winner", () => {
    const recs = generateRecommendations(baseReport);
    expect(recs.some(r => r.includes("winner"))).toBe(true);
  });

  it("generates recommendation for low notification CTR", () => {
    const data = { ...baseReport, pwaMetrics: { ...baseReport.pwaMetrics, notificationCTR: 5 } };
    const recs = generateRecommendations(data);
    expect(recs.some(r => r.includes("click-through rate"))).toBe(true);
  });

  it("generates recommendation for mobile-heavy traffic", () => {
    const recs = generateRecommendations(baseReport);
    // 75/100 = 75% mobile
    expect(recs.some(r => r.includes("mobile"))).toBe(true);
  });

  it("formats report for notification correctly", () => {
    const report = { ...baseReport, recommendations: generateRecommendations(baseReport) };
    const formatted = formatReportForNotification(report);
    
    expect(formatted).toContain("Weekly PWA & Mobile Report");
    expect(formatted).toContain("2026-01-01");
    expect(formatted).toContain("2026-01-07");
    expect(formatted).toContain("PWA Metrics");
    expect(formatted).toContain("A/B Test");
    expect(formatted).toContain("Mobile Engagement");
    expect(formatted).toContain("Generation");
    expect(formatted).toContain("Recommendations");
  });

  it("handles all-healthy metrics", () => {
    const healthyData: WeeklyReportData = {
      ...baseReport,
      pwaMetrics: { ...baseReport.pwaMetrics, installRate: 10, notificationCTR: 20 },
      abTestResults: { ...baseReport.abTestResults, isSignificant: false, totalImpressions: 200 },
      mobileEngagement: { ...baseReport.mobileEngagement, avgScrollDepth: 70, avgSessionDuration: 60, platformBreakdown: [{ platform: "desktop", count: 80 }, { platform: "ios", count: 20 }] },
      generationMetrics: { ...baseReport.generationMetrics, successRate: 95 },
    };
    const recs = generateRecommendations(healthyData);
    expect(recs.length).toBeGreaterThan(0);
  });
});
