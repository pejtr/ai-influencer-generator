import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = trpc.dashboard.getSummary.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  const formatCurrency = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  const healthColors = {
    healthy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="container py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Command Center</h1>
          <p className="text-muted-foreground mt-1">Unified view of all key performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={healthColors[summary.funnelHealth]}>
            {summary.funnelHealth === "healthy" ? "All Systems Healthy" :
             summary.funnelHealth === "warning" ? `${summary.activeAlerts} Warning${summary.activeAlerts > 1 ? "s" : ""}` :
             `${summary.activeAlerts} Critical Alert${summary.activeAlerts > 1 ? "s" : ""}`}
          </Badge>
          <Link href="/admin">
            <Button variant="outline" size="sm">Back to Admin</Button>
          </Link>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total Users"
          value={summary.totalUsers.toLocaleString()}
          subtitle={`${summary.recentUsers} new (30d)`}
          change={summary.userGrowthPct}
          icon="👥"
        />
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          subtitle={`${formatCurrency(summary.recentRevenue)} (30d)`}
          change={summary.revenueGrowthPct}
          icon="💰"
        />
        <KpiCard
          title="Total Generations"
          value={summary.totalGenerations.toLocaleString()}
          subtitle={`${summary.recentGenerations.toLocaleString()} (30d)`}
          icon="🎨"
        />
        <KpiCard
          title="Overall ROAS"
          value={summary.overallRoas > 0 ? `${summary.overallRoas}x` : "N/A"}
          subtitle={summary.totalSpend > 0 ? `Spend: ${formatCurrency(summary.totalSpend)}` : "No ad spend tracked"}
          icon="📊"
        />
      </div>

      {/* Profit & Best Channel Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-3xl font-bold ${summary.totalProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(summary.totalProfit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenue {formatCurrency(summary.totalRevenue)} − Spend {formatCurrency(summary.totalSpend)}
                </p>
              </div>
              <div className="text-4xl">
                {summary.totalProfit >= 0 ? "📈" : "📉"}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Acquisition Channel</p>
                <p className="text-3xl font-bold capitalize">{summary.bestChannel || "N/A"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.bestChannelLtv > 0 ? `LTV: ${formatCurrency(summary.bestChannelLtv)} per user` : "No revenue data yet"}
                </p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Grid */}
      <h2 className="text-xl font-semibold mb-4">Analytics Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <NavCard
          title="Conversion Funnel"
          description="Visit → Sign Up → Generation → Purchase flow with drop-off analysis"
          href="/admin/funnel"
          icon="🔽"
          badge={summary.activeAlerts > 0 ? `${summary.activeAlerts} alerts` : undefined}
          badgeVariant={summary.funnelHealth === "critical" ? "destructive" : "secondary"}
        />
        <NavCard
          title="Funnel Alerts"
          description="Automated conversion rate drop detection and alert history"
          href="/admin/funnel-alerts"
          icon="🔔"
          badge={summary.activeAlerts > 0 ? `${summary.activeAlerts} active` : undefined}
          badgeVariant={summary.funnelHealth === "critical" ? "destructive" : "secondary"}
        />
        <NavCard
          title="Cohort Analysis"
          description="User segmentation by registration date with retention heatmap"
          href="/admin/cohort-analysis"
          icon="📅"
        />
        <NavCard
          title="Revenue Attribution"
          description="LTV per acquisition channel with revenue breakdown"
          href="/admin/revenue"
          icon="💎"
        />
        <NavCard
          title="Attribution Models"
          description="Compare first-touch, last-touch, linear, and time-decay models"
          href="/admin/attribution"
          icon="🔀"
        />
        <NavCard
          title="Cost Tracking & ROAS"
          description="Ad spend per channel with ROAS and CAC calculations"
          href="/admin/costs"
          icon="💸"
        />
        <NavCard
          title="Predictive LTV"
          description="Forecast future user value with budget reallocation recommendations"
          href="/admin/predictive-ltv"
          icon="🔮"
        />
        <NavCard
          title="PWA Analytics"
          description="Install rates, A/B tests, heatmaps, scroll depth, weekly reports"
          href="/admin/pwa-analytics"
          icon="📱"
        />
        <NavCard
          title="A/B Test Results"
          description="Statistical significance, auto-optimization, variant performance"
          href="/admin/pwa-analytics"
          icon="🧪"
        />
      </div>

      {/* Revenue Breakdown Mini Chart */}
      <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">30-Day Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.recentRevenue)}</p>
            <p className={`text-sm ${summary.revenueGrowthPct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatPct(summary.revenueGrowthPct)} vs previous 30d
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">30-Day New Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.recentUsers.toLocaleString()}</p>
            <p className={`text-sm ${summary.userGrowthPct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatPct(summary.userGrowthPct)} vs previous 30d
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Revenue Per User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary.totalUsers > 0 ? formatCurrency(summary.totalRevenue / summary.totalUsers) : "$0.00"}
            </p>
            <p className="text-sm text-muted-foreground">
              Across {summary.totalUsers.toLocaleString()} total users
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, change, icon }: {
  title: string;
  value: string;
  subtitle: string;
  change?: number;
  icon: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              {change !== undefined && (
                <span className={`text-xs font-medium ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function NavCard({ title, description, href, icon, badge, badgeVariant }: {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {badge && <Badge variant={badgeVariant || "secondary"} className="text-xs">{badge}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
