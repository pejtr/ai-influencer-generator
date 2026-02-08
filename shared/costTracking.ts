/**
 * Cost Tracking & ROAS/CAC Calculation
 * 
 * Tracks ad spend per channel per period and calculates ROAS, CAC, and profit margins.
 */

import type { AcquisitionChannel } from "./revenueAttribution";

export interface ChannelCost {
  id?: number;
  channel: AcquisitionChannel;
  amount: number; // USD
  period: string; // YYYY-MM format
  description?: string;
  createdAt?: number;
}

export interface ChannelROAS {
  channel: AcquisitionChannel;
  totalSpend: number;
  totalRevenue: number;
  roas: number; // Revenue / Spend ratio
  cac: number; // Cost per acquisition (spend / new customers)
  newCustomers: number;
  profit: number; // Revenue - Spend
  profitMargin: number; // (Revenue - Spend) / Revenue * 100
  roasStatus: "excellent" | "good" | "breakeven" | "negative";
}

export interface CostTrackingData {
  channels: ChannelROAS[];
  totals: {
    totalSpend: number;
    totalRevenue: number;
    totalRoas: number;
    totalCac: number;
    totalNewCustomers: number;
    totalProfit: number;
  };
  monthlyTrend: MonthlyROASTrend[];
}

export interface MonthlyROASTrend {
  month: string; // YYYY-MM
  channel: AcquisitionChannel;
  spend: number;
  revenue: number;
  roas: number;
  newCustomers: number;
}

/**
 * Calculate ROAS (Return on Ad Spend).
 */
export function calculateROAS(revenue: number, spend: number): number {
  if (spend === 0) return revenue > 0 ? Infinity : 0;
  return Math.round((revenue / spend) * 100) / 100;
}

/**
 * Calculate CAC (Customer Acquisition Cost).
 */
export function calculateCAC(spend: number, newCustomers: number): number {
  if (newCustomers === 0) return spend > 0 ? Infinity : 0;
  return Math.round((spend / newCustomers) * 100) / 100;
}

/**
 * Calculate profit margin.
 */
export function calculateProfitMargin(revenue: number, spend: number): number {
  if (revenue === 0) return spend > 0 ? -100 : 0;
  return Math.round(((revenue - spend) / revenue) * 1000) / 10;
}

/**
 * Determine ROAS status.
 */
export function getROASStatus(roas: number): "excellent" | "good" | "breakeven" | "negative" {
  if (roas >= 4) return "excellent";
  if (roas >= 2) return "good";
  if (roas >= 1) return "breakeven";
  return "negative";
}

/**
 * Build channel ROAS metrics from raw data.
 */
export function buildChannelROAS(rawData: {
  channel: AcquisitionChannel;
  totalSpend: number;
  totalRevenue: number;
  newCustomers: number;
}): ChannelROAS {
  const roas = calculateROAS(rawData.totalRevenue, rawData.totalSpend);
  const cac = calculateCAC(rawData.totalSpend, rawData.newCustomers);
  const profit = rawData.totalRevenue - rawData.totalSpend;
  const profitMargin = calculateProfitMargin(rawData.totalRevenue, rawData.totalSpend);

  return {
    channel: rawData.channel,
    totalSpend: rawData.totalSpend,
    totalRevenue: rawData.totalRevenue,
    roas: roas === Infinity ? 999 : roas,
    cac: cac === Infinity ? 999 : cac,
    newCustomers: rawData.newCustomers,
    profit: Math.round(profit * 100) / 100,
    profitMargin,
    roasStatus: getROASStatus(roas === Infinity ? 999 : roas),
  };
}

/**
 * Generate insights from cost tracking data.
 */
export function generateCostInsights(data: CostTrackingData): Array<{
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  channel?: AcquisitionChannel;
}> {
  const insights: Array<{ type: "success" | "warning" | "info"; title: string; message: string; channel?: AcquisitionChannel }> = [];

  if (data.channels.length === 0) {
    insights.push({ type: "info", title: "No Cost Data", message: "Add ad spend data per channel to see ROAS and CAC calculations." });
    return insights;
  }

  // Best ROAS channel
  const channelsWithSpend = data.channels.filter(c => c.totalSpend > 0);
  if (channelsWithSpend.length > 0) {
    const bestRoas = channelsWithSpend.reduce((best, ch) => ch.roas > best.roas ? ch : best, channelsWithSpend[0]);
    insights.push({
      type: bestRoas.roasStatus === "excellent" || bestRoas.roasStatus === "good" ? "success" : "info",
      title: "Best ROAS Channel",
      message: `${bestRoas.channel} has the best ROAS at ${bestRoas.roas}x ($${bestRoas.totalRevenue.toFixed(2)} revenue / $${bestRoas.totalSpend.toFixed(2)} spend).`,
      channel: bestRoas.channel,
    });

    // Worst ROAS channel
    const worstRoas = channelsWithSpend.reduce((worst, ch) => ch.roas < worst.roas ? ch : worst, channelsWithSpend[0]);
    if (worstRoas.roasStatus === "negative") {
      insights.push({
        type: "warning",
        title: "Negative ROAS",
        message: `${worstRoas.channel} has negative ROAS (${worstRoas.roas}x). You're spending $${worstRoas.totalSpend.toFixed(2)} but only earning $${worstRoas.totalRevenue.toFixed(2)}. Consider reducing spend or optimizing this channel.`,
        channel: worstRoas.channel,
      });
    }

    // Lowest CAC
    const channelsWithCustomers = channelsWithSpend.filter(c => c.newCustomers > 0);
    if (channelsWithCustomers.length > 0) {
      const bestCac = channelsWithCustomers.reduce((best, ch) => ch.cac < best.cac ? ch : best, channelsWithCustomers[0]);
      insights.push({
        type: "success",
        title: "Lowest CAC",
        message: `${bestCac.channel} acquires customers for $${bestCac.cac.toFixed(2)} each — the most cost-efficient channel.`,
        channel: bestCac.channel,
      });
    }
  }

  // Overall profitability
  if (data.totals.totalSpend > 0) {
    const overallProfit = data.totals.totalRevenue - data.totals.totalSpend;
    insights.push({
      type: overallProfit > 0 ? "success" : "warning",
      title: "Overall Profitability",
      message: overallProfit > 0
        ? `Total profit: $${overallProfit.toFixed(2)} (${data.totals.totalRoas}x ROAS). Your ad spend is profitable.`
        : `Total loss: $${Math.abs(overallProfit).toFixed(2)}. Overall ROAS is ${data.totals.totalRoas}x. Consider optimizing spend allocation.`,
    });
  }

  return insights;
}
