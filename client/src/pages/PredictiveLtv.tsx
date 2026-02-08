import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PredictiveLtv() {
  const { user } = useAuth();
  const [totalBudget, setTotalBudget] = useState<number>(1000);

  const { data: ltvData, isLoading: ltvLoading } = trpc.predictive.getLtvPredictions.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: budgetData, isLoading: budgetLoading } = trpc.predictive.getBudgetReallocation.useQuery(
    { totalBudget },
    { enabled: !!user && user.role === "admin" }
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const isLoading = ltvLoading || budgetLoading;
  const predictions = ltvData?.predictions || [];

  const formatCurrency = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Find best predicted channel
  const bestPredicted = useMemo(() => {
    if (predictions.length === 0) return null;
    return predictions.reduce((best, p) => p.predicted365d > best.predicted365d ? p : best, predictions[0]);
  }, [predictions]);

  // Max LTV for bar scaling
  const maxLtv = useMemo(() => {
    if (predictions.length === 0) return 1;
    return Math.max(...predictions.map(p => Math.max(p.currentLtv, p.predicted90d, p.predicted180d, p.predicted365d)), 1);
  }, [predictions]);

  const channelColors: Record<string, string> = {
    organic: "#10b981",
    paid: "#3b82f6",
    affiliate: "#f59e0b",
    direct: "#8b5cf6",
    social: "#ec4899",
  };

  return (
    <div className="container py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictive LTV & Budget Optimization</h1>
          <p className="text-muted-foreground mt-1">
            Forecast future user value and optimize marketing budget allocation
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/analytics-dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" size="sm">Back to Admin</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg" />)}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Best Channel (Predicted 365d)</p>
                <p className="text-2xl font-bold capitalize mt-1">{bestPredicted?.channel || "N/A"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {bestPredicted ? formatCurrency(bestPredicted.predicted365d) + " predicted LTV" : "No data"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Predicted LTV (365d)</p>
                <p className="text-2xl font-bold mt-1">
                  {predictions.length > 0
                    ? formatCurrency(predictions.reduce((s, p) => s + p.predicted365d, 0) / predictions.length)
                    : "$0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Across {predictions.length} channels</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Data Points</p>
                <p className="text-2xl font-bold mt-1">{ltvData?.cohortDataPoints || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Cohort data points used</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Highest Growth Potential</p>
                <p className="text-2xl font-bold capitalize mt-1">
                  {predictions.length > 0
                    ? predictions.reduce((best, p) => {
                        const growth = p.currentLtv > 0 ? (p.predicted365d - p.currentLtv) / p.currentLtv : 0;
                        const bestGrowth = best.currentLtv > 0 ? (best.predicted365d - best.currentLtv) / best.currentLtv : 0;
                        return growth > bestGrowth ? p : best;
                      }, predictions[0]).channel
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Highest predicted growth rate</p>
              </CardContent>
            </Card>
          </div>

          {/* LTV Predictions Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>LTV Predictions by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No prediction data available. More user activity data is needed.
                </p>
              ) : (
                <div className="space-y-6">
                  {predictions.map(pred => {
                    const color = channelColors[pred.channel] || "#6b7280";
                    return (
                      <div key={pred.channel} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-medium capitalize">{pred.channel}</span>
                            <Badge variant="outline" className="text-xs">
                              Confidence: {Math.round(pred.confidence * 100)}%
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Current: {formatCurrency(pred.currentLtv)}
                          </span>
                        </div>
                        {/* Bar chart for time horizons */}
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          {[
                            { label: "Current", value: pred.currentLtv },
                            { label: "90d", value: pred.predicted90d },
                            { label: "180d", value: pred.predicted180d },
                            { label: "365d", value: pred.predicted365d },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <div className="flex items-end h-16 mb-1">
                                <div
                                  className="w-full rounded-t transition-all duration-500"
                                  style={{
                                    backgroundColor: color,
                                    height: `${Math.max(4, (value / maxLtv) * 100)}%`,
                                    opacity: label === "Current" ? 0.5 : label === "90d" ? 0.65 : label === "180d" ? 0.8 : 1,
                                  }}
                                />
                              </div>
                              <p className="text-center text-muted-foreground">{label}</p>
                              <p className="text-center font-medium">{formatCurrency(value)}</p>
                            </div>
                          ))}
                        </div>
                        {/* Growth indicator */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Predicted 365d growth:</span>
                          <span className={pred.predicted365d > pred.currentLtv ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                            {pred.currentLtv > 0
                              ? `${((pred.predicted365d - pred.currentLtv) / pred.currentLtv * 100).toFixed(0)}%`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Reallocation */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Budget Reallocation Recommendations</CardTitle>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Total Budget:</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">$</span>
                    <input
                      type="number"
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Math.max(0, Number(e.target.value)))}
                      className="w-24 px-2 py-1 border rounded text-sm bg-background"
                      min={0}
                      step={100}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!budgetData || budgetData.allocations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No budget data available. Add cost tracking data first.
                </p>
              ) : (
                <>
                  {/* Allocation Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Channel</th>
                          <th className="text-right py-2 font-medium">Current Spend</th>
                          <th className="text-right py-2 font-medium">Recommended</th>
                          <th className="text-right py-2 font-medium">Change</th>
                          <th className="text-right py-2 font-medium">Expected ROAS</th>
                          <th className="text-right py-2 font-medium">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetData.allocations.map(alloc => {
                          const change = alloc.recommendedSpend - alloc.currentSpend;
                          return (
                            <tr key={alloc.channel} className="border-b">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channelColors[alloc.channel] || "#6b7280" }} />
                                  <span className="capitalize font-medium">{alloc.channel}</span>
                                </div>
                              </td>
                              <td className="text-right py-3">{formatCurrency(alloc.currentSpend)}</td>
                              <td className="text-right py-3 font-medium">{formatCurrency(alloc.recommendedSpend)}</td>
                              <td className={`text-right py-3 ${change > 0 ? "text-emerald-500" : change < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                {change > 0 ? "+" : ""}{formatCurrency(change)}
                              </td>
                              <td className="text-right py-3">{alloc.expectedRoas.toFixed(1)}x</td>
                              <td className="text-right py-3">
                                <Badge variant={alloc.expectedRoas >= 3 ? "default" : alloc.expectedRoas >= 1 ? "secondary" : "outline"}>
                                  {alloc.expectedRoas.toFixed(1)}x
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Allocation Visual */}
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Recommended Budget Allocation</p>
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      {(() => {
                    const totalRec = budgetData.allocations.reduce((s, a) => s + a.recommendedSpend, 0) || 1;
                    return budgetData.allocations
                      .filter(a => a.recommendedSpend > 0)
                      .map(alloc => {
                        const pct = Math.round((alloc.recommendedSpend / totalRec) * 100);
                        return (
                          <div
                            key={alloc.channel}
                            className="flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              backgroundColor: channelColors[alloc.channel] || "#6b7280",
                              width: `${pct}%`,
                              minWidth: pct > 5 ? "auto" : "0",
                            }}
                            title={`${alloc.channel}: ${pct}%`}
                          >
                            {pct >= 10 ? `${alloc.channel} ${pct}%` : ""}
                          </div>
                        );
                      });
                  })()}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {(() => {
                        const totalRec = budgetData.allocations.reduce((s, a) => s + a.recommendedSpend, 0) || 1;
                        return budgetData.allocations.map(alloc => {
                          const pct = Math.round((alloc.recommendedSpend / totalRec) * 100);
                          return (
                            <div key={alloc.channel} className="flex items-center gap-1 text-xs">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channelColors[alloc.channel] || "#6b7280" }} />
                              <span className="capitalize">{alloc.channel}: {pct}%</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Insights */}
                  {budgetData.insights && budgetData.insights.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Key Insights</p>
                      <div className="space-y-2">
                        {budgetData.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-muted/50">
                            <span>{insight.type === "success" ? "📈" : insight.type === "warning" ? "⚠️" : "💡"}</span>
                            <span>{insight.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Methodology Note */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Methodology:</strong> LTV predictions use exponential decay curve fitting on historical cohort revenue data.
                Budget recommendations are based on a composite score of predicted LTV, current ROAS, customer acquisition efficiency,
                and revenue momentum. Confidence levels reflect the amount of historical data available per channel.
                Predictions improve as more user activity data accumulates over time.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
