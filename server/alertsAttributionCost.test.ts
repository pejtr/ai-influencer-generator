import { describe, it, expect } from "vitest";
import {
  checkFunnelAlerts,
  calculateHistoricalAverages,
  buildAlertNotification,
  DEFAULT_THRESHOLDS,
  type FunnelStepRate,
  type HistoricalAverage,
} from "../shared/funnelAlerts";
import {
  firstTouchAttribution,
  lastTouchAttribution,
  linearAttribution,
  timeDecayAttribution,
  compareAttributionModels,
  buildModelComparisonTable,
  generateAttributionInsights,
  ATTRIBUTION_MODELS,
  type Touchpoint,
} from "../shared/attributionModels";
import {
  calculateROAS,
  calculateCAC,
  buildChannelROAS,
  generateCostInsights,
  type CostTrackingData,
} from "../shared/costTracking";

// ============================================================
// Funnel Alerts Tests
// ============================================================
describe("Funnel Alerts", () => {
  describe("DEFAULT_THRESHOLDS", () => {
    it("should have warning and critical thresholds", () => {
      expect(DEFAULT_THRESHOLDS.warningThreshold).toBeGreaterThan(0);
      expect(DEFAULT_THRESHOLDS.criticalThreshold).toBeGreaterThan(DEFAULT_THRESHOLDS.warningThreshold);
      expect(DEFAULT_THRESHOLDS.minSampleSize).toBeGreaterThan(0);
    });
  });

  describe("calculateHistoricalAverages", () => {
    it("should calculate averages from historical data", () => {
      const historical = [
        { stepId: "signups", weekStart: "2026-01-01", rate: 10, count: 100 },
        { stepId: "signups", weekStart: "2026-01-08", rate: 12, count: 120 },
        { stepId: "signups", weekStart: "2026-01-15", rate: 8, count: 80 },
        { stepId: "generations", weekStart: "2026-01-01", rate: 30, count: 50 },
        { stepId: "generations", weekStart: "2026-01-08", rate: 25, count: 60 },
      ];
      const averages = calculateHistoricalAverages(historical);
      expect(averages).toBeDefined();
      expect(Array.isArray(averages)).toBe(true);
    });

    it("should return empty array for empty input", () => {
      const averages = calculateHistoricalAverages([]);
      expect(averages).toEqual([]);
    });
  });

  describe("checkFunnelAlerts", () => {
    it("should return no alerts when rates are stable", () => {
      const currentRates: FunnelStepRate[] = [
        { stepId: "signups", stepLabel: "Visit → Sign Up", rate: 10, count: 100 },
      ];
      const historicalAverages: HistoricalAverage[] = [
        { stepId: "signups", avgRate: 10, stdDev: 1, weekCount: 4 },
      ];
      const alerts = checkFunnelAlerts(currentRates, historicalAverages);
      expect(alerts.length).toBe(0);
    });

    it("should detect warning when rate drops moderately", () => {
      const currentRates: FunnelStepRate[] = [
        { stepId: "signups", stepLabel: "Visit → Sign Up", rate: 7, count: 100 },
      ];
      const historicalAverages: HistoricalAverage[] = [
        { stepId: "signups", avgRate: 10, stdDev: 1, weekCount: 4 },
      ];
      const alerts = checkFunnelAlerts(currentRates, historicalAverages);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      if (alerts.length > 0) {
        expect(["warning", "critical"]).toContain(alerts[0].severity);
      }
    });

    it("should detect critical when rate drops significantly", () => {
      const currentRates: FunnelStepRate[] = [
        { stepId: "signups", stepLabel: "Visit → Sign Up", rate: 3, count: 100 },
      ];
      const historicalAverages: HistoricalAverage[] = [
        { stepId: "signups", avgRate: 10, stdDev: 1, weekCount: 4 },
      ];
      const alerts = checkFunnelAlerts(currentRates, historicalAverages);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      const criticals = alerts.filter(a => a.severity === "critical");
      expect(criticals.length).toBeGreaterThanOrEqual(1);
    });

    it("should skip steps with insufficient data", () => {
      const currentRates: FunnelStepRate[] = [
        { stepId: "signups", stepLabel: "Visit → Sign Up", rate: 3, count: 2 },
      ];
      const historicalAverages: HistoricalAverage[] = [
        { stepId: "signups", avgRate: 10, stdDev: 1, weekCount: 1 },
      ];
      const alerts = checkFunnelAlerts(currentRates, historicalAverages);
      // Should skip due to low sample or insufficient weeks
      expect(alerts.length).toBe(0);
    });
  });

  describe("buildAlertNotification", () => {
    it("should build notification from alerts", () => {
      const alerts = [
        {
          stepId: "signups",
          stepLabel: "Visit → Sign Up",
          severity: "critical" as const,
          currentRate: 3,
          averageRate: 10,
          dropPercent: 70,
          message: "Signup rate dropped 70% below average",
        },
      ];
      const notification = buildAlertNotification(alerts);
      expect(notification).toHaveProperty("title");
      expect(notification).toHaveProperty("content");
      expect(notification.title).toContain("Alert");
      expect(notification.content.length).toBeGreaterThan(0);
    });

    it("should handle empty alerts array", () => {
      const notification = buildAlertNotification([]);
      expect(notification).toHaveProperty("title");
      expect(notification).toHaveProperty("content");
    });
  });
});

// ============================================================
// Attribution Models Tests
// ============================================================
describe("Attribution Models", () => {
  describe("ATTRIBUTION_MODELS", () => {
    it("should define all 4 models", () => {
      expect(ATTRIBUTION_MODELS).toHaveProperty("first_touch");
      expect(ATTRIBUTION_MODELS).toHaveProperty("last_touch");
      expect(ATTRIBUTION_MODELS).toHaveProperty("linear");
      expect(ATTRIBUTION_MODELS).toHaveProperty("time_decay");
    });

    it("each model should have label and description", () => {
      Object.values(ATTRIBUTION_MODELS).forEach(model => {
        expect(model).toHaveProperty("label");
        expect(model).toHaveProperty("description");
        expect(model.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe("firstTouchAttribution", () => {
    it("should attribute all revenue to first touchpoint", () => {
      const journeys = [{
        touchpoints: [
          { channel: "paid" as const, timestamp: 1000, eventType: "visit" },
          { channel: "organic" as const, timestamp: 2000, eventType: "signup" },
          { channel: "social" as const, timestamp: 3000, eventType: "purchase" },
        ],
        revenue: 100,
      }];
      const result = firstTouchAttribution(journeys);
      expect(result.channelCredits.paid).toBe(100);
      expect(result.channelCredits.organic).toBe(0);
      expect(result.channelCredits.social).toBe(0);
    });

    it("should handle single touchpoint", () => {
      const journeys = [{
        touchpoints: [
          { channel: "organic" as const, timestamp: 1000, eventType: "visit" },
        ],
        revenue: 50,
      }];
      const result = firstTouchAttribution(journeys);
      expect(result.channelCredits.organic).toBe(50);
    });

    it("should return zeros for no touchpoints", () => {
      const journeys = [{ touchpoints: [] as Touchpoint[], revenue: 100 }];
      const result = firstTouchAttribution(journeys);
      expect(Object.values(result.channelCredits).every(v => v === 0)).toBe(true);
    });
  });

  describe("lastTouchAttribution", () => {
    it("should attribute all revenue to last touchpoint", () => {
      const journeys = [{
        touchpoints: [
          { channel: "paid" as const, timestamp: 1000, eventType: "visit" },
          { channel: "organic" as const, timestamp: 2000, eventType: "signup" },
          { channel: "social" as const, timestamp: 3000, eventType: "purchase" },
        ],
        revenue: 100,
      }];
      const result = lastTouchAttribution(journeys);
      expect(result.channelCredits.social).toBe(100);
      expect(result.channelCredits.paid).toBe(0);
    });
  });

  describe("linearAttribution", () => {
    it("should distribute revenue equally across unique channels", () => {
      const journeys = [{
        touchpoints: [
          { channel: "paid" as const, timestamp: 1000, eventType: "visit" },
          { channel: "organic" as const, timestamp: 2000, eventType: "signup" },
        ],
        revenue: 100,
      }];
      const result = linearAttribution(journeys);
      expect(result.channelCredits.paid).toBeCloseTo(50, 1);
      expect(result.channelCredits.organic).toBeCloseTo(50, 1);
    });

    it("should handle multiple touchpoints from same channel (unique channels)", () => {
      const journeys = [{
        touchpoints: [
          { channel: "paid" as const, timestamp: 1000, eventType: "visit" },
          { channel: "paid" as const, timestamp: 2000, eventType: "click" },
          { channel: "organic" as const, timestamp: 3000, eventType: "signup" },
        ],
        revenue: 90,
      }];
      const result = linearAttribution(journeys);
      // Linear splits by unique channels: paid + organic = 2 channels, 45 each
      expect(result.channelCredits.paid).toBeCloseTo(45, 1);
      expect(result.channelCredits.organic).toBeCloseTo(45, 1);
    });
  });

  describe("timeDecayAttribution", () => {
    it("should give more credit to recent touchpoints", () => {
      const journeys = [{
        touchpoints: [
          { channel: "paid" as const, timestamp: 1000, eventType: "visit" },
          { channel: "organic" as const, timestamp: 100000000, eventType: "purchase" },
        ],
        revenue: 100,
      }];
      const result = timeDecayAttribution(journeys);
      expect(result.channelCredits.organic).toBeGreaterThan(result.channelCredits.paid);
    });
  });

  describe("compareAttributionModels", () => {
    it("should return results for all 4 models", () => {
      const journeys = [
        {
          touchpoints: [
            { channel: "paid" as const, timestamp: 1000, eventType: "visit" },
            { channel: "organic" as const, timestamp: 2000, eventType: "purchase" },
          ],
          revenue: 100,
        },
      ];
      const results = compareAttributionModels(journeys);
      expect(results.length).toBe(4);
      expect(results.map(r => r.model)).toContain("first_touch");
      expect(results.map(r => r.model)).toContain("last_touch");
      expect(results.map(r => r.model)).toContain("linear");
      expect(results.map(r => r.model)).toContain("time_decay");
    });

    it("should handle empty journeys", () => {
      const results = compareAttributionModels([]);
      expect(results.length).toBe(4);
      results.forEach(r => {
        expect(r.totalRevenue).toBe(0);
      });
    });
  });

  describe("buildModelComparisonTable", () => {
    it("should build comparison table from results", () => {
      const journeys = [
        {
          touchpoints: [
            { channel: "paid" as const, timestamp: 1000, eventType: "visit" },
            { channel: "organic" as const, timestamp: 2000, eventType: "purchase" },
          ],
          revenue: 100,
        },
      ];
      const results = compareAttributionModels(journeys);
      const table = buildModelComparisonTable(results);
      expect(Array.isArray(table)).toBe(true);
      if (table.length > 0) {
        expect(table[0]).toHaveProperty("channel");
        expect(table[0]).toHaveProperty("firstTouch");
        expect(table[0]).toHaveProperty("lastTouch");
        expect(table[0]).toHaveProperty("linear");
        expect(table[0]).toHaveProperty("timeDecay");
      }
    });
  });

  describe("generateAttributionInsights", () => {
    it("should generate insights from results", () => {
      const journeys = [
        {
          touchpoints: [
            { channel: "paid" as const, timestamp: 1000, eventType: "visit" },
            { channel: "organic" as const, timestamp: 2000, eventType: "purchase" },
          ],
          revenue: 100,
        },
      ];
      const results = compareAttributionModels(journeys);
      const insights = generateAttributionInsights(results);
      expect(Array.isArray(insights)).toBe(true);
    });
  });
});

// ============================================================
// Cost Tracking Tests
// ============================================================
describe("Cost Tracking", () => {
  describe("calculateROAS", () => {
    it("should calculate ROAS correctly", () => {
      expect(calculateROAS(200, 100)).toBe(2);
      expect(calculateROAS(50, 100)).toBe(0.5);
    });

    it("should return Infinity for zero spend with revenue", () => {
      expect(calculateROAS(100, 0)).toBe(Infinity);
    });

    it("should return 0 for zero spend and zero revenue", () => {
      expect(calculateROAS(0, 0)).toBe(0);
    });

    it("should handle zero revenue", () => {
      expect(calculateROAS(0, 100)).toBe(0);
    });
  });

  describe("calculateCAC", () => {
    it("should calculate CAC correctly", () => {
      expect(calculateCAC(1000, 10)).toBe(100);
      expect(calculateCAC(500, 5)).toBe(100);
    });

    it("should return Infinity for zero customers with spend", () => {
      expect(calculateCAC(1000, 0)).toBe(Infinity);
    });

    it("should return 0 for zero spend", () => {
      expect(calculateCAC(0, 10)).toBe(0);
    });

    it("should return 0 for zero spend and zero customers", () => {
      expect(calculateCAC(0, 0)).toBe(0);
    });
  });

  describe("buildChannelROAS", () => {
    it("should build channel ROAS data", () => {
      const result = buildChannelROAS({
        channel: "paid",
        totalSpend: 1000,
        totalRevenue: 3000,
        newCustomers: 30,
      });
      expect(result.channel).toBe("paid");
      expect(result.totalSpend).toBe(1000);
      expect(result.totalRevenue).toBe(3000);
      expect(result.roas).toBe(3);
      expect(result.cac).toBeCloseTo(33.33, 1);
      expect(result.newCustomers).toBe(30);
      expect(result.profit).toBe(2000);
    });

    it("should handle zero values gracefully", () => {
      const result = buildChannelROAS({
        channel: "organic",
        totalSpend: 0,
        totalRevenue: 500,
        newCustomers: 10,
      });
      expect(result.roas).toBe(999); // Infinity mapped to 999
      expect(result.cac).toBe(0);
      expect(result.profit).toBe(500);
    });
  });

  describe("generateCostInsights", () => {
    it("should generate insights from cost data", () => {
      const data: CostTrackingData = {
        channels: [
          buildChannelROAS({ channel: "paid", totalSpend: 1000, totalRevenue: 3000, newCustomers: 30 }),
          buildChannelROAS({ channel: "organic", totalSpend: 0, totalRevenue: 2000, newCustomers: 50 }),
          buildChannelROAS({ channel: "affiliate", totalSpend: 500, totalRevenue: 200, newCustomers: 5 }),
        ],
        totals: {
          totalSpend: 1500,
          totalRevenue: 5200,
          totalRoas: 3.47,
          totalCac: 17.65,
          totalNewCustomers: 85,
          totalProfit: 3700,
        },
        monthlyTrend: [],
      };
      const insights = generateCostInsights(data);
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it("should handle empty channel data", () => {
      const data: CostTrackingData = {
        channels: [],
        totals: {
          totalSpend: 0,
          totalRevenue: 0,
          totalRoas: 0,
          totalCac: 0,
          totalNewCustomers: 0,
          totalProfit: 0,
        },
        monthlyTrend: [],
      };
      const insights = generateCostInsights(data);
      expect(Array.isArray(insights)).toBe(true);
    });

    it("should identify channels with negative ROAS", () => {
      const data: CostTrackingData = {
        channels: [
          buildChannelROAS({ channel: "paid", totalSpend: 1000, totalRevenue: 300, newCustomers: 5 }),
        ],
        totals: {
          totalSpend: 1000,
          totalRevenue: 300,
          totalRoas: 0.3,
          totalCac: 200,
          totalNewCustomers: 5,
          totalProfit: -700,
        },
        monthlyTrend: [],
      };
      const insights = generateCostInsights(data);
      const warnings = insights.filter(i => i.type === "warning");
      expect(warnings.length).toBeGreaterThanOrEqual(1);
    });
  });
});
