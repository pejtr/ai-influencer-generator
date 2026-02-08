/**
 * Attribution Models - First-touch, Last-touch, Multi-touch (Linear, Time-decay)
 * 
 * Compares how different attribution models assign revenue credit to channels.
 */

import type { AcquisitionChannel } from "./revenueAttribution";

export type AttributionModel = "first_touch" | "last_touch" | "linear" | "time_decay";

export const ATTRIBUTION_MODELS: Record<AttributionModel, { label: string; description: string; icon: string }> = {
  first_touch: {
    label: "First Touch",
    description: "100% credit to the first channel the user interacted with",
    icon: "🎯",
  },
  last_touch: {
    label: "Last Touch",
    description: "100% credit to the last channel before conversion",
    icon: "🏁",
  },
  linear: {
    label: "Linear",
    description: "Equal credit distributed across all touchpoints",
    icon: "📊",
  },
  time_decay: {
    label: "Time Decay",
    description: "More credit to touchpoints closer to conversion (half-life: 7 days)",
    icon: "⏳",
  },
};

export const ALL_MODELS: AttributionModel[] = ["first_touch", "last_touch", "linear", "time_decay"];

export interface Touchpoint {
  channel: AcquisitionChannel;
  timestamp: number; // Unix ms
  eventType: string; // e.g., "page_view", "signup", "generation", "purchase"
}

export interface AttributionResult {
  model: AttributionModel;
  channelCredits: Record<AcquisitionChannel, number>; // Revenue attributed to each channel
  channelConversions: Record<AcquisitionChannel, number>; // Fractional conversions per channel
  totalRevenue: number;
  totalConversions: number;
}

export interface ModelComparison {
  channel: AcquisitionChannel;
  firstTouch: number;
  lastTouch: number;
  linear: number;
  timeDecay: number;
}

/**
 * Apply first-touch attribution: 100% credit to first touchpoint channel.
 */
export function firstTouchAttribution(
  userJourneys: { touchpoints: Touchpoint[]; revenue: number }[]
): AttributionResult {
  const credits = initCredits();
  const conversions = initCredits();
  let totalRevenue = 0;
  let totalConversions = 0;

  for (const journey of userJourneys) {
    if (journey.touchpoints.length === 0) continue;
    const sorted = [...journey.touchpoints].sort((a, b) => a.timestamp - b.timestamp);
    const firstChannel = sorted[0].channel;
    credits[firstChannel] += journey.revenue;
    conversions[firstChannel] += 1;
    totalRevenue += journey.revenue;
    totalConversions += 1;
  }

  return { model: "first_touch", channelCredits: credits, channelConversions: conversions, totalRevenue, totalConversions };
}

/**
 * Apply last-touch attribution: 100% credit to last touchpoint channel.
 */
export function lastTouchAttribution(
  userJourneys: { touchpoints: Touchpoint[]; revenue: number }[]
): AttributionResult {
  const credits = initCredits();
  const conversions = initCredits();
  let totalRevenue = 0;
  let totalConversions = 0;

  for (const journey of userJourneys) {
    if (journey.touchpoints.length === 0) continue;
    const sorted = [...journey.touchpoints].sort((a, b) => a.timestamp - b.timestamp);
    const lastChannel = sorted[sorted.length - 1].channel;
    credits[lastChannel] += journey.revenue;
    conversions[lastChannel] += 1;
    totalRevenue += journey.revenue;
    totalConversions += 1;
  }

  return { model: "last_touch", channelCredits: credits, channelConversions: conversions, totalRevenue, totalConversions };
}

/**
 * Apply linear attribution: equal credit across all unique touchpoint channels.
 */
export function linearAttribution(
  userJourneys: { touchpoints: Touchpoint[]; revenue: number }[]
): AttributionResult {
  const credits = initCredits();
  const conversions = initCredits();
  let totalRevenue = 0;
  let totalConversions = 0;

  for (const journey of userJourneys) {
    if (journey.touchpoints.length === 0) continue;
    const uniqueChannels = Array.from(new Set(journey.touchpoints.map(t => t.channel)));
    const share = 1 / uniqueChannels.length;
    const revenueShare = journey.revenue / uniqueChannels.length;

    for (const ch of uniqueChannels) {
      credits[ch] += revenueShare;
      conversions[ch] += share;
    }
    totalRevenue += journey.revenue;
    totalConversions += 1;
  }

  return { model: "linear", channelCredits: roundCredits(credits), channelConversions: roundCredits(conversions), totalRevenue, totalConversions };
}

/**
 * Apply time-decay attribution: exponential decay with 7-day half-life.
 * More recent touchpoints get more credit.
 */
export function timeDecayAttribution(
  userJourneys: { touchpoints: Touchpoint[]; revenue: number }[],
  halfLifeDays: number = 7
): AttributionResult {
  const credits = initCredits();
  const conversions = initCredits();
  let totalRevenue = 0;
  let totalConversions = 0;
  const lambda = Math.LN2 / (halfLifeDays * 24 * 60 * 60 * 1000); // decay constant in ms

  for (const journey of userJourneys) {
    if (journey.touchpoints.length === 0) continue;
    const sorted = [...journey.touchpoints].sort((a, b) => a.timestamp - b.timestamp);
    const conversionTime = sorted[sorted.length - 1].timestamp;

    // Calculate weights based on time decay
    const weights: { channel: AcquisitionChannel; weight: number }[] = [];
    let totalWeight = 0;

    for (const tp of sorted) {
      const timeDiff = conversionTime - tp.timestamp;
      const weight = Math.exp(-lambda * timeDiff);
      weights.push({ channel: tp.channel, weight });
      totalWeight += weight;
    }

    if (totalWeight === 0) continue;

    // Distribute credit proportionally
    for (const w of weights) {
      const share = w.weight / totalWeight;
      credits[w.channel] += journey.revenue * share;
      conversions[w.channel] += share;
    }
    totalRevenue += journey.revenue;
    totalConversions += 1;
  }

  return { model: "time_decay", channelCredits: roundCredits(credits), channelConversions: roundCredits(conversions), totalRevenue, totalConversions };
}

/**
 * Run all attribution models and return comparison.
 */
export function compareAttributionModels(
  userJourneys: { touchpoints: Touchpoint[]; revenue: number }[]
): AttributionResult[] {
  return [
    firstTouchAttribution(userJourneys),
    lastTouchAttribution(userJourneys),
    linearAttribution(userJourneys),
    timeDecayAttribution(userJourneys),
  ];
}

/**
 * Build a side-by-side comparison table of revenue per channel across models.
 */
export function buildModelComparisonTable(results: AttributionResult[]): ModelComparison[] {
  const channels: AcquisitionChannel[] = ["organic", "paid", "affiliate", "direct", "social"];
  const ft = results.find(r => r.model === "first_touch");
  const lt = results.find(r => r.model === "last_touch");
  const lin = results.find(r => r.model === "linear");
  const td = results.find(r => r.model === "time_decay");

  return channels.map(ch => ({
    channel: ch,
    firstTouch: round2(ft?.channelCredits[ch] ?? 0),
    lastTouch: round2(lt?.channelCredits[ch] ?? 0),
    linear: round2(lin?.channelCredits[ch] ?? 0),
    timeDecay: round2(td?.channelCredits[ch] ?? 0),
  }));
}

/**
 * Generate insights from attribution model comparison.
 */
export function generateAttributionInsights(results: AttributionResult[]): Array<{
  type: "success" | "warning" | "info";
  title: string;
  message: string;
}> {
  const insights: Array<{ type: "success" | "warning" | "info"; title: string; message: string }> = [];

  if (results.length === 0) {
    insights.push({ type: "info", title: "No Data", message: "No user journey data available for attribution analysis." });
    return insights;
  }

  const ft = results.find(r => r.model === "first_touch");
  const lt = results.find(r => r.model === "last_touch");

  if (ft && lt) {
    // Find channels where first-touch and last-touch disagree most
    const channels: AcquisitionChannel[] = ["organic", "paid", "affiliate", "direct", "social"];
    let maxDiff = 0;
    let diffChannel: AcquisitionChannel = "direct";

    for (const ch of channels) {
      const diff = Math.abs((ft.channelCredits[ch] || 0) - (lt.channelCredits[ch] || 0));
      if (diff > maxDiff) {
        maxDiff = diff;
        diffChannel = ch;
      }
    }

    if (maxDiff > 0) {
      const ftVal = round2(ft.channelCredits[diffChannel] || 0);
      const ltVal = round2(lt.channelCredits[diffChannel] || 0);
      insights.push({
        type: "info",
        title: "Biggest Model Disagreement",
        message: `"${diffChannel}" shows the largest difference: $${ftVal} (first-touch) vs $${ltVal} (last-touch). This channel plays different roles in the customer journey.`,
      });
    }

    // Find the channel that introduces users (high first-touch, low last-touch)
    for (const ch of channels) {
      const ftCredit = ft.channelCredits[ch] || 0;
      const ltCredit = lt.channelCredits[ch] || 0;
      if (ftCredit > 0 && ltCredit > 0 && ftCredit > ltCredit * 1.5) {
        insights.push({
          type: "success",
          title: "Awareness Driver",
          message: `"${ch}" is primarily an awareness channel — it introduces users who later convert through other channels. First-touch: $${round2(ftCredit)}, Last-touch: $${round2(ltCredit)}.`,
        });
        break;
      }
    }

    // Find the channel that closes (high last-touch, low first-touch)
    for (const ch of channels) {
      const ftCredit = ft.channelCredits[ch] || 0;
      const ltCredit = lt.channelCredits[ch] || 0;
      if (ltCredit > 0 && ftCredit > 0 && ltCredit > ftCredit * 1.5) {
        insights.push({
          type: "success",
          title: "Conversion Closer",
          message: `"${ch}" is primarily a closing channel — it converts users who were introduced elsewhere. Last-touch: $${round2(ltCredit)}, First-touch: $${round2(ftCredit)}.`,
        });
        break;
      }
    }
  }

  return insights;
}

// Helpers
function initCredits(): Record<AcquisitionChannel, number> {
  return { organic: 0, paid: 0, affiliate: 0, direct: 0, social: 0 };
}

function roundCredits(credits: Record<AcquisitionChannel, number>): Record<AcquisitionChannel, number> {
  const result = { ...credits };
  for (const key of Object.keys(result) as AcquisitionChannel[]) {
    result[key] = Math.round(result[key] * 100) / 100;
  }
  return result;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
