import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MODEL_COLORS: Record<string, string> = {
  first_touch: "#3b82f6",
  last_touch: "#ef4444",
  linear: "#22c55e",
  time_decay: "#f59e0b",
};

const MODEL_LABELS: Record<string, string> = {
  first_touch: "First Touch",
  last_touch: "Last Touch",
  linear: "Linear",
  time_decay: "Time Decay",
};

export default function AttributionModels() {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const { data, isLoading } = trpc.attribution.compare.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const maxRevenue = data?.results
    ? Math.max(...data.results.flatMap(r => Object.values(r.channelCredits)))
    : 1;

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Attribution Models</h1>
        <p className="text-muted-foreground mt-1">
          Compare first-touch, last-touch, linear, and time-decay attribution to understand channel roles
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{data?.totalJourneys ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Total User Journeys</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{data?.journeysWithRevenue ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Journeys with Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">
              ${data?.results?.[0]?.totalRevenue?.toFixed(2) ?? "0.00"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">4</div>
            <div className="text-sm text-muted-foreground mt-1">Models Compared</div>
          </CardContent>
        </Card>
      </div>

      {/* Model Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        {Object.entries(MODEL_LABELS).map(([key, label]) => {
          const modelInfo = data?.models?.[key as keyof typeof data.models];
          return (
            <button
              key={key}
              onClick={() => setSelectedModel(selectedModel === key ? null : key)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedModel === key
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[key] }} />
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {modelInfo?.description ?? ""}
              </p>
            </button>
          );
        })}
      </div>

      {/* Revenue Comparison Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revenue Attribution by Channel</CardTitle>
          <CardDescription>How each model distributes revenue credit across channels</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.comparison || data.comparison.every(c => c.firstTouch === 0 && c.lastTouch === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No touchpoint data yet</p>
              <p className="text-sm">User touchpoints will be collected automatically as users interact with the platform</p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.comparison.map((row) => (
                <div key={row.channel} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize text-sm">{row.channel}</span>
                  </div>
                  <div className="space-y-1">
                    {(["firstTouch", "lastTouch", "linear", "timeDecay"] as const).map((model) => {
                      const modelKey = model === "firstTouch" ? "first_touch" :
                        model === "lastTouch" ? "last_touch" :
                        model === "timeDecay" ? "time_decay" : "linear";
                      const value = row[model];
                      const width = maxRevenue > 0 ? (value / maxRevenue) * 100 : 0;

                      if (selectedModel && selectedModel !== modelKey) return null;

                      return (
                        <div key={model} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20 shrink-0">
                            {MODEL_LABELS[modelKey]}
                          </span>
                          <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(width, value > 0 ? 2 : 0)}%`,
                                backgroundColor: MODEL_COLORS[modelKey],
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono w-16 text-right">${value.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Detailed Comparison Table</CardTitle>
          <CardDescription>Revenue attributed to each channel by model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Channel</th>
                  <th className="text-right py-2 px-3" style={{ color: MODEL_COLORS.first_touch }}>First Touch</th>
                  <th className="text-right py-2 px-3" style={{ color: MODEL_COLORS.last_touch }}>Last Touch</th>
                  <th className="text-right py-2 px-3" style={{ color: MODEL_COLORS.linear }}>Linear</th>
                  <th className="text-right py-2 px-3" style={{ color: MODEL_COLORS.time_decay }}>Time Decay</th>
                  <th className="text-right py-2 px-3">Variance</th>
                </tr>
              </thead>
              <tbody>
                {data?.comparison?.map((row) => {
                  const values = [row.firstTouch, row.lastTouch, row.linear, row.timeDecay];
                  const max = Math.max(...values);
                  const min = Math.min(...values);
                  const variance = max - min;

                  return (
                    <tr key={row.channel} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium capitalize">{row.channel}</td>
                      <td className={`py-2 px-3 text-right ${row.firstTouch === max ? "font-bold" : ""}`}>
                        ${row.firstTouch.toFixed(2)}
                      </td>
                      <td className={`py-2 px-3 text-right ${row.lastTouch === max ? "font-bold" : ""}`}>
                        ${row.lastTouch.toFixed(2)}
                      </td>
                      <td className={`py-2 px-3 text-right ${row.linear === max ? "font-bold" : ""}`}>
                        ${row.linear.toFixed(2)}
                      </td>
                      <td className={`py-2 px-3 text-right ${row.timeDecay === max ? "font-bold" : ""}`}>
                        ${row.timeDecay.toFixed(2)}
                      </td>
                      <td className={`py-2 px-3 text-right ${variance > 10 ? "text-yellow-500" : "text-muted-foreground"}`}>
                        ${variance.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {data?.insights && data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attribution Insights</CardTitle>
            <CardDescription>Key findings from comparing attribution models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.insights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    insight.type === "success" ? "border-green-500/30 bg-green-500/5" :
                    insight.type === "warning" ? "border-yellow-500/30 bg-yellow-500/5" :
                    "border-blue-500/30 bg-blue-500/5"
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{insight.title}</div>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
