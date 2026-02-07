/**
 * Scroll depth heatmap types and utilities.
 * Visualizes where users stop scrolling (drop-off zones).
 */

export interface ScrollDepthZone {
  /** Depth percentage (0-100) */
  depth: number;
  /** Number of sessions that reached this depth */
  sessions: number;
  /** Percentage of total sessions */
  percentage: number;
}

export interface ScrollDepthData {
  /** Page URL */
  page: string;
  /** Total sessions for this page */
  totalSessions: number;
  /** Depth zones (every 10% increment) */
  zones: ScrollDepthZone[];
  /** Average scroll depth percentage */
  avgDepth: number;
  /** Median scroll depth percentage */
  medianDepth: number;
  /** "Fold line" - depth where 50% of users drop off */
  foldLine: number;
}

/**
 * Process raw scroll depth events into structured zone data.
 */
export function processScrollDepthData(
  events: { depth: number; page: string; sessionId?: string }[]
): ScrollDepthData[] {
  // Group by page
  const pageMap = new Map<string, Map<string, number>>();

  for (const event of events) {
    if (!pageMap.has(event.page)) {
      pageMap.set(event.page, new Map());
    }
    const sessions = pageMap.get(event.page)!;
    const sessionKey = event.sessionId || `anon-${Math.random()}`;
    const currentMax = sessions.get(sessionKey) || 0;
    if (event.depth > currentMax) {
      sessions.set(sessionKey, event.depth);
    }
  }

  const results: ScrollDepthData[] = [];

  for (const [page, sessions] of Array.from(pageMap.entries())) {
    const depths: number[] = Array.from(sessions.values()).sort((a: number, b: number) => a - b);
    const totalSessions = depths.length;

    if (totalSessions === 0) continue;

    // Build zones at every 10% increment
    const zones: ScrollDepthZone[] = [];
    for (let d = 0; d <= 100; d += 10) {
      const reached = depths.filter((depth: number) => depth >= d).length;
      zones.push({
        depth: d,
        sessions: reached,
        percentage: (reached / totalSessions) * 100,
      });
    }

    // Calculate averages
    const avgDepth = depths.reduce((s: number, d: number) => s + d, 0) / totalSessions;
    const medianDepth: number = depths[Math.floor(totalSessions / 2)] || 0;

    // Find fold line (where 50% drop off)
    let foldLine: number = 100;
    for (const zone of zones) {
      if (zone.percentage < 50) {
        foldLine = zone.depth;
        break;
      }
    }

    results.push({
      page,
      totalSessions,
      zones,
      avgDepth,
      medianDepth,
      foldLine,
    });
  }

  return results.sort((a, b) => b.totalSessions - a.totalSessions);
}

/**
 * Get color for a scroll depth percentage (green = high retention, red = drop-off).
 */
export function getDepthColor(percentage: number): string {
  if (percentage >= 80) return "#22c55e"; // green
  if (percentage >= 60) return "#84cc16"; // lime
  if (percentage >= 40) return "#eab308"; // yellow
  if (percentage >= 20) return "#f97316"; // orange
  return "#ef4444"; // red
}

/**
 * Get a human-readable label for scroll depth.
 */
export function getDepthLabel(depth: number): string {
  if (depth === 0) return "Top of page";
  if (depth <= 25) return "Above the fold";
  if (depth <= 50) return "Mid-page";
  if (depth <= 75) return "Below the fold";
  return "Bottom of page";
}
