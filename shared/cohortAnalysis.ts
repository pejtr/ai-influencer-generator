/**
 * Cohort Analysis - Types and Utility Functions
 * 
 * Segments users by registration date (weekly or monthly cohorts)
 * and tracks retention, engagement, and revenue over time.
 */

export type CohortPeriod = "weekly" | "monthly";

/** A single cell in the retention matrix */
export interface CohortCell {
  /** Period offset from cohort start (0 = registration period) */
  periodOffset: number;
  /** Number of active users in this cell */
  activeUsers: number;
  /** Retention rate as percentage (0-100) */
  retentionRate: number;
  /** Revenue generated in this period by this cohort */
  revenue: number;
  /** Number of generations in this period by this cohort */
  generations: number;
}

/** A single cohort row (users registered in the same period) */
export interface CohortRow {
  /** Cohort label (e.g., "2026-W05" or "2026-01") */
  label: string;
  /** Start date of the cohort period */
  startDate: string;
  /** End date of the cohort period */
  endDate: string;
  /** Total users in this cohort */
  totalUsers: number;
  /** Retention data for each subsequent period */
  cells: CohortCell[];
}

/** Summary metrics across all cohorts */
export interface CohortSummary {
  /** Total number of cohorts */
  totalCohorts: number;
  /** Total users across all cohorts */
  totalUsers: number;
  /** Average retention at period 1 (first period after registration) */
  avgRetentionPeriod1: number;
  /** Average retention at period 4 */
  avgRetentionPeriod4: number;
  /** Average retention at period 8 */
  avgRetentionPeriod8: number;
  /** Best performing cohort by retention */
  bestCohort: { label: string; avgRetention: number } | null;
  /** Worst performing cohort by retention */
  worstCohort: { label: string; avgRetention: number } | null;
  /** Average revenue per user across all cohorts */
  avgRevenuePerUser: number;
  /** Average LTV (total revenue / total users) */
  avgLTV: number;
  /** Trend direction: improving, declining, or stable */
  retentionTrend: "improving" | "declining" | "stable";
}

/** Full cohort analysis result */
export interface CohortAnalysisResult {
  period: CohortPeriod;
  cohorts: CohortRow[];
  summary: CohortSummary;
  /** Maximum period offset available in the data */
  maxPeriodOffset: number;
}

/**
 * Get color for retention rate (green = high, red = low).
 * Returns OKLCH-compatible hex colors.
 */
export function getRetentionColor(rate: number): string {
  if (rate >= 80) return "#22c55e"; // green-500
  if (rate >= 60) return "#4ade80"; // green-400
  if (rate >= 40) return "#86efac"; // green-300
  if (rate >= 25) return "#fbbf24"; // amber-400
  if (rate >= 15) return "#f97316"; // orange-500
  if (rate >= 5) return "#ef4444";  // red-500
  if (rate > 0) return "#991b1b";   // red-800
  return "#1f2937"; // gray-800 (no data / 0%)
}

/**
 * Get text color for retention cell (ensure readability).
 */
export function getRetentionTextColor(rate: number): string {
  if (rate >= 40) return "#000000";
  return "#ffffff";
}

/**
 * Calculate cohort summary from cohort rows.
 */
export function calculateCohortSummary(cohorts: CohortRow[]): CohortSummary {
  if (cohorts.length === 0) {
    return {
      totalCohorts: 0,
      totalUsers: 0,
      avgRetentionPeriod1: 0,
      avgRetentionPeriod4: 0,
      avgRetentionPeriod8: 0,
      bestCohort: null,
      worstCohort: null,
      avgRevenuePerUser: 0,
      avgLTV: 0,
      retentionTrend: "stable",
    };
  }

  const totalUsers = cohorts.reduce((s, c) => s + c.totalUsers, 0);

  // Average retention at specific periods
  const getAvgRetention = (offset: number): number => {
    const cohortsWithData = cohorts.filter(c => c.cells.some(cell => cell.periodOffset === offset));
    if (cohortsWithData.length === 0) return 0;
    const sum = cohortsWithData.reduce((s, c) => {
      const cell = c.cells.find(cell => cell.periodOffset === offset);
      return s + (cell?.retentionRate ?? 0);
    }, 0);
    return sum / cohortsWithData.length;
  };

  // Calculate average retention per cohort for best/worst
  const cohortAvgRetentions = cohorts.map(c => {
    const retentionCells = c.cells.filter(cell => cell.periodOffset > 0);
    const avg = retentionCells.length > 0
      ? retentionCells.reduce((s, cell) => s + cell.retentionRate, 0) / retentionCells.length
      : 0;
    return { label: c.label, avgRetention: avg };
  }).filter(c => c.avgRetention > 0);

  const bestCohort = cohortAvgRetentions.length > 0
    ? cohortAvgRetentions.reduce((best, c) => c.avgRetention > best.avgRetention ? c : best)
    : null;

  const worstCohort = cohortAvgRetentions.length > 0
    ? cohortAvgRetentions.reduce((worst, c) => c.avgRetention < worst.avgRetention ? c : worst)
    : null;

  // Revenue metrics
  const totalRevenue = cohorts.reduce((s, c) =>
    s + c.cells.reduce((cs, cell) => cs + cell.revenue, 0), 0);
  const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

  // Retention trend: compare first half vs second half of cohorts
  const midpoint = Math.floor(cohortAvgRetentions.length / 2);
  let retentionTrend: "improving" | "declining" | "stable" = "stable";
  if (cohortAvgRetentions.length >= 4) {
    const firstHalf = cohortAvgRetentions.slice(0, midpoint);
    const secondHalf = cohortAvgRetentions.slice(midpoint);
    const firstAvg = firstHalf.reduce((s, c) => s + c.avgRetention, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, c) => s + c.avgRetention, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (diff > 3) retentionTrend = "improving";
    else if (diff < -3) retentionTrend = "declining";
  }

  return {
    totalCohorts: cohorts.length,
    totalUsers,
    avgRetentionPeriod1: getAvgRetention(1),
    avgRetentionPeriod4: getAvgRetention(4),
    avgRetentionPeriod8: getAvgRetention(8),
    bestCohort,
    worstCohort,
    avgRevenuePerUser,
    avgLTV: avgRevenuePerUser, // Simplified LTV = revenue per user
    retentionTrend,
  };
}

/**
 * Format a period offset as a human-readable label.
 */
export function formatPeriodLabel(offset: number, period: CohortPeriod): string {
  if (offset === 0) return period === "weekly" ? "W0" : "M0";
  return period === "weekly" ? `W${offset}` : `M${offset}`;
}

/**
 * Get the ISO week number for a date.
 */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get the cohort label for a given date.
 */
export function getCohortLabel(date: Date, period: CohortPeriod): string {
  const year = date.getFullYear();
  if (period === "weekly") {
    const week = getISOWeek(date);
    return `${year}-W${String(week).padStart(2, "0")}`;
  }
  const month = date.getMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Calculate the period offset between two dates.
 */
export function getPeriodOffset(registrationDate: Date, activityDate: Date, period: CohortPeriod): number {
  if (period === "weekly") {
    const diffMs = activityDate.getTime() - registrationDate.getTime();
    return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  }
  // Monthly
  const regYear = registrationDate.getFullYear();
  const regMonth = registrationDate.getMonth();
  const actYear = activityDate.getFullYear();
  const actMonth = activityDate.getMonth();
  return (actYear - regYear) * 12 + (actMonth - regMonth);
}

/**
 * Process raw user activity data into cohort rows.
 * This is the main processing function used by both server and tests.
 */
export function buildCohortRows(
  users: { id: number; createdAt: Date }[],
  activities: { userId: number; date: Date; revenue: number; generations: number }[],
  period: CohortPeriod,
  maxPeriods: number = 12
): CohortRow[] {
  // Group users by cohort
  const cohortMap = new Map<string, { users: typeof users; startDate: Date; endDate: Date }>();

  for (const user of users) {
    const label = getCohortLabel(user.createdAt, period);
    if (!cohortMap.has(label)) {
      const start = new Date(user.createdAt);
      if (period === "weekly") {
        const day = start.getDay();
        start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // Monday
      } else {
        start.setDate(1);
      }
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      if (period === "weekly") {
        end.setDate(end.getDate() + 6);
      } else {
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
      }
      end.setHours(23, 59, 59, 999);

      cohortMap.set(label, { users: [], startDate: start, endDate: end });
    }
    cohortMap.get(label)!.users.push(user);
  }

  // Build activity lookup: userId -> activities
  const activityByUser = new Map<number, typeof activities>();
  for (const act of activities) {
    if (!activityByUser.has(act.userId)) {
      activityByUser.set(act.userId, []);
    }
    activityByUser.get(act.userId)!.push(act);
  }

  // Build cohort rows
  const rows: CohortRow[] = [];

  for (const [label, cohort] of Array.from(cohortMap.entries())) {
    const totalUsers = cohort.users.length;
    if (totalUsers === 0) continue;

    const cells: CohortCell[] = [];

    for (let offset = 0; offset <= maxPeriods; offset++) {
      let activeUsers = 0;
      let totalRevenue = 0;
      let totalGenerations = 0;

      for (const user of cohort.users) {
        const userActivities = activityByUser.get(user.id) || [];
        const periodActivities = userActivities.filter(act => {
          const actOffset = getPeriodOffset(user.createdAt, act.date, period);
          return actOffset === offset;
        });

        if (periodActivities.length > 0) {
          activeUsers++;
          totalRevenue += periodActivities.reduce((s, a) => s + a.revenue, 0);
          totalGenerations += periodActivities.reduce((s, a) => s + a.generations, 0);
        }
      }

      cells.push({
        periodOffset: offset,
        activeUsers,
        retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        revenue: totalRevenue,
        generations: totalGenerations,
      });
    }

    rows.push({
      label,
      startDate: cohort.startDate.toISOString().split("T")[0],
      endDate: cohort.endDate.toISOString().split("T")[0],
      totalUsers,
      cells,
    });
  }

  // Sort by label (chronological)
  return rows.sort((a, b) => a.label.localeCompare(b.label));
}
