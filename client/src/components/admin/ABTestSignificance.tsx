import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateABTestSignificance,
  type VariantStats,
  type VariantWithCI,
} from "@shared/abTestStats";
import { INSTALL_BANNER_VARIANTS } from "@/lib/abTest";
import {
  BarChart3,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Target,
} from "lucide-react";

interface ABTestSignificanceProps {
  /** Raw per-variant data from the API */
  variantData: Array<{
    eventType: string;
    metadata: any;
    count: number;
  }>;
  days: number;
}

function parseVariantId(metadata: any): string {
  if (!metadata) return "unknown";
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return parsed.variantId || "unknown";
    } catch {
      return "unknown";
    }
  }
  return metadata.variantId || "unknown";
}

export default function ABTestSignificance({ variantData, days }: ABTestSignificanceProps) {
  const significance = useMemo(() => {
    if (!variantData || variantData.length === 0) return null;

    // Aggregate per-variant stats
    const variantMap = new Map<string, { impressions: number; clicks: number; dismissals: number }>();

    // Initialize all known variants
    for (const v of INSTALL_BANNER_VARIANTS) {
      variantMap.set(v.id, { impressions: 0, clicks: 0, dismissals: 0 });
    }

    for (const row of variantData) {
      const variantId = parseVariantId(row.metadata);
      if (!variantMap.has(variantId)) {
        variantMap.set(variantId, { impressions: 0, clicks: 0, dismissals: 0 });
      }
      const stats = variantMap.get(variantId)!;

      if (row.eventType === "ab_variant_assigned") {
        stats.impressions += Number(row.count);
      } else if (row.eventType === "ab_install_clicked") {
        stats.clicks += Number(row.count);
      } else if (row.eventType === "ab_dismiss_clicked") {
        stats.dismissals += Number(row.count);
      }
    }

    // Build VariantStats array
    const variants: VariantStats[] = [];
    Array.from(variantMap.entries()).forEach(([variantId, stats]) => {
      if (stats.impressions === 0) return;
      variants.push({
        variantId,
        impressions: stats.impressions,
        conversions: stats.clicks,
        dismissals: stats.dismissals,
        conversionRate: stats.impressions > 0 ? stats.clicks / stats.impressions : 0,
      });
    });

    if (variants.length === 0) return null;

    return calculateABTestSignificance(variants, 0.95);
  }, [variantData]);

  if (!significance) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            A/B Test Statistical Significance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            No A/B test data yet. Install banner variants are being tested automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { isSignificant, pValue, winner, relativeImprovement, variants, minSampleSize, totalSamples, summary } = significance;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          A/B Test Statistical Significance
          <span className="text-xs font-normal text-muted-foreground ml-auto">{days}d</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Significance Status */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          isSignificant 
            ? "bg-green-500/10 border border-green-500/20" 
            : "bg-yellow-500/10 border border-yellow-500/20"
        }`}>
          {isSignificant ? (
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" />
          )}
          <div>
            <p className={`font-semibold text-sm ${isSignificant ? "text-green-500" : "text-yellow-500"}`}>
              {isSignificant ? "Statistically Significant" : "Not Yet Significant"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{summary}</p>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xl font-bold font-mono">{pValue.toFixed(4)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">p-value</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xl font-bold">{totalSamples}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Samples</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xl font-bold">{minSampleSize * variants.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Min. Needed</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-xl font-bold">95%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</p>
          </div>
        </div>

        {/* Sample Size Progress */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Sample Progress</span>
            <span>{Math.min(100, Math.round((totalSamples / (minSampleSize * variants.length)) * 100))}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isSignificant ? "bg-green-500" : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(100, (totalSamples / (minSampleSize * variants.length)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Per-Variant Breakdown */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Variant Performance
          </h4>
          <div className="space-y-3">
            {variants
              .sort((a, b) => b.conversionRate - a.conversionRate)
              .map((v: VariantWithCI) => {
                const isWinner = winner === v.variantId;
                const variantConfig = INSTALL_BANNER_VARIANTS.find(bv => bv.id === v.variantId);

                return (
                  <div
                    key={v.variantId}
                    className={`p-3 rounded-lg border transition-colors ${
                      isWinner
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-border/30 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                        <span className="font-medium text-sm capitalize">
                          {variantConfig?.title || v.variantId}
                        </span>
                        {v.variantId === "control" && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">CONTROL</span>
                        )}
                      </div>
                      <span className={`font-bold text-sm ${isWinner ? "text-green-500" : ""}`}>
                        {(v.conversionRate * 100).toFixed(2)}%
                      </span>
                    </div>

                    {/* Confidence Interval Bar */}
                    <div className="relative h-6 bg-muted/50 rounded-md overflow-hidden mb-2">
                      {/* CI range */}
                      <div
                        className={`absolute top-0 h-full rounded-md ${
                          isWinner ? "bg-green-500/30" : "bg-blue-500/20"
                        }`}
                        style={{
                          left: `${v.ciLower * 100}%`,
                          width: `${Math.max(0.5, (v.ciUpper - v.ciLower) * 100)}%`,
                        }}
                      />
                      {/* Point estimate */}
                      <div
                        className={`absolute top-0 h-full w-0.5 ${
                          isWinner ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ left: `${v.conversionRate * 100}%` }}
                      />
                      {/* Labels */}
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] text-muted-foreground">
                        <span>{(v.ciLower * 100).toFixed(1)}%</span>
                        <span>{(v.ciUpper * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-4 text-[11px] text-muted-foreground">
                      <span>{v.impressions} views</span>
                      <span className="text-green-500">{v.conversions} installs</span>
                      <span className="text-red-400">{v.dismissals} dismissed</span>
                      <span>SE: ±{(v.standardError * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Winner announcement */}
        {isSignificant && winner && relativeImprovement !== null && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <TrendingUp className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-green-500">
                Winner: "{INSTALL_BANNER_VARIANTS.find(v => v.id === winner)?.title || winner}"
              </p>
              <p className="text-xs text-muted-foreground">
                {relativeImprovement > 0 ? "+" : ""}{relativeImprovement}% improvement over control.
                Recommend implementing this variant as the default.
              </p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
          <span>CI = 95% Wilson Score Confidence Interval</span>
          <span>SE = Standard Error</span>
          <span>p-value via Chi-Squared Test</span>
        </div>
      </CardContent>
    </Card>
  );
}
