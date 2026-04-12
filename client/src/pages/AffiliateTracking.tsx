import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  TrendingUp, DollarSign, Users, MousePointer, BarChart3,
  Copy, Check, Download, ExternalLink, QrCode, ArrowUpRight,
  Clock, CheckCircle2, XCircle, AlertCircle, Loader2,
  Trophy, Medal, Gem, Crown, Star, Wallet, CreditCard,
  Activity, Target, Zap, Globe
} from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

// ── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatPercent(value: string | number) {
  return `${Number(value).toFixed(1)}%`;
}

const BADGE_CONFIG = {
  none: { icon: Star, color: "text-gray-400", label: "Starter" },
  bronze: { icon: Medal, color: "text-amber-600", label: "Bronze" },
  silver: { icon: Medal, color: "text-gray-300", label: "Silver" },
  gold: { icon: Trophy, color: "text-yellow-400", label: "Gold" },
  diamond: { icon: Gem, color: "text-cyan-400", label: "Diamond" },
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Pending" },
  processing: { icon: Loader2, color: "text-blue-400", bg: "bg-blue-400/10", label: "Processing" },
  completed: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", label: "Paid" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", label: "Rejected" },
};

// ── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({
  title, value, subtitle, icon: Icon, trend, color = "text-purple-400"
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {trend && (
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> {trend}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-gray-800 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────

function MiniBarChart({ data, valueKey, labelKey }: {
  data: any[];
  valueKey: string;
  labelKey: string;
}) {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 text-sm py-8">No data yet</div>;
  }
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.slice(-14).map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const height = Math.max((val / max) * 100, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full bg-purple-500/60 hover:bg-purple-400 rounded-sm transition-all cursor-pointer"
              style={{ height: `${height}%` }}
            />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
              {d[labelKey]?.slice(5)}: {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── UTM Link Builder ──────────────────────────────────────────────────────

function LinkBuilder() {
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmMedium, setUtmMedium] = useState("bio");
  const [utmCampaign, setUtmCampaign] = useState("aifluencer");
  const [copied, setCopied] = useState(false);

  const { data: linkData } = trpc.affiliateTracking.buildTrackingLink.useQuery({
    utmSource, utmMedium, utmCampaign,
  });

  const copy = () => {
    if (linkData?.trackingUrl) {
      navigator.clipboard.writeText(linkData.trackingUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-gray-400">Source</Label>
          <Select value={utmSource} onValueChange={setUtmSource}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["instagram", "tiktok", "youtube", "twitter", "facebook", "email", "blog", "other"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-400">Medium</Label>
          <Select value={utmMedium} onValueChange={setUtmMedium}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["bio", "post", "story", "reel", "dm", "video", "email", "other"].map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-400">Campaign</Label>
          <Input
            value={utmCampaign}
            onChange={e => setUtmCampaign(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white mt-1"
            placeholder="campaign-name"
          />
        </div>
      </div>

      {linkData && (
        <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
          <p className="text-xs text-gray-300 flex-1 truncate font-mono">{linkData.trackingUrl}</p>
          <Button size="sm" variant="ghost" onClick={copy} className="shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </Button>
          <a href={linkData.qrCodeUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="shrink-0">
              <QrCode className="w-4 h-4" />
            </Button>
          </a>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { source: "instagram", medium: "bio", label: "Instagram Bio" },
          { source: "tiktok", medium: "bio", label: "TikTok Bio" },
          { source: "youtube", medium: "video", label: "YouTube Desc" },
        ].map(preset => (
          <Button
            key={preset.label}
            size="sm"
            variant="outline"
            className="text-xs border-gray-700"
            onClick={() => { setUtmSource(preset.source); setUtmMedium(preset.medium); }}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ── Payout Request Dialog ─────────────────────────────────────────────────

function PayoutDialog({ pendingEarnings }: { pendingEarnings: number }) {
  const [amount, setAmount] = useState(String(Math.floor(pendingEarnings)));
  const [method, setMethod] = useState<"paypal" | "stripe" | "bank">("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const requestPayout = trpc.affiliateTracking.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout request submitted! We'll process it within 3-5 business days.");
      setOpen(false);
      utils.affiliateTracking.getSummary.invalidate();
      utils.affiliateTracking.getPayouts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={pendingEarnings < 50}
        >
          <Wallet className="w-4 h-4 mr-2" />
          Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-sm text-green-400">
              Available: <strong>{formatCurrency(pendingEarnings)}</strong>
            </p>
            <p className="text-xs text-gray-400 mt-1">Minimum payout: $50</p>
          </div>
          <div>
            <Label>Amount ($)</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={50}
              max={pendingEarnings}
              className="bg-gray-800 border-gray-700 text-white mt-1"
            />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={(v: any) => setMethod(v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method === "paypal" && (
            <div>
              <Label>PayPal Email</Label>
              <Input
                type="email"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white mt-1"
                placeholder="your@paypal.com"
              />
            </div>
          )}
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => requestPayout.mutate({
              amount: Number(amount),
              method,
              paypalEmail: method === "paypal" ? paypalEmail : undefined,
            })}
            disabled={requestPayout.isPending || Number(amount) < 50}
          >
            {requestPayout.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function AffiliateTracking() {
  const { user, isAuthenticated, loading } = useAuth();
  const [days, setDays] = useState(30);

  const { data: affiliateStatus } = trpc.affiliate.getStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: summary, isLoading: summaryLoading } = trpc.affiliateTracking.getSummary.useQuery(
    undefined,
    { enabled: isAuthenticated && affiliateStatus?.isAffiliate === true }
  );

  const { data: dailyStats } = trpc.affiliateTracking.getDailyStats.useQuery(
    { days },
    { enabled: isAuthenticated && affiliateStatus?.isAffiliate === true }
  );

  const { data: clickSources } = trpc.affiliateTracking.getClickSources.useQuery(
    { days },
    { enabled: isAuthenticated && affiliateStatus?.isAffiliate === true }
  );

  const { data: commissions } = trpc.affiliateTracking.getCommissions.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && affiliateStatus?.isAffiliate === true }
  );

  const { data: payouts } = trpc.affiliateTracking.getPayouts.useQuery(
    undefined,
    { enabled: isAuthenticated && affiliateStatus?.isAffiliate === true }
  );

  // Admin data
  const { data: adminPayouts } = trpc.affiliateTracking.adminGetPendingPayouts.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: adminPerformance } = trpc.affiliateTracking.adminGetPerformance.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const utils = trpc.useUtils();
  const processPayoutMutation = trpc.affiliateTracking.adminProcessPayout.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Payout ${vars.action === "approve" ? "approved" : "rejected"}`);
      utils.affiliateTracking.adminGetPendingPayouts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const registerAffiliate = trpc.affiliate.register.useMutation({
    onSuccess: () => {
      toast.success("Affiliate account created!");
      utils.affiliate.getStatus.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <h2 className="text-2xl font-bold text-white">Sign in to view your affiliate dashboard</h2>
          <a href={getLoginUrl()}><Button className="bg-purple-600 hover:bg-purple-700">Sign In</Button></a>
        </div>
      </div>
    );
  }

  if (!affiliateStatus?.isAffiliate) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Join the Affiliate Program</h2>
            <p className="text-gray-400 mb-6">Earn 30% on direct referrals, 10% on level 2, and 5% on level 3. Unlimited earning potential.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Level 1", rate: "30%", desc: "Direct" },
                { label: "Level 2", rate: "10%", desc: "Indirect" },
                { label: "Level 3", rate: "5%", desc: "Network" },
              ].map(t => (
                <div key={t.label} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xl font-bold text-purple-400">{t.rate}</p>
                  <p className="text-xs text-gray-400">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
              ))}
            </div>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => registerAffiliate.mutate()}
              disabled={registerAffiliate.isPending}
            >
              {registerAffiliate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Become an Affiliate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const badge = summary?.badge ?? "none";
  const BadgeIcon = BADGE_CONFIG[badge as keyof typeof BADGE_CONFIG]?.icon ?? Star;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Commission Tracker</h1>
              <p className="text-gray-400 text-sm">Real-time affiliate performance dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 ${BADGE_CONFIG[badge as keyof typeof BADGE_CONFIG]?.color}`}>
              <BadgeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{BADGE_CONFIG[badge as keyof typeof BADGE_CONFIG]?.label}</span>
            </div>
            {summary && <PayoutDialog pendingEarnings={summary.pendingEarnings} />}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {[7, 14, 30, 60, 90].map(d => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              className={days === d ? "bg-purple-600" : "border-gray-700 text-gray-400"}
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>

        {summaryLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <KpiCard
                title="Total Earned"
                value={formatCurrency(summary?.totalEarnings ?? 0)}
                subtitle="All time"
                icon={DollarSign}
                color="text-green-400"
              />
              <KpiCard
                title="Pending"
                value={formatCurrency(summary?.pendingEarnings ?? 0)}
                subtitle="Awaiting payout"
                icon={Clock}
                color="text-yellow-400"
              />
              <KpiCard
                title="This Month"
                value={formatCurrency(summary?.thisMonth.commissions ?? 0)}
                subtitle={`${summary?.thisMonth.conversions ?? 0} conversions`}
                icon={TrendingUp}
                color="text-purple-400"
              />
              <KpiCard
                title="Conversion Rate"
                value={formatPercent(summary?.last30Days.conversionRate ?? 0)}
                subtitle={`${summary?.last30Days.totalClicks ?? 0} clicks`}
                icon={Target}
                color="text-blue-400"
              />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KpiCard
                title="Total Referrals"
                value={String(summary?.totalReferrals ?? 0)}
                subtitle={`${summary?.activeReferrals ?? 0} active`}
                icon={Users}
                color="text-cyan-400"
              />
              <KpiCard
                title="L1 Earnings"
                value={formatCurrency(summary?.earningsLevel1 ?? 0)}
                subtitle="30% direct"
                icon={Zap}
                color="text-purple-400"
              />
              <KpiCard
                title="L2 Earnings"
                value={formatCurrency(summary?.earningsLevel2 ?? 0)}
                subtitle="10% indirect"
                icon={Activity}
                color="text-indigo-400"
              />
              <KpiCard
                title="L3 Earnings"
                value={formatCurrency(summary?.earningsLevel3 ?? 0)}
                subtitle="5% network"
                icon={Globe}
                color="text-violet-400"
              />
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="bg-gray-900 border border-gray-800 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
                <TabsTrigger value="links">Link Builder</TabsTrigger>
                {user?.role === "admin" && <TabsTrigger value="admin">Admin</TabsTrigger>}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Clicks Chart */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400">Daily Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MiniBarChart data={dailyStats ?? []} valueKey="clicks" labelKey="date" />
                    </CardContent>
                  </Card>

                  {/* Commissions Chart */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400">Daily Commissions ($)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MiniBarChart data={dailyStats ?? []} valueKey="commissions" labelKey="date" />
                    </CardContent>
                  </Card>
                </div>

                {/* Traffic Sources */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-base">Traffic Sources</CardTitle>
                    <CardDescription>Where your referrals come from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {clickSources && clickSources.length > 0 ? (
                      <div className="space-y-3">
                        {clickSources.map((src, i) => {
                          const total = clickSources.reduce((s, r) => s + Number(r.clicks), 0);
                          const pct = total > 0 ? (Number(src.clicks) / total * 100) : 0;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-24 text-xs text-gray-400 truncate">
                                {src.utmSource ?? "direct"} / {src.utmMedium ?? "none"}
                              </div>
                              <div className="flex-1 bg-gray-800 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-400 w-16 text-right">
                                {src.clicks} clicks
                              </div>
                              <div className="text-xs text-green-400 w-12 text-right">
                                {src.conversions} conv
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-6">
                        No traffic data yet. Share your affiliate link to start tracking!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Commissions Tab */}
              <TabsContent value="commissions">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-base">Commission History</CardTitle>
                    <CardDescription>All earned commissions across all levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {commissions && commissions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-800">
                              <th className="text-left py-2 pr-4">Date</th>
                              <th className="text-left py-2 pr-4">Level</th>
                              <th className="text-left py-2 pr-4">Amount</th>
                              <th className="text-left py-2 pr-4">Rate</th>
                              <th className="text-left py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {commissions.map((c) => {
                              const statusKey = (c.status ?? "pending") as keyof typeof STATUS_CONFIG;
                              const S = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
                              return (
                                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                  <td className="py-2 pr-4 text-gray-400">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-2 pr-4">
                                    <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                                      L{c.level}
                                    </Badge>
                                  </td>
                                  <td className="py-2 pr-4 font-semibold text-green-400">
                                    {formatCurrency(Number(c.amount))}
                                  </td>
                                  <td className="py-2 pr-4 text-gray-400">
                                    {Number(c.commissionRate).toFixed(0)}%
                                  </td>
                                  <td className="py-2">
                                    <span className={`flex items-center gap-1 text-xs ${S.color}`}>
                                      <S.icon className="w-3 h-3" />
                                      {S.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-8">
                        No commissions yet. Start referring users to earn!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payouts Tab */}
              <TabsContent value="payouts" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Payout History</h3>
                    <p className="text-sm text-gray-400">Minimum payout: $50 · Processed within 3-5 business days</p>
                  </div>
                  {summary && <PayoutDialog pendingEarnings={summary.pendingEarnings} />}
                </div>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="pt-4">
                    {payouts && payouts.length > 0 ? (
                      <div className="space-y-3">
                        {payouts.map((p) => {
                          const statusKey = (p.status ?? "pending") as keyof typeof STATUS_CONFIG;
                          const S = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
                          return (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${S.bg}`}>
                                  <S.icon className={`w-4 h-4 ${S.color}`} />
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{formatCurrency(Number(p.amount))}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(p.createdAt).toLocaleDateString()} · paypal
                                  </p>
                                </div>
                              </div>
                              <Badge className={`${S.bg} ${S.color} border-0`}>{S.label}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-8">No payout requests yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Link Builder Tab */}
              <TabsContent value="links">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-base">UTM Link Builder</CardTitle>
                    <CardDescription>Create trackable affiliate links for each platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LinkBuilder />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin Tab */}
              {user?.role === "admin" && (
                <TabsContent value="admin" className="space-y-6">
                  {/* Pending Payouts */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-base">Pending Payout Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {adminPayouts && adminPayouts.length > 0 ? (
                        <div className="space-y-3">
                          {adminPayouts.map(({ payout, affiliate }) => (
                            <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                              <div>
                                <p className="font-semibold text-white">{formatCurrency(Number(payout.amount))}</p>
                                <p className="text-xs text-gray-400">
                                  {affiliate.affiliateCode} · {payout.paypalEmail}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Requested: {new Date(payout.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => processPayoutMutation.mutate({ payoutId: payout.id, action: "approve" })}
                                  disabled={processPayoutMutation.isPending}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                  onClick={() => processPayoutMutation.mutate({ payoutId: payout.id, action: "reject" })}
                                  disabled={processPayoutMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-6">No pending payout requests.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* All Affiliates Performance */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-base">Affiliate Performance Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {adminPerformance && adminPerformance.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-800">
                                <th className="text-left py-2 pr-4">#</th>
                                <th className="text-left py-2 pr-4">Code</th>
                                <th className="text-left py-2 pr-4">Total Earned</th>
                                <th className="text-left py-2 pr-4">Pending</th>
                                <th className="text-left py-2 pr-4">Referrals</th>
                                <th className="text-left py-2 pr-4">Badge</th>
                                <th className="text-left py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminPerformance.map((a, i) => {
                                const b = a.badge as keyof typeof BADGE_CONFIG;
                                const B = BADGE_CONFIG[b] ?? BADGE_CONFIG.none;
                                return (
                                  <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                    <td className="py-2 pr-4 text-gray-500">#{i + 1}</td>
                                    <td className="py-2 pr-4 font-mono text-purple-400">{a.affiliateCode}</td>
                                    <td className="py-2 pr-4 font-semibold text-green-400">
                                      {formatCurrency(Number(a.totalEarnings))}
                                    </td>
                                    <td className="py-2 pr-4 text-yellow-400">
                                      {formatCurrency(Number(a.pendingEarnings))}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-300">{a.totalReferrals}</td>
                                    <td className="py-2 pr-4">
                                      <span className={`flex items-center gap-1 text-xs ${B.color}`}>
                                        <B.icon className="w-3 h-3" /> {B.label}
                                      </span>
                                    </td>
                                    <td className="py-2">
                                      <Badge
                                        variant="outline"
                                        className={a.status === "approved" ? "text-green-400 border-green-400/30" : "text-gray-400 border-gray-600"}
                                      >
                                        {a.status}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-6">No affiliates yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
