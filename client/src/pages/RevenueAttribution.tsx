import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, DollarSign, Users, TrendingUp, BarChart3, AlertTriangle,
  CheckCircle, Info, Loader2, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  CHANNEL_CONFIG, ALL_CHANNELS, type AcquisitionChannel, type ChannelMetrics,
  generateRevenueInsights, buildChannelComparison
} from "@shared/revenueAttribution";

export default function RevenueAttribution() {
  const { user } = useAuth();
  const [trendDays, setTrendDays] = useState(90);

  const { data: attribution, isLoading } = trpc.revenue.getAttribution.useQuery();
  const { data: ltvTrend } = trpc.revenue.getLtvTrend.useQuery({ days: trendDays });
  const { data: insightsData } = trpc.revenue.getInsights.useQuery();

  if (!user || user.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Admin access required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const insights = insightsData?.insights || [];
  const comparison = insightsData?.comparison || [];

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Revenue Attribution</h1>
            <p className="text-muted-foreground">LTV per acquisition channel &mdash; identify your most profitable traffic sources</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="w-4 h-4" /> Total Users
            </div>
            <div className="text-2xl font-bold">{attribution?.totals.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" /> Total Revenue
            </div>
            <div className="text-2xl font-bold">${(attribution?.totals.totalRevenue || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" /> Overall LTV
            </div>
            <div className="text-2xl font-bold">${(attribution?.totals.overallLtv || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" /> Paid Users
            </div>
            <div className="text-2xl font-bold">{attribution?.totals.totalPaidUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" /> Conversion
            </div>
            <div className="text-2xl font-bold">{(attribution?.totals.overallConversionRate || 0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Channel LTV Bars */}
      <Card>
        <CardHeader>
          <CardTitle>LTV by Acquisition Channel</CardTitle>
          <CardDescription>Lifetime value per user segmented by how they discovered the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <ChannelLtvBars channels={attribution?.channels || []} />
        </CardContent>
      </Card>

      {/* Channel Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Comparison</CardTitle>
          <CardDescription>Side-by-side metrics for all acquisition channels</CardDescription>
        </CardHeader>
        <CardContent>
          <ComparisonTable comparison={comparison} channels={attribution?.channels || []} />
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Subscription vs credit pack revenue per channel</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueBreakdown channels={attribution?.channels || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retention & Engagement</CardTitle>
            <CardDescription>30-day retention and days to first purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <RetentionChart channels={attribution?.channels || []} />
          </CardContent>
        </Card>
      </div>

      {/* LTV Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue by acquisition channel</CardDescription>
            </div>
            <div className="flex gap-2">
              {[30, 60, 90].map(d => (
                <Button key={d} variant={trendDays === d ? "default" : "outline"} size="sm"
                  onClick={() => setTrendDays(d)}>{d}d</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LtvTrendChart data={ltvTrend || []} />
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
          <CardDescription>Actionable findings based on your revenue data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-muted-foreground text-sm">No insights available yet. Data will appear as users sign up and make purchases.</p>
          ) : (
            insights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                insight.type === "success" ? "border-green-500/30 bg-green-500/5" :
                insight.type === "warning" ? "border-yellow-500/30 bg-yellow-500/5" :
                "border-blue-500/30 bg-blue-500/5"
              }`}>
                {insight.type === "success" ? <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" /> :
                 insight.type === "warning" ? <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" /> :
                 <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />}
                <div>
                  <div className="font-medium text-sm">{insight.title}</div>
                  <div className="text-sm text-muted-foreground">{insight.message}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Sub-components ----

function ChannelLtvBars({ channels }: { channels: ChannelMetrics[] }) {
  const maxLtv = Math.max(...channels.map(c => c.ltv), 1);

  return (
    <div className="space-y-4">
      {channels.map(ch => {
        const config = CHANNEL_CONFIG[ch.channel];
        const barWidth = (ch.ltv / maxLtv) * 100;
        return (
          <div key={ch.channel} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{config.icon}</span>
                <span className="font-medium">{config.label}</span>
                <Badge variant="outline" className="text-xs">{ch.totalUsers} users</Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{ch.paidUsers} paid</span>
                <span className="font-bold">${ch.ltv.toFixed(2)}</span>
              </div>
            </div>
            <div className="h-8 bg-muted rounded-md overflow-hidden relative">
              <div
                className="h-full rounded-md transition-all duration-700 ease-out flex items-center px-3"
                style={{
                  width: `${Math.max(barWidth, 2)}%`,
                  background: `linear-gradient(90deg, ${config.color}cc, ${config.color}88)`,
                }}
              >
                {barWidth > 15 && (
                  <span className="text-xs font-medium text-white">${ch.ltv.toFixed(2)} / user</span>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Conv: {ch.conversionRate}%</span>
              <span>AOV: ${ch.avgOrderValue.toFixed(2)}</span>
              <span>30d Ret: {ch.retentionRate30d}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonTable({ comparison, channels }: { comparison: any[]; channels: ChannelMetrics[] }) {
  if (comparison.length === 0) {
    return <p className="text-muted-foreground text-sm">No comparison data available.</p>;
  }

  const activeChannels = channels.filter(c => c.totalUsers > 0);
  if (activeChannels.length === 0) {
    return <p className="text-muted-foreground text-sm">No active channels yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium">Metric</th>
            {activeChannels.map(ch => (
              <th key={ch.channel} className="text-right py-2 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  {CHANNEL_CONFIG[ch.channel].icon} {CHANNEL_CONFIG[ch.channel].label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-2 pr-4 text-muted-foreground">{row.metric}</td>
              {activeChannels.map(ch => {
                const val = row.values[ch.channel];
                const isBest = row.best === ch.channel;
                return (
                  <td key={ch.channel} className={`text-right py-2 px-3 ${isBest ? "font-bold text-green-500" : ""}`}>
                    {val !== undefined ? String(val) : "—"}
                    {isBest && " ★"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RevenueBreakdown({ channels }: { channels: ChannelMetrics[] }) {
  const totalRevenue = channels.reduce((s, c) => s + c.totalRevenue, 0);
  if (totalRevenue === 0) {
    return <p className="text-muted-foreground text-sm">No revenue data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {channels.filter(c => c.totalRevenue > 0).map(ch => {
        const config = CHANNEL_CONFIG[ch.channel];
        const pct = (ch.totalRevenue / totalRevenue) * 100;
        const subPct = ch.totalRevenue > 0 ? (ch.subscriptionRevenue / ch.totalRevenue) * 100 : 0;
        return (
          <div key={ch.channel} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">{config.icon} {config.label}</span>
              <span className="font-medium">${ch.totalRevenue.toFixed(2)} ({pct.toFixed(1)}%)</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden flex">
              <div className="h-full" style={{
                width: `${subPct}%`,
                backgroundColor: config.color,
                opacity: 0.9,
              }} title={`Subscriptions: $${ch.subscriptionRevenue.toFixed(2)}`} />
              <div className="h-full" style={{
                width: `${100 - subPct}%`,
                backgroundColor: config.color,
                opacity: 0.4,
              }} title={`Credit Packs: $${ch.creditPackRevenue.toFixed(2)}`} />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Subs: ${ch.subscriptionRevenue.toFixed(2)}</span>
              <span>Credits: ${ch.creditPackRevenue.toFixed(2)}</span>
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/90 inline-block" /> Subscriptions</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/40 inline-block" /> Credit Packs</span>
      </div>
    </div>
  );
}

function RetentionChart({ channels }: { channels: ChannelMetrics[] }) {
  const activeChannels = channels.filter(c => c.totalUsers > 0);
  if (activeChannels.length === 0) {
    return <p className="text-muted-foreground text-sm">No retention data yet.</p>;
  }

  const maxRetention = Math.max(...activeChannels.map(c => c.retentionRate30d), 1);

  return (
    <div className="space-y-4">
      {activeChannels.map(ch => {
        const config = CHANNEL_CONFIG[ch.channel];
        return (
          <div key={ch.channel} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">{config.icon} {config.label}</span>
              <span className="font-medium">{ch.retentionRate30d}% retained</span>
            </div>
            <div className="h-5 bg-muted rounded-md overflow-hidden">
              <div className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${(ch.retentionRate30d / Math.max(maxRetention, 1)) * 100}%`,
                  backgroundColor: config.color,
                  opacity: 0.7,
                }} />
            </div>
            <div className="text-xs text-muted-foreground">
              Avg {ch.firstPurchaseDays.toFixed(1)} days to first purchase
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LtvTrendChart({ data }: { data: Array<{ date: string; channel: string; revenue: number; userCount: number }> }) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">No revenue trend data available yet.</p>;
  }

  // Group by date, sum revenue per channel
  const dateMap = new Map<string, Record<string, number>>();
  data.forEach(d => {
    const existing = dateMap.get(d.date) || {};
    existing[d.channel] = (existing[d.channel] || 0) + d.revenue;
    dateMap.set(d.date, existing);
  });

  const dates = Array.from(dateMap.keys()).sort();
  const maxRevenue = Math.max(...dates.map(d => {
    const vals = dateMap.get(d)!;
    return Object.values(vals).reduce((s, v) => s + v, 0);
  }), 1);

  const svgWidth = 800;
  const svgHeight = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 50 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ minWidth: 400 }}>
        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padding.top + chartH * (1 - pct);
          return (
            <g key={pct}>
              <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y}
                stroke="currentColor" strokeOpacity={0.1} />
              <text x={padding.left - 5} y={y + 4} textAnchor="end"
                className="fill-muted-foreground" fontSize={10}>
                ${(maxRevenue * pct).toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Stacked bars */}
        {dates.map((date, i) => {
          const vals = dateMap.get(date)!;
          const barWidth = Math.max(chartW / dates.length - 2, 2);
          const x = padding.left + (i / dates.length) * chartW + 1;
          let yOffset = 0;

          return (
            <g key={date}>
              {ALL_CHANNELS.map(ch => {
                const val = vals[ch] || 0;
                const barH = (val / maxRevenue) * chartH;
                const y = padding.top + chartH - yOffset - barH;
                yOffset += barH;
                if (val === 0) return null;
                return (
                  <rect key={ch} x={x} y={y} width={barWidth} height={barH}
                    fill={CHANNEL_CONFIG[ch].color} opacity={0.7} rx={1}>
                    <title>{`${date} - ${CHANNEL_CONFIG[ch].label}: $${val.toFixed(2)}`}</title>
                  </rect>
                );
              })}
              {/* X label every ~5th bar */}
              {i % Math.max(Math.floor(dates.length / 8), 1) === 0 && (
                <text x={x + barWidth / 2} y={svgHeight - 5} textAnchor="middle"
                  className="fill-muted-foreground" fontSize={9}>
                  {date.slice(5)}
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        {ALL_CHANNELS.map((ch, i) => (
          <g key={ch} transform={`translate(${padding.left + i * 100}, ${svgHeight - 18})`}>
            <rect width={8} height={8} fill={CHANNEL_CONFIG[ch].color} opacity={0.7} rx={1} />
            <text x={12} y={8} className="fill-muted-foreground" fontSize={9}>{CHANNEL_CONFIG[ch].label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
