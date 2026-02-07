/**
 * Weekly report data structures and formatting utilities.
 * Used by both the server-side report generator and the admin dashboard.
 */

export interface WeeklyReportData {
  period: { start: string; end: string };
  pwaMetrics: {
    totalInstalls: number;
    installRate: number;
    offlineSessions: number;
    notificationsEnabled: number;
    notificationCTR: number;
    swRegistrations: number;
  };
  abTestResults: {
    totalImpressions: number;
    bestVariant: string | null;
    bestConversionRate: number;
    isSignificant: boolean;
    pValue: number;
  };
  mobileEngagement: {
    totalSessions: number;
    avgSessionDuration: number; // seconds
    avgScrollDepth: number; // percentage
    totalTouchInteractions: number;
    topPages: { url: string; views: number }[];
    platformBreakdown: { platform: string; count: number }[];
  };
  generationMetrics: {
    totalStarted: number;
    totalCompleted: number;
    totalFailed: number;
    successRate: number;
  };
  recommendations: string[];
}

/**
 * Generate actionable recommendations based on the report data.
 */
export function generateRecommendations(data: WeeklyReportData): string[] {
  const recs: string[] = [];

  // PWA install rate
  if (data.pwaMetrics.installRate < 5) {
    recs.push("PWA install rate is below 5%. Consider testing more aggressive install prompts or adjusting the banner delay timing.");
  } else if (data.pwaMetrics.installRate > 20) {
    recs.push("Excellent PWA install rate! Consider reducing the install banner frequency to avoid user fatigue.");
  }

  // Notification CTR
  if (data.pwaMetrics.notificationCTR < 10) {
    recs.push("Notification click-through rate is low. Try personalizing notification content or adjusting send timing.");
  }

  // A/B test
  if (data.abTestResults.isSignificant && data.abTestResults.bestVariant) {
    recs.push(`A/B test has a winner: "${data.abTestResults.bestVariant}". Consider implementing this variant as the default.`);
  } else if (data.abTestResults.totalImpressions < 100) {
    recs.push("A/B test needs more data. Current sample size is too small for reliable conclusions.");
  }

  // Mobile engagement
  if (data.mobileEngagement.avgScrollDepth < 50) {
    recs.push("Average scroll depth is below 50%. Content above the fold may need improvement to encourage deeper engagement.");
  }

  if (data.mobileEngagement.avgSessionDuration < 30) {
    recs.push("Average session duration is under 30 seconds. Consider adding more engaging content or interactive elements.");
  }

  // Generation success
  if (data.generationMetrics.successRate < 90) {
    recs.push(`Generation success rate is ${data.generationMetrics.successRate.toFixed(1)}%. Investigate failure causes and consider adding retry logic.`);
  }

  // Platform optimization
  const mobilePlatforms = data.mobileEngagement.platformBreakdown.filter(
    p => ["ios", "android"].includes(p.platform.toLowerCase())
  );
  const totalMobile = mobilePlatforms.reduce((sum, p) => sum + p.count, 0);
  const totalAll = data.mobileEngagement.platformBreakdown.reduce((sum, p) => sum + p.count, 0);
  
  if (totalAll > 0 && totalMobile / totalAll > 0.6) {
    recs.push("Over 60% of traffic is mobile. Prioritize mobile-first optimizations and PWA features.");
  }

  if (recs.length === 0) {
    recs.push("All metrics look healthy. Continue monitoring and consider expanding A/B tests to other UI elements.");
  }

  return recs;
}

/**
 * Format the weekly report as a readable text string for notifications.
 */
export function formatReportForNotification(data: WeeklyReportData): string {
  const lines: string[] = [
    `📊 Weekly PWA & Mobile Report`,
    `Period: ${data.period.start} — ${data.period.end}`,
    ``,
    `🔧 PWA Metrics:`,
    `  • Installs: ${data.pwaMetrics.totalInstalls} (${data.pwaMetrics.installRate.toFixed(1)}% rate)`,
    `  • Offline sessions: ${data.pwaMetrics.offlineSessions}`,
    `  • Notifications enabled: ${data.pwaMetrics.notificationsEnabled}`,
    `  • Notification CTR: ${data.pwaMetrics.notificationCTR.toFixed(1)}%`,
    ``,
    `🧪 A/B Test:`,
    `  • Impressions: ${data.abTestResults.totalImpressions}`,
    `  • Best variant: ${data.abTestResults.bestVariant || "N/A"} (${(data.abTestResults.bestConversionRate * 100).toFixed(1)}%)`,
    `  • Significant: ${data.abTestResults.isSignificant ? "YES ✅" : "Not yet"}`,
    ``,
    `📱 Mobile Engagement:`,
    `  • Sessions: ${data.mobileEngagement.totalSessions}`,
    `  • Avg duration: ${data.mobileEngagement.avgSessionDuration.toFixed(0)}s`,
    `  • Avg scroll depth: ${data.mobileEngagement.avgScrollDepth.toFixed(0)}%`,
    `  • Touch interactions: ${data.mobileEngagement.totalTouchInteractions}`,
    ``,
    `🎨 Generation:`,
    `  • Started: ${data.generationMetrics.totalStarted}`,
    `  • Completed: ${data.generationMetrics.totalCompleted}`,
    `  • Success rate: ${data.generationMetrics.successRate.toFixed(1)}%`,
    ``,
    `💡 Recommendations:`,
    ...data.recommendations.map(r => `  • ${r}`),
  ];

  return lines.join("\n");
}
