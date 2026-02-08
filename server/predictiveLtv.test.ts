import { describe, it, expect } from "vitest";
import {
  fitLogCurve,
  predictLtvAtMonth,
  buildLtvPredictions,
  calculateBudgetReallocation,
  type CohortLtvDataPoint,
} from "../shared/predictiveLtv";

// ============================================================
// Predictive LTV Tests
// ============================================================

describe("fitLogCurve", () => {
  it("returns zero slope for single data point", () => {
    const result = fitLogCurve([{ month: 1, ltv: 10 }]);
    expect(result.a).toBe(0);
    expect(result.b).toBe(10);
    expect(result.rSquared).toBe(0);
  });

  it("returns zero for empty data", () => {
    const result = fitLogCurve([]);
    expect(result.a).toBe(0);
    expect(result.b).toBe(0);
    expect(result.rSquared).toBe(0);
  });

  it("fits a logarithmic curve to growing data", () => {
    const data = [
      { month: 1, ltv: 5 },
      { month: 2, ltv: 8 },
      { month: 3, ltv: 10 },
      { month: 6, ltv: 14 },
      { month: 12, ltv: 18 },
    ];
    const result = fitLogCurve(data);
    expect(result.a).toBeGreaterThan(0); // Positive growth
    expect(result.rSquared).toBeGreaterThan(0.5); // Reasonable fit
  });

  it("handles flat data with near-zero slope", () => {
    const data = [
      { month: 1, ltv: 10 },
      { month: 2, ltv: 10 },
      { month: 3, ltv: 10 },
    ];
    const result = fitLogCurve(data);
    expect(Math.abs(result.a)).toBeLessThan(1);
  });
});

describe("predictLtvAtMonth", () => {
  it("returns non-negative values", () => {
    expect(predictLtvAtMonth(5, 2, 0)).toBeGreaterThanOrEqual(0);
    expect(predictLtvAtMonth(5, 2, 6)).toBeGreaterThanOrEqual(0);
    expect(predictLtvAtMonth(5, 2, 12)).toBeGreaterThanOrEqual(0);
  });

  it("increases with month for positive slope", () => {
    const m3 = predictLtvAtMonth(5, 2, 3);
    const m6 = predictLtvAtMonth(5, 2, 6);
    const m12 = predictLtvAtMonth(5, 2, 12);
    expect(m6).toBeGreaterThan(m3);
    expect(m12).toBeGreaterThan(m6);
  });

  it("returns base value at month 0", () => {
    const result = predictLtvAtMonth(10, 5, 0);
    expect(result).toBe(5); // a * ln(1) + b = 0 + 5
  });
});

describe("buildLtvPredictions", () => {
  it("returns predictions for all 5 channels", () => {
    const result = buildLtvPredictions([], {
      organic: 0,
      paid: 0,
      affiliate: 0,
      direct: 0,
      social: 0,
    });
    expect(result).toHaveLength(5);
    expect(result.map(p => p.channel)).toEqual(["organic", "paid", "affiliate", "direct", "social"]);
  });

  it("uses low confidence for channels with no data", () => {
    const result = buildLtvPredictions([], {
      organic: 10,
      paid: 0,
      affiliate: 0,
      direct: 0,
      social: 0,
    });
    const organic = result.find(p => p.channel === "organic")!;
    expect(organic.confidence).toBeLessThanOrEqual(0.2);
  });

  it("produces higher predictions for channels with growing cohort data", () => {
    const cohortData: CohortLtvDataPoint[] = [
      { cohortMonth: "2025-01", channel: "paid", monthsSinceSignup: 1, cumulativeRevenue: 50, userCount: 10, ltvPerUser: 5 },
      { cohortMonth: "2025-01", channel: "paid", monthsSinceSignup: 2, cumulativeRevenue: 80, userCount: 10, ltvPerUser: 8 },
      { cohortMonth: "2025-01", channel: "paid", monthsSinceSignup: 3, cumulativeRevenue: 100, userCount: 10, ltvPerUser: 10 },
      { cohortMonth: "2025-02", channel: "paid", monthsSinceSignup: 1, cumulativeRevenue: 60, userCount: 10, ltvPerUser: 6 },
      { cohortMonth: "2025-02", channel: "paid", monthsSinceSignup: 2, cumulativeRevenue: 90, userCount: 10, ltvPerUser: 9 },
    ];
    const result = buildLtvPredictions(cohortData, {
      organic: 0,
      paid: 10,
      affiliate: 0,
      direct: 0,
      social: 0,
    });
    const paid = result.find(p => p.channel === "paid")!;
    expect(paid.predicted365d).toBeGreaterThan(paid.currentLtv);
    expect(paid.confidence).toBeGreaterThan(0);
  });

  it("handles currentLtv of zero gracefully", () => {
    const result = buildLtvPredictions([], {
      organic: 0,
      paid: 0,
      affiliate: 0,
      direct: 0,
      social: 0,
    });
    for (const pred of result) {
      expect(pred.currentLtv).toBe(0);
      expect(pred.predicted365d).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================
// Budget Reallocation Tests
// ============================================================

describe("calculateBudgetReallocation", () => {
  it("returns empty allocations for no data", () => {
    const result = calculateBudgetReallocation([], 1000);
    expect(result.allocations).toHaveLength(0);
    expect(result.totalBudget).toBe(1000);
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it("allocates more budget to higher-performing channels", () => {
    const result = calculateBudgetReallocation([
      { channel: "paid", currentSpend: 500, revenue: 2000, newCustomers: 20, predictedLtv365d: 50 },
      { channel: "organic", currentSpend: 500, revenue: 500, newCustomers: 5, predictedLtv365d: 20 },
    ], 1000);

    expect(result.allocations).toHaveLength(2);
    const paid = result.allocations.find(a => a.channel === "paid")!;
    const organic = result.allocations.find(a => a.channel === "organic")!;
    expect(paid.recommendedSpend).toBeGreaterThan(organic.recommendedSpend);
  });

  it("uses total of current spend when no budget specified", () => {
    const result = calculateBudgetReallocation([
      { channel: "paid", currentSpend: 300, revenue: 900, newCustomers: 10, predictedLtv365d: 30 },
      { channel: "organic", currentSpend: 200, revenue: 400, newCustomers: 5, predictedLtv365d: 20 },
    ]);
    expect(result.totalBudget).toBe(500);
  });

  it("generates insights for budget optimization", () => {
    const result = calculateBudgetReallocation([
      { channel: "paid", currentSpend: 100, revenue: 1000, newCustomers: 50, predictedLtv365d: 80 },
      { channel: "social", currentSpend: 900, revenue: 100, newCustomers: 2, predictedLtv365d: 5 },
    ], 1000);

    expect(result.insights.length).toBeGreaterThan(0);
  });

  it("handles zero spend channels", () => {
    const result = calculateBudgetReallocation([
      { channel: "paid", currentSpend: 1000, revenue: 3000, newCustomers: 30, predictedLtv365d: 50 },
      { channel: "organic", currentSpend: 0, revenue: 500, newCustomers: 10, predictedLtv365d: 40 },
    ], 1000);

    expect(result.allocations).toHaveLength(2);
    // Both should get some allocation
    for (const alloc of result.allocations) {
      expect(alloc.recommendedSpend).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns expected ROAS improvement", () => {
    const result = calculateBudgetReallocation([
      { channel: "paid", currentSpend: 200, revenue: 1000, newCustomers: 20, predictedLtv365d: 50 },
      { channel: "social", currentSpend: 800, revenue: 200, newCustomers: 3, predictedLtv365d: 10 },
    ], 1000);

    expect(result.expectedTotalRoas).toBeGreaterThanOrEqual(0);
    expect(result.currentTotalRoas).toBeGreaterThanOrEqual(0);
  });

  it("handles budget of zero", () => {
    const result = calculateBudgetReallocation([
      { channel: "paid", currentSpend: 0, revenue: 0, newCustomers: 0, predictedLtv365d: 0 },
    ], 0);
    expect(result.totalBudget).toBe(0);
    expect(result.allocations).toHaveLength(0);
  });
});
