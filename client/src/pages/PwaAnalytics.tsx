import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, Smartphone, Monitor, Globe, Bell, BellRing, 
  Wifi, WifiOff, RefreshCw, TrendingUp, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Shield
} from "lucide-react";

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
  touch_start: "Touch Interactions",
  scroll_depth: "Scroll Depth Tracked",
  viewport_resize: "Viewport Resized",
  orientation_change: "Orientation Changed",
  device_info: "Device Info Captured",
  session_duration: "Session Duration Tracked",
  ab_banner_impression: "A/B Banner Impression",
  ab_banner_click: "A/B Banner Click",
  ab_banner_dismiss: "A/B Banner Dismiss",
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

export default function PwaAnalytics() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);

  const { data: summary, isLoading: summaryLoading } = trpc.pwaAnalytics.getSummary.useQuery(
    { days },
    { enabled: user?.role === "admin" }
  );

  const { data: platformData, isLoading: platformLoading } = trpc.pwaAnalytics.getByPlatform.useQuery(
    { days },
    { enabled: user?.role === "admin" }
  );

  const { data: installTrend } = trpc.pwaAnalytics.getTrend.useQuery(
    { eventType: "app_installed", days },
    { enabled: user?.role === "admin" }
  );

  const metrics = useMemo(() => {
    if (!summary) return null;
    const eventMap = new Map(summary.map(s => [s.eventType, Number(s.count)]));
    
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
    platformData.forEach(row => {
      const p = row.platform || "unknown";
      platforms.set(p, (platforms.get(p) || 0) + Number(row.count));
    });
    return Array.from(platforms.entries())
      .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
      .sort((a, b) => b.value - a.value);
  }, [platformData]);

  if (!user || user.role !== "admin") {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              PWA Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track installations, offline usage, and notification engagement
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

            {/* Platform & Event Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Platform Breakdown */}
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

              {/* All Events */}
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
                      {summary
                        .sort((a, b) => Number(b.count) - Number(a.count))
                        .map((row, i) => (
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

            {/* A/B Test Results */}
            <Card className="bg-card/50 backdrop-blur border-border/50 mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  A/B Test: Install Banner Variants
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (() => {
                  const abEvents = summary.filter(s => ["ab_variant_assigned", "ab_install_clicked", "ab_dismiss_clicked"].includes(s.eventType));
                  if (abEvents.length === 0) return <p className="text-muted-foreground text-sm text-center py-4">No A/B test data yet. Install banner variants are being tested automatically.</p>;
                  const impressions = abEvents.find(e => e.eventType === "ab_variant_assigned");
                  const clicks = abEvents.find(e => e.eventType === "ab_install_clicked");
                  const dismissals = abEvents.find(e => e.eventType === "ab_dismiss_clicked");
                  const impCount = Number(impressions?.count || 0);
                  const clickCount = Number(clicks?.count || 0);
                  const dismissCount = Number(dismissals?.count || 0);
                  const ctr = impCount > 0 ? ((clickCount / impCount) * 100).toFixed(1) : "0";
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/30">
                          <p className="text-2xl font-bold">{impCount}</p>
                          <p className="text-xs text-muted-foreground">Impressions</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-500/10">
                          <p className="text-2xl font-bold text-green-500">{clickCount}</p>
                          <p className="text-xs text-muted-foreground">Installs</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-blue-500/10">
                          <p className="text-2xl font-bold text-blue-500">{ctr}%</p>
                          <p className="text-xs text-muted-foreground">CTR</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Dismissed: {dismissCount} ({impCount > 0 ? ((dismissCount / impCount) * 100).toFixed(1) : 0}%)</p>
                        <p className="mt-1">3 banner variants are being tested: Speed & Offline, Creative Studio, and Exclusive Features</p>
                      </div>
                    </div>
                  );
                })() : <p className="text-muted-foreground text-sm text-center py-4">Loading...</p>}
              </CardContent>
            </Card>

            {/* Mobile Device Tracking */}
            <Card className="bg-card/50 backdrop-blur border-border/50 mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Mobile Device Behavior
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (() => {
                  const mobileEvents = summary.filter(s => 
                    ["touch_interaction", "scroll_depth", "viewport_change", "page_view", "session_start", "session_end"].includes(s.eventType)
                  );
                  if (mobileEvents.length === 0) return <p className="text-muted-foreground text-sm text-center py-4">No mobile tracking data yet. Data is collected automatically from mobile visitors.</p>;
                  const maxVal = Math.max(...mobileEvents.map(e => Number(e.count)), 1);
                  return (
                    <BarChartSimple
                      maxValue={maxVal}
                      data={mobileEvents.map((e, i) => ({
                        label: EVENT_LABELS[e.eventType] || e.eventType,
                        value: Number(e.count),
                        color: ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500", "bg-cyan-500"][i % 6],
                      }))}
                    />
                  );
                })() : <p className="text-muted-foreground text-sm text-center py-4">Loading...</p>}
              </CardContent>
            </Card>

            {/* Generation Webhook Stats */}
            <Card className="bg-card/50 backdrop-blur border-border/50 mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Generation Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (() => {
                  const genEvents = summary.filter(s => s.eventType.startsWith("generation_"));
                  if (genEvents.length === 0) return <p className="text-muted-foreground text-sm text-center py-4">No generation events yet.</p>;
                  const started = Number(genEvents.find(e => e.eventType === "generation_started")?.count || 0);
                  const completed = Number(genEvents.find(e => e.eventType === "generation_completed")?.count || 0);
                  const failed = Number(genEvents.find(e => e.eventType === "generation_failed")?.count || 0);
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
                    {installTrend.map((day, i) => {
                      const maxCount = Math.max(...installTrend.map(d => Number(d.count)), 1);
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
      </div>
    </div>
  );
}
