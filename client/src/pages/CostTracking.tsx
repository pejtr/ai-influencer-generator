import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const CHANNEL_COLORS: Record<string, string> = {
  organic: "#22c55e",
  paid: "#3b82f6",
  affiliate: "#f59e0b",
  direct: "#8b5cf6",
  social: "#ec4899",
};

export default function CostTracking() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formChannel, setFormChannel] = useState<string>("paid");
  const [formAmount, setFormAmount] = useState("");
  const [formPeriod, setFormPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [formDescription, setFormDescription] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.costTracking.getData.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const addMutation = trpc.costTracking.addCost.useMutation({
    onSuccess: () => {
      utils.costTracking.getData.invalidate();
      setShowAddForm(false);
      setFormAmount("");
      setFormDescription("");
      setStatusMsg("Cost entry added successfully.");
      setTimeout(() => setStatusMsg(null), 3000);
    },
  });

  const deleteMutation = trpc.costTracking.deleteCost.useMutation({
    onSuccess: () => {
      utils.costTracking.getData.invalidate();
      setStatusMsg("Cost entry deleted.");
      setTimeout(() => setStatusMsg(null), 3000);
    },
  });

  const sortedChannels = useMemo(() => {
    if (!data?.channels) return [];
    return [...data.channels].sort((a, b) => b.roas - a.roas);
  }, [data?.channels]);

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

  const totals = data?.totals;

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cost Tracking & ROAS</h1>
          <p className="text-muted-foreground mt-1">
            Track ad spend per channel and calculate true ROAS and CAC
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "+ Add Cost Entry"}
        </Button>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-green-500/10 text-green-500 border border-green-500/30">
          {statusMsg}
        </div>
      )}

      {/* Add Cost Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Channel</label>
                <select
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="organic">Organic</option>
                  <option value="paid">Paid</option>
                  <option value="affiliate">Affiliate</option>
                  <option value="direct">Direct</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Period (YYYY-MM)</label>
                <input
                  type="month"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Google Ads campaign"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  const amountCents = Math.round(parseFloat(formAmount) * 100);
                  if (isNaN(amountCents) || amountCents <= 0) return;
                  addMutation.mutate({
                    channel: formChannel as "organic" | "paid" | "affiliate" | "direct" | "social",
                    amount: amountCents,
                    period: formPeriod,
                    description: formDescription || undefined,
                  });
                }}
                disabled={addMutation.isPending || !formAmount}
              >
                {addMutation.isPending ? "Adding..." : "Add Cost"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totals Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">${totals?.totalSpend?.toFixed(2) ?? "0.00"}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Spend</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-500">${totals?.totalRevenue?.toFixed(2) ?? "0.00"}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className={`text-2xl font-bold ${(totals?.totalProfit ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              ${totals?.totalProfit?.toFixed(2) ?? "0.00"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Profit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className={`text-2xl font-bold ${(totals?.totalRoas ?? 0) >= 1 ? "text-green-500" : "text-red-500"}`}>
              {totals?.totalRoas?.toFixed(2) ?? "0.00"}x
            </div>
            <div className="text-xs text-muted-foreground mt-1">Overall ROAS</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">${totals?.totalCac?.toFixed(2) ?? "0.00"}</div>
            <div className="text-xs text-muted-foreground mt-1">Avg CAC</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{totals?.totalNewCustomers ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">New Customers</div>
          </CardContent>
        </Card>
      </div>

      {/* ROAS by Channel Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>ROAS by Channel</CardTitle>
          <CardDescription>Return on ad spend comparison — higher is better, 1.0x = break-even</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedChannels.length === 0 || sortedChannels.every(c => c.totalSpend === 0 && c.totalRevenue === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No cost data yet</p>
              <p className="text-sm">Add cost entries to see ROAS calculations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedChannels.map((ch) => {
                const maxRoas = Math.max(...sortedChannels.map(c => c.roas), 1);
                const barWidth = maxRoas > 0 ? (ch.roas / maxRoas) * 100 : 0;

                return (
                  <div key={ch.channel} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{ch.channel}</span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Spend: ${ch.totalSpend.toFixed(2)}</span>
                        <span>Revenue: ${ch.totalRevenue.toFixed(2)}</span>
                        <span>CAC: ${ch.cac.toFixed(2)}</span>
                        <span className={`font-bold text-sm ${ch.roas >= 1 ? "text-green-500" : "text-red-500"}`}>
                          {ch.roas.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                    <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(barWidth, ch.roas > 0 ? 3 : 0)}%`,
                          backgroundColor: CHANNEL_COLORS[ch.channel] ?? "#666",
                        }}
                      />
                      {/* Break-even line */}
                      {maxRoas > 1 && (
                        <div
                          className="absolute inset-y-0 w-0.5 bg-white/50"
                          style={{ left: `${(1 / maxRoas) * 100}%` }}
                          title="Break-even (1.0x)"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="text-xs text-muted-foreground text-center mt-2">
                White line = break-even (1.0x ROAS)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Details Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Channel Performance Details</CardTitle>
          <CardDescription>Comprehensive metrics per acquisition channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Channel</th>
                  <th className="text-right py-2 px-3">Spend</th>
                  <th className="text-right py-2 px-3">Revenue</th>
                  <th className="text-right py-2 px-3">Profit</th>
                  <th className="text-right py-2 px-3">ROAS</th>
                  <th className="text-right py-2 px-3">CAC</th>
                  <th className="text-right py-2 px-3">Customers</th>
                  <th className="text-right py-2 px-3">Rev/Customer</th>
                </tr>
              </thead>
              <tbody>
                {sortedChannels.map((ch) => {
                  const profit = ch.totalRevenue - ch.totalSpend;
                  const revPerCustomer = ch.newCustomers > 0 ? ch.totalRevenue / ch.newCustomers : 0;

                  return (
                    <tr key={ch.channel} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[ch.channel] }} />
                          <span className="font-medium capitalize">{ch.channel}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">${ch.totalSpend.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${ch.totalRevenue.toFixed(2)}</td>
                      <td className={`py-2 px-3 text-right font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                        ${profit.toFixed(2)}
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${ch.roas >= 1 ? "text-green-500" : "text-red-500"}`}>
                        {ch.roas.toFixed(2)}x
                      </td>
                      <td className="py-2 px-3 text-right">${ch.cac.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{ch.newCustomers}</td>
                      <td className="py-2 px-3 text-right">${revPerCustomer.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cost Entries */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cost Entries</CardTitle>
          <CardDescription>Individual ad spend records</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.rawCosts || data.rawCosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No cost entries yet. Click "+ Add Cost Entry" to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Channel</th>
                    <th className="text-left py-2 px-3">Period</th>
                    <th className="text-right py-2 px-3">Amount</th>
                    <th className="text-left py-2 px-3">Description</th>
                    <th className="text-left py-2 px-3">Date Added</th>
                    <th className="text-right py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rawCosts.map((cost) => (
                    <tr key={cost.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 capitalize">{cost.channel}</td>
                      <td className="py-2 px-3">{cost.period}</td>
                      <td className="py-2 px-3 text-right font-medium">${(cost.amount / 100).toFixed(2)}</td>
                      <td className="py-2 px-3 text-muted-foreground">{cost.description || "—"}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">
                        {new Date(cost.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteMutation.mutate({ id: cost.id })}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {data?.insights && data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Optimization Insights</CardTitle>
            <CardDescription>Recommendations based on ROAS and CAC analysis</CardDescription>
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
