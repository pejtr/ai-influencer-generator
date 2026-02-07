import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ABTestSignificance from "@/components/admin/ABTestSignificance";
import ABAutoOptimize from "@/components/admin/ABAutoOptimize";
import Heatmap from "@/components/admin/Heatmap";
import ScrollDepthHeatmap from "@/components/admin/ScrollDepthHeatmap";
import ReportExport from "@/components/admin/ReportExport";
import { 
  Download, Smartphone, Monitor, Globe, Bell, BellRing, 
  Wifi, WifiOff, RefreshCw, TrendingUp, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Shield, MousePointerClick,
  FileText, Calendar, Flame, Zap, Layers
} from "lucide-react";
import {
  type WeeklyReportData,
  generateRecommendations,
  formatReportForNotification,
} from "@shared/weeklyReport";

const EVENT_LABELS: Record<string, string> = {
  install_prompt_shown: "Install Prompt Shown",
  install_prompt_accepted: "Install Accepted",
  install_prompt_dismissed: "Install Dismissed",
  app_installed: "App Installed",
  offline_session_start: "Offline Session Start",
  offline_session_end: "Offline Session End",
  notification_permission_granted: "Notifications Enabled",
  notification_permission_denied: "Notifications Denied",
  notification_shown: "Notification Shown",
  notification_clicked: "Notification Clicked",
  notification_dismissed: "Notification Dismissed",
  sw_registered: "SW Registered",
  sw_update_available: "SW Update Available",
  sw_update_applied: "SW Update Applied",
  touch_interaction: "Touch Interactions",
  scroll_depth: "Scroll Depth Tracked",
  viewport_change: "Viewport Resized",
  orientation_change: "Orientation Changed",
  device_info: "Device Info Captured",
  session_duration: "Session Duration Tracked",
  page_view: "Page Views",
  session_start: "Session Starts",
  session_end: "Session Ends",
  ab_variant_assigned: "A/B Banner Impression",
  ab_install_clicked: "A/B Banner Click",
  ab_dismiss_clicked: "A/B Banner Dismiss",
  generation_started: "Generation Started",
  generation_completed: "Generation Completed",
  generation_failed: "Generation Failed",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  install_prompt_shown: <Download className="w-4 h-4" />,
  install_prompt_accepted: <Download className="w-4 h-4 text-green-500" />,
  install_prompt_dismissed: <Download className="w-4 h-4 text-red-500" />,
  app_installed: <Smartphone className="w-4 h-4 text-blue-500" />,
  offline_session_start: <WifiOff className="w-4 h-4 text-yellow-500" />,
  offline_session_end: <Wifi className="w-4 h-4 text-green-500" />,
  notification_permission_granted: <BellRing className="w-4 h-4 text-green-500" />,
  notification_permission_denied: <Bell className="w-4 h-4 text-red-500" />,
  notification_shown: <Bell className="w-4 h-4 text-blue-500" />,
  notification_clicked: <Bell className="w-4 h-4 text-green-500" />,
  notification_dismissed: <Bell className="w-4 h-4 text-muted-foreground" />,
  sw_registered: <RefreshCw className="w-4 h-4 text-blue-500" />,
  sw_update_available: <RefreshCw className="w-4 h-4 text-yellow-500" />,
  sw_update_applied: <RefreshCw className="w-4 h-4 text-green-500" />,
};

function MetricCard({ title, value, icon, subtitle, trend }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${trend.positive ? "text-green-500" : "text-red-500"}`}>
                {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartSimple({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${item.color || "bg-primary"}`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type TabId = "overview" | "abtest" | "heatmap" | "scrolldepth" | "report";

export default function PwaAnalytics() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [heatmapPage, setHeatmapPage] = useState("/");

  const isAdmin = user?.role === "admin";

  const { data: summary, isLoading: summaryLoading } = trpc.pwaAnalytics.getSummary.useQuery(
    { days },
    { enabled: isAdmin }
  );

  const { data: platformData } = trpc.pwaAnalytics.getByPlatform.useQuery(
    { days },
    { enabled: isAdmin }
  );

  const { data: installTrend } = trpc.pwaAnalytics.getTrend.useQuery(
    { eventType: "app_installed", days },
    { enabled: isAdmin }
  );

  const { data: abVariantData } = trpc.pwaAnalytics.getABTestVariants.useQuery(
    { days },
    { enabled: isAdmin && (activeTab === "abtest" || activeTab === "overview") }
  );

  const { data: heatmapData } = trpc.pwaAnalytics.getHeatmapData.useQuery(
    { days: Math.min(days, 30) },
    { enabled: isAdmin && activeTab === "heatmap" }
  );

  const { data: scrollDepthData } = trpc.pwaAnalytics.getScrollDepth.useQuery(
    { days },
    { enabled: isAdmin && activeTab === "scrolldepth" }
  );

  const { data: autoOptimizeData } = trpc.pwaAnalytics.getAutoOptimizeStats.useQuery(
    undefined,
    { enabled: isAdmin && activeTab === "abtest" }
  );

  const { data: weeklyReportRaw } = trpc.pwaAnalytics.getWeeklyReport.useQuery(
    undefined,
    { enabled: isAdmin && activeTab === "report" }
  );

  const metrics = useMemo(() => {
    if (!summary) return null;
    const eventMap = new Map(summary.map((s: any) => [s.eventType, Number(s.count)]));
    
    const installs = eventMap.get("app_installed") || 0;
    const promptsShown = eventMap.get("install_prompt_shown") || 0;
    const promptsAccepted = eventMap.get("install_prompt_accepted") || 0;
    const offlineStarts = eventMap.get("offline_session_start") || 0;
    const notifGranted = eventMap.get("notification_permission_granted") || 0;
    const notifDenied = eventMap.get("notification_permission_denied") || 0;
    const notifShown = eventMap.get("notification_shown") || 0;
    const notifClicked = eventMap.get("notification_clicked") || 0;
    const swRegistered = eventMap.get("sw_registered") || 0;

    const installRate = promptsShown > 0 ? Math.round((promptsAccepted / promptsShown) * 100) : 0;
    const notifAcceptRate = (notifGranted + notifDenied) > 0 
      ? Math.round((notifGranted / (notifGranted + notifDenied)) * 100) : 0;
    const notifClickRate = notifShown > 0 ? Math.round((notifClicked / notifShown) * 100) : 0;

    return {
      installs, promptsShown, promptsAccepted, offlineStarts,
      notifGranted, notifDenied, notifShown, notifClicked,
      swRegistered, installRate, notifAcceptRate, notifClickRate,
    };
  }, [summary]);

  const platformBreakdown = useMemo(() => {
    if (!platformData) return [];
    const platforms = new Map<string, number>();
    platformData.forEach((row: any) => {
      const p = row.platform || "unknown";
      platforms.set(p, (platforms.get(p) || 0) + Number(row.count));
    });
    return Array.from(platforms.entries())
      .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
      .sort((a, b) => b.value - a.value);
  }, [platformData]);

  // Parse heatmap points
  const heatmapPoints = useMemo(() => {
    if (!heatmapData) return [];
    return heatmapData
      .filter((row: any) => {
        const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        if (!meta || typeof meta.x !== "number" || typeof meta.y !== "number") return false;
        if (heatmapPage && meta.page && meta.page !== heatmapPage) return false;
        return true;
      })
      .map((row: any) => {
        const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        return { x: meta.x, y: meta.y, intensity: 1 };
      });
  }, [heatmapData, heatmapPage]);

  // Parse unique pages from heatmap data
  const heatmapPages = useMemo(() => {
    if (!heatmapData) return ["/"];
    const pages = new Set<string>();
    heatmapData.forEach((row: any) => {
      const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
      if (meta?.page) pages.add(meta.page);
    });
    return Array.from(pages).sort();
  }, [heatmapData]);

  // Build weekly report
  const weeklyReport = useMemo((): WeeklyReportData | null => {
    if (!weeklyReportRaw) return null;
    const { summary: wSummary, platforms, sessionEnds, pageViews } = weeklyReportRaw;
    if (!wSummary) return null;

    const eventMap = new Map((wSummary as any[]).map(s => [s.eventType, Number(s.count)]));

    const totalInstalls = eventMap.get("app_installed") || 0;
    const promptsShown = eventMap.get("install_prompt_shown") || 0;
    const installRate = promptsShown > 0 ? (totalInstalls / promptsShown) * 100 : 0;
    const offlineSessions = eventMap.get("offline_session_start") || 0;
    const notifEnabled = eventMap.get("notification_permission_granted") || 0;
    const notifShown = eventMap.get("notification_shown") || 0;
    const notifClicked = eventMap.get("notification_clicked") || 0;
    const notifCTR = notifShown > 0 ? (notifClicked / notifShown) * 100 : 0;
    const swRegs = eventMap.get("sw_registered") || 0;

    const abImpressions = eventMap.get("ab_variant_assigned") || 0;
    const abClicks = eventMap.get("ab_install_clicked") || 0;

    const genStarted = eventMap.get("generation_started") || 0;
    const genCompleted = eventMap.get("generation_completed") || 0;
    const genFailed = eventMap.get("generation_failed") || 0;

    // Parse session durations
    let totalDuration = 0;
    let totalScrollDepth = 0;
    let sessionCount = 0;
    if (sessionEnds) {
      for (const row of sessionEnds as any[]) {
        const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        if (meta?.sessionDuration) {
          totalDuration += Number(meta.sessionDuration);
          sessionCount++;
        }
        if (meta?.maxScrollDepth) {
          totalScrollDepth += Number(meta.maxScrollDepth);
        }
      }
    }

    // Parse top pages
    const topPages: { url: string; views: number }[] = [];
    if (pageViews) {
      for (const row of pageViews as any[]) {
        const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
        if (meta?.url) {
          topPages.push({ url: meta.url, views: Number(row.count) });
        }
      }
    }
    topPages.sort((a, b) => b.views - a.views);

    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const data: WeeklyReportData = {
      period: {
        start: weekAgo.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
      pwaMetrics: {
        totalInstalls,
        installRate,
        offlineSessions,
        notificationsEnabled: notifEnabled,
        notificationCTR: notifCTR,
        swRegistrations: swRegs,
      },
      abTestResults: {
        totalImpressions: abImpressions,
        bestVariant: null,
        bestConversionRate: abImpressions > 0 ? abClicks / abImpressions : 0,
        isSignificant: false,
        pValue: 1,
      },
      mobileEngagement: {
        totalSessions: eventMap.get("session_start") || 0,
        avgSessionDuration: sessionCount > 0 ? totalDuration / sessionCount : 0,
        avgScrollDepth: sessionCount > 0 ? totalScrollDepth / sessionCount : 0,
        totalTouchInteractions: eventMap.get("touch_interaction") || 0,
        topPages,
        platformBreakdown: platforms
          ? (platforms as any[]).map(p => ({ platform: p.platform || "unknown", count: Number(p.count) }))
          : [],
      },
      generationMetrics: {
        totalStarted: genStarted,
        totalCompleted: genCompleted,
        totalFailed: genFailed,
        successRate: genStarted > 0 ? (genCompleted / genStarted) * 100 : 0,
      },
      recommendations: [],
    };

    data.recommendations = generateRecommendations(data);
    return data;
  }, [weeklyReportRaw]);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground">This dashboard is only available to administrators.</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "abtest", label: "A/B Test", icon: <Flame className="w-4 h-4" /> },
    { id: "heatmap", label: "Touch Map", icon: <MousePointerClick className="w-4 h-4" /> },
    { id: "scrolldepth", label: "Scroll Depth", icon: <Layers className="w-4 h-4" /> },
    { id: "report", label: "Weekly Report", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="container py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              PWA Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track installations, A/B tests, mobile behavior, and engagement
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(d)}
                className="rounded-full"
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-muted/30 p-1 rounded-xl overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <>
            {summaryLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-card/50 animate-pulse">
                    <CardContent className="p-5 h-24" />
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <MetricCard
                    title="App Installs"
                    value={metrics?.installs ?? 0}
                    icon={<Smartphone className="w-5 h-5" />}
                    subtitle={`${metrics?.installRate ?? 0}% install rate`}
                  />
                  <MetricCard
                    title="Offline Sessions"
                    value={metrics?.offlineStarts ?? 0}
                    icon={<WifiOff className="w-5 h-5" />}
                    subtitle="Users going offline"
                  />
                  <MetricCard
                    title="Notifications Enabled"
                    value={metrics?.notifGranted ?? 0}
                    icon={<BellRing className="w-5 h-5" />}
                    subtitle={`${metrics?.notifAcceptRate ?? 0}% accept rate`}
                  />
                  <MetricCard
                    title="Notification CTR"
                    value={`${metrics?.notifClickRate ?? 0}%`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    subtitle={`${metrics?.notifClicked ?? 0} of ${metrics?.notifShown ?? 0} clicked`}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Install Funnel */}
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Download className="w-5 h-5 text-primary" />
                        Install Funnel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChartSimple
                        maxValue={metrics?.promptsShown ?? 1}
                        data={[
                          { label: "Prompts Shown", value: metrics?.promptsShown ?? 0, color: "bg-blue-500" },
                          { label: "Prompts Accepted", value: metrics?.promptsAccepted ?? 0, color: "bg-green-500" },
                          { label: "App Installed", value: metrics?.installs ?? 0, color: "bg-emerald-500" },
                        ]}
                      />
                    </CardContent>
                  </Card>

                  {/* Notification Funnel */}
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Notification Funnel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChartSimple
                        maxValue={Math.max(metrics?.notifGranted ?? 0, metrics?.notifShown ?? 0, 1)}
                        data={[
                          { label: "Permission Granted", value: metrics?.notifGranted ?? 0, color: "bg-green-500" },
                          { label: "Permission Denied", value: metrics?.notifDenied ?? 0, color: "bg-red-500" },
                          { label: "Notifications Shown", value: metrics?.notifShown ?? 0, color: "bg-blue-500" },
                          { label: "Notifications Clicked", value: metrics?.notifClicked ?? 0, color: "bg-emerald-500" },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Platform & Events */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-primary" />
                        Platform Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {platformBreakdown.length > 0 ? (
                        <BarChartSimple
                          maxValue={Math.max(...platformBreakdown.map(p => p.value), 1)}
                          data={platformBreakdown.map((p, i) => ({
                            label: p.label,
                            value: p.value,
                            color: ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500"][i % 4],
                          }))}
                        />
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-8">No platform data yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        All Events ({days}d)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {summary && summary.length > 0 ? (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {[...summary]
                            .sort((a: any, b: any) => Number(b.count) - Number(a.count))
                            .map((row: any, i: number) => (
                              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  {EVENT_ICONS[row.eventType] || <Globe className="w-4 h-4" />}
                                  <span className="text-sm">{EVENT_LABELS[row.eventType] || row.eventType}</span>
                                </div>
                                <span className="font-mono font-medium text-sm">{Number(row.count)}</span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-8">No events recorded yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Generation Stats */}
                <Card className="bg-card/50 backdrop-blur border-border/50 mb-8">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Generation Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summary ? (() => {
                      const genEvents = summary.filter((s: any) => s.eventType.startsWith("generation_"));
                      if (genEvents.length === 0) return <p className="text-muted-foreground text-sm text-center py-4">No generation events yet.</p>;
                      const started = Number((genEvents as any[]).find(e => e.eventType === "generation_started")?.count || 0);
                      const completed = Number((genEvents as any[]).find(e => e.eventType === "generation_completed")?.count || 0);
                      const failed = Number((genEvents as any[]).find(e => e.eventType === "generation_failed")?.count || 0);
                      const successRate = started > 0 ? ((completed / started) * 100).toFixed(1) : "0";
                      return (
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-3 rounded-lg bg-muted/30">
                            <p className="text-2xl font-bold">{started}</p>
                            <p className="text-xs text-muted-foreground">Started</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-green-500/10">
                            <p className="text-2xl font-bold text-green-500">{completed}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-red-500/10">
                            <p className="text-2xl font-bold text-red-500">{failed}</p>
                            <p className="text-xs text-muted-foreground">Failed</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-blue-500/10">
                            <p className="text-2xl font-bold text-blue-500">{successRate}%</p>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                          </div>
                        </div>
                      );
                    })() : <p className="text-muted-foreground text-sm text-center py-4">Loading...</p>}
                  </CardContent>
                </Card>

                {/* Install Trend */}
                {installTrend && installTrend.length > 0 && (
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Install Trend ({days}d)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-1 h-32">
                        {installTrend.map((day: any, i: number) => {
                          const maxCount = Math.max(...installTrend.map((d: any) => Number(d.count)), 1);
                          const height = (Number(day.count) / maxCount) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">{Number(day.count)}</span>
                              <div
                                className="w-full bg-primary/80 rounded-t transition-all duration-300 min-h-[2px]"
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[9px] text-muted-foreground rotate-45 origin-left">
                                {String(day.date).slice(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* ==================== A/B TEST TAB ==================== */}
        {activeTab === "abtest" && (
          <div className="space-y-6">
            <ABTestSignificance
              variantData={abVariantData ?? []}
              days={days}
            />
            <ABAutoOptimize
              variantData={autoOptimizeData ?? []}
            />
          </div>
        )}

        {/* ==================== SCROLL DEPTH TAB ==================== */}
        {activeTab === "scrolldepth" && (
          <ScrollDepthHeatmap
            scrollData={scrollDepthData ?? []}
            days={days}
          />
        )}

        {/* ==================== HEATMAP TAB ==================== */}
        {activeTab === "heatmap" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Heatmap Visualization */}
            <div className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-primary" />
                    Touch Heatmap
                    <span className="text-xs font-normal text-muted-foreground ml-auto">
                      {heatmapPoints.length} points
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      <Heatmap
                        points={heatmapPoints}
                        showGrid={true}
                        selectedPage={heatmapPage}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Heatmap Controls & Stats */}
            <div className="space-y-6">
              {/* Page Filter */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm">Filter by Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {heatmapPages.map(page => (
                      <button
                        key={page}
                        onClick={() => setHeatmapPage(page)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          heatmapPage === page
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Heatmap Legend */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm">Density Legend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-4 rounded-full overflow-hidden" style={{
                    background: "linear-gradient(to right, rgba(0,0,255,0.5), rgba(0,255,255,0.7), rgba(0,255,0,0.8), rgba(255,255,0,0.9), rgba(255,0,0,1))"
                  }} />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </CardContent>
              </Card>

              {/* Touch Stats */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm">Touch Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Points</span>
                    <span className="font-medium">{heatmapPoints.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pages Tracked</span>
                    <span className="font-medium">{heatmapPages.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Page</span>
                    <span className="font-medium text-primary">{heatmapPage}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== WEEKLY REPORT TAB ==================== */}
        {activeTab === "report" && (
          <div className="space-y-6">
            {weeklyReport ? (
              <>
                {/* Report Header */}
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Weekly Report: {weeklyReport.period.start} — {weeklyReport.period.end}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-blue-500/10">
                        <p className="text-2xl font-bold text-blue-500">{weeklyReport.pwaMetrics.totalInstalls}</p>
                        <p className="text-xs text-muted-foreground">Installs</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-2xl font-bold text-green-500">{weeklyReport.mobileEngagement.totalSessions}</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-purple-500/10">
                        <p className="text-2xl font-bold text-purple-500">{weeklyReport.generationMetrics.totalCompleted}</p>
                        <p className="text-xs text-muted-foreground">Generations</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                        <p className="text-2xl font-bold text-yellow-500">{weeklyReport.pwaMetrics.notificationCTR.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Notif. CTR</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PWA Metrics */}
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        PWA Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Install Rate</span>
                        <span className="font-medium">{weeklyReport.pwaMetrics.installRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Offline Sessions</span>
                        <span className="font-medium">{weeklyReport.pwaMetrics.offlineSessions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Notifications Enabled</span>
                        <span className="font-medium">{weeklyReport.pwaMetrics.notificationsEnabled}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SW Registrations</span>
                        <span className="font-medium">{weeklyReport.pwaMetrics.swRegistrations}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mobile Engagement */}
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MousePointerClick className="w-4 h-4 text-primary" />
                        Mobile Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg. Session Duration</span>
                        <span className="font-medium">{weeklyReport.mobileEngagement.avgSessionDuration.toFixed(0)}s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg. Scroll Depth</span>
                        <span className="font-medium">{weeklyReport.mobileEngagement.avgScrollDepth.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Touch Interactions</span>
                        <span className="font-medium">{weeklyReport.mobileEngagement.totalTouchInteractions}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Pages */}
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Top Pages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {weeklyReport.mobileEngagement.topPages.length > 0 ? (
                        <div className="space-y-2">
                          {weeklyReport.mobileEngagement.topPages.slice(0, 5).map((page, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground truncate mr-2">{page.url}</span>
                              <span className="font-medium shrink-0">{page.views}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">No page view data</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Generation Stats */}
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Generation Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Started</span>
                        <span className="font-medium">{weeklyReport.generationMetrics.totalStarted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-medium text-green-500">{weeklyReport.generationMetrics.totalCompleted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed</span>
                        <span className="font-medium text-red-500">{weeklyReport.generationMetrics.totalFailed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Success Rate</span>
                        <span className="font-medium">{weeklyReport.generationMetrics.successRate.toFixed(1)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {weeklyReport.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                          <span className="text-orange-500 font-bold text-sm shrink-0">{i + 1}.</span>
                          <p className="text-sm text-muted-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Export Buttons */}
                <ReportExport />

                {/* Raw Report Preview */}
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Notification Preview
                      <span className="text-xs font-normal text-muted-foreground ml-auto">
                        Sent weekly to owner
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg font-mono leading-relaxed max-h-80 overflow-y-auto">
                      {formatReportForNotification(weeklyReport)}
                    </pre>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 mx-auto text-muted-foreground mb-3 animate-spin" />
                  <p className="text-muted-foreground">Loading weekly report data...</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
