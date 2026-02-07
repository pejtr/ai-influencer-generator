import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDepthColor, getDepthLabel, processScrollDepthData } from "@shared/scrollDepth";
import { ArrowDown, Layers, Target, TrendingDown, ChevronDown } from "lucide-react";

interface ScrollDepthHeatmapProps {
  scrollData: Array<{
    metadata: any;
    createdAt: Date | string;
  }>;
  days: number;
}

function parseScrollEvents(data: Array<{ metadata: any; createdAt: Date | string }>) {
  const events: { depth: number; page: string; sessionId?: string }[] = [];
  for (const row of data) {
    const meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
    if (meta?.depth != null && meta?.url) {
      events.push({
        depth: Number(meta.depth),
        page: meta.url,
        sessionId: meta.sessionId,
      });
    }
  }
  return events;
}

export default function ScrollDepthHeatmap({ scrollData, days }: ScrollDepthHeatmapProps) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  const pageData = useMemo(() => {
    const events = parseScrollEvents(scrollData);
    return processScrollDepthData(events);
  }, [scrollData]);

  const activePage = useMemo(() => {
    if (selectedPage) return pageData.find(p => p.page === selectedPage) || null;
    return pageData[0] || null;
  }, [pageData, selectedPage]);

  if (pageData.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Scroll Depth Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            No scroll depth data yet. Data is collected as users scroll through pages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Scroll Depth Heatmap
          <span className="text-xs font-normal text-muted-foreground ml-auto">{days}d</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page selector */}
        <div className="relative">
          <select
            className="w-full bg-muted/30 border border-border/50 rounded-lg px-4 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedPage || pageData[0]?.page || ""}
            onChange={(e) => setSelectedPage(e.target.value)}
          >
            {pageData.map(p => (
              <option key={p.page} value={p.page}>
                {p.page} ({p.totalSessions} sessions)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {activePage && (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{activePage.totalSessions}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sessions</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{activePage.avgDepth.toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Depth</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{activePage.medianDepth.toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Median</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold" style={{ color: getDepthColor(activePage.foldLine) }}>
                  {activePage.foldLine}%
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">50% Drop-off</p>
              </div>
            </div>

            {/* Visual scroll depth heatmap */}
            <div className="relative">
              <div className="space-y-0.5">
                {activePage.zones.map((zone, i) => {
                  const color = getDepthColor(zone.percentage);
                  const isFoldLine = zone.depth === activePage.foldLine;

                  return (
                    <div key={zone.depth} className="relative group">
                      {/* Fold line indicator */}
                      {isFoldLine && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-red-400" />
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {/* Depth label */}
                        <div className="w-12 text-right text-[11px] text-muted-foreground font-mono shrink-0">
                          {zone.depth}%
                        </div>

                        {/* Bar */}
                        <div className="flex-1 relative h-8 bg-muted/20 rounded overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                            style={{
                              width: `${zone.percentage}%`,
                              backgroundColor: color,
                              opacity: 0.7,
                            }}
                          />
                          {/* Gradient overlay for depth effect */}
                          <div
                            className="absolute inset-y-0 left-0 rounded"
                            style={{
                              width: `${zone.percentage}%`,
                              background: `linear-gradient(90deg, ${color}33, ${color}11)`,
                            }}
                          />

                          {/* Labels inside bar */}
                          <div className="absolute inset-0 flex items-center justify-between px-3">
                            <span className="text-[11px] font-medium text-white/90 drop-shadow-sm">
                              {zone.percentage.toFixed(0)}% ({zone.sessions})
                            </span>
                            <span className="text-[10px] text-white/60 hidden sm:inline">
                              {getDepthLabel(zone.depth)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fold line annotation */}
                      {isFoldLine && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full">
                          <TrendingDown className="w-3 h-3" />
                          50% drop-off
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scroll direction indicator */}
              <div className="flex justify-center mt-3">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ArrowDown className="w-3 h-3" />
                  Scroll direction
                </div>
              </div>
            </div>

            {/* Color legend */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
              <span>Retention:</span>
              <div className="flex gap-1">
                {[
                  { color: "#22c55e", label: "80%+" },
                  { color: "#84cc16", label: "60-80%" },
                  { color: "#eab308", label: "40-60%" },
                  { color: "#f97316", label: "20-40%" },
                  { color: "#ef4444", label: "<20%" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-0.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color, opacity: 0.7 }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
