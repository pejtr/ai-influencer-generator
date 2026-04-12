import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  BarChart3, TrendingUp, DollarSign, Users, MessageSquare,
  Zap, Target, Clock, CheckCircle2, AlertTriangle, Crown,
  FileText, Calendar, Activity, Star, ArrowUpRight, Loader2,
  ShieldCheck, Lightbulb, BookOpen
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ── Types ─────────────────────────────────────────────────────────────────

interface TeamMember {
  id: number;
  name: string;
  role: string;
  messagesSent: number;
  revenueDriven: number;
  avgResponseTime: number;
  conversionRate: string;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function GoldenRatioGauge({ value, target = 2.5 }: { value: number; target?: number }) {
  const pct = Math.min((value / (target * 2)) * 100, 100);
  const color = value >= target ? "text-green-400" : value >= target * 0.7 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-400">
        <span>$0</span>
        <span className={`font-bold text-lg ${color}`}>${value.toFixed(2)}/msg</span>
        <span>Target: ${target}</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${value >= target ? "bg-green-500" : value >= target * 0.7 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 text-center">
        {value >= target ? "✅ Above target — excellent performance" : `⚠️ ${((target - value) / target * 100).toFixed(0)}% below target`}
      </p>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color = "text-purple-400", change }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; color?: string; change?: string;
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {change && (
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> {change}
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

// ── EOS Report Component ──────────────────────────────────────────────────

function EOSReportCard({ member }: { member: TeamMember }) {
  const goldenRatio = member.messagesSent > 0
    ? member.revenueDriven / member.messagesSent
    : 0;
  const convRate = Number(member.conversionRate);
  const grade = goldenRatio >= 2.5 && convRate >= 15 ? "A" : goldenRatio >= 1.5 && convRate >= 10 ? "B" : goldenRatio >= 1 ? "C" : "D";
  const gradeColor = grade === "A" ? "text-green-400 bg-green-400/10" : grade === "B" ? "text-blue-400 bg-blue-400/10" : grade === "C" ? "text-yellow-400 bg-yellow-400/10" : "text-red-400 bg-red-400/10";

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{member.name}</p>
          <p className="text-xs text-gray-400">{member.role}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${gradeColor}`}>
          Grade {grade}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-900 rounded-lg p-2">
          <p className="text-lg font-bold text-white">{member.messagesSent}</p>
          <p className="text-xs text-gray-400">Messages</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-2">
          <p className="text-lg font-bold text-green-400">{formatCurrency(member.revenueDriven)}</p>
          <p className="text-xs text-gray-400">Revenue</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-2">
          <p className={`text-lg font-bold ${goldenRatio >= 2.5 ? "text-green-400" : "text-yellow-400"}`}>
            ${goldenRatio.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">$/msg</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Avg response: {member.avgResponseTime}min</span>
        <span>Conversion: {convRate.toFixed(1)}%</span>
        <Badge
          variant="outline"
          className={member.status === "active" ? "text-green-400 border-green-400/30" : "text-gray-400 border-gray-600"}
        >
          {member.status}
        </Badge>
      </div>
    </div>
  );
}

// ── Weekly Report ─────────────────────────────────────────────────────────

function WeeklyReport({ snapshot }: { snapshot: any }) {
  if (!snapshot) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No weekly report available yet.</p>
        <p className="text-xs mt-1">Reports are generated automatically every Sunday.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            Week of {new Date(snapshot.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </h4>
          <Badge variant="outline" className="text-purple-400 border-purple-400/30">Weekly Summary</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: snapshot.totalUsers, icon: Users },
            { label: "Revenue", value: formatCurrency(Number(snapshot.totalRevenue ?? 0)), icon: DollarSign },
            { label: "Generations", value: snapshot.totalGenerations, icon: Zap },
            { label: "Messages", value: snapshot.totalMessages, icon: MessageSquare },
          ].map(m => (
            <div key={m.label} className="bg-gray-900 rounded-lg p-3 text-center">
              <m.icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{m.value ?? 0}</p>
              <p className="text-xs text-gray-400">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Best Practices Panel ──────────────────────────────────────────────────

function BestPracticesPanel() {
  const practices = [
    {
      category: "Infrastructure First",
      icon: ShieldCheck,
      color: "text-blue-400",
      items: [
        "Build systems before adding more creators — 'One More Creator' fallacy kills agencies",
        "If it breaks when you take a week off, it's not a business yet",
        "Founder target: 2-4h/day reviewing dashboards only",
        "Delegate to Chat Manager, Content Manager, VAs, Account Manager",
      ],
    },
    {
      category: "Golden Ratio Targets",
      icon: Target,
      color: "text-yellow-400",
      items: [
        "Golden Ratio = Revenue ÷ Messages Sent (target: $2.50+/msg)",
        "Chatting ratio: 80% of shift time in active conversations",
        "Response time under 5 minutes during peak hours",
        "Conversion rate target: 15%+ (fan → paying customer)",
      ],
    },
    {
      category: "EOS Report Checklist",
      icon: FileText,
      color: "text-green-400",
      items: [
        "Messages sent this shift + revenue driven",
        "Top 3 fans engaged (by revenue potential)",
        "Blockers or issues encountered",
        "Custom request volume and status",
      ],
    },
    {
      category: "Weekly Agency Review",
      icon: BarChart3,
      color: "text-purple-400",
      items: [
        "Revenue: current vs previous month (closed + projected)",
        "Chatter performance leaderboard with grades",
        "Content performance: top 3 posts by engagement",
        "Strategic decision: what to double down on next week",
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {practices.map(p => (
        <Card key={p.category} className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <p.icon className={`w-4 h-4 ${p.color}`} />
              {p.category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {p.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${p.color}`} />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function AgencyDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: teamMembers, isLoading: teamLoading } = trpc.team.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: snapshots } = trpc.snapshot.history.useQuery(
    { days: 7 },
    { enabled: isAuthenticated }
  );

  const latestSnapshot = snapshots?.[0];

  // Compute agency-level Golden Ratio from team data
  const totalMessages = teamMembers?.reduce((s: number, m: any) => s + (m.messagesSent ?? 0), 0) ?? 0;
  const totalRevenue = teamMembers?.reduce((s: number, m: any) => s + Number(m.revenueDriven ?? 0), 0) ?? 0;
  const goldenRatio = totalMessages > 0 ? totalRevenue / totalMessages : 0;
  const avgConversionRate = teamMembers && teamMembers.length > 0
    ? teamMembers.reduce((s: number, m: any) => s + Number(m.conversionRate ?? 0), 0) / teamMembers.length
    : 0;

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
          <h2 className="text-2xl font-bold text-white">Sign in to access Agency Dashboard</h2>
          <a href={getLoginUrl()}><Button className="bg-purple-600 hover:bg-purple-700">Sign In</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Agency Dashboard</h1>
              <p className="text-gray-400 text-sm">OFM best practices · 2-4h/day founder view</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/30">
              <Star className="w-3 h-3 mr-1" /> Founder Mode
            </Badge>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Golden Ratio"
            value={`$${goldenRatio.toFixed(2)}/msg`}
            subtitle="Revenue per message"
            icon={Target}
            color={goldenRatio >= 2.5 ? "text-green-400" : "text-yellow-400"}
          />
          <MetricCard
            title="Team Members"
            value={String(teamMembers?.length ?? 0)}
            subtitle="Active chatters & managers"
            icon={Users}
            color="text-blue-400"
          />
          <MetricCard
            title="Total Messages"
            value={totalMessages.toLocaleString()}
            subtitle="All chatters combined"
            icon={MessageSquare}
            color="text-purple-400"
          />
          <MetricCard
            title="Avg Conversion"
            value={`${avgConversionRate.toFixed(1)}%`}
            subtitle="Target: 15%+"
            icon={Activity}
            color={avgConversionRate >= 15 ? "text-green-400" : "text-yellow-400"}
          />
        </div>

        {/* Golden Ratio Gauge */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              Agency Golden Ratio
            </CardTitle>
            <CardDescription>Revenue generated per message sent across all chatters</CardDescription>
          </CardHeader>
          <CardContent>
            <GoldenRatioGauge value={goldenRatio} target={2.5} />
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 border border-gray-800 mb-6">
            <TabsTrigger value="overview">EOS Reports</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
            <TabsTrigger value="practices">Best Practices</TabsTrigger>
          </TabsList>

          {/* EOS Reports Tab */}
          <TabsContent value="overview">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">End-of-Shift Reports</h3>
                <p className="text-sm text-gray-400">Per-chatter performance metrics for today</p>
              </div>
              <Badge variant="outline" className="text-gray-400 border-gray-600">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </Badge>
            </div>

            {teamLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : teamMembers && teamMembers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
              {teamMembers.map((m: any) => (
                <EOSReportCard key={m.id} member={m as TeamMember} />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="py-12 text-center">
                  <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No team members yet.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add chatters and managers in{" "}
                    <a href="/creator/tools" className="text-purple-400 hover:underline">Creator Tools → Team</a>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Mistake Warnings */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Common OFM Mistakes to Avoid
              </h4>
              {[
                { title: "\"One More Creator\" Fallacy", desc: "Build systems first. Adding creators without infrastructure = chaos.", icon: AlertTriangle, color: "text-red-400" },
                { title: "Being the Bottleneck", desc: "If the business stops when you stop, it's a job — not a business.", icon: AlertTriangle, color: "text-yellow-400" },
                { title: "Manual Operations", desc: "Automate EOS reports, scheduling, and follow-ups. Your time = strategy only.", icon: Lightbulb, color: "text-blue-400" },
              ].map(w => (
                <div key={w.title} className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <w.icon className={`w-5 h-5 mt-0.5 shrink-0 ${w.color}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{w.title}</p>
                    <p className="text-xs text-gray-400">{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Weekly Report Tab */}
          <TabsContent value="weekly">
            <div className="mb-4">
              <h3 className="font-semibold text-white">Weekly Agency Report</h3>
              <p className="text-sm text-gray-400">Auto-generated every Sunday · Single sheet, no back-and-forth</p>
            </div>
            {snapshots && snapshots.length > 0 ? (
              <div className="space-y-4">
                {snapshots.map((s: any) => <WeeklyReport key={s.id} snapshot={s} />)}
              </div>
            ) : (
              <WeeklyReport snapshot={null} />
            )}
          </TabsContent>

          {/* Best Practices Tab */}
          <TabsContent value="practices">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-semibold text-white">OFM Agency Best Practices</h3>
                <p className="text-sm text-gray-400">Extracted from top-performing OFM agencies</p>
              </div>
            </div>
            <BestPracticesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
