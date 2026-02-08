/**
 * Funnel Alerts - Automated detection of conversion rate drops
 * Compares current period vs rolling 4-week average and triggers alerts.
 */

export interface FunnelAlert {
  id: string;
  stepId: string;
  stepLabel: string;
  severity: "critical" | "warning" | "info";
  currentRate: number;
  averageRate: number;
  dropPercent: number; // How much it dropped (absolute pp)
  dropRelative: number; // Relative % drop
  message: string;
  createdAt: number; // Unix timestamp ms
  acknowledged: boolean;
}

export interface AlertThreshold {
  /** Minimum relative % drop to trigger warning (default 15%) */
  warningThreshold: number;
  /** Minimum relative % drop to trigger critical (default 30%) */
  criticalThreshold: number;
  /** Minimum sample size to trigger alerts */
  minSampleSize: number;
}

export const DEFAULT_THRESHOLDS: AlertThreshold = {
  warningThreshold: 15,
  criticalThreshold: 30,
  minSampleSize: 20,
};

export interface AlertCheckResult {
  alerts: FunnelAlert[];
  stepsChecked: number;
  periodLabel: string;
}

/**
 * Check funnel steps for conversion rate drops vs historical average.
 */
export function checkFunnelAlerts(
  currentRates: { stepId: string; stepLabel: string; rate: number; count: number }[],
  historicalRates: { stepId: string; avgRate: number; stdDev: number }[],
  thresholds: AlertThreshold = DEFAULT_THRESHOLDS
): FunnelAlert[] {
  const alerts: FunnelAlert[] = [];
  const now = Date.now();

  for (const current of currentRates) {
    if (current.count < thresholds.minSampleSize) continue;

    const historical = historicalRates.find(h => h.stepId === current.stepId);
    if (!historical || historical.avgRate === 0) continue;

    const dropPp = historical.avgRate - current.rate;
    const dropRelative = (dropPp / historical.avgRate) * 100;

    if (dropRelative < thresholds.warningThreshold) continue;

    const severity = dropRelative >= thresholds.criticalThreshold ? "critical" : "warning";

    alerts.push({
      id: `alert-${current.stepId}-${now}`,
      stepId: current.stepId,
      stepLabel: current.stepLabel,
      severity,
      currentRate: Math.round(current.rate * 10) / 10,
      averageRate: Math.round(historical.avgRate * 10) / 10,
      dropPercent: Math.round(dropPp * 10) / 10,
      dropRelative: Math.round(dropRelative * 10) / 10,
      message: buildAlertMessage(current.stepLabel, severity, current.rate, historical.avgRate, dropRelative),
      createdAt: now,
      acknowledged: false,
    });
  }

  return alerts.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}

function buildAlertMessage(
  stepLabel: string,
  severity: "critical" | "warning" | "info",
  currentRate: number,
  avgRate: number,
  dropRelative: number
): string {
  const roundedCurrent = Math.round(currentRate * 10) / 10;
  const roundedAvg = Math.round(avgRate * 10) / 10;
  const roundedDrop = Math.round(dropRelative * 10) / 10;

  if (severity === "critical") {
    return `CRITICAL: "${stepLabel}" conversion dropped ${roundedDrop}% below 4-week average (${roundedCurrent}% vs ${roundedAvg}% avg). Immediate investigation recommended.`;
  }
  return `WARNING: "${stepLabel}" conversion is ${roundedDrop}% below 4-week average (${roundedCurrent}% vs ${roundedAvg}% avg). Monitor closely.`;
}

/**
 * Build alert notification content for owner notification.
 */
export function buildAlertNotification(alerts: FunnelAlert[]): { title: string; content: string } {
  if (alerts.length === 0) {
    return { title: "Funnel Check: All Clear", content: "No significant conversion rate drops detected." };
  }

  const critical = alerts.filter(a => a.severity === "critical");
  const warnings = alerts.filter(a => a.severity === "warning");

  const title = critical.length > 0
    ? `🚨 ${critical.length} Critical Funnel Alert${critical.length > 1 ? "s" : ""}`
    : `⚠️ ${warnings.length} Funnel Warning${warnings.length > 1 ? "s" : ""}`;

  const lines = alerts.map(a => `• [${a.severity.toUpperCase()}] ${a.stepLabel}: ${a.currentRate}% (avg: ${a.averageRate}%, drop: ${a.dropRelative}%)`);

  const content = [
    `Funnel Alert Report - ${new Date().toISOString().split("T")[0]}`,
    "",
    ...lines,
    "",
    critical.length > 0 ? "Action Required: Critical drops detected. Check your funnel immediately." : "Monitor: Conversion rates are below average. Keep an eye on trends.",
  ].join("\n");

  return { title, content };
}

/**
 * Calculate rolling average rates from historical weekly data.
 */
export function calculateHistoricalAverages(
  weeklyData: { stepId: string; rate: number; week: string }[]
): { stepId: string; avgRate: number; stdDev: number }[] {
  const byStep = new Map<string, number[]>();

  for (const d of weeklyData) {
    if (!byStep.has(d.stepId)) byStep.set(d.stepId, []);
    byStep.get(d.stepId)!.push(d.rate);
  }

  const results: { stepId: string; avgRate: number; stdDev: number }[] = [];

  for (const [stepId, rates] of Array.from(byStep)) {
    if (rates.length === 0) {
      results.push({ stepId, avgRate: 0, stdDev: 0 });
      continue;
    }
    const avg = rates.reduce((s: number, r: number) => s + r, 0) / rates.length;
    const variance = rates.reduce((s: number, r: number) => s + Math.pow(r - avg, 2), 0) / rates.length;
    results.push({
      stepId,
      avgRate: Math.round(avg * 100) / 100,
      stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
    });
  }

  return results;
}
