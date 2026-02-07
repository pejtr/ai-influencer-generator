import { describe, it, expect } from "vitest";
import {
  calculateTrafficAllocation,
  selectVariantByWeight,
  DEFAULT_AUTO_OPTIMIZE_CONFIG,
  type AutoOptimizeConfig,
} from "../shared/abAutoOptimize";
import {
  processScrollDepthData,
  getDepthColor,
  getDepthLabel,
} from "../shared/scrollDepth";
import {
  generateReportCSV,
  generateReportHTML,
} from "../shared/reportExport";
import { type WeeklyReportData } from "../shared/weeklyReport";

// ==================== A/B AUTO-OPTIMIZE TESTS ====================

describe("A/B Auto-Optimize (Thompson Sampling)", () => {
  const baseConfig: AutoOptimizeConfig = {
    ...DEFAULT_AUTO_OPTIMIZE_CONFIG,
    enabled: true,
    simulations: 1000, // Fewer sims for test speed
  };

  it("returns empty array for no variants", () => {
    const result = calculateTrafficAllocation([], baseConfig);
    expect(result).toEqual([]);
  });

  it("returns equal weights when disabled", () => {
    const variants = [
      { variantId: "a", impressions: 100, conversions: 20 },
      { variantId: "b", impressions: 100, conversions: 10 },
    ];
    const result = calculateTrafficAllocation(variants, { ...baseConfig, enabled: false });
    expect(result).toHaveLength(2);
    expect(result[0].weight).toBeCloseTo(0.5, 1);
    expect(result[1].weight).toBeCloseTo(0.5, 1);
  });

  it("returns equal weights when not enough data", () => {
    const variants = [
      { variantId: "a", impressions: 10, conversions: 5 },
      { variantId: "b", impressions: 10, conversions: 2 },
    ];
    const result = calculateTrafficAllocation(variants, baseConfig);
    expect(result[0].weight).toBeCloseTo(0.5, 1);
    expect(result[1].weight).toBeCloseTo(0.5, 1);
  });

  it("allocates more traffic to better-performing variant", () => {
    const variants = [
      { variantId: "winner", impressions: 200, conversions: 60 },  // 30% CR
      { variantId: "loser", impressions: 200, conversions: 10 },   // 5% CR
    ];
    const result = calculateTrafficAllocation(variants, baseConfig);
    const winner = result.find(r => r.variantId === "winner")!;
    const loser = result.find(r => r.variantId === "loser")!;
    expect(winner.weight).toBeGreaterThan(loser.weight);
    expect(winner.probBest).toBeGreaterThan(0.5);
  });

  it("respects minimum exploration weight", () => {
    const variants = [
      { variantId: "a", impressions: 500, conversions: 200 },
      { variantId: "b", impressions: 500, conversions: 5 },
    ];
    const config: AutoOptimizeConfig = { ...baseConfig, minExplorationWeight: 0.1 };
    const result = calculateTrafficAllocation(variants, config);
    // Even the worst variant should get at least 10%
    for (const alloc of result) {
      expect(alloc.weight).toBeGreaterThanOrEqual(0.09); // Allow small float tolerance
    }
  });

  it("weights sum to 1", () => {
    const variants = [
      { variantId: "a", impressions: 100, conversions: 30 },
      { variantId: "b", impressions: 100, conversions: 20 },
      { variantId: "c", impressions: 100, conversions: 10 },
      { variantId: "d", impressions: 100, conversions: 5 },
    ];
    const result = calculateTrafficAllocation(variants, baseConfig);
    const totalWeight = result.reduce((s, r) => s + r.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);
  });

  it("calculates correct conversion rates", () => {
    const variants = [
      { variantId: "a", impressions: 200, conversions: 50 },
    ];
    const result = calculateTrafficAllocation(variants, baseConfig);
    expect(result[0].conversionRate).toBeCloseTo(0.25, 5);
  });

  it("sets correct alpha and beta for Beta distribution", () => {
    const variants = [
      { variantId: "a", impressions: 100, conversions: 30 },
    ];
    const result = calculateTrafficAllocation(variants, baseConfig);
    expect(result[0].alpha).toBe(31); // conversions + 1
    expect(result[0].beta).toBe(71);  // (impressions - conversions) + 1
  });

  it("selectVariantByWeight returns a valid variant", () => {
    const allocations = [
      { variantId: "a", weight: 0.5, conversionRate: 0.3, alpha: 31, beta: 71, probBest: 0.5 },
      { variantId: "b", weight: 0.5, conversionRate: 0.2, alpha: 21, beta: 81, probBest: 0.5 },
    ];
    const result = selectVariantByWeight(allocations);
    expect(["a", "b"]).toContain(result);
  });

  it("selectVariantByWeight returns null for empty array", () => {
    expect(selectVariantByWeight([])).toBeNull();
  });
});

// ==================== SCROLL DEPTH TESTS ====================

describe("Scroll Depth Heatmap", () => {
  it("processes scroll events into page data", () => {
    const events = [
      { depth: 10, page: "/", sessionId: "s1" },
      { depth: 50, page: "/", sessionId: "s1" },
      { depth: 80, page: "/", sessionId: "s1" },
      { depth: 30, page: "/", sessionId: "s2" },
      { depth: 60, page: "/", sessionId: "s2" },
    ];
    const result = processScrollDepthData(events);
    expect(result).toHaveLength(1);
    expect(result[0].page).toBe("/");
    expect(result[0].totalSessions).toBe(2);
  });

  it("keeps max depth per session", () => {
    const events = [
      { depth: 10, page: "/", sessionId: "s1" },
      { depth: 90, page: "/", sessionId: "s1" },
      { depth: 50, page: "/", sessionId: "s1" }, // Lower than 90, should be ignored
    ];
    const result = processScrollDepthData(events);
    expect(result[0].totalSessions).toBe(1);
    // Session s1 max depth is 90, so it should reach 0-90 zones
    const zone90 = result[0].zones.find(z => z.depth === 90);
    expect(zone90?.sessions).toBe(1);
    const zone100 = result[0].zones.find(z => z.depth === 100);
    expect(zone100?.sessions).toBe(0);
  });

  it("calculates correct zone percentages", () => {
    const events = [
      { depth: 100, page: "/", sessionId: "s1" },
      { depth: 100, page: "/", sessionId: "s2" },
      { depth: 50, page: "/", sessionId: "s3" },
      { depth: 20, page: "/", sessionId: "s4" },
    ];
    const result = processScrollDepthData(events);
    const zone0 = result[0].zones.find(z => z.depth === 0)!;
    expect(zone0.percentage).toBe(100); // All sessions reach 0%
    const zone50 = result[0].zones.find(z => z.depth === 50)!;
    expect(zone50.sessions).toBe(3); // s1, s2, s3 reached 50%
    expect(zone50.percentage).toBe(75);
  });

  it("groups by page correctly", () => {
    const events = [
      { depth: 50, page: "/", sessionId: "s1" },
      { depth: 80, page: "/about", sessionId: "s2" },
      { depth: 30, page: "/", sessionId: "s3" },
    ];
    const result = processScrollDepthData(events);
    expect(result).toHaveLength(2);
    const homePage = result.find(r => r.page === "/")!;
    const aboutPage = result.find(r => r.page === "/about")!;
    expect(homePage.totalSessions).toBe(2);
    expect(aboutPage.totalSessions).toBe(1);
  });

  it("calculates fold line correctly", () => {
    // 4 sessions: depths 100, 80, 40, 20
    // At 50%: 2 out of 4 sessions = 50% → still >= 50
    // At 60%: 2 out of 4 = 50% → still >= 50
    // At 80%: 2 out of 4 = 50% → still >= 50
    // At 90%: 1 out of 4 = 25% → < 50 → fold line = 90
    const events = [
      { depth: 100, page: "/", sessionId: "s1" },
      { depth: 80, page: "/", sessionId: "s2" },
      { depth: 40, page: "/", sessionId: "s3" },
      { depth: 20, page: "/", sessionId: "s4" },
    ];
    const result = processScrollDepthData(events);
    expect(result[0].foldLine).toBe(90);
  });

  it("returns empty for no events", () => {
    expect(processScrollDepthData([])).toEqual([]);
  });

  it("getDepthColor returns correct colors", () => {
    expect(getDepthColor(90)).toBe("#22c55e"); // green
    expect(getDepthColor(70)).toBe("#84cc16"); // lime
    expect(getDepthColor(50)).toBe("#eab308"); // yellow
    expect(getDepthColor(30)).toBe("#f97316"); // orange
    expect(getDepthColor(10)).toBe("#ef4444"); // red
  });

  it("getDepthLabel returns correct labels", () => {
    expect(getDepthLabel(0)).toBe("Top of page");
    expect(getDepthLabel(20)).toBe("Above the fold");
    expect(getDepthLabel(40)).toBe("Mid-page");
    expect(getDepthLabel(60)).toBe("Below the fold");
    expect(getDepthLabel(90)).toBe("Bottom of page");
  });
});

// ==================== REPORT EXPORT TESTS ====================

describe("Report Export", () => {
  const mockReport: WeeklyReportData = {
    period: { start: "2026-02-01", end: "2026-02-08" },
    pwaMetrics: {
      totalInstalls: 42,
      installRate: 8.5,
      offlineSessions: 15,
      notificationsEnabled: 30,
      notificationCTR: 12.3,
      swRegistrations: 50,
    },
    abTestResults: {
      totalImpressions: 500,
      bestVariant: "urgency",
      bestConversionRate: 0.15,
      isSignificant: true,
      pValue: 0.023,
    },
    mobileEngagement: {
      totalSessions: 200,
      avgSessionDuration: 45.5,
      avgScrollDepth: 62.3,
      totalTouchInteractions: 1500,
      topPages: [
        { url: "/", views: 150 },
        { url: "/generate", views: 80 },
      ],
      platformBreakdown: [
        { platform: "ios", count: 100 },
        { platform: "android", count: 80 },
        { platform: "desktop", count: 20 },
      ],
    },
    generationMetrics: {
      totalStarted: 100,
      totalCompleted: 85,
      totalFailed: 15,
      successRate: 85.0,
    },
    recommendations: ["Increase install prompts", "Optimize for mobile"],
  };

  describe("CSV Export", () => {
    it("generates valid CSV content", () => {
      const csv = generateReportCSV(mockReport);
      expect(csv).toContain("AI Influencer Generator - Weekly Report");
      expect(csv).toContain("2026-02-01 to 2026-02-08");
    });

    it("includes all metric sections", () => {
      const csv = generateReportCSV(mockReport);
      expect(csv).toContain("PWA Metrics");
      expect(csv).toContain("A/B Test Results");
      expect(csv).toContain("Mobile Engagement");
      expect(csv).toContain("Generation Metrics");
    });

    it("includes correct values", () => {
      const csv = generateReportCSV(mockReport);
      expect(csv).toContain("42"); // totalInstalls
      expect(csv).toContain("8.50"); // installRate
      expect(csv).toContain("urgency"); // bestVariant
      expect(csv).toContain("85.00"); // successRate
    });

    it("includes top pages", () => {
      const csv = generateReportCSV(mockReport);
      expect(csv).toContain("/");
      expect(csv).toContain("/generate");
    });

    it("includes recommendations", () => {
      const csv = generateReportCSV(mockReport);
      expect(csv).toContain("Increase install prompts");
      expect(csv).toContain("Optimize for mobile");
    });

    it("properly escapes CSV fields with commas", () => {
      const report = {
        ...mockReport,
        recommendations: ["Test, with comma"],
      };
      const csv = generateReportCSV(report);
      expect(csv).toContain('"Test, with comma"');
    });
  });

  describe("HTML Export", () => {
    it("generates valid HTML document", () => {
      const html = generateReportHTML(mockReport);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("includes report period", () => {
      const html = generateReportHTML(mockReport);
      expect(html).toContain("2026-02-01");
      expect(html).toContain("2026-02-08");
    });

    it("includes KPI values", () => {
      const html = generateReportHTML(mockReport);
      expect(html).toContain("42"); // installs
      expect(html).toContain("200"); // sessions
      expect(html).toContain("85"); // generations completed
    });

    it("includes all sections", () => {
      const html = generateReportHTML(mockReport);
      expect(html).toContain("PWA Metrics");
      expect(html).toContain("A/B Test Results");
      expect(html).toContain("Mobile Engagement");
      expect(html).toContain("Generation Performance");
    });

    it("includes recommendations", () => {
      const html = generateReportHTML(mockReport);
      expect(html).toContain("Increase install prompts");
      expect(html).toContain("Optimize for mobile");
    });

    it("uses color coding for metrics", () => {
      const html = generateReportHTML(mockReport);
      // Install rate 8.5% >= 5 should be green
      expect(html).toContain("#22c55e");
    });

    it("includes top pages section", () => {
      const html = generateReportHTML(mockReport);
      expect(html).toContain("/generate");
    });
  });
});
