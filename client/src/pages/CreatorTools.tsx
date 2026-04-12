import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users, DollarSign, MessageCircle, TrendingUp, Heart,
  Loader2, Plus, Send, FolderOpen, Target, Zap, BarChart3,
  UserPlus, Shield, Eye, AlertTriangle, Search, Filter,
  Image as ImageIcon, Video, Music, Archive, Tag, Clock,
  ArrowLeft, RefreshCw, Sparkles, Globe, Bot
} from "lucide-react";

// ============================================================
// FAN CRM TAB
// ============================================================
function FanCrmTab() {
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [showAtRisk, setShowAtRisk] = useState(false);

  const { data: stats, isLoading: statsLoading } = trpc.fanCrm.getStats.useQuery();
  const { data: fansData, isLoading: fansLoading } = trpc.fanCrm.list.useQuery({
    spendingTier: tierFilter !== "all" ? tierFilter : undefined,
    isAtRisk: showAtRisk ? true : undefined,
    sortBy: "engagementScore",
    sortDir: "desc",
    limit: 50,
  });

  const recalculate = trpc.fanCrm.recalculateScore.useMutation({
    onSuccess: () => toast.success("Fan score recalculated"),
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Fans</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalFans || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">At Risk</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">{stats?.atRiskFans || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Whales</span>
            </div>
            <p className="text-2xl font-bold text-emerald-500">{stats?.whales || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Avg Score</span>
            </div>
            <p className="text-2xl font-bold">{stats?.avgEngagementScore || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Lifetime $</span>
            </div>
            <p className="text-2xl font-bold">${stats?.totalLifetimeSpend?.toFixed(0) || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      {stats?.tierBreakdown && stats.tierBreakdown.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Fan Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {stats.tierBreakdown.map(t => (
                <Badge key={t.tier} variant={t.tier === 'whale' ? 'default' : 'secondary'}
                  className="cursor-pointer" onClick={() => setTierFilter(t.tier)}>
                  {t.tier}: {t.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="whale">Whales</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="dormant">Dormant</SelectItem>
            <SelectItem value="new">New</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={showAtRisk} onCheckedChange={setShowAtRisk} />
          <Label className="text-sm">At Risk Only</Label>
        </div>
      </div>

      {/* Fan List */}
      {fansLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : fansData?.fans && fansData.fans.length > 0 ? (
        <div className="space-y-2">
          {fansData.fans.map(fan => (
            <Card key={fan.id} className="bg-card/50 border-border/50">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Fan #{fan.fanUserId}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={fan.spendingTier === 'whale' ? 'default' : 'secondary'} className="text-xs">
                          {fan.spendingTier}
                        </Badge>
                        {fan.isAtRisk && <Badge variant="destructive" className="text-xs">At Risk</Badge>}
                        {fan.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Score</p>
                      <p className="font-bold">{fan.engagementScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Spent</p>
                      <p className="font-bold">${Number(fan.lifetimeSpend).toFixed(0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Messages</p>
                      <p className="font-bold">{fan.totalMessages}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => recalculate.mutate({ fanUserId: fan.fanUserId })}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No fan profiles yet. Fan profiles are created automatically as fans interact with your content.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// MESSAGE TEMPLATES TAB
// ============================================================
function MessageTemplatesTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: "", content: "", category: "custom" as const, variables: [] as string[] });

  const { data: templates, refetch } = trpc.messageTemplate.list.useQuery();
  const createMutation = trpc.messageTemplate.create.useMutation({
    onSuccess: () => { toast.success("Template created"); setShowCreate(false); refetch(); },
  });
  const deleteMutation = trpc.messageTemplate.delete.useMutation({
    onSuccess: () => { toast.success("Template deleted"); refetch(); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Message Templates</h3>
          <p className="text-sm text-muted-foreground">Reusable message templates for campaigns and automations</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map(t => (
            <Card key={t.id} className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                  <Badge variant="secondary">{t.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{t.content}</p>
                {t.variables && t.variables.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {t.variables.map(v => (
                      <Badge key={v} variant="outline" className="text-xs">{`{${v}}`}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 pb-3 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Used {t.usageCount}x</span>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate({ id: t.id })}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No templates yet. Create your first message template.</p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message Template</DialogTitle>
            <DialogDescription>Create a reusable template for messages and campaigns</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Welcome message" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="winback">Win-back</SelectItem>
                  <SelectItem value="ppv">PPV</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                placeholder="Hey {fanName}! Thanks for subscribing..." rows={5} />
              <p className="text-xs text-muted-foreground mt-1">Use {`{variable}`} for dynamic content</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.name || !formData.content}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// AUTOMATIONS TAB
// ============================================================
function AutomationsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "", trigger: "new_subscriber" as "new_subscriber" | "inactive_days" | "purchase" | "tip" | "birthday" | "custom", triggerValue: "",
    messageContent: "", delayMinutes: 0, sendAtOptimalTime: false,
  });

  const { data: automations, refetch } = trpc.automation.list.useQuery();
  const createMutation = trpc.automation.create.useMutation({
    onSuccess: () => { toast.success("Automation created"); setShowCreate(false); refetch(); },
  });
  const toggleMutation = trpc.automation.update.useMutation({
    onSuccess: () => { toast.success("Automation updated"); refetch(); },
  });
  const deleteMutation = trpc.automation.delete.useMutation({
    onSuccess: () => { toast.success("Automation deleted"); refetch(); },
  });

  const TRIGGERS = [
    { value: "new_subscriber", label: "New Subscriber", icon: UserPlus },
    { value: "inactive_days", label: "Inactive Days", icon: Clock },
    { value: "purchase", label: "After Purchase", icon: DollarSign },
    { value: "tip", label: "After Tip", icon: Heart },
    { value: "birthday", label: "Birthday", icon: Sparkles },
    { value: "custom", label: "Custom", icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Automations</h3>
          <p className="text-sm text-muted-foreground">Set up automated messages triggered by fan actions</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Automation
        </Button>
      </div>

      {automations && automations.length > 0 ? (
        <div className="space-y-3">
          {automations.map(a => {
            const triggerInfo = TRIGGERS.find(t => t.value === a.trigger);
            const TriggerIcon = triggerInfo?.icon || Zap;
            return (
              <Card key={a.id} className="bg-card/50 border-border/50">
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                        <TriggerIcon className={`w-5 h-5 ${a.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Trigger: {triggerInfo?.label || a.trigger}
                          {a.triggerValue && ` (${a.triggerValue})`}
                          {a.delayMinutes > 0 && ` • Delay: ${a.delayMinutes}min`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Sent: {a.totalSent}</p>
                        <p className="text-muted-foreground">Revenue: ${Number(a.totalRevenue).toFixed(0)}</p>
                      </div>
                      <Switch checked={a.isActive} onCheckedChange={v => toggleMutation.mutate({ id: a.id, isActive: v })} />
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate({ id: a.id })}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No automations yet. Create your first automation to engage fans automatically.</p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Automation</DialogTitle>
            <DialogDescription>Automate messages based on fan actions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Welcome sequence" />
            </div>
            <div>
              <Label>Trigger</Label>
              <Select value={formData.trigger} onValueChange={v => setFormData(p => ({ ...p, trigger: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {formData.trigger === "inactive_days" && (
              <div>
                <Label>Days Inactive</Label>
                <Input type="number" value={formData.triggerValue} onChange={e => setFormData(p => ({ ...p, triggerValue: e.target.value }))} placeholder="7" />
              </div>
            )}
            <div>
              <Label>Message</Label>
              <Textarea value={formData.messageContent} onChange={e => setFormData(p => ({ ...p, messageContent: e.target.value }))}
                placeholder="Hey! Thanks for joining..." rows={4} />
            </div>
            <div>
              <Label>Delay (minutes)</Label>
              <Input type="number" value={formData.delayMinutes} onChange={e => setFormData(p => ({ ...p, delayMinutes: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.sendAtOptimalTime} onCheckedChange={v => setFormData(p => ({ ...p, sendAtOptimalTime: v }))} />
              <Label>Send at fan's optimal time</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.name || !formData.messageContent}>
              Create Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// CAMPAIGNS TAB
// ============================================================
function CampaignsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: "", messageContent: "" });

  const { data: campaigns, refetch } = trpc.campaign.list.useQuery();
  const createMutation = trpc.campaign.create.useMutation({
    onSuccess: () => { toast.success("Campaign created"); setShowCreate(false); refetch(); },
  });
  const deleteMutation = trpc.campaign.delete.useMutation({
    onSuccess: () => { toast.success("Campaign deleted"); refetch(); },
  });

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-blue-500/20 text-blue-400",
    sending: "bg-amber-500/20 text-amber-400",
    sent: "bg-emerald-500/20 text-emerald-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mass Campaigns</h3>
          <p className="text-sm text-muted-foreground">Send targeted messages to fan segments</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="space-y-3">
          {campaigns.map(c => (
            <Card key={c.id} className="bg-card/50 border-border/50">
              <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.messageContent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={STATUS_COLORS[c.status] || ""}>{c.status}</Badge>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Sent: {c.totalSent}/{c.totalRecipients}</p>
                      <p className="text-muted-foreground">Revenue: ${Number(c.totalRevenue).toFixed(0)}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate({ id: c.id })}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Send className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No campaigns yet. Create your first mass message campaign.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
            <DialogDescription>Create a mass message campaign to reach your fans</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Holiday Special" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={formData.messageContent} onChange={e => setFormData(p => ({ ...p, messageContent: e.target.value }))}
                placeholder="Hey! Check out my exclusive new content..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.name || !formData.messageContent}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// CONTENT VAULT TAB
// ============================================================
function ContentVaultTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "", contentType: "image" as const, url: "", folder: "", tags: [] as string[],
    category: "", defaultPpvPrice: "", isExclusive: false,
  });

  const { data: stats } = trpc.vault.stats.useQuery();
  const { data: vaultData, refetch } = trpc.vault.list.useQuery({
    search: search || undefined,
    contentType: typeFilter !== "all" ? typeFilter : undefined,
    sortBy: "createdAt",
  });
  const createMutation = trpc.vault.create.useMutation({
    onSuccess: () => { toast.success("Content added to vault"); setShowCreate(false); refetch(); },
  });
  const deleteMutation = trpc.vault.delete.useMutation({
    onSuccess: () => { toast.success("Content removed"); refetch(); },
  });

  const TYPE_ICONS: Record<string, any> = {
    image: ImageIcon, video: Video, audio: Music, gallery: Archive,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold">{stats?.totalSales || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(0) || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Views</p>
            <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="gallery">Gallery</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Content
        </Button>
      </div>

      {/* Content Grid */}
      {vaultData?.items && vaultData.items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vaultData.items.map(item => {
            const TypeIcon = TYPE_ICONS[item.contentType] || ImageIcon;
            return (
              <Card key={item.id} className="bg-card/50 border-border/50 overflow-hidden">
                {item.thumbnailUrl ? (
                  <div className="aspect-video bg-muted relative">
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                    {item.isExclusive && (
                      <Badge className="absolute top-2 right-2 bg-amber-500">Exclusive</Badge>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    <TypeIcon className="w-12 h-12 text-muted-foreground" />
                    {item.isExclusive && (
                      <Badge className="absolute top-2 right-2 bg-amber-500">Exclusive</Badge>
                    )}
                  </div>
                )}
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <Badge variant="secondary" className="text-xs">{item.contentType}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.salesCount} sales • {item.viewCount} views</span>
                    {item.defaultPpvPrice && <span className="text-emerald-500 font-medium">${Number(item.defaultPpvPrice).toFixed(2)}</span>}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {item.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 pb-3 flex justify-end">
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate({ id: item.id })}>
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Your content vault is empty. Add your first piece of content.</p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Vault</DialogTitle>
            <DialogDescription>Add content to your organized media library</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Beach photoshoot" />
            </div>
            <div>
              <Label>Content Type</Label>
              <Select value={formData.contentType} onValueChange={v => setFormData(p => ({ ...p, contentType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="gallery">Gallery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL</Label>
              <Input value={formData.url} onChange={e => setFormData(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Folder</Label>
              <Input value={formData.folder} onChange={e => setFormData(p => ({ ...p, folder: e.target.value }))} placeholder="Photoshoots" />
            </div>
            <div>
              <Label>Default PPV Price ($)</Label>
              <Input value={formData.defaultPpvPrice} onChange={e => setFormData(p => ({ ...p, defaultPpvPrice: e.target.value }))} placeholder="9.99" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.isExclusive} onCheckedChange={v => setFormData(p => ({ ...p, isExclusive: v }))} />
              <Label>Exclusive Content</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.title || !formData.url}>
              Add to Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// TEAM MANAGEMENT TAB
// ============================================================
function TeamTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    memberUserId: 0, role: "chatter" as const,
    permissions: { canChat: true, canSendPpv: false, canViewAnalytics: false, canManageContent: false, canManageTeam: false },
  });

  const { data: team, refetch } = trpc.team.list.useQuery();
  const { data: performance } = trpc.team.performance.useQuery();
  const addMutation = trpc.team.add.useMutation({
    onSuccess: () => { toast.success("Team member added"); setShowAdd(false); refetch(); },
  });
  const removeMutation = trpc.team.remove.useMutation({
    onSuccess: () => { toast.success("Team member removed"); refetch(); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Management</h3>
          <p className="text-sm text-muted-foreground">Manage chatters and moderators</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Add Member
        </Button>
      </div>

      {/* Performance Overview */}
      {performance && performance.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Member #{m.memberUserId}</p>
                      <Badge variant="secondary" className="text-xs">{m.role}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Messages</p>
                      <p className="font-bold">{m.messagesSent}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-bold text-emerald-500">${m.revenueGenerated.toFixed(0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Avg Response</p>
                      <p className="font-bold">{m.avgResponseTime}s</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team List */}
      {team && team.length > 0 ? (
        <div className="space-y-2">
          {team.map(m => (
            <Card key={m.id} className="bg-card/50 border-border/50">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.isActive ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                      <Shield className={`w-5 h-5 ${m.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium">Member #{m.memberUserId}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{m.role}</Badge>
                        <Badge variant={m.isActive ? "default" : "secondary"}>{m.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeMutation.mutate({ id: m.id })}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No team members yet. Add chatters and moderators to help manage your fans.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a chatter or moderator to your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input type="number" value={formData.memberUserId || ""} onChange={e => setFormData(p => ({ ...p, memberUserId: parseInt(e.target.value) || 0 }))} placeholder="Enter user ID" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={v => setFormData(p => ({ ...p, role: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="chatter">Chatter</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              {Object.entries(formData.permissions).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <Switch checked={val} onCheckedChange={v => setFormData(p => ({
                    ...p, permissions: { ...p.permissions, [key]: v }
                  }))} />
                  <Label className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace('can ', 'Can ')}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate(formData)} disabled={!formData.memberUserId}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// SOCIAL TRAFFIC TAB
// ============================================================
function SocialTrafficTab() {
  const { data: trafficStats, isLoading } = trpc.socialTraffic.stats.useQuery({ days: 30 });

  const PLATFORM_COLORS: Record<string, string> = {
    tiktok: "bg-pink-500/20 text-pink-400",
    instagram: "bg-purple-500/20 text-purple-400",
    twitter: "bg-blue-400/20 text-blue-400",
    youtube: "bg-red-500/20 text-red-400",
    reddit: "bg-orange-500/20 text-orange-400",
    pinterest: "bg-red-400/20 text-red-400",
    other: "bg-gray-500/20 text-gray-400",
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Social Traffic Analytics</h3>
        <p className="text-sm text-muted-foreground">Track where your fans come from and how they convert</p>
      </div>

      {trafficStats?.byPlatform && trafficStats.byPlatform.length > 0 ? (
        <div className="space-y-4">
          {trafficStats.byPlatform.map(p => (
            <Card key={p.platform} className="bg-card/50 border-border/50">
              <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={PLATFORM_COLORS[p.platform] || ""}>{p.platform}</Badge>
                    <span className="text-sm font-medium">{p.visits} visits</span>
                  </div>
                  <span className="text-sm text-emerald-500 font-medium">${p.revenue.toFixed(0)} revenue</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Signups</p>
                    <p className="font-bold">{p.signups} ({p.signupRate}%)</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Generations</p>
                    <p className="font-bold">{p.generations}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Purchases</p>
                    <p className="font-bold">{p.purchases} ({p.purchaseRate}%)</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Session</p>
                    <p className="font-bold">{Math.floor(p.avgSessionDuration / 60)}m {p.avgSessionDuration % 60}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No traffic data yet. Social traffic is tracked automatically from referrer URLs.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// MAIN CREATOR TOOLS PAGE
// ============================================================
export default function CreatorTools() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("crm");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Creator Tools</h1>
          <p className="text-muted-foreground mb-6">Sign in to access your creator tools</p>
          <Button asChild><a href={getLoginUrl()}>Sign In</a></Button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "crm", label: "Fan CRM", icon: Users },
    { id: "vault", label: "Content Vault", icon: FolderOpen },
    { id: "templates", label: "Templates", icon: MessageCircle },
    { id: "automations", label: "Automations", icon: Bot },
    { id: "campaigns", label: "Campaigns", icon: Send },
    { id: "team", label: "Team", icon: Shield },
    { id: "traffic", label: "Traffic", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-20 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/creator")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Creator Tools</h1>
            <p className="text-sm text-muted-foreground">Manage fans, content, messaging, and team performance</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6 bg-card/50">
            {TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2 whitespace-nowrap">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="crm"><FanCrmTab /></TabsContent>
          <TabsContent value="vault"><ContentVaultTab /></TabsContent>
          <TabsContent value="templates"><MessageTemplatesTab /></TabsContent>
          <TabsContent value="automations"><AutomationsTab /></TabsContent>
          <TabsContent value="campaigns"><CampaignsTab /></TabsContent>
          <TabsContent value="team"><TeamTab /></TabsContent>
          <TabsContent value="traffic"><SocialTrafficTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
