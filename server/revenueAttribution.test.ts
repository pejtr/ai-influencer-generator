import { describe, it, expect } from "vitest";
import {
  calculateLTV,
  calculateLTVPaid,
  calculateConversionRate,
  calculateAOV,
  determineChannel,
  buildChannelMetrics,
  generateRevenueInsights,
  buildChannelComparison,
  CHANNEL_CONFIG,
  ALL_CHANNELS,
  type AcquisitionChannel,
  type RevenueAttributionData,
  type ChannelMetrics,
} from "@shared/revenueAttribution";

describe("Revenue Attribution - LTV Calculations", () => {
  it("calculates LTV correctly", () => {
    expect(calculateLTV(1000, 100)).toBe(10);
    expect(calculateLTV(0, 100)).toBe(0);
    expect(calculateLTV(1000, 0)).toBe(0);
    expect(calculateLTV(333, 100)).toBe(3.33);
  });

  it("calculates LTV per paying user", () => {
    expect(calculateLTVPaid(1000, 10)).toBe(100);
    expect(calculateLTVPaid(0, 10)).toBe(0);
    expect(calculateLTVPaid(1000, 0)).toBe(0);
  });

  it("calculates conversion rate", () => {
    expect(calculateConversionRate(10, 100)).toBe(10);
    expect(calculateConversionRate(0, 100)).toBe(0);
    expect(calculateConversionRate(10, 0)).toBe(0);
    expect(calculateConversionRate(1, 3)).toBe(33.3);
  });

  it("calculates average order value", () => {
    expect(calculateAOV(500, 10)).toBe(50);
    expect(calculateAOV(0, 10)).toBe(0);
    expect(calculateAOV(500, 0)).toBe(0);
  });
});

describe("Revenue Attribution - Channel Detection", () => {
  it("detects affiliate channel from referredBy", () => {
    expect(determineChannel(undefined, undefined, "user123")).toBe("affiliate");
    expect(determineChannel("google", "cpc", "user123")).toBe("affiliate"); // referredBy takes priority
  });

  it("detects paid channels from UTM medium", () => {
    expect(determineChannel("google", "cpc")).toBe("paid");
    expect(determineChannel("facebook", "ppc")).toBe("paid");
    expect(determineChannel("any", "paid")).toBe("paid");
    expect(determineChannel("any", "display")).toBe("paid");
    expect(determineChannel("any", "cpm")).toBe("paid");
  });

  it("detects social channels", () => {
    expect(determineChannel("facebook", "post")).toBe("social");
    expect(determineChannel("instagram", "story")).toBe("social");
    expect(determineChannel("twitter", "tweet")).toBe("social");
    expect(determineChannel("tiktok", "video")).toBe("social");
    expect(determineChannel("linkedin", "share")).toBe("social");
    expect(determineChannel("youtube", "video")).toBe("social");
    expect(determineChannel("any", "social")).toBe("social");
  });

  it("detects organic channels", () => {
    expect(determineChannel("google", "organic")).toBe("organic");
    expect(determineChannel("bing", "organic")).toBe("organic");
    expect(determineChannel("yahoo", "search")).toBe("organic");
    expect(determineChannel("duckduckgo", "search")).toBe("organic");
  });

  it("defaults to direct when no UTM data", () => {
    expect(determineChannel()).toBe("direct");
    expect(determineChannel(null, null, null)).toBe("direct");
    expect(determineChannel("", "")).toBe("direct");
  });

  it("handles case insensitivity", () => {
    expect(determineChannel("Google", "CPC")).toBe("paid");
    expect(determineChannel("Facebook", "Social")).toBe("social");
  });
});

describe("Revenue Attribution - Build Channel Metrics", () => {
  it("builds metrics from raw data", () => {
    const raw = {
      channel: "organic" as AcquisitionChannel,
      totalUsers: 100,
      paidUsers: 15,
      subscriptionRevenue: 300,
      creditPackRevenue: 200,
      totalOrders: 20,
      avgDaysToFirstPurchase: 5.5,
      activeUsersLast30d: 60,
    };

    const metrics = buildChannelMetrics(raw);
    expect(metrics.channel).toBe("organic");
    expect(metrics.totalUsers).toBe(100);
    expect(metrics.paidUsers).toBe(15);
    expect(metrics.totalRevenue).toBe(500);
    expect(metrics.conversionRate).toBe(15);
    expect(metrics.ltv).toBe(5);
    expect(metrics.ltvPaid).toBeCloseTo(33.33, 1);
    expect(metrics.avgOrderValue).toBe(25);
    expect(metrics.retentionRate30d).toBe(60);
    expect(metrics.firstPurchaseDays).toBe(5.5);
  });

  it("handles zero users gracefully", () => {
    const raw = {
      channel: "paid" as AcquisitionChannel,
      totalUsers: 0,
      paidUsers: 0,
      subscriptionRevenue: 0,
      creditPackRevenue: 0,
      totalOrders: 0,
      avgDaysToFirstPurchase: 0,
      activeUsersLast30d: 0,
    };

    const metrics = buildChannelMetrics(raw);
    expect(metrics.ltv).toBe(0);
    expect(metrics.conversionRate).toBe(0);
    expect(metrics.retentionRate30d).toBe(0);
  });
});

describe("Revenue Attribution - Insights Generation", () => {
  const makeData = (channels: ChannelMetrics[]): RevenueAttributionData => ({
    channels,
    totals: {
      totalUsers: channels.reduce((s, c) => s + c.totalUsers, 0),
      totalPaidUsers: channels.reduce((s, c) => s + c.paidUsers, 0),
      totalRevenue: channels.reduce((s, c) => s + c.totalRevenue, 0),
      overallLtv: 5,
      overallConversionRate: 10,
    },
    topChannel: null,
    worstChannel: null,
    ltvTrend: [],
  });

  it("generates no-data insight when empty", () => {
    const data = makeData([]);
    const insights = generateRevenueInsights(data);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe("info");
    expect(insights[0].title).toBe("No Data");
  });

  it("identifies highest LTV channel", () => {
    const channels: ChannelMetrics[] = [
      buildChannelMetrics({ channel: "organic" as AcquisitionChannel, totalUsers: 50, paidUsers: 10, subscriptionRevenue: 200, creditPackRevenue: 100, totalOrders: 12, avgDaysToFirstPurchase: 3, activeUsersLast30d: 30 }),
      buildChannelMetrics({ channel: "paid" as AcquisitionChannel, totalUsers: 30, paidUsers: 5, subscriptionRevenue: 50, creditPackRevenue: 50, totalOrders: 6, avgDaysToFirstPurchase: 7, activeUsersLast30d: 10 }),
    ];
    const insights = generateRevenueInsights(makeData(channels));
    const ltvInsight = insights.find(i => i.title === "Highest LTV Channel");
    expect(ltvInsight).toBeDefined();
    expect(ltvInsight!.channel).toBe("organic");
  });

  it("warns about low conversion channels", () => {
    const channels: ChannelMetrics[] = [
      buildChannelMetrics({ channel: "paid" as AcquisitionChannel, totalUsers: 100, paidUsers: 1, subscriptionRevenue: 10, creditPackRevenue: 5, totalOrders: 1, avgDaysToFirstPurchase: 14, activeUsersLast30d: 20 }),
    ];
    const insights = generateRevenueInsights(makeData(channels));
    const warning = insights.find(i => i.title === "Low Conversion Channel");
    expect(warning).toBeDefined();
    expect(warning!.type).toBe("warning");
  });

  it("includes overall performance insight", () => {
    const channels: ChannelMetrics[] = [
      buildChannelMetrics({ channel: "direct" as AcquisitionChannel, totalUsers: 50, paidUsers: 5, subscriptionRevenue: 100, creditPackRevenue: 50, totalOrders: 6, avgDaysToFirstPurchase: 5, activeUsersLast30d: 25 }),
    ];
    const insights = generateRevenueInsights(makeData(channels));
    const overall = insights.find(i => i.title === "Overall Performance");
    expect(overall).toBeDefined();
    expect(overall!.type).toBe("info");
  });
});

describe("Revenue Attribution - Channel Comparison", () => {
  it("builds comparison table", () => {
    const channels: ChannelMetrics[] = [
      buildChannelMetrics({ channel: "organic" as AcquisitionChannel, totalUsers: 100, paidUsers: 20, subscriptionRevenue: 400, creditPackRevenue: 200, totalOrders: 25, avgDaysToFirstPurchase: 3, activeUsersLast30d: 60 }),
      buildChannelMetrics({ channel: "paid" as AcquisitionChannel, totalUsers: 50, paidUsers: 5, subscriptionRevenue: 50, creditPackRevenue: 50, totalOrders: 6, avgDaysToFirstPurchase: 10, activeUsersLast30d: 15 }),
    ];
    const comparison = buildChannelComparison(channels);
    expect(comparison.length).toBeGreaterThan(0);

    const ltvRow = comparison.find(c => c.metric === "LTV (per user)");
    expect(ltvRow).toBeDefined();
    expect(ltvRow!.best).toBe("organic");

    const usersRow = comparison.find(c => c.metric === "Total Users");
    expect(usersRow).toBeDefined();
    expect(usersRow!.best).toBe("organic");
  });

  it("returns empty array for no channels", () => {
    expect(buildChannelComparison([])).toEqual([]);
  });
});

describe("Revenue Attribution - Constants", () => {
  it("has all 5 channels configured", () => {
    expect(ALL_CHANNELS).toHaveLength(5);
    expect(ALL_CHANNELS).toContain("organic");
    expect(ALL_CHANNELS).toContain("paid");
    expect(ALL_CHANNELS).toContain("affiliate");
    expect(ALL_CHANNELS).toContain("direct");
    expect(ALL_CHANNELS).toContain("social");
  });

  it("has config for all channels", () => {
    ALL_CHANNELS.forEach(ch => {
      const config = CHANNEL_CONFIG[ch];
      expect(config.label).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(config.icon).toBeTruthy();
      expect(config.description).toBeTruthy();
    });
  });
});
