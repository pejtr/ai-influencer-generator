// Revenue Attribution & LTV per Acquisition Channel

export type AcquisitionChannel = "organic" | "paid" | "affiliate" | "direct" | "social";

export const CHANNEL_CONFIG: Record<AcquisitionChannel, { label: string; color: string; icon: string; description: string }> = {
  organic: { label: "Organic", color: "#22c55e", icon: "🌿", description: "Search engines, direct URL, bookmarks" },
  paid: { label: "Paid Ads", color: "#f59e0b", icon: "📢", description: "Google Ads, Meta Ads, display campaigns" },
  affiliate: { label: "Affiliate", color: "#8b5cf6", icon: "🤝", description: "Affiliate referrals, partner links" },
  direct: { label: "Direct", color: "#3b82f6", icon: "🔗", description: "Direct visits, unknown source" },
  social: { label: "Social", color: "#ec4899", icon: "📱", description: "Social media, influencer posts" },
};

export const ALL_CHANNELS: AcquisitionChannel[] = ["organic", "paid", "affiliate", "direct", "social"];

export interface ChannelMetrics {
  channel: AcquisitionChannel;
  totalUsers: number;
  paidUsers: number;
  conversionRate: number; // % of users who paid
  totalRevenue: number; // Total revenue from this channel
  avgRevenuePerUser: number; // ARPU
  ltv: number; // Lifetime value per user
  ltvPaid: number; // LTV per paying user
  subscriptionRevenue: number;
  creditPackRevenue: number;
  avgOrderValue: number; // Average order value
  paybackPeriodDays: number | null; // Estimated payback period (null if no cost data)
  firstPurchaseDays: number; // Avg days from signup to first purchase
  retentionRate30d: number; // 30-day retention rate %
}

export interface RevenueAttributionData {
  channels: ChannelMetrics[];
  totals: {
    totalUsers: number;
    totalPaidUsers: number;
    totalRevenue: number;
    overallLtv: number;
    overallConversionRate: number;
  };
  topChannel: AcquisitionChannel | null;
  worstChannel: AcquisitionChannel | null;
  ltvTrend: LtvTrendPoint[];
}

export interface LtvTrendPoint {
  date: string; // YYYY-MM-DD
  channel: AcquisitionChannel;
  cumulativeLtv: number;
  userCount: number;
}

export interface ChannelComparison {
  metric: string;
  values: Record<AcquisitionChannel, number | string>;
  best: AcquisitionChannel;
  unit: string;
}

// Calculate LTV from raw data
export function calculateLTV(totalRevenue: number, totalUsers: number): number {
  if (totalUsers === 0) return 0;
  return Math.round((totalRevenue / totalUsers) * 100) / 100;
}

// Calculate LTV per paying user
export function calculateLTVPaid(totalRevenue: number, paidUsers: number): number {
  if (paidUsers === 0) return 0;
  return Math.round((totalRevenue / paidUsers) * 100) / 100;
}

// Calculate conversion rate
export function calculateConversionRate(paidUsers: number, totalUsers: number): number {
  if (totalUsers === 0) return 0;
  return Math.round((paidUsers / totalUsers) * 1000) / 10;
}

// Calculate average order value
export function calculateAOV(totalRevenue: number, totalOrders: number): number {
  if (totalOrders === 0) return 0;
  return Math.round((totalRevenue / totalOrders) * 100) / 100;
}

// Determine acquisition channel from UTM parameters
export function determineChannel(utmSource?: string | null, utmMedium?: string | null, referredBy?: string | null): AcquisitionChannel {
  if (referredBy) return "affiliate";

  const source = (utmSource || "").toLowerCase();
  const medium = (utmMedium || "").toLowerCase();

  // Paid channels
  if (medium === "cpc" || medium === "ppc" || medium === "paid" || medium === "display" || medium === "cpm") {
    return "paid";
  }

  // Social channels
  if (source.includes("facebook") || source.includes("instagram") || source.includes("twitter") ||
      source.includes("tiktok") || source.includes("linkedin") || source.includes("youtube") ||
      medium === "social") {
    return "social";
  }

  // Organic search
  if (source.includes("google") || source.includes("bing") || source.includes("yahoo") ||
      source.includes("duckduckgo") || medium === "organic") {
    return "organic";
  }

  // If there's any UTM source, it's likely a campaign
  if (source && source !== "direct") {
    return "social"; // Default non-paid campaign to social
  }

  return "direct";
}

// Build channel metrics from raw query data
export function buildChannelMetrics(rawData: {
  channel: AcquisitionChannel;
  totalUsers: number;
  paidUsers: number;
  subscriptionRevenue: number;
  creditPackRevenue: number;
  totalOrders: number;
  avgDaysToFirstPurchase: number;
  activeUsersLast30d: number;
}): ChannelMetrics {
  const totalRevenue = rawData.subscriptionRevenue + rawData.creditPackRevenue;
  const retentionRate30d = rawData.totalUsers > 0
    ? Math.round((rawData.activeUsersLast30d / rawData.totalUsers) * 1000) / 10
    : 0;

  return {
    channel: rawData.channel,
    totalUsers: rawData.totalUsers,
    paidUsers: rawData.paidUsers,
    conversionRate: calculateConversionRate(rawData.paidUsers, rawData.totalUsers),
    totalRevenue,
    avgRevenuePerUser: calculateLTV(totalRevenue, rawData.totalUsers),
    ltv: calculateLTV(totalRevenue, rawData.totalUsers),
    ltvPaid: calculateLTVPaid(totalRevenue, rawData.paidUsers),
    subscriptionRevenue: rawData.subscriptionRevenue,
    creditPackRevenue: rawData.creditPackRevenue,
    avgOrderValue: calculateAOV(totalRevenue, rawData.totalOrders),
    paybackPeriodDays: null, // Requires cost data input
    firstPurchaseDays: rawData.avgDaysToFirstPurchase,
    retentionRate30d,
  };
}

// Generate insights from channel metrics
export function generateRevenueInsights(data: RevenueAttributionData): Array<{
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  channel?: AcquisitionChannel;
}> {
  const insights: Array<{ type: "success" | "warning" | "info"; title: string; message: string; channel?: AcquisitionChannel }> = [];

  if (data.channels.length === 0) {
    insights.push({ type: "info", title: "No Data", message: "No acquisition data available yet. Users will be tracked as they sign up." });
    return insights;
  }

  // Find best LTV channel
  const bestLtv = data.channels.reduce((best, ch) => ch.ltv > best.ltv ? ch : best, data.channels[0]);
  if (bestLtv.ltv > 0) {
    insights.push({
      type: "success",
      title: "Highest LTV Channel",
      message: `${CHANNEL_CONFIG[bestLtv.channel].label} users have the highest LTV at $${bestLtv.ltv.toFixed(2)} per user.`,
      channel: bestLtv.channel,
    });
  }

  // Find best conversion rate
  const bestConversion = data.channels.filter(c => c.totalUsers >= 5).reduce((best, ch) =>
    ch.conversionRate > best.conversionRate ? ch : best, data.channels[0]);
  if (bestConversion.conversionRate > 0 && bestConversion.totalUsers >= 5) {
    insights.push({
      type: "success",
      title: "Best Converting Channel",
      message: `${CHANNEL_CONFIG[bestConversion.channel].label} converts at ${bestConversion.conversionRate}% — ${bestConversion.paidUsers} of ${bestConversion.totalUsers} users paid.`,
      channel: bestConversion.channel,
    });
  }

  // Warn about low conversion channels with significant traffic
  data.channels.forEach(ch => {
    if (ch.totalUsers >= 10 && ch.conversionRate < 2) {
      insights.push({
        type: "warning",
        title: "Low Conversion Channel",
        message: `${CHANNEL_CONFIG[ch.channel].label} has ${ch.totalUsers} users but only ${ch.conversionRate}% conversion. Consider improving onboarding for this channel.`,
        channel: ch.channel,
      });
    }
  });

  // Retention insight
  const bestRetention = data.channels.filter(c => c.totalUsers >= 5).reduce((best, ch) =>
    ch.retentionRate30d > best.retentionRate30d ? ch : best, data.channels[0]);
  if (bestRetention.retentionRate30d > 0 && bestRetention.totalUsers >= 5) {
    insights.push({
      type: "info",
      title: "Best Retention",
      message: `${CHANNEL_CONFIG[bestRetention.channel].label} has ${bestRetention.retentionRate30d}% 30-day retention — these users are most engaged.`,
      channel: bestRetention.channel,
    });
  }

  // Overall conversion
  if (data.totals.totalUsers > 0) {
    insights.push({
      type: "info",
      title: "Overall Performance",
      message: `${data.totals.totalPaidUsers} of ${data.totals.totalUsers} users (${data.totals.overallConversionRate}%) have made a purchase. Total revenue: $${data.totals.totalRevenue.toFixed(2)}.`,
    });
  }

  return insights;
}

// Build comparison table data
export function buildChannelComparison(channels: ChannelMetrics[]): ChannelComparison[] {
  if (channels.length === 0) return [];

  const metrics: ChannelComparison[] = [];

  const addMetric = (metric: string, getter: (c: ChannelMetrics) => number, unit: string, higherIsBetter = true) => {
    const values: Record<string, number | string> = {};
    let bestChannel: AcquisitionChannel = channels[0].channel;
    let bestValue = higherIsBetter ? -Infinity : Infinity;

    channels.forEach(ch => {
      const val = getter(ch);
      values[ch.channel] = unit === "$" ? `$${val.toFixed(2)}` : unit === "days" ? val.toFixed(1) : `${val}${unit === "%" ? "%" : ""}`;
      if ((higherIsBetter && val > bestValue) || (!higherIsBetter && val < bestValue)) {
        bestValue = val;
        bestChannel = ch.channel;
      }
    });

    metrics.push({ metric, values: values as Record<AcquisitionChannel, number | string>, best: bestChannel, unit });
  };

  addMetric("Total Users", c => c.totalUsers, "#");
  addMetric("Paid Users", c => c.paidUsers, "#");
  addMetric("Conversion Rate", c => c.conversionRate, "%");
  addMetric("LTV (per user)", c => c.ltv, "$");
  addMetric("LTV (per paying user)", c => c.ltvPaid, "$");
  addMetric("Total Revenue", c => c.totalRevenue, "$");
  addMetric("Avg Order Value", c => c.avgOrderValue, "$");
  addMetric("30d Retention", c => c.retentionRate30d, "%");
  addMetric("Days to 1st Purchase", c => c.firstPurchaseDays, "days", false);

  return metrics;
}
