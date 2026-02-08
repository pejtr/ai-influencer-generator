import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FunnelAlerts() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const { data: unacknowledged, refetch: refetchUnack } = trpc.funnelAlerts.getUnacknowledged.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const { data: history, refetch: refetchHistory } = trpc.funnelAlerts.getHistory.useQuery(
    { limit: 50 },
    { enabled: !!user && user.role === "admin" }
  );

  const checkMutation = trpc.funnelAlerts.check.useMutation({
    onSuccess: (data) => {
      setIsChecking(false);
      refetchUnack();
      refetchHistory();
      if (data.alerts.length === 0) {
        setStatusMsg("All clear - no significant conversion rate drops detected.");
      } else {
        setStatusMsg(`${data.alerts.length} alert(s) found: ${data.alerts.filter(a => a.severity === "critical").length} critical, ${data.alerts.filter(a => a.severity === "warning").length} warnings`);
      }
      setTimeout(() => setStatusMsg(null), 5000);
    },
    onError: () => {
      setIsChecking(false);
      setStatusMsg("Error: Failed to check funnel alerts.");
      setTimeout(() => setStatusMsg(null), 5000);
    },
  });

  const ackMutation = trpc.funnelAlerts.acknowledge.useMutation({
    onSuccess: () => {
      refetchUnack();
      refetchHistory();
      setStatusMsg("Alert acknowledged.");
      setTimeout(() => setStatusMsg(null), 3000);
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const criticalCount = unacknowledged?.filter(a => a.severity === "critical").length ?? 0;
  const warningCount = unacknowledged?.filter(a => a.severity === "warning").length ?? 0;

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Funnel Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Automated detection of conversion rate drops vs 4-week rolling average
          </p>
        </div>
        <Button
          onClick={() => { setIsChecking(true); checkMutation.mutate(); }}
          disabled={isChecking}
          size="lg"
        >
          {isChecking ? "Checking..." : "Run Alert Check"}
        </Button>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          statusMsg.startsWith("Error") ? "bg-red-500/10 text-red-500 border border-red-500/30" :
          statusMsg.includes("alert") ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/30" :
          "bg-green-500/10 text-green-500 border border-green-500/30"
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className={criticalCount > 0 ? "border-red-500 bg-red-500/5" : ""}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${criticalCount > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                {criticalCount}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Critical Alerts</div>
            </div>
          </CardContent>
        </Card>
        <Card className={warningCount > 0 ? "border-yellow-500 bg-yellow-500/5" : ""}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${warningCount > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                {warningCount}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Warnings</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-muted-foreground">
                {history?.length ?? 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Total Alert History</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {unacknowledged && unacknowledged.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Unacknowledged alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unacknowledged.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border flex items-start justify-between gap-4 ${
                    alert.severity === "critical"
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-yellow-500/50 bg-yellow-500/5"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        alert.severity === "critical" ? "bg-red-500 text-white" : "bg-yellow-500 text-black"
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="font-medium">{alert.stepLabel}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Current: {(alert.currentRate / 10).toFixed(1)}%</span>
                      <span>Average: {(alert.averageRate / 10).toFixed(1)}%</span>
                      <span>Drop: {(alert.dropPercent / 10).toFixed(1)}pp</span>
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => ackMutation.mutate({ alertId: alert.id })}
                    disabled={ackMutation.isPending}
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>Past funnel alerts and their resolution status</CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No alerts yet</p>
              <p className="text-sm">Click "Run Alert Check" to analyze your funnel conversion rates</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Severity</th>
                    <th className="text-left py-2 px-3">Step</th>
                    <th className="text-right py-2 px-3">Current</th>
                    <th className="text-right py-2 px-3">Average</th>
                    <th className="text-right py-2 px-3">Drop</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((alert) => (
                    <tr key={alert.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          alert.severity === "critical" ? "bg-red-500/20 text-red-500" :
                          alert.severity === "warning" ? "bg-yellow-500/20 text-yellow-600" :
                          "bg-blue-500/20 text-blue-500"
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium">{alert.stepLabel}</td>
                      <td className="py-2 px-3 text-right">{(alert.currentRate / 10).toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right">{(alert.averageRate / 10).toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right text-red-500">-{(alert.dropPercent / 10).toFixed(1)}pp</td>
                      <td className="py-2 px-3">
                        {alert.acknowledged ? (
                          <span className="text-green-500 text-xs">Acknowledged</span>
                        ) : (
                          <span className="text-yellow-500 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
