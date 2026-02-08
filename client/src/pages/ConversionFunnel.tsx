import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowDown, ArrowRight, TrendingUp, TrendingDown,
  Minus, Filter, Users, Zap, DollarSign, Eye, AlertTriangle,
  CheckCircle, Info, Percent
} from "lucide-react";
import { Link } from "wouter";
import type { FunnelStep, FunnelInsight, FunnelComparison } from "@shared/conversionFunnel";

function FunnelBar({ step, index, maxCount, isLast }: {
  step: FunnelStep; index: number; maxCount: number; isLast: boolean;
}) {
  const widthPercent = maxCount > 0 ? Math.max(8, (step.count / maxCount) * 100) : 8;

  return (
    <div className="relative">
      {/* Step bar */}
      <div className="flex items-center gap-4">
        {/* Step number */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: step.color, color: "#fff" }}
        >
          {index + 1}
        </div>

        {/* Bar + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-sm font-semibold text-foreground">{step.label}</span>
              <span className="text-xs text-muted-foreground ml-2">{step.description}</span>
            </div>
            <div className="text-right shrink-0 ml-3">
              <span className="text-lg font-bold" style={{ color: step.color }}>
                {step.count.toLocaleString()}
              </span>
              {index > 0 && (
                <span className="text-xs text-muted-foreground ml-1.5">
                  ({step.absoluteRate}% of total)
                </span>
              )}
            </div>
          </div>

          {/* Animated bar */}
          <div className="w-full bg-muted/20 rounded-full h-10 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 ease-out"
              style={{
                width: `${widthPercent}%`,
                background: `linear-gradient(90deg, ${step.color}cc, ${step.color})`,
              }}
            >
              {widthPercent > 15 && (
                <span className="text-xs font-semibold text-white">
                  {step.count.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drop-off indicator between steps */}
      {!isLast && (
        <div className="flex items-center gap-4 my-2">
          <div className="w-8 flex justify-center">
            <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <div className="flex-1 flex items-center gap-3 px-3 py-1.5 bg-muted/10 rounded-lg border border-border/20">
            <div className="flex items-center gap-1.5">
              <Percent className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Conversion:</span>
              <span className="text-xs font-semibold text-foreground">
                {/* Next step's conversion rate */}
              </span>
            </div>
            <div className="h-3 w-px bg-border/30" />
            <div className="flex items-center gap-1.5">
              <ArrowDown className="w-3 h-3 text-red-400" />
              <span className="text-xs text-muted-foreground">Drop-off:</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FunnelVisualization({ funnel, comparison }: {
  funnel: FunnelStep[]; comparison: FunnelComparison | null;
}) {
  const maxCount = funnel.length > 0 ? funnel[0].count : 0;

  if (funnel.every(s => s.count === 0)) {
    return (
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-8 text-center">
          <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No funnel data available for this period.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Data will appear as users interact with the platform.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {funnel.map((step, i) => (
          <div key={step.id}>
            {/* Step bar */}
            <div className="flex items-center gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: step.color, color: "#fff" }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{step.label}</span>
                    <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{step.description}</span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-lg font-bold" style={{ color: step.color }}>
                      {step.count.toLocaleString()}
                    </span>
                    {i > 0 && (
                      <span className="text-xs text-muted-foreground ml-1.5">
                        ({step.absoluteRate}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-9 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 ease-out"
                    style={{
                      width: `${maxCount > 0 ? Math.max(8, (step.count / maxCount) * 100) : 8}%`,
                      background: `linear-gradient(90deg, ${step.color}99, ${step.color})`,
                    }}
                  >
                    {(step.count / maxCount) * 100 > 15 && (
                      <span className="text-xs font-semibold text-white">
                        {step.count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drop-off connector */}
            {i < funnel.length - 1 && (
              <div className="flex items-center gap-4 my-2">
                <div className="w-8 flex justify-center">
                  <div className="w-px h-6 bg-border/30" />
                </div>
                <div className="flex-1 flex items-center gap-3 px-3 py-1.5 bg-muted/10 rounded-lg border border-border/20">
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-muted-foreground">Conv:</span>
                    <span className="text-xs font-bold text-green-400">
                      {funnel[i + 1].conversionRate}%
                    </span>
                  </div>
                  <div className="h-3 w-px bg-border/30" />
                  <div className="flex items-center gap-1.5">
                    <ArrowDown className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-muted-foreground">Drop:</span>
                    <span className="text-xs font-bold text-red-400">
                      {funnel[i + 1].dropOffRate}%
                    </span>
                  </div>
                  {comparison && (() => {
                    const change = comparison.changes.find(c => c.stepId === funnel[i + 1].id);
                    if (!change || Math.abs(change.change) < 0.5) return null;
                    const isUp = change.change > 0;
                    return (
                      <>
                        <div className="h-3 w-px bg-border/30" />
                        <div className="flex items-center gap-1">
                          {isUp ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                          <span className={`text-[10px] font-medium ${isUp ? "text-green-400" : "text-red-400"}`}>
                            {isUp ? "+" : ""}{change.change.toFixed(1)}pp
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StepCards({ funnel, comparison }: {
  funnel: FunnelStep[]; comparison: FunnelComparison | null;
}) {
  const icons = [Eye, Users, Zap, DollarSign];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {funnel.map((step, i) => {
        const Icon = icons[i] || Eye;
        const change = comparison?.changes.find(c => c.stepId === step.id);
        const prevStep = comparison?.previous.find(s => s.id === step.id);

        return (
          <Card key={step.id} className="bg-card/60 border-border/40">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{step.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: step.color }}>
                    {step.count.toLocaleString()}
                  </p>
                  {i > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.conversionRate}% from {funnel[i - 1].label.toLowerCase()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${step.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: step.color }} />
                  </div>
                  {change && Math.abs(change.change) >= 0.5 && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-medium ${change.change > 0 ? "text-green-400" : "text-red-400"}`}>
                      {change.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {change.change > 0 ? "+" : ""}{change.change.toFixed(1)}pp
                    </div>
                  )}
                  {prevStep && (
                    <span className="text-[10px] text-muted-foreground/50">
                      prev: {prevStep.count.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function InsightsSection({ insights }: { insights: FunnelInsight[] }) {
  if (insights.length === 0) return null;

  const iconMap = {
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  };

  const colorMap = {
    warning: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", icon: "text-red-400" },
    success: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", icon: "text-green-400" },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", icon: "text-blue-400" },
  };

  return (
    <Card className="bg-card/60 border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Actionable Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, i) => {
            const Icon = iconMap[insight.type];
            const colors = colorMap[insight.type];
            return (
              <div key={i} className={`p-3 ${colors.bg} border ${colors.border} rounded-lg`}>
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 ${colors.icon} shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-medium ${colors.text}`}>{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendChart({ days }: { days: number }) {
  const { data: trend } = trpc.funnel.getTrend.useQuery({ days });

  if (!trend || trend.length < 2) return null;

  const width = 700;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVisits = Math.max(...trend.map(d => d.visits), 1);
  const maxSignups = Math.max(...trend.map(d => d.signups), 1);
  const maxGens = Math.max(...trend.map(d => d.generations), 1);
  const maxVal = Math.max(maxVisits, maxSignups, maxGens);

  const series = [
    { key: "visits" as const, color: "#6366f1", label: "Visits" },
    { key: "signups" as const, color: "#8b5cf6", label: "Signups" },
    { key: "generations" as const, color: "#a855f7", label: "Generations" },
  ];

  return (
    <Card className="bg-card/60 border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Daily Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-3">
          {series.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(frac => {
            const y = padding.top + (1 - frac) * chartH;
            return (
              <g key={frac}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                  stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3,3" />
                <text x={padding.left - 5} y={y + 3} textAnchor="end"
                  fill="currentColor" fillOpacity={0.3} fontSize={9}>
                  {Math.round(maxVal * frac)}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          {series.map(s => {
            const points = trend.map((d, i) => ({
              x: padding.left + (i / (trend.length - 1)) * chartW,
              y: padding.top + (1 - d[s.key] / maxVal) * chartH,
            }));
            const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            return (
              <path key={s.key} d={pathD} fill="none" stroke={s.color}
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.8} />
            );
          })}

          {/* X axis labels (show every nth) */}
          {trend.filter((_, i) => i % Math.max(1, Math.floor(trend.length / 7)) === 0).map((d, i, arr) => {
            const idx = trend.indexOf(d);
            const x = padding.left + (idx / (trend.length - 1)) * chartW;
            return (
              <text key={i} x={x} y={height - 5} textAnchor="middle"
                fill="currentColor" fillOpacity={0.3} fontSize={8}>
                {d.date.slice(5)}
              </text>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

export default function ConversionFunnel() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const isAdmin = user?.role === "admin";

  const { data, isLoading } = trpc.funnel.getAnalysis.useQuery(
    { days },
    { enabled: isAdmin }
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-2">Admin Access Required</h2>
            <p className="text-sm text-muted-foreground">Conversion funnel is only available to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="container max-w-6xl mx-auto px-4 pt-6">
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
                <Filter className="w-5 h-5 text-primary" />
                Conversion Funnel
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visit → Sign Up → Generate → Purchase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
              {[7, 30, 90, 365].map(d => (
                <Button
                  key={d}
                  variant={days === d ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 px-2.5"
                  onClick={() => setDays(d)}
                >
                  {d <= 90 ? `${d}d` : "All"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-card/60 border-border/40 animate-pulse">
                  <CardContent className="p-4 h-24" />
                </Card>
              ))}
            </div>
            <Card className="bg-card/60 border-border/40 animate-pulse">
              <CardContent className="p-4 h-64" />
            </Card>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Overall metric banner */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Filter className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{data.periodLabel}</p>
                <p className="text-sm text-foreground mt-0.5">
                  <span className="text-2xl font-bold text-primary">{data.overallConversionRate}%</span>
                  <span className="text-muted-foreground ml-2">
                    overall conversion ({data.totalVisits.toLocaleString()} visits → {data.totalConversions.toLocaleString()} paid)
                  </span>
                </p>
              </div>
            </div>

            {/* Step cards */}
            <StepCards funnel={data.funnel} comparison={data.comparison} />

            {/* Main funnel visualization */}
            <FunnelVisualization funnel={data.funnel} comparison={data.comparison} />

            {/* Daily trend */}
            <TrendChart days={days} />

            {/* Insights */}
            <InsightsSection insights={data.insights} />
          </div>
        ) : (
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-8 text-center">
              <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No data available.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
