/**
 * Predictive LTV Model & Budget Reallocation
 * 
 * Uses historical cohort data to predict future LTV per channel,
 * and recommends optimal budget allocation based on ROAS.
 */

import type { AcquisitionChannel } from "./revenueAttribution";

// ============================================================
// Predictive LTV Types
// ============================================================

export interface CohortLtvDataPoint {
  cohortMonth: string; // YYYY-MM
  channel: AcquisitionChannel;
  monthsSinceSignup: number;
  cumulativeRevenue: number;
  userCount: number;
  ltvPerUser: number;
}

export interface PredictedLTV {
  channel: AcquisitionChannel;
  currentLtv: number; // Observed LTV
  predicted30d: number;
  predicted90d: number;
  predicted180d: number;
  predicted365d: number;
  confidence: number; // 0-1, based on data quality
  growthRate: number; // Monthly LTV growth rate
  dataPoints: number; // Number of cohort data points used
}

export interface LtvPredictionResult {
  predictions: PredictedLTV[];
  modelAccuracy: number; // R-squared or similar
  lastUpdated: number;
}

// ============================================================
// Budget Reallocation Types
// ============================================================

export interface BudgetAllocation {
  channel: AcquisitionChannel;
  currentSpend: number;
  recommendedSpend: number;
  changePct: number; // % change from current
  changeAmount: number; // $ change
  expectedRoas: number;
  expectedNewCustomers: number;
  expectedRevenue: number;
  reason: string;
}

export interface BudgetReallocationResult {
  totalBudget: number;
  allocations: BudgetAllocation[];
  expectedTotalRevenue: number;
  expectedTotalRoas: number;
  currentTotalRoas: number;
  improvementPct: number;
  insights: Array<{ type: "success" | "warning" | "info"; title: string; message: string }>;
}

// ============================================================
// Predictive LTV Functions
// ============================================================

/**
 * Fit a logarithmic growth curve to LTV data: LTV(t) = a * ln(t + 1) + b
 * This models diminishing returns over time (common for SaaS/subscription).
 */
export function fitLogCurve(dataPoints: { month: number; ltv: number }[]): { a: number; b: number; rSquared: number } {
  if (dataPoints.length < 2) {
    return { a: 0, b: dataPoints[0]?.ltv ?? 0, rSquared: 0 };
  }

  const n = dataPoints.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const dp of dataPoints) {
    const x = Math.log(dp.month + 1);
    const y = dp.ltv;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-10) {
    return { a: 0, b: sumY / n, rSquared: 0 };
  }

  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (const dp of dataPoints) {
    const x = Math.log(dp.month + 1);
    const predicted = a * x + b;
    ssTot += (dp.ltv - meanY) ** 2;
    ssRes += (dp.ltv - predicted) ** 2;
  }
  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  return { a, b, rSquared };
}

/**
 * Predict LTV at a given month using the fitted curve.
 */
export function predictLtvAtMonth(a: number, b: number, month: number): number {
  return Math.max(0, Math.round((a * Math.log(month + 1) + b) * 100) / 100);
}

/**
 * Build predictions for all channels from cohort LTV data.
 */
export function buildLtvPredictions(
  cohortData: CohortLtvDataPoint[],
  currentLtvByChannel: Record<AcquisitionChannel, number>
): PredictedLTV[] {
  const channels: AcquisitionChannel[] = ["organic", "paid", "affiliate", "direct", "social"];
  const predictions: PredictedLTV[] = [];

  for (const channel of channels) {
    const channelData = cohortData.filter(d => d.channel === channel);
    
    // Group by months since signup and average
    const byMonth = new Map<number, { totalLtv: number; count: number }>();
    for (const d of channelData) {
      const existing = byMonth.get(d.monthsSinceSignup) || { totalLtv: 0, count: 0 };
      existing.totalLtv += d.ltvPerUser;
      existing.count += 1;
      byMonth.set(d.monthsSinceSignup, existing);
    }

    const dataPoints = Array.from(byMonth.entries())
      .map(([month, data]) => ({ month, ltv: data.totalLtv / data.count }))
      .sort((a, b) => a.month - b.month);

    const currentLtv = currentLtvByChannel[channel] || 0;

    if (dataPoints.length < 2) {
      // Not enough data — use simple linear extrapolation
      const monthlyGrowth = dataPoints.length === 1 && dataPoints[0].month > 0
        ? dataPoints[0].ltv / dataPoints[0].month
        : currentLtv * 0.05; // Assume 5% monthly growth

      predictions.push({
        channel,
        currentLtv,
        predicted30d: round2(currentLtv + monthlyGrowth),
        predicted90d: round2(currentLtv + monthlyGrowth * 3),
        predicted180d: round2(currentLtv + monthlyGrowth * 6),
        predicted365d: round2(currentLtv + monthlyGrowth * 12),
        confidence: dataPoints.length === 0 ? 0 : 0.2,
        growthRate: currentLtv > 0 ? round2((monthlyGrowth / currentLtv) * 100) : 0,
        dataPoints: dataPoints.length,
      });
      continue;
    }

    // Fit logarithmic curve
    const { a, b, rSquared } = fitLogCurve(dataPoints);
    const maxMonth = Math.max(...dataPoints.map(d => d.month));

    // Predict future months
    const predicted30d = predictLtvAtMonth(a, b, maxMonth + 1);
    const predicted90d = predictLtvAtMonth(a, b, maxMonth + 3);
    const predicted180d = predictLtvAtMonth(a, b, maxMonth + 6);
    const predicted365d = predictLtvAtMonth(a, b, maxMonth + 12);

    // Calculate monthly growth rate from last two data points
    const lastTwo = dataPoints.slice(-2);
    const growthRate = lastTwo.length === 2 && lastTwo[0].ltv > 0
      ? round2(((lastTwo[1].ltv - lastTwo[0].ltv) / lastTwo[0].ltv) * 100)
      : 0;

    // Confidence based on data quality
    const confidence = Math.min(1, round2(
      (rSquared * 0.5) + // Model fit
      (Math.min(dataPoints.length, 6) / 6 * 0.3) + // Data quantity
      (channelData.length >= 10 ? 0.2 : channelData.length / 50) // Sample size
    ));

    predictions.push({
      channel,
      currentLtv,
      predicted30d,
      predicted90d,
      predicted180d,
      predicted365d,
      confidence,
      growthRate,
      dataPoints: dataPoints.length,
    });
  }

  return predictions;
}

// ============================================================
// Budget Reallocation Functions
// ============================================================

/**
 * Calculate optimal budget allocation based on channel performance.
 * Uses a modified Kelly Criterion approach weighted by ROAS and LTV.
 */
export function calculateBudgetReallocation(
  channelPerformance: Array<{
    channel: AcquisitionChannel;
    currentSpend: number;
    revenue: number;
    newCustomers: number;
    predictedLtv365d: number;
  }>,
  totalBudget?: number
): BudgetReallocationResult {
  const budget = totalBudget || channelPerformance.reduce((sum, c) => sum + c.currentSpend, 0);
  
  if (budget === 0 || channelPerformance.length === 0) {
    return {
      totalBudget: budget,
      allocations: [],
      expectedTotalRevenue: 0,
      expectedTotalRoas: 0,
      currentTotalRoas: 0,
      improvementPct: 0,
      insights: [{ type: "info", title: "No Data", message: "Add cost data to see budget reallocation recommendations." }],
    };
  }

  // Calculate current performance metrics
  const currentTotalRevenue = channelPerformance.reduce((sum, c) => sum + c.revenue, 0);
  const currentTotalRoas = budget > 0 ? round2(currentTotalRevenue / budget) : 0;

  // Score each channel based on ROAS and predicted LTV
  const channelScores = channelPerformance.map(c => {
    const roas = c.currentSpend > 0 ? c.revenue / c.currentSpend : 0;
    const efficiency = c.currentSpend > 0 ? c.newCustomers / c.currentSpend : 0;
    const ltvScore = c.predictedLtv365d;
    
    // Composite score: ROAS * 0.4 + LTV * 0.3 + Efficiency * 0.3
    const normalizedRoas = Math.min(roas / 5, 1); // Cap at 5x
    const normalizedLtv = ltvScore > 0 ? Math.min(ltvScore / 100, 1) : 0; // Cap at $100
    const normalizedEfficiency = Math.min(efficiency * 100, 1); // Cap at 1 customer per $100
    
    const score = (normalizedRoas * 0.4) + (normalizedLtv * 0.3) + (normalizedEfficiency * 0.3);
    
    return { ...c, roas, efficiency, score: Math.max(score, 0.05) }; // Minimum 5% score
  });

  // Allocate budget proportionally to scores
  const totalScore = channelScores.reduce((sum, c) => sum + c.score, 0);
  
  const allocations: BudgetAllocation[] = channelScores.map(c => {
    const proportion = c.score / totalScore;
    const recommendedSpend = round2(budget * proportion);
    const changeAmount = round2(recommendedSpend - c.currentSpend);
    const changePct = c.currentSpend > 0 ? round2((changeAmount / c.currentSpend) * 100) : (recommendedSpend > 0 ? 100 : 0);
    
    // Estimate expected outcomes
    const costPerCustomer = c.currentSpend > 0 && c.newCustomers > 0 ? c.currentSpend / c.newCustomers : budget / 5;
    const expectedNewCustomers = Math.round(recommendedSpend / costPerCustomer);
    const revenuePerDollar = c.currentSpend > 0 ? c.revenue / c.currentSpend : 0;
    const expectedRevenue = round2(recommendedSpend * revenuePerDollar);
    const expectedRoas = recommendedSpend > 0 ? round2(expectedRevenue / recommendedSpend) : 0;

    let reason = "";
    if (changePct > 20) {
      reason = `High ROAS (${c.roas.toFixed(1)}x) and strong predicted LTV ($${c.predictedLtv365d.toFixed(0)}) justify increased investment.`;
    } else if (changePct < -20) {
      reason = `Below-average ROAS (${c.roas.toFixed(1)}x) suggests reallocating budget to higher-performing channels.`;
    } else {
      reason = `Current allocation is near optimal. ROAS: ${c.roas.toFixed(1)}x.`;
    }

    return {
      channel: c.channel,
      currentSpend: c.currentSpend,
      recommendedSpend,
      changePct,
      changeAmount,
      expectedRoas,
      expectedNewCustomers,
      expectedRevenue,
      reason,
    };
  });

  // Calculate expected totals
  const expectedTotalRevenue = round2(allocations.reduce((sum, a) => sum + a.expectedRevenue, 0));
  const expectedTotalRoas = budget > 0 ? round2(expectedTotalRevenue / budget) : 0;
  const improvementPct = currentTotalRoas > 0 ? round2(((expectedTotalRoas - currentTotalRoas) / currentTotalRoas) * 100) : 0;

  // Generate insights
  const insights = generateReallocationInsights(allocations, currentTotalRoas, expectedTotalRoas, improvementPct);

  return {
    totalBudget: budget,
    allocations: allocations.sort((a, b) => b.recommendedSpend - a.recommendedSpend),
    expectedTotalRevenue,
    expectedTotalRoas,
    currentTotalRoas,
    improvementPct,
    insights,
  };
}

function generateReallocationInsights(
  allocations: BudgetAllocation[],
  currentRoas: number,
  expectedRoas: number,
  improvementPct: number
): Array<{ type: "success" | "warning" | "info"; title: string; message: string }> {
  const insights: Array<{ type: "success" | "warning" | "info"; title: string; message: string }> = [];

  if (improvementPct > 5) {
    insights.push({
      type: "success",
      title: "Budget Optimization Opportunity",
      message: `Reallocating budget could improve overall ROAS from ${currentRoas}x to ${expectedRoas}x (+${improvementPct}%).`,
    });
  } else if (improvementPct > 0) {
    insights.push({
      type: "info",
      title: "Minor Optimization Available",
      message: `Current allocation is close to optimal. Potential improvement: +${improvementPct}% ROAS.`,
    });
  }

  // Find biggest increase recommendation
  const biggestIncrease = allocations.reduce((max, a) => a.changePct > max.changePct ? a : max, allocations[0]);
  if (biggestIncrease && biggestIncrease.changePct > 10) {
    insights.push({
      type: "success",
      title: `Scale Up: ${biggestIncrease.channel}`,
      message: `Increase ${biggestIncrease.channel} spend by ${biggestIncrease.changePct.toFixed(0)}% (+$${biggestIncrease.changeAmount.toFixed(2)}). Expected ROAS: ${biggestIncrease.expectedRoas}x.`,
    });
  }

  // Find biggest decrease recommendation
  const biggestDecrease = allocations.reduce((min, a) => a.changePct < min.changePct ? a : min, allocations[0]);
  if (biggestDecrease && biggestDecrease.changePct < -10) {
    insights.push({
      type: "warning",
      title: `Reduce: ${biggestDecrease.channel}`,
      message: `Reduce ${biggestDecrease.channel} spend by ${Math.abs(biggestDecrease.changePct).toFixed(0)}% (-$${Math.abs(biggestDecrease.changeAmount).toFixed(2)}). Current performance doesn't justify the investment.`,
    });
  }

  // Channels with no spend but potential
  const zeroSpend = allocations.filter(a => a.currentSpend === 0 && a.recommendedSpend > 0);
  if (zeroSpend.length > 0) {
    insights.push({
      type: "info",
      title: "Untapped Channels",
      message: `Consider testing: ${zeroSpend.map(a => a.channel).join(", ")}. These channels show potential based on organic performance.`,
    });
  }

  return insights;
}

// ============================================================
// Unified Dashboard Summary Types
// ============================================================

export interface UnifiedDashboardSummary {
  // Funnel health
  funnelHealth: "healthy" | "warning" | "critical";
  activeAlerts: number;
  overallConversionRate: number;

  // Revenue
  totalRevenue: number;
  totalRevenueTrend: number; // % change vs previous period
  bestChannel: AcquisitionChannel | null;
  bestChannelLtv: number;

  // Cost efficiency
  overallRoas: number;
  totalSpend: number;
  totalProfit: number;
  
  // Predictions
  predicted30dRevenue: number;
  predicted90dRevenue: number;

  // Budget
  budgetOptimizationPotential: number; // % improvement possible
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
