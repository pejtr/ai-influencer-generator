import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageSquare, Plus, Trash2, Play, BarChart2, Zap, Settings,
  ChevronRight, CheckCircle, XCircle, Eye, TrendingUp, Hash, Send,
  Instagram, Youtube, Twitter, Edit2, ToggleLeft, ToggleRight
} from "lucide-react";

// ── Platform icons ────────────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  tiktok: <span className="text-sm font-bold">TK</span>,
  youtube: <Youtube className="w-4 h-4" />,
  facebook: <span className="text-sm font-bold">FB</span>,
  twitter: <Twitter className="w-4 h-4" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "from-pink-500 to-purple-600",
  tiktok: "from-black to-gray-700",
  youtube: "from-red-500 to-red-700",
  facebook: "from-blue-500 to-blue-700",
  twitter: "from-sky-400 to-sky-600",
};

// ── DM Template variables hint ────────────────────────────────────────────────
const TEMPLATE_VARS = ["{name}", "{keyword}", "{link}"];

// ── Keyword match types ───────────────────────────────────────────────────────
const MATCH_TYPES = [
  { value: "contains", label: "Contains", desc: "Comment contains the keyword anywhere" },
  { value: "exact", label: "Exact Match", desc: "Comment matches keyword exactly" },
  { value: "starts_with", label: "Starts With", desc: "Comment starts with keyword" },
];

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    active: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Active" },
    paused: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Paused" },
    draft: { color: "bg-white/10 text-white/50 border-white/20", label: "Draft" },
  };
  const c = cfg[status] ?? cfg.draft;
  return <Badge className={`text-xs border ${c.color}`}>{c.label}</Badge>;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-white/5 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CommentFunnel() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("campaigns");
  const [newCampaign, setNewCampaign] = useState({ name: "", platform: "instagram" as const, description: "" });
  const [newKeyword, setNewKeyword] = useState({ keyword: "", matchType: "contains" as const, caseSensitive: false });
  const [newMessage, setNewMessage] = useState({ messageType: "initial_dm" as const, content: "", delayMinutes: 0 });
  const [editingMessage, setEditingMessage] = useState<{ id: number; content: string; messageType: string; delayMinutes: number } | null>(null);
  const [simComment, setSimComment] = useState("");
  const [simName, setSimName] = useState("TestUser");
  const [simResult, setSimResult] = useState<null | { triggered: boolean; matchedKeyword: string | null; matchType?: string; messages: Array<{ id: number; messageType: string; rendered: string; delayMinutes: number }> }>(null);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: campaigns, isLoading: campaignsLoading } = trpc.commentFunnel.getCampaigns.useQuery(undefined, { enabled: isAuthenticated });
  const { data: overallStats } = trpc.commentFunnel.getOverallStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: keywords } = trpc.commentFunnel.getKeywords.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId }
  );
  const { data: messages } = trpc.commentFunnel.getMessages.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId }
  );
  const { data: analytics } = trpc.commentFunnel.getCampaignAnalytics.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId && activeTab === "analytics" }
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createCampaign = trpc.commentFunnel.createCampaign.useMutation({
    onSuccess: () => {
      utils.commentFunnel.getCampaigns.invalidate();
      utils.commentFunnel.getOverallStats.invalidate();
      setShowNewCampaignDialog(false);
      setNewCampaign({ name: "", platform: "instagram", description: "" });
      toast.success("Campaign created!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCampaign = trpc.commentFunnel.updateCampaign.useMutation({
    onSuccess: () => {
      utils.commentFunnel.getCampaigns.invalidate();
      toast.success("Campaign updated!");
    },
  });

  const deleteCampaign = trpc.commentFunnel.deleteCampaign.useMutation({
    onSuccess: () => {
      utils.commentFunnel.getCampaigns.invalidate();
      utils.commentFunnel.getOverallStats.invalidate();
      setSelectedCampaignId(null);
      toast.success("Campaign deleted");
    },
  });

  const addKeyword = trpc.commentFunnel.addKeyword.useMutation({
    onSuccess: () => {
      utils.commentFunnel.getKeywords.invalidate({ campaignId: selectedCampaignId! });
      setNewKeyword({ keyword: "", matchType: "contains", caseSensitive: false });
      toast.success("Keyword added!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteKeyword = trpc.commentFunnel.deleteKeyword.useMutation({
    onSuccess: () => utils.commentFunnel.getKeywords.invalidate({ campaignId: selectedCampaignId! }),
  });

  const saveMessage = trpc.commentFunnel.saveMessage.useMutation({
    onSuccess: () => {
      utils.commentFunnel.getMessages.invalidate({ campaignId: selectedCampaignId! });
      setShowNewMessageDialog(false);
      setNewMessage({ messageType: "initial_dm", content: "", delayMinutes: 0 });
      setEditingMessage(null);
      toast.success("Message saved!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMessage = trpc.commentFunnel.deleteMessage.useMutation({
    onSuccess: () => utils.commentFunnel.getMessages.invalidate({ campaignId: selectedCampaignId! }),
  });

  const simulateTrigger = trpc.commentFunnel.simulateTrigger.useMutation({
    onSuccess: (data) => {
      setSimResult(data);
      if (data.triggered) {
        toast.success(`Triggered by keyword: "${data.matchedKeyword}"`);
      } else {
        toast.error("No keyword matched — try a different comment");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Selected campaign ─────────────────────────────────────────────────────
  const selectedCampaign = campaigns?.find((c) => c.id === selectedCampaignId);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-sm">
          <MessageSquare className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Comment-to-DM Funnel</h2>
          <p className="text-white/60 text-sm mb-4">Sign in to manage your automated engagement funnels.</p>
          <Button className="bg-pink-500 hover:bg-pink-600 text-white w-full">Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Comment-to-DM Funnel</h1>
              <p className="text-white/40 text-xs">Auto-engage commenters with targeted DMs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs">
              {overallStats?.activeCampaigns ?? 0} Active
            </Badge>
            <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90">
                  <Plus className="w-4 h-4 mr-1" /> New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Create Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-white/70 text-sm">Campaign Name</Label>
                    <Input
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign((p) => ({ ...p, name: e.target.value }))}
                      placeholder='e.g. "Comment FIRE for guide"'
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm">Platform</Label>
                    <Select value={newCampaign.platform} onValueChange={(v) => setNewCampaign((p) => ({ ...p, platform: v as typeof newCampaign.platform }))}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/10">
                        {["instagram", "tiktok", "youtube", "facebook", "twitter"].map((p) => (
                          <SelectItem key={p} value={p} className="text-white capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm">Description (optional)</Label>
                    <Textarea
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign((p) => ({ ...p, description: e.target.value }))}
                      placeholder="What does this funnel do?"
                      className="bg-white/5 border-white/10 text-white mt-1 resize-none"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={() => createCampaign.mutate(newCampaign)}
                    disabled={!newCampaign.name || createCampaign.isPending}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  >
                    {createCampaign.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Overall Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Campaigns" value={overallStats?.totalCampaigns ?? 0} icon={<MessageSquare className="w-4 h-4" />} color="text-pink-400" />
          <StatCard label="Total Triggers" value={overallStats?.totalTriggers ?? 0} icon={<Hash className="w-4 h-4" />} color="text-purple-400" />
          <StatCard label="DMs Sent" value={overallStats?.totalDms ?? 0} icon={<Send className="w-4 h-4" />} color="text-blue-400" />
          <StatCard label="Conversion Rate" value={`${overallStats?.overallConversionRate ?? 0}%`} icon={<TrendingUp className="w-4 h-4" />} color="text-green-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Campaign List ── */}
          <div className="lg:col-span-1">
            <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Campaigns</h2>
            {campaignsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : campaigns?.length === 0 ? (
              <Card className="bg-white/5 border-white/10 border-dashed">
                <CardContent className="pt-6 pb-6 text-center">
                  <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">No campaigns yet</p>
                  <p className="text-white/30 text-xs mt-1">Create your first funnel above</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {campaigns?.map((campaign) => (
                  <Card
                    key={campaign.id}
                    onClick={() => { setSelectedCampaignId(campaign.id); setActiveTab("keywords"); }}
                    className={`cursor-pointer transition-all border ${
                      selectedCampaignId === campaign.id
                        ? "bg-pink-900/20 border-pink-500/50"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded bg-gradient-to-br ${PLATFORM_COLORS[campaign.platform]} flex-shrink-0`}>
                            {PLATFORM_ICONS[campaign.platform]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{campaign.name}</p>
                            <p className="text-white/40 text-xs capitalize">{campaign.platform}</p>
                          </div>
                        </div>
                        <StatusBadge status={campaign.status} />
                      </div>
                      <div className="flex gap-3 mt-2 pt-2 border-t border-white/5">
                        <span className="text-white/40 text-xs">{campaign.triggerCount} triggers</span>
                        <span className="text-white/40 text-xs">{campaign.dmSentCount} DMs</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ── Campaign Detail ── */}
          <div className="lg:col-span-2">
            {!selectedCampaign ? (
              <Card className="bg-white/5 border-white/10 h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                  <Zap className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">Select a campaign to manage it</p>
                  <p className="text-white/30 text-sm mt-1">or create a new one to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {/* Campaign header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${PLATFORM_COLORS[selectedCampaign.platform]}`}>
                      {PLATFORM_ICONS[selectedCampaign.platform]}
                    </div>
                    <div>
                      <h2 className="text-white font-bold">{selectedCampaign.name}</h2>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={selectedCampaign.status} />
                        <span className="text-white/40 text-xs capitalize">{selectedCampaign.platform}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-white/70 hover:text-white text-xs"
                      onClick={() => updateCampaign.mutate({
                        id: selectedCampaign.id,
                        status: selectedCampaign.status === "active" ? "paused" : "active"
                      })}
                    >
                      {selectedCampaign.status === "active" ? (
                        <><ToggleRight className="w-3 h-3 mr-1 text-green-400" /> Active</>
                      ) : (
                        <><ToggleLeft className="w-3 h-3 mr-1 text-white/40" /> Paused</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                      onClick={() => {
                        if (confirm("Delete this campaign and all its data?")) {
                          deleteCampaign.mutate({ id: selectedCampaign.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-white/5 border border-white/10 mb-4">
                    <TabsTrigger value="keywords" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 text-white/60 text-xs">
                      <Hash className="w-3 h-3 mr-1" /> Keywords
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 text-white/60 text-xs">
                      <MessageSquare className="w-3 h-3 mr-1" /> DM Messages
                    </TabsTrigger>
                    <TabsTrigger value="simulate" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 text-white/60 text-xs">
                      <Play className="w-3 h-3 mr-1" /> Simulate
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 text-white/60 text-xs">
                      <BarChart2 className="w-3 h-3 mr-1" /> Analytics
                    </TabsTrigger>
                  </TabsList>

                  {/* ── KEYWORDS TAB ── */}
                  <TabsContent value="keywords">
                    <Card className="bg-white/5 border-white/10 mb-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                          <Hash className="w-4 h-4 text-pink-400" />
                          Trigger Keywords
                          <Badge className="bg-white/10 text-white/60 text-xs ml-auto">{keywords?.length ?? 0} keywords</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Add keyword form */}
                        <div className="flex gap-2 mb-4">
                          <Input
                            value={newKeyword.keyword}
                            onChange={(e) => setNewKeyword((p) => ({ ...p, keyword: e.target.value }))}
                            placeholder='e.g. "FIRE", "guide", "link"'
                            className="bg-white/5 border-white/10 text-white text-sm flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newKeyword.keyword && selectedCampaignId) {
                                addKeyword.mutate({ campaignId: selectedCampaignId, ...newKeyword });
                              }
                            }}
                          />
                          <Select value={newKeyword.matchType} onValueChange={(v) => setNewKeyword((p) => ({ ...p, matchType: v as typeof newKeyword.matchType }))}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111] border-white/10">
                              {MATCH_TYPES.map((m) => (
                                <SelectItem key={m.value} value={m.value} className="text-white text-xs">{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => selectedCampaignId && addKeyword.mutate({ campaignId: selectedCampaignId, ...newKeyword })}
                            disabled={!newKeyword.keyword || addKeyword.isPending}
                            className="bg-pink-500 hover:bg-pink-600 text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Keyword list */}
                        {keywords?.length === 0 ? (
                          <p className="text-white/40 text-sm text-center py-4">No keywords yet — add one above</p>
                        ) : (
                          <div className="space-y-2">
                            {keywords?.map((kw) => (
                              <div key={kw.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs font-mono">
                                    {kw.keyword}
                                  </Badge>
                                  <Badge className="bg-white/10 text-white/50 text-xs">{kw.matchType}</Badge>
                                  {kw.caseSensitive && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">case-sensitive</Badge>}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:bg-red-500/10 h-6 w-6 p-0"
                                  onClick={() => deleteKeyword.mutate({ id: kw.id })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tips */}
                        <div className="mt-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                          <p className="text-pink-400 text-xs font-semibold mb-1">💡 kayvon.ai Strategy</p>
                          <p className="text-white/60 text-xs">
                            Use single power words: <span className="text-pink-300 font-mono">"FIRE"</span>, <span className="text-pink-300 font-mono">"GUIDE"</span>, <span className="text-pink-300 font-mono">"LINK"</span>, <span className="text-pink-300 font-mono">"YES"</span>.
                            Post asks: <em>"Comment FIRE and I'll DM you the full workflow"</em> — this drives 10-40x more engagement than just posting a link.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── MESSAGES TAB ── */}
                  <TabsContent value="messages">
                    <Card className="bg-white/5 border-white/10 mb-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-purple-400" />
                          DM Message Templates
                          <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white ml-auto text-xs">
                                <Plus className="w-3 h-3 mr-1" /> Add Message
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#111] border-white/10 text-white">
                              <DialogHeader>
                                <DialogTitle>{editingMessage ? "Edit Message" : "New DM Template"}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-2">
                                <div>
                                  <Label className="text-white/70 text-sm">Message Type</Label>
                                  <Select
                                    value={editingMessage?.messageType ?? newMessage.messageType}
                                    onValueChange={(v) => editingMessage
                                      ? setEditingMessage((p) => p ? { ...p, messageType: v } : null)
                                      : setNewMessage((p) => ({ ...p, messageType: v as typeof newMessage.messageType }))
                                    }
                                  >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111] border-white/10">
                                      <SelectItem value="initial_dm" className="text-white">Initial DM (sent immediately)</SelectItem>
                                      <SelectItem value="follow_up" className="text-white">Follow-up (delayed)</SelectItem>
                                      <SelectItem value="conversion" className="text-white">Conversion (final CTA)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-white/70 text-sm">Delay (minutes after trigger)</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={10080}
                                    value={editingMessage?.delayMinutes ?? newMessage.delayMinutes}
                                    onChange={(e) => {
                                      const v = parseInt(e.target.value) || 0;
                                      editingMessage
                                        ? setEditingMessage((p) => p ? { ...p, delayMinutes: v } : null)
                                        : setNewMessage((p) => ({ ...p, delayMinutes: v }));
                                    }}
                                    className="bg-white/5 border-white/10 text-white mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white/70 text-sm">Message Content</Label>
                                  <div className="flex gap-1 mt-1 mb-1 flex-wrap">
                                    {TEMPLATE_VARS.map((v) => (
                                      <button
                                        key={v}
                                        type="button"
                                        onClick={() => {
                                          const insert = v;
                                          editingMessage
                                            ? setEditingMessage((p) => p ? { ...p, content: p.content + insert } : null)
                                            : setNewMessage((p) => ({ ...p, content: p.content + insert }));
                                        }}
                                        className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded px-2 py-0.5 hover:bg-purple-500/30 font-mono"
                                      >
                                        {v}
                                      </button>
                                    ))}
                                  </div>
                                  <Textarea
                                    value={editingMessage?.content ?? newMessage.content}
                                    onChange={(e) => {
                                      editingMessage
                                        ? setEditingMessage((p) => p ? { ...p, content: e.target.value } : null)
                                        : setNewMessage((p) => ({ ...p, content: e.target.value }));
                                    }}
                                    placeholder="Hey {name}! You commented {keyword} — here's your exclusive guide: {link} 🔥"
                                    className="bg-white/5 border-white/10 text-white resize-none"
                                    rows={4}
                                  />
                                  <p className="text-white/30 text-xs mt-1">Use {"{name}"}, {"{keyword}"}, {"{link}"} as dynamic placeholders</p>
                                </div>
                                <Button
                                  onClick={() => {
                                    if (editingMessage) {
                                      saveMessage.mutate({
                                        id: editingMessage.id,
                                        campaignId: selectedCampaignId!,
                                        messageType: editingMessage.messageType as "initial_dm" | "follow_up" | "conversion",
                                        content: editingMessage.content,
                                        delayMinutes: editingMessage.delayMinutes,
                                      });
                                    } else {
                                      saveMessage.mutate({ campaignId: selectedCampaignId!, ...newMessage });
                                    }
                                  }}
                                  disabled={!(editingMessage?.content ?? newMessage.content) || saveMessage.isPending}
                                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                >
                                  {saveMessage.isPending ? "Saving..." : "Save Message"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {messages?.length === 0 ? (
                          <p className="text-white/40 text-sm text-center py-4">No messages yet — add your first DM template</p>
                        ) : (
                          <div className="space-y-3">
                            {messages?.map((msg) => (
                              <div key={msg.id} className={`p-3 rounded-lg border ${msg.isActive ? "bg-white/5 border-white/10" : "bg-white/2 border-white/5 opacity-50"}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-xs ${
                                      msg.messageType === "initial_dm" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                      msg.messageType === "follow_up" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                      "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                    }`}>
                                      {msg.messageType === "initial_dm" ? "Initial DM" : msg.messageType === "follow_up" ? "Follow-up" : "Conversion"}
                                    </Badge>
                                    {msg.delayMinutes > 0 && (
                                      <Badge className="bg-white/10 text-white/50 text-xs">
                                        +{msg.delayMinutes}min delay
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-white/40 hover:text-white h-6 w-6 p-0"
                                      onClick={() => {
                                        setEditingMessage({ id: msg.id, content: msg.content, messageType: msg.messageType, delayMinutes: msg.delayMinutes });
                                        setShowNewMessageDialog(true);
                                      }}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-400 hover:bg-red-500/10 h-6 w-6 p-0"
                                      onClick={() => deleteMessage.mutate({ id: msg.id })}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-white/70 text-sm font-mono bg-black/30 rounded p-2 whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* DM best practices */}
                        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                          <p className="text-purple-400 text-xs font-semibold mb-1">💬 DM Best Practices</p>
                          <ul className="text-white/60 text-xs space-y-1">
                            <li>• Keep initial DM under 150 chars — feels personal, not spammy</li>
                            <li>• Use <span className="font-mono text-purple-300">{"{name}"}</span> to personalize every message</li>
                            <li>• Include one clear CTA with <span className="font-mono text-purple-300">{"{link}"}</span></li>
                            <li>• Follow-up after 24h if no response (optional)</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── SIMULATE TAB ── */}
                  <TabsContent value="simulate">
                    <Card className="bg-white/5 border-white/10 mb-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                          <Play className="w-4 h-4 text-green-400" />
                          Funnel Simulator
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-white/70 text-sm">Commenter Name</Label>
                              <Input
                                value={simName}
                                onChange={(e) => setSimName(e.target.value)}
                                placeholder="TestUser"
                                className="bg-white/5 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-white/70 text-sm">Simulated Comment</Label>
                              <Input
                                value={simComment}
                                onChange={(e) => setSimComment(e.target.value)}
                                placeholder='e.g. "FIRE 🔥 need this guide!"'
                                className="bg-white/5 border-white/10 text-white mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => selectedCampaignId && simulateTrigger.mutate({
                              campaignId: selectedCampaignId,
                              commentText: simComment,
                              commenterName: simName,
                            })}
                            disabled={!simComment || simulateTrigger.isPending}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {simulateTrigger.isPending ? "Simulating..." : "Run Simulation"}
                          </Button>

                          {/* Simulation Result */}
                          {simResult && (
                            <div className={`p-4 rounded-lg border ${simResult.triggered ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                              <div className="flex items-center gap-2 mb-3">
                                {simResult.triggered ? (
                                  <><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-green-400 font-semibold">Triggered!</span></>
                                ) : (
                                  <><XCircle className="w-5 h-5 text-red-400" /><span className="text-red-400 font-semibold">No Match</span></>
                                )}
                              </div>
                              {simResult.triggered && (
                                <>
                                  <p className="text-white/60 text-xs mb-3">
                                    Matched keyword: <span className="text-pink-400 font-mono font-bold">"{simResult.matchedKeyword}"</span>
                                    {" "}({simResult.matchType})
                                  </p>
                                  <div className="space-y-2">
                                    <p className="text-white/70 text-xs font-semibold">Messages that would be sent:</p>
                                    {simResult.messages.map((msg, i) => (
                                      <div key={i} className="p-3 bg-black/30 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge className={`text-xs ${
                                            msg.messageType === "initial_dm" ? "bg-green-500/20 text-green-400" :
                                            msg.messageType === "follow_up" ? "bg-blue-500/20 text-blue-400" :
                                            "bg-orange-500/20 text-orange-400"
                                          }`}>
                                            {msg.messageType}
                                          </Badge>
                                          {msg.delayMinutes > 0 && (
                                            <span className="text-white/40 text-xs">+{msg.delayMinutes}min</span>
                                          )}
                                        </div>
                                        <p className="text-white text-sm font-mono whitespace-pre-wrap">{msg.rendered}</p>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                              {!simResult.triggered && (
                                <p className="text-white/50 text-sm">
                                  The comment "{simComment}" didn't match any keywords. Try adding more keywords or check your match type settings.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Quick test examples */}
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-white/50 text-xs font-semibold mb-2">Quick test examples:</p>
                            <div className="flex flex-wrap gap-2">
                              {["FIRE 🔥", "I need the guide", "link please", "YES!", "how do I start?"].map((ex) => (
                                <button
                                  key={ex}
                                  onClick={() => setSimComment(ex)}
                                  className="text-xs bg-white/5 border border-white/10 text-white/60 rounded px-2 py-1 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                  {ex}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── ANALYTICS TAB ── */}
                  <TabsContent value="analytics">
                    {analytics ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <StatCard label="Triggers" value={analytics.totalTriggers} icon={<Hash className="w-4 h-4" />} color="text-pink-400" />
                          <StatCard label="DMs Sent" value={analytics.totalDmsSent} icon={<Send className="w-4 h-4" />} color="text-purple-400" />
                          <StatCard label="Conversions" value={analytics.totalConversions} icon={<CheckCircle className="w-4 h-4" />} color="text-green-400" />
                          <StatCard label="Conv. Rate" value={`${analytics.conversionRate}%`} icon={<TrendingUp className="w-4 h-4" />} color="text-blue-400" />
                        </div>

                        {/* Top keywords */}
                        {analytics.topKeywords.length > 0 && (
                          <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-white text-sm">Top Trigger Keywords</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {analytics.topKeywords.map((kw, i) => (
                                  <div key={kw.keyword} className="flex items-center gap-3">
                                    <span className="text-white/30 text-xs w-4">#{i + 1}</span>
                                    <span className="text-pink-400 font-mono text-sm flex-1">{kw.keyword}</span>
                                    <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs">{kw.count} triggers</Badge>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Recent events */}
                        {analytics.recentEvents.length > 0 && (
                          <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-white text-sm flex items-center gap-2">
                                <Eye className="w-4 h-4 text-white/40" /> Recent Events
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {analytics.recentEvents.map((event) => (
                                  <div key={event.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                                    <Badge className={`text-xs flex-shrink-0 ${
                                      event.eventType === "comment_detected" ? "bg-blue-500/20 text-blue-400" :
                                      event.eventType === "dm_sent" ? "bg-green-500/20 text-green-400" :
                                      event.eventType === "converted" ? "bg-yellow-500/20 text-yellow-400" :
                                      "bg-white/10 text-white/50"
                                    }`}>
                                      {event.eventType.replace("_", " ")}
                                    </Badge>
                                    {event.commenterName && <span className="text-white/60 text-xs">{event.commenterName}</span>}
                                    {event.triggerKeyword && <span className="text-pink-400 font-mono text-xs">"{event.triggerKeyword}"</span>}
                                    <span className="text-white/30 text-xs ml-auto">
                                      {new Date(event.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {analytics.totalTriggers === 0 && (
                          <Card className="bg-white/5 border-white/10">
                            <CardContent className="pt-8 pb-8 text-center">
                              <BarChart2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                              <p className="text-white/40">No events yet</p>
                              <p className="text-white/30 text-sm mt-1">Use the Simulator tab to test your funnel, or activate the campaign to start tracking real events</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[1, 2].map((i) => <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />)}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>

        {/* ── How It Works ── */}
        <Card className="bg-white/5 border-white/10 mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              How Comment-to-DM Funnels Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Post Your Video", desc: 'Add CTA in caption: "Comment FIRE and I\'ll DM you the guide 🔥"', color: "text-pink-400" },
                { step: "2", title: "Keyword Detected", desc: "Someone comments with your trigger word — funnel activates instantly", color: "text-purple-400" },
                { step: "3", title: "Auto DM Sent", desc: "Personalized DM with {name} and {link} sent automatically within seconds", color: "text-blue-400" },
                { step: "4", title: "Convert & Track", desc: "Track clicks, conversions, and optimize your top-performing keywords", color: "text-green-400" },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className={`text-2xl font-bold ${s.color} flex-shrink-0 w-8`}>{s.step}</div>
                  <div>
                    <p className="text-white text-sm font-semibold">{s.title}</p>
                    <p className="text-white/50 text-xs mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
