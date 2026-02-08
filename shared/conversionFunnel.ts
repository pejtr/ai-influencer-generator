/**
 * Conversion Funnel Analysis
 * 
 * Tracks the user journey: Visit → Signup → First Generation → Paid Conversion
 * with drop-off rates, period comparison, and actionable insights.
 */

export interface FunnelStep {
  /** Step identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Short description */
  description: string;
  /** Number of users/events at this step */
  count: number;
  /** Conversion rate from previous step (0-100). 100 for first step. */
  conversionRate: number;
  /** Drop-off rate from previous step (0-100). 0 for first step. */
  dropOffRate: number;
  /** Absolute rate from first step (0-100). 100 for first step. */
  absoluteRate: number;
  /** Color for visualization */
  color: string;
}

export interface FunnelComparison {
  /** Current period funnel */
  current: FunnelStep[];
  /** Previous period funnel (same duration, earlier) */
  previous: FunnelStep[];
  /** Change in conversion rate per step (current - previous) */
  changes: { stepId: string; change: number }[];
}

export interface FunnelInsight {
  type: "warning" | "success" | "info";
  title: string;
  message: string;
  stepId?: string;
}

export interface FunnelAnalysisResult {
  funnel: FunnelStep[];
  comparison: FunnelComparison | null;
  insights: FunnelInsight[];
  periodLabel: string;
  totalVisits: number;
  totalConversions: number;
  overallConversionRate: number;
}

/** Raw counts from the database for building the funnel */
export interface FunnelRawData {
  visits: number;        // page_view or session_start events
  signups: number;       // user registrations in the period
  generations: number;   // unique users who generated at least 1 image
  paidUsers: number;     // unique users who made a purchase (credit pack or subscription)
}

/** Step definitions for the conversion funnel */
export const FUNNEL_STEPS = [
  { id: "visits", label: "Visits", description: "Unique sessions on the platform", color: "#6366f1" },
  { id: "signups", label: "Sign Ups", description: "Users who created an account", color: "#8b5cf6" },
  { id: "generations", label: "First Generation", description: "Users who generated at least 1 image", color: "#a855f7" },
  { id: "paid", label: "Paid Conversion", description: "Users who made a purchase", color: "#22c55e" },
] as const;

/**
 * Build funnel steps from raw data.
 */
export function buildFunnelSteps(data: FunnelRawData): FunnelStep[] {
  const counts = [data.visits, data.signups, data.generations, data.paidUsers];

  return FUNNEL_STEPS.map((step, i) => {
    const count = counts[i];
    const prevCount = i === 0 ? count : counts[i - 1];
    const firstCount = counts[0];

    const conversionRate = i === 0 ? 100 : (prevCount > 0 ? (count / prevCount) * 100 : 0);
    const dropOffRate = i === 0 ? 0 : (100 - conversionRate);
    const absoluteRate = firstCount > 0 ? (count / firstCount) * 100 : 0;

    return {
      id: step.id,
      label: step.label,
      description: step.description,
      count,
      conversionRate: Math.round(conversionRate * 10) / 10,
      dropOffRate: Math.round(dropOffRate * 10) / 10,
      absoluteRate: Math.round(absoluteRate * 10) / 10,
      color: step.color,
    };
  });
}

/**
 * Compare two funnel periods and calculate changes.
 */
export function compareFunnels(current: FunnelStep[], previous: FunnelStep[]): FunnelComparison {
  const changes = FUNNEL_STEPS.map(step => {
    const curr = current.find(s => s.id === step.id);
    const prev = previous.find(s => s.id === step.id);
    return {
      stepId: step.id,
      change: (curr?.conversionRate ?? 0) - (prev?.conversionRate ?? 0),
    };
  });

  return { current, previous, changes };
}

/**
 * Generate actionable insights from funnel data.
 */
export function generateFunnelInsights(
  funnel: FunnelStep[],
  comparison: FunnelComparison | null
): FunnelInsight[] {
  const insights: FunnelInsight[] = [];

  const signupStep = funnel.find(s => s.id === "signups");
  const genStep = funnel.find(s => s.id === "generations");
  const paidStep = funnel.find(s => s.id === "paid");

  // Visit → Signup conversion
  if (signupStep && signupStep.conversionRate < 10) {
    insights.push({
      type: "warning",
      title: "Low Signup Rate",
      message: `Only ${signupStep.conversionRate}% of visitors sign up. Consider improving your landing page CTA, adding social proof, or simplifying the registration flow.`,
      stepId: "signups",
    });
  } else if (signupStep && signupStep.conversionRate >= 25) {
    insights.push({
      type: "success",
      title: "Strong Signup Rate",
      message: `${signupStep.conversionRate}% of visitors sign up — well above typical SaaS benchmarks (5-15%).`,
      stepId: "signups",
    });
  }

  // Signup → Generation activation
  if (genStep && genStep.conversionRate < 30) {
    insights.push({
      type: "warning",
      title: "Low Activation Rate",
      message: `Only ${genStep.conversionRate}% of signups generate their first image. Improve onboarding with guided tutorials, pre-built templates, or a first-generation wizard.`,
      stepId: "generations",
    });
  } else if (genStep && genStep.conversionRate >= 60) {
    insights.push({
      type: "success",
      title: "Excellent Activation",
      message: `${genStep.conversionRate}% of signups generate their first image. Your onboarding is effective.`,
      stepId: "generations",
    });
  }

  // Generation → Paid conversion
  if (paidStep && paidStep.conversionRate < 5) {
    insights.push({
      type: "warning",
      title: "Low Monetization",
      message: `Only ${paidStep.conversionRate}% of active users convert to paid. Consider adding usage limits, premium features, or time-limited offers to drive conversions.`,
      stepId: "paid",
    });
  } else if (paidStep && paidStep.conversionRate >= 15) {
    insights.push({
      type: "success",
      title: "Strong Monetization",
      message: `${paidStep.conversionRate}% of active users convert to paid — excellent for a freemium model.`,
      stepId: "paid",
    });
  }

  // Biggest drop-off point
  const dropSteps = funnel.filter(s => s.id !== "visits").sort((a, b) => b.dropOffRate - a.dropOffRate);
  if (dropSteps.length > 0 && dropSteps[0].dropOffRate > 50) {
    const worst = dropSteps[0];
    insights.push({
      type: "info",
      title: "Biggest Drop-off",
      message: `The largest drop-off (${worst.dropOffRate}%) occurs at "${worst.label}". This is your highest-leverage optimization point.`,
      stepId: worst.id,
    });
  }

  // Overall funnel rate
  const overallRate = funnel.length > 0 ? funnel[funnel.length - 1].absoluteRate : 0;
  if (overallRate > 0) {
    insights.push({
      type: "info",
      title: "Overall Conversion",
      message: `${overallRate}% of visitors ultimately become paying customers. Industry average for SaaS is 2-5%.`,
    });
  }

  // Period comparison insights
  if (comparison) {
    const improving = comparison.changes.filter(c => c.change > 3);
    const declining = comparison.changes.filter(c => c.change < -3);

    if (improving.length > 0) {
      const best = improving.sort((a, b) => b.change - a.change)[0];
      const stepLabel = FUNNEL_STEPS.find(s => s.id === best.stepId)?.label ?? best.stepId;
      insights.push({
        type: "success",
        title: "Improving Step",
        message: `"${stepLabel}" conversion improved by +${best.change.toFixed(1)}pp vs previous period.`,
        stepId: best.stepId,
      });
    }

    if (declining.length > 0) {
      const worst = declining.sort((a, b) => a.change - b.change)[0];
      const stepLabel = FUNNEL_STEPS.find(s => s.id === worst.stepId)?.label ?? worst.stepId;
      insights.push({
        type: "warning",
        title: "Declining Step",
        message: `"${stepLabel}" conversion dropped by ${worst.change.toFixed(1)}pp vs previous period. Investigate recent changes.`,
        stepId: worst.stepId,
      });
    }
  }

  return insights;
}

/**
 * Get period boundaries for a given number of days.
 */
export function getPeriodBoundaries(days: number): {
  current: { start: Date; end: Date };
  previous: { start: Date; end: Date };
} {
  const now = new Date();
  const currentEnd = new Date(now);
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);

  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days);

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd },
  };
}
