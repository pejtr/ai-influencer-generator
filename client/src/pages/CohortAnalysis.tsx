import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, TrendingUp, TrendingDown, Minus, Calendar, BarChart3,
  DollarSign, Activity, ArrowLeft, Zap, Target, Crown
} from "lucide-react";
import { Link } from "wouter";
import {
  type CohortRow, type CohortPeriod, type CohortSummary,
  getRetentionColor, getRetentionTextColor, formatPeriodLabel
} from "@shared/cohortAnalysis";

function MetricCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle?: string; icon: any; color: string;
}) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RetentionHeatmap({ cohorts, period, maxOffset }: {
  cohorts: CohortRow[]; period: CohortPeriod; maxOffset: number;
}) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [viewMode, setViewMode] = useState<"retention" | "revenue" | "generations">("retention");

  // Limit visible columns to avoid overflow
  const visiblePeriods = Math.min(maxOffset + 1, period === "weekly" ? 13 : 13);

  if (cohorts.length === 0) {
    return (
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No cohort data available yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Users will appear here as they register and interact with the platform.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Retention Heatmap
          </CardTitle>
          <div className="flex gap-1">
            {(["retention", "revenue", "generations"] as const).map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "outline"}
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => setViewMode(mode)}
              >
                {mode === "retention" ? "Retention %" : mode === "revenue" ? "Revenue $" : "Generations"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left p-2 pl-4 text-muted-foreground font-medium sticky left-0 bg-card/90 backdrop-blur z-10 min-w-[100px]">
                Cohort
              </th>
              <th className="text-center p-2 text-muted-foreground font-medium min-w-[50px]">
                Users
              </th>
              {Array.from({ length: visiblePeriods }, (_, i) => (
                <th key={i} className="text-center p-2 text-muted-foreground font-medium min-w-[52px]">
                  {formatPeriodLabel(i, period)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort, rowIdx) => (
              <tr key={cohort.label} className="border-b border-border/10 hover:bg-accent/5">
                <td className="p-2 pl-4 font-mono text-muted-foreground sticky left-0 bg-card/90 backdrop-blur z-10">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground/80">{cohort.label}</span>
                    <span className="text-[10px] text-muted-foreground/60">{cohort.startDate}</span>
                  </div>
                </td>
                <td className="text-center p-2 font-medium text-foreground/70">
                  {cohort.totalUsers}
                </td>
                {Array.from({ length: visiblePeriods }, (_, colIdx) => {
                  const cell = cohort.cells.find(c => c.periodOffset === colIdx);
                  if (!cell) {
                    return <td key={colIdx} className="p-1"><div className="w-full h-8 rounded bg-muted/10" /></td>;
                  }

                  const value = viewMode === "retention"
                    ? cell.retentionRate
                    : viewMode === "revenue"
                      ? cell.revenue
                      : cell.generations;

                  const displayValue = viewMode === "retention"
                    ? `${cell.retentionRate.toFixed(0)}%`
                    : viewMode === "revenue"
                      ? `$${cell.revenue.toFixed(0)}`
                      : String(cell.generations);

                  const bgColor = viewMode === "retention"
                    ? getRetentionColor(cell.retentionRate)
                    : viewMode === "revenue"
                      ? getRetentionColor(cell.revenue > 0 ? Math.min(100, (cell.revenue / 50) * 100) : 0)
                      : getRetentionColor(cell.generations > 0 ? Math.min(100, (cell.generations / 10) * 100) : 0);

                  const textColor = viewMode === "retention"
                    ? getRetentionTextColor(cell.retentionRate)
                    : value > 0 ? getRetentionTextColor(60) : getRetentionTextColor(0);

                  const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;

                  return (
                    <td key={colIdx} className="p-1">
                      <div
                        className="w-full h-8 rounded flex items-center justify-center font-medium transition-all cursor-default"
                        style={{
                          backgroundColor: bgColor,
                          color: textColor,
                          opacity: isHovered ? 1 : 0.85,
                          transform: isHovered ? "scale(1.05)" : "scale(1)",
                          boxShadow: isHovered ? `0 0 8px ${bgColor}60` : "none",
                        }}
                        onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${cohort.label} | ${formatPeriodLabel(colIdx, period)}\nUsers: ${cell.activeUsers}/${cohort.totalUsers}\nRetention: ${cell.retentionRate.toFixed(1)}%\nRevenue: $${cell.revenue.toFixed(2)}\nGenerations: ${cell.generations}`}
                      >
                        {value > 0 ? displayValue : "–"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="flex items-center gap-3 p-3 pl-4 border-t border-border/20">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {viewMode === "retention" ? "Retention" : viewMode === "revenue" ? "Revenue" : "Activity"}:
          </span>
          <div className="flex items-center gap-1">
            {[0, 5, 15, 25, 40, 60, 80].map(rate => (
              <div key={rate} className="flex items-center gap-0.5">
                <div
                  className="w-4 h-3 rounded-sm"
                  style={{ backgroundColor: getRetentionColor(rate), opacity: 0.85 }}
                />
                <span className="text-[9px] text-muted-foreground">{rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummarySection({ summary, period }: { summary: CohortSummary; period: CohortPeriod }) {
  const trendIcon = summary.retentionTrend === "improving"
    ? <TrendingUp className="w-4 h-4 text-green-400" />
    : summary.retentionTrend === "declining"
      ? <TrendingDown className="w-4 h-4 text-red-400" />
      : <Minus className="w-4 h-4 text-amber-400" />;

  const trendColor = summary.retentionTrend === "improving" ? "#22c55e"
    : summary.retentionTrend === "declining" ? "#ef4444" : "#f59e0b";

  const trendLabel = summary.retentionTrend === "improving" ? "Improving"
    : summary.retentionTrend === "declining" ? "Declining" : "Stable";

  const p1Label = period === "weekly" ? "Week 1" : "Month 1";
  const p4Label = period === "weekly" ? "Week 4" : "Month 4";
  const p8Label = period === "weekly" ? "Week 8" : "Month 8";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <MetricCard
        title="Total Cohorts"
        value={String(summary.totalCohorts)}
        subtitle={`${summary.totalUsers} users total`}
        icon={Users}
        color="#6366f1"
      />
      <MetricCard
        title={`${p1Label} Retention`}
        value={`${summary.avgRetentionPeriod1.toFixed(1)}%`}
        subtitle="Avg across cohorts"
        icon={Activity}
        color={summary.avgRetentionPeriod1 >= 30 ? "#22c55e" : "#ef4444"}
      />
      <MetricCard
        title={`${p4Label} Retention`}
        value={`${summary.avgRetentionPeriod4.toFixed(1)}%`}
        subtitle="Avg across cohorts"
        icon={Target}
        color={summary.avgRetentionPeriod4 >= 15 ? "#22c55e" : "#ef4444"}
      />
      <MetricCard
        title="Avg Revenue/User"
        value={`$${summary.avgRevenuePerUser.toFixed(2)}`}
        subtitle="Lifetime value"
        icon={DollarSign}
        color="#f59e0b"
      />
      <MetricCard
        title="Best Cohort"
        value={summary.bestCohort?.label || "N/A"}
        subtitle={summary.bestCohort ? `${summary.bestCohort.avgRetention.toFixed(1)}% avg retention` : undefined}
        icon={Crown}
        color="#22c55e"
      />
      <MetricCard
        title="Retention Trend"
        value={trendLabel}
        subtitle="Recent vs older cohorts"
        icon={summary.retentionTrend === "improving" ? TrendingUp : summary.retentionTrend === "declining" ? TrendingDown : Minus}
        color={trendColor}
      />
    </div>
  );
}

function RetentionCurve({ cohorts, period }: { cohorts: CohortRow[]; period: CohortPeriod }) {
  // Calculate average retention per period offset across all cohorts
  const avgRetention = useMemo(() => {
    if (cohorts.length === 0) return [];
    const maxOffset = Math.max(...cohorts.flatMap(c => c.cells.map(cell => cell.periodOffset)));
    const result: { offset: number; avgRate: number; count: number }[] = [];

    for (let i = 0; i <= Math.min(maxOffset, 12); i++) {
      const rates = cohorts
        .map(c => c.cells.find(cell => cell.periodOffset === i))
        .filter((cell): cell is NonNullable<typeof cell> => cell != null && cell.activeUsers > 0)
        .map(cell => cell.retentionRate);

      if (rates.length > 0) {
        result.push({
          offset: i,
          avgRate: rates.reduce((s, r) => s + r, 0) / rates.length,
          count: rates.length,
        });
      }
    }
    return result;
  }, [cohorts]);

  if (avgRetention.length < 2) return null;

  const maxRate = 100;
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = avgRetention.map((d, i) => ({
    x: padding.left + (i / (avgRetention.length - 1)) * chartW,
    y: padding.top + (1 - d.avgRate / maxRate) * chartH,
    rate: d.avgRate,
    offset: d.offset,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = pathD + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <Card className="bg-card/60 border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          Average Retention Curve
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[600px]">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(rate => {
            const y = padding.top + (1 - rate / maxRate) * chartH;
            return (
              <g key={rate}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                  stroke="currentColor" strokeOpacity={0.1} strokeDasharray="3,3" />
                <text x={padding.left - 5} y={y + 3} textAnchor="end"
                  fill="currentColor" fillOpacity={0.4} fontSize={10}>
                  {rate}%
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={height - 5} textAnchor="middle"
              fill="currentColor" fillOpacity={0.4} fontSize={9}>
              {formatPeriodLabel(p.offset, period)}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#retentionGradient)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="#6366f1" stroke="#0f0f1a" strokeWidth={2} />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#6366f1" fontSize={9} fontWeight={600}>
                {p.rate.toFixed(0)}%
              </text>
            </g>
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
        </svg>
      </CardContent>
    </Card>
  );
}

export default function CohortAnalysis() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<CohortPeriod>("weekly");
  const [months, setMonths] = useState(6);

  const isAdmin = user?.role === "admin";

  const { data, isLoading } = trpc.cohort.getAnalysis.useQuery(
    { period, months },
    { enabled: isAdmin }
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-2">Admin Access Required</h2>
            <p className="text-sm text-muted-foreground">Cohort analysis is only available to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Cohort Analysis
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                User retention, engagement &amp; revenue by registration date
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
              {(["weekly", "monthly"] as const).map(p => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={() => setPeriod(p)}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {p === "weekly" ? "Weekly" : "Monthly"}
                </Button>
              ))}
            </div>

            {/* Time range selector */}
            <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
              {[3, 6, 12].map(m => (
                <Button
                  key={m}
                  variant={months === m ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 px-2.5"
                  onClick={() => setMonths(m)}
                >
                  {m}mo
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-card/60 border-border/40 animate-pulse">
                  <CardContent className="p-4 h-20" />
                </Card>
              ))}
            </div>
            <Card className="bg-card/60 border-border/40 animate-pulse">
              <CardContent className="p-4 h-64" />
            </Card>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <SummarySection summary={data.summary} period={period} />

            {/* Retention Heatmap */}
            <RetentionHeatmap
              cohorts={data.cohorts}
              period={period}
              maxOffset={data.maxPeriodOffset}
            />

            {/* Retention Curve */}
            <RetentionCurve cohorts={data.cohorts} period={period} />

            {/* Insights */}
            {data.summary.totalCohorts > 0 && (
              <Card className="bg-card/60 border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-400" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.summary.avgRetentionPeriod1 < 30 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs font-medium text-red-400">Low Early Retention</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {period === "weekly" ? "Week 1" : "Month 1"} retention is {data.summary.avgRetentionPeriod1.toFixed(1)}%.
                          Focus on onboarding experience and first-use value delivery.
                        </p>
                      </div>
                    )}
                    {data.summary.avgRetentionPeriod1 >= 30 && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs font-medium text-green-400">Strong Early Retention</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {period === "weekly" ? "Week 1" : "Month 1"} retention is {data.summary.avgRetentionPeriod1.toFixed(1)}%.
                          Users find value quickly after registration.
                        </p>
                      </div>
                    )}
                    {data.summary.retentionTrend === "improving" && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs font-medium text-green-400">Improving Trend</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recent cohorts retain better than older ones. Product improvements are working.
                        </p>
                      </div>
                    )}
                    {data.summary.retentionTrend === "declining" && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs font-medium text-red-400">Declining Trend</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recent cohorts retain worse than older ones. Investigate recent changes or traffic quality.
                        </p>
                      </div>
                    )}
                    {data.summary.avgRevenuePerUser > 0 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-xs font-medium text-amber-400">Revenue per User</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Average LTV is ${data.summary.avgLTV.toFixed(2)} per user.
                          {data.summary.avgLTV < 10 ? " Consider improving monetization touchpoints." : " Monetization is healthy."}
                        </p>
                      </div>
                    )}
                    {data.summary.bestCohort && data.summary.worstCohort && data.summary.bestCohort.label !== data.summary.worstCohort.label && (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-xs font-medium text-primary">Cohort Comparison</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Best: <span className="text-green-400 font-medium">{data.summary.bestCohort.label}</span> ({data.summary.bestCohort.avgRetention.toFixed(1)}%)
                          vs Worst: <span className="text-red-400 font-medium">{data.summary.worstCohort.label}</span> ({data.summary.worstCohort.avgRetention.toFixed(1)}%).
                          Analyze what drove the difference.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No data available. Users will appear as they register.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
