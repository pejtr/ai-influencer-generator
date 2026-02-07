import { useMemo, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  calculateTrafficAllocation,
  type AutoOptimizeConfig,
  DEFAULT_AUTO_OPTIMIZE_CONFIG,
} from "@shared/abAutoOptimize";
import { INSTALL_BANNER_VARIANTS, isAutoOptimizeEnabled, setAutoOptimize, setCachedWeights } from "@/lib/abTest";
import {
  Zap,
  BarChart3,
  Trophy,
  Percent,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

interface ABAutoOptimizeProps {
  variantData: Array<{
    eventType: string;
    metadata: any;
    count: number;
  }>;
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

export default function ABAutoOptimize({ variantData }: ABAutoOptimizeProps) {
  const [enabled, setEnabled] = useState(isAutoOptimizeEnabled());
  const [config, setConfig] = useState<AutoOptimizeConfig>({
    ...DEFAULT_AUTO_OPTIMIZE_CONFIG,
    enabled,
  });

  // Parse variant stats from raw data
  const variantStats = useMemo(() => {
    if (!variantData || variantData.length === 0) return [];

    const variantMap = new Map<string, { impressions: number; conversions: number }>();

    for (const v of INSTALL_BANNER_VARIANTS) {
      variantMap.set(v.id, { impressions: 0, conversions: 0 });
    }

    for (const row of variantData) {
      const variantId = parseVariantId(row.metadata);
      if (!variantMap.has(variantId)) {
        variantMap.set(variantId, { impressions: 0, conversions: 0 });
      }
      const stats = variantMap.get(variantId)!;

      if (row.eventType === "ab_variant_assigned") {
        stats.impressions += Number(row.count);
      } else if (row.eventType === "ab_install_clicked") {
        stats.conversions += Number(row.count);
      }
    }

    return Array.from(variantMap.entries())
      .filter(([_, stats]) => stats.impressions > 0)
      .map(([variantId, stats]) => ({
        variantId,
        impressions: stats.impressions,
        conversions: stats.conversions,
      }));
  }, [variantData]);

  // Calculate allocations
  const allocations = useMemo(() => {
    return calculateTrafficAllocation(variantStats, { ...config, enabled });
  }, [variantStats, config, enabled]);

  // Update cached weights when allocations change
  useEffect(() => {
    if (enabled && allocations.length > 0) {
      const weights: Record<string, number> = {};
      for (const alloc of allocations) {
        weights[alloc.variantId] = alloc.weight;
      }
      setCachedWeights(weights);
    }
  }, [allocations, enabled]);

  const handleToggle = useCallback((checked: boolean) => {
    setEnabled(checked);
    setAutoOptimize(checked);
    setConfig(prev => ({ ...prev, enabled: checked }));
    toast.success(checked ? "Auto-optimization enabled" : "Auto-optimization disabled (equal split)");
  }, []);

  const handleRefreshWeights = useCallback(() => {
    if (allocations.length > 0) {
      const weights: Record<string, number> = {};
      for (const alloc of allocations) {
        weights[alloc.variantId] = alloc.weight;
      }
      setCachedWeights(weights);
      toast.success("Traffic weights updated");
    }
  }, [allocations]);

  const maxWeight = Math.max(...allocations.map(a => a.weight), 0.01);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Auto-Optimization (Thompson Sampling)
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {enabled ? "Active" : "Equal Split"}
            </span>
            <Switch checked={enabled} onCheckedChange={handleToggle} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status banner */}
        <div className={`flex items-center gap-3 p-3 rounded-xl ${
          enabled
            ? "bg-amber-500/10 border border-amber-500/20"
            : "bg-muted/30 border border-border/30"
        }`}>
          {enabled ? (
            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
          ) : (
            <BarChart3 className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${enabled ? "text-amber-500" : "text-muted-foreground"}`}>
              {enabled
                ? "Multi-Armed Bandit active — traffic shifts toward best performers"
                : "Equal traffic split — each variant gets 25% of traffic"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {enabled
                ? `Min ${config.minExplorationWeight * 100}% exploration per variant, ${config.minImpressionsPerVariant} min impressions before optimization`
                : "Enable to automatically allocate more traffic to winning variants"}
            </p>
          </div>
          {enabled && (
            <Button variant="ghost" size="sm" onClick={handleRefreshWeights} className="shrink-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Traffic allocation visualization */}
        {allocations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              Traffic Allocation
            </h4>
            <div className="space-y-3">
              {allocations
                .sort((a, b) => b.weight - a.weight)
                .map((alloc) => {
                  const variantConfig = INSTALL_BANNER_VARIANTS.find(v => v.id === alloc.variantId);
                  const isTop = alloc.weight === maxWeight;

                  return (
                    <div
                      key={alloc.variantId}
                      className={`p-3 rounded-lg border transition-colors ${
                        isTop && enabled
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-border/30 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isTop && enabled && <Trophy className="w-4 h-4 text-amber-500" />}
                          <span className="font-medium text-sm">
                            {variantConfig?.title || alloc.variantId}
                          </span>
                          {alloc.variantId === "control" && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">CONTROL</span>
                          )}
                        </div>
                        <span className={`font-bold text-sm font-mono ${isTop && enabled ? "text-amber-500" : ""}`}>
                          {(alloc.weight * 100).toFixed(1)}%
                        </span>
                      </div>

                      {/* Weight bar */}
                      <div className="h-3 bg-muted/30 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isTop && enabled ? "bg-amber-500" : "bg-primary/60"
                          }`}
                          style={{ width: `${alloc.weight * 100}%` }}
                        />
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 text-[11px] text-muted-foreground">
                        <span>CR: {(alloc.conversionRate * 100).toFixed(2)}%</span>
                        <span>P(best): {(alloc.probBest * 100).toFixed(1)}%</span>
                        <span>α={alloc.alpha} β={alloc.beta}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Config section */}
        {enabled && (
          <div className="pt-3 border-t border-border/30">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              Configuration
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase">Min Impressions</p>
                <p className="font-mono font-medium">{config.minImpressionsPerVariant}</p>
              </div>
              <div className="p-2 rounded bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase">Min Exploration</p>
                <p className="font-mono font-medium">{(config.minExplorationWeight * 100).toFixed(0)}%</p>
              </div>
              <div className="p-2 rounded bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase">Simulations</p>
                <p className="font-mono font-medium">{config.simulations.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase">Cache Duration</p>
                <p className="font-mono font-medium">30 min</p>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
          <span>CR = Conversion Rate</span>
          <span>P(best) = Probability of being best variant</span>
          <span>α/β = Beta distribution parameters</span>
        </div>
      </CardContent>
    </Card>
  );
}
