/**
 * Report export utilities for generating CSV and PDF-ready content.
 * Used by both server-side export endpoints and client-side preview.
 */

import { type WeeklyReportData } from "./weeklyReport";

/**
 * Generate CSV content from weekly report data.
 * Returns a string that can be directly written to a .csv file.
 */
export function generateReportCSV(data: WeeklyReportData): string {
  const rows: string[][] = [];

  // Header
  rows.push(["AI Influencer Generator - Weekly Report"]);
  rows.push([`Period: ${data.period.start} to ${data.period.end}`]);
  rows.push([]);

  // PWA Metrics
  rows.push(["PWA Metrics", "Value"]);
  rows.push(["Total Installs", String(data.pwaMetrics.totalInstalls)]);
  rows.push(["Install Rate (%)", data.pwaMetrics.installRate.toFixed(2)]);
  rows.push(["Offline Sessions", String(data.pwaMetrics.offlineSessions)]);
  rows.push(["Notifications Enabled", String(data.pwaMetrics.notificationsEnabled)]);
  rows.push(["Notification CTR (%)", data.pwaMetrics.notificationCTR.toFixed(2)]);
  rows.push(["SW Registrations", String(data.pwaMetrics.swRegistrations)]);
  rows.push([]);

  // A/B Test Results
  rows.push(["A/B Test Results", "Value"]);
  rows.push(["Total Impressions", String(data.abTestResults.totalImpressions)]);
  rows.push(["Best Variant", data.abTestResults.bestVariant || "N/A"]);
  rows.push(["Best Conversion Rate (%)", (data.abTestResults.bestConversionRate * 100).toFixed(2)]);
  rows.push(["Statistically Significant", data.abTestResults.isSignificant ? "Yes" : "No"]);
  rows.push(["p-value", data.abTestResults.pValue.toFixed(4)]);
  rows.push([]);

  // Mobile Engagement
  rows.push(["Mobile Engagement", "Value"]);
  rows.push(["Total Sessions", String(data.mobileEngagement.totalSessions)]);
  rows.push(["Avg Session Duration (s)", data.mobileEngagement.avgSessionDuration.toFixed(1)]);
  rows.push(["Avg Scroll Depth (%)", data.mobileEngagement.avgScrollDepth.toFixed(1)]);
  rows.push(["Total Touch Interactions", String(data.mobileEngagement.totalTouchInteractions)]);
  rows.push([]);

  // Top Pages
  if (data.mobileEngagement.topPages.length > 0) {
    rows.push(["Top Pages", "Views"]);
    for (const page of data.mobileEngagement.topPages.slice(0, 10)) {
      rows.push([page.url, String(page.views)]);
    }
    rows.push([]);
  }

  // Platform Breakdown
  if (data.mobileEngagement.platformBreakdown.length > 0) {
    rows.push(["Platform", "Count"]);
    for (const p of data.mobileEngagement.platformBreakdown) {
      rows.push([p.platform, String(p.count)]);
    }
    rows.push([]);
  }

  // Generation Metrics
  rows.push(["Generation Metrics", "Value"]);
  rows.push(["Total Started", String(data.generationMetrics.totalStarted)]);
  rows.push(["Total Completed", String(data.generationMetrics.totalCompleted)]);
  rows.push(["Total Failed", String(data.generationMetrics.totalFailed)]);
  rows.push(["Success Rate (%)", data.generationMetrics.successRate.toFixed(2)]);
  rows.push([]);

  // Recommendations
  if (data.recommendations.length > 0) {
    rows.push(["AI Recommendations"]);
    for (const rec of data.recommendations) {
      rows.push([rec]);
    }
  }

  // Convert to CSV string with proper escaping
  return rows.map(row => row.map(cell => {
    if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }).join(",")).join("\n");
}

/**
 * Generate HTML content suitable for PDF rendering.
 * Uses inline styles for maximum compatibility with PDF generators.
 */
export function generateReportHTML(data: WeeklyReportData): string {
  const metricRow = (label: string, value: string | number, color?: string) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#aaa;font-size:13px">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:right;font-weight:600;color:${color || '#fff'};font-size:13px">${value}</td>
    </tr>`;

  const sectionHeader = (title: string, emoji: string) =>
    `<div style="margin:24px 0 12px;padding:10px 16px;background:#1a1a2e;border-radius:8px;border-left:3px solid #6366f1">
      <h2 style="margin:0;font-size:16px;color:#e2e8f0">${emoji} ${title}</h2>
    </div>`;

  const mobilePercent = (() => {
    const mobile = data.mobileEngagement.platformBreakdown
      .filter(p => ["ios", "android"].includes(p.platform.toLowerCase()))
      .reduce((s, p) => s + p.count, 0);
    const total = data.mobileEngagement.platformBreakdown.reduce((s, p) => s + p.count, 0);
    return total > 0 ? ((mobile / total) * 100).toFixed(0) : "0";
  })();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; padding: 32px; }
    .container { max-width: 700px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; background: #16162a; border-radius: 8px; overflow: hidden; margin-bottom: 8px; }
    .header { text-align: center; margin-bottom: 32px; padding: 24px; background: linear-gradient(135deg, #1a1a3e, #0f0f2a); border-radius: 12px; border: 1px solid #333; }
    .header h1 { margin: 0 0 8px; font-size: 22px; color: #fff; }
    .header p { margin: 0; color: #888; font-size: 13px; }
    .kpi-grid { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
    .kpi { flex: 1; min-width: 140px; background: #16162a; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #333; }
    .kpi .value { font-size: 28px; font-weight: 700; color: #6366f1; }
    .kpi .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .rec { padding: 10px 14px; margin: 6px 0; background: #1a1a2e; border-radius: 6px; border-left: 3px solid #f59e0b; font-size: 13px; color: #d1d5db; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #333; color: #666; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly PWA & Mobile Report</h1>
      <p>${data.period.start} — ${data.period.end}</p>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="value">${data.pwaMetrics.totalInstalls}</div>
        <div class="label">Installs</div>
      </div>
      <div class="kpi">
        <div class="value">${data.mobileEngagement.totalSessions}</div>
        <div class="label">Sessions</div>
      </div>
      <div class="kpi">
        <div class="value">${data.generationMetrics.totalCompleted}</div>
        <div class="label">Generations</div>
      </div>
      <div class="kpi">
        <div class="value" style="color:${data.generationMetrics.successRate >= 90 ? '#22c55e' : '#ef4444'}">${data.generationMetrics.successRate.toFixed(0)}%</div>
        <div class="label">Success Rate</div>
      </div>
    </div>

    ${sectionHeader("PWA Metrics", "📱")}
    <table>
      ${metricRow("Total Installs", data.pwaMetrics.totalInstalls)}
      ${metricRow("Install Rate", data.pwaMetrics.installRate.toFixed(1) + "%", data.pwaMetrics.installRate >= 5 ? "#22c55e" : "#ef4444")}
      ${metricRow("Offline Sessions", data.pwaMetrics.offlineSessions)}
      ${metricRow("Notifications Enabled", data.pwaMetrics.notificationsEnabled)}
      ${metricRow("Notification CTR", data.pwaMetrics.notificationCTR.toFixed(1) + "%", data.pwaMetrics.notificationCTR >= 10 ? "#22c55e" : "#ef4444")}
      ${metricRow("SW Registrations", data.pwaMetrics.swRegistrations)}
    </table>

    ${sectionHeader("A/B Test Results", "🧪")}
    <table>
      ${metricRow("Total Impressions", data.abTestResults.totalImpressions)}
      ${metricRow("Best Variant", data.abTestResults.bestVariant || "N/A")}
      ${metricRow("Best Conversion Rate", (data.abTestResults.bestConversionRate * 100).toFixed(2) + "%")}
      ${metricRow("Significant", data.abTestResults.isSignificant ? "YES ✅" : "Not yet", data.abTestResults.isSignificant ? "#22c55e" : "#f59e0b")}
      ${metricRow("p-value", data.abTestResults.pValue.toFixed(4))}
    </table>

    ${sectionHeader("Mobile Engagement", "📊")}
    <table>
      ${metricRow("Total Sessions", data.mobileEngagement.totalSessions)}
      ${metricRow("Avg Session Duration", data.mobileEngagement.avgSessionDuration.toFixed(0) + "s")}
      ${metricRow("Avg Scroll Depth", data.mobileEngagement.avgScrollDepth.toFixed(0) + "%")}
      ${metricRow("Touch Interactions", data.mobileEngagement.totalTouchInteractions)}
      ${metricRow("Mobile Traffic", mobilePercent + "%")}
    </table>

    ${data.mobileEngagement.topPages.length > 0 ? `
    ${sectionHeader("Top Pages", "🌐")}
    <table>
      ${data.mobileEngagement.topPages.slice(0, 5).map(p => metricRow(p.url, p.views)).join("")}
    </table>` : ""}

    ${sectionHeader("Generation Performance", "🎨")}
    <table>
      ${metricRow("Started", data.generationMetrics.totalStarted)}
      ${metricRow("Completed", data.generationMetrics.totalCompleted, "#22c55e")}
      ${metricRow("Failed", data.generationMetrics.totalFailed, "#ef4444")}
      ${metricRow("Success Rate", data.generationMetrics.successRate.toFixed(1) + "%", data.generationMetrics.successRate >= 90 ? "#22c55e" : "#ef4444")}
    </table>

    ${data.recommendations.length > 0 ? `
    ${sectionHeader("AI Recommendations", "💡")}
    ${data.recommendations.map(r => `<div class="rec">${r}</div>`).join("")}
    ` : ""}

    <div class="footer">
      Generated by AI Influencer Generator • ${new Date().toISOString().split("T")[0]}
    </div>
  </div>
</body>
</html>`;
}
