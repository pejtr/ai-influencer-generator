import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Calendar, Plus, Trash2, Wand2, ChevronRight,
  Instagram, Youtube, Linkedin, Twitter, CheckCircle2,
  Circle, PlayCircle, Scissors, Send
} from "lucide-react";
import { Link } from "wouter";

// ─── Pipeline Status Config ────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "idea", label: "Idea", icon: Circle, color: "text-muted-foreground", bg: "bg-muted/30" },
  { key: "scripted", label: "Scripted", icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10" },
  { key: "recorded", label: "Recorded", icon: PlayCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
  { key: "edited", label: "Edited", icon: Scissors, color: "text-violet-400", bg: "bg-violet-500/10" },
  { key: "published", label: "Published", icon: Send, color: "text-green-400", bg: "bg-green-500/10" },
] as const;

type PipelineStatus = "idea" | "scripted" | "recorded" | "edited" | "published";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-3 h-3" />,
  youtube: <Youtube className="w-3 h-3" />,
  tiktok: <span className="text-xs font-bold">TT</span>,
  linkedin: <Linkedin className="w-3 h-3" />,
  twitter: <Twitter className="w-3 h-3" />,
  facebook: <span className="text-xs font-bold">FB</span>,
};

// ─── Calendar Item Card ────────────────────────────────────────────────────

function CalendarItemCard({
  item,
  onStatusChange,
  onDelete,
}: {
  item: {
    id: number; title: string; platform: string; scheduledDate: Date | string;
    pipelineStatus: string; notes: string | null;
  };
  onStatusChange: (id: number, status: PipelineStatus) => void;
  onDelete: (id: number) => void;
}) {
  const stage = PIPELINE_STAGES.find(s => s.key === item.pipelineStatus) ?? PIPELINE_STAGES[0];
  const StageIcon = stage.icon;
  const nextStage = PIPELINE_STAGES[PIPELINE_STAGES.findIndex(s => s.key === item.pipelineStatus) + 1];

  return (
    <Card className={`transition-all hover:border-primary/30 ${stage.bg}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <StageIcon className={`w-4 h-4 ${stage.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {PLATFORM_ICONS[item.platform]}
                <span className="capitalize">{item.platform}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(item.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${stage.color} border-current/30`}
              >
                {stage.label}
              </Badge>
            </div>
            {item.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{item.notes}</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {nextStage && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 px-2"
                onClick={() => onStatusChange(item.id, nextStage.key as PipelineStatus)}
                title={`Mark as ${nextStage.label}`}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive h-7 w-7 p-0"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AI Week Plan Generator ────────────────────────────────────────────────

function WeekPlanGenerator({ onGenerated }: { onGenerated: (days: any[]) => void }) {
  const [niche, setNiche] = useState("");
  const [offer, setOffer] = useState("");
  const [platforms, setPlatforms] = useState(["instagram"]);
  const [postsPerDay, setPostsPerDay] = useState(1);

  const generate = trpc.contentSystem.calendar.generateWeekPlan.useMutation({
    onSuccess: (data) => {
      onGenerated(data.days);
      toast.success(`Generated ${data.days.length} content ideas!`);
    },
    onError: (e) => toast.error(e.message),
  });

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Your Niche <span className="text-red-400">*</span></label>
        <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. AI tools for content creators" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Offer / CTA</label>
        <Input value={offer} onChange={e => setOffer(e.target.value)} placeholder="e.g. Comment 'SYSTEM' for my free guide" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Platforms</label>
        <div className="flex gap-2 flex-wrap">
          {["instagram", "tiktok", "youtube", "linkedin"].map(p => (
            <Button
              key={p}
              size="sm"
              variant={platforms.includes(p) ? "default" : "outline"}
              onClick={() => togglePlatform(p)}
              className="capitalize text-xs"
            >
              {PLATFORM_ICONS[p]}
              <span className="ml-1">{p}</span>
            </Button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Posts per Day</label>
        <Select value={String(postsPerDay)} onValueChange={v => setPostsPerDay(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{n} post{n > 1 ? "s" : ""}/day</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full"
        disabled={!niche.trim() || generate.isPending || platforms.length === 0}
        onClick={() => generate.mutate({ niche, offer, platforms, postsPerDay })}
      >
        {generate.isPending
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating 7-day plan...</>
          : <><Wand2 className="w-4 h-4 mr-2" />Generate 7-Day Content Plan</>
        }
      </Button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ContentCalendar() {
  const { isAuthenticated, loading } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState<string>("instagram");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");

  const utils = trpc.useUtils();

  const { data: items, isLoading } = trpc.contentSystem.calendar.getItems.useQuery(
    {}, { enabled: isAuthenticated }
  );

  const addItem = trpc.contentSystem.calendar.addItem.useMutation({
    onSuccess: () => {
      utils.contentSystem.calendar.getItems.invalidate();
      setAddOpen(false);
      setNewTitle(""); setNewNotes("");
      toast.success("Added to calendar!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.contentSystem.calendar.updateStatus.useMutation({
    onSuccess: () => utils.contentSystem.calendar.getItems.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const deleteItem = trpc.contentSystem.calendar.delete.useMutation({
    onSuccess: () => {
      utils.contentSystem.calendar.getItems.invalidate();
      toast.success("Removed from calendar");
    },
  });

  const handleBulkAdd = (days: any[]) => {
    const today = new Date();
    days.forEach((day, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      addItem.mutate({
        title: day.title,
        platform: (day.platform || "instagram") as any,
        scheduledDate: date,
        pipelineStatus: "idea",
        notes: day.hook ? `Hook: ${day.hook}` : "",
      });
    });
    setPlanOpen(false);
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (filterStatus === "all") return items;
    return items.filter(i => i.pipelineStatus === filterStatus);
  }, [items, filterStatus]);

  // Pipeline stats
  const pipelineStats = useMemo(() => {
    if (!items) return {};
    return PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage.key] = items.filter(i => i.pipelineStatus === stage.key).length;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center"><CardTitle>Sign in required</CardTitle></CardHeader>
          <CardContent className="text-center"><Button asChild><Link href="/">Go Home</Link></Button></CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold">Content Calendar</h1>
                <Badge variant="secondary" className="text-xs">Steps 3–4 — Nicola Urbini System</Badge>
              </div>
              <p className="text-muted-foreground text-sm max-w-xl">
                Plan, track, and publish. Move content through the 5-stage pipeline from idea to published.
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Wand2 className="w-4 h-4 mr-2" />AI Week Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Generate 7-Day Content Plan</DialogTitle>
                  </DialogHeader>
                  <p className="text-xs text-muted-foreground mb-3">
                    AI generates a full week of content ideas with hooks, angles, and CTAs — ready to drop into your pipeline.
                  </p>
                  <WeekPlanGenerator onGenerated={handleBulkAdd} />
                </DialogContent>
              </Dialog>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add to Content Calendar</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Title <span className="text-red-400">*</span></label>
                      <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. 5 AI tools that saved me 4 hours/day" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Platform</label>
                        <Select value={newPlatform} onValueChange={setNewPlatform}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["instagram", "tiktok", "youtube", "linkedin", "twitter", "facebook"].map(p => (
                              <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Scheduled Date</label>
                        <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Notes / Hook</label>
                      <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Hook, key points, CTA..." rows={3} />
                    </div>
                    <Button
                      className="w-full"
                      disabled={!newTitle.trim() || addItem.isPending}
                      onClick={() => addItem.mutate({
                        title: newTitle,
                        platform: newPlatform as any,
                        scheduledDate: new Date(newDate),
                        pipelineStatus: "idea",
                        notes: newNotes,
                      })}
                    >
                      {addItem.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add to Calendar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Pipeline Overview */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {PIPELINE_STAGES.map(stage => {
              const StageIcon = stage.icon;
              const count = pipelineStats[stage.key] ?? 0;
              return (
                <button
                  key={stage.key}
                  onClick={() => setFilterStatus(filterStatus === stage.key ? "all" : stage.key)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    filterStatus === stage.key
                      ? `${stage.bg} border-current/30`
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <StageIcon className={`w-4 h-4 mx-auto mb-1 ${stage.color}`} />
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{stage.label}</div>
                </button>
              );
            })}
          </div>

          {/* Filter Badge */}
          {filterStatus !== "all" && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Showing:</span>
              <Badge variant="secondary" className="capitalize">{filterStatus}</Badge>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setFilterStatus("all")}>
                Clear filter
              </Button>
            </div>
          )}

          {/* Content List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {filterStatus === "all" ? "Calendar is empty" : `No ${filterStatus} content`}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                {filterStatus === "all"
                  ? "Generate a 7-day AI plan or add content manually to start tracking your pipeline."
                  : `No content in the "${filterStatus}" stage yet.`
                }
              </p>
              {filterStatus === "all" && (
                <div className="flex gap-2">
                  <Button onClick={() => setPlanOpen(true)} variant="outline">
                    <Wand2 className="w-4 h-4 mr-2" />AI Week Plan
                  </Button>
                  <Button onClick={() => setAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />Add Manually
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item => (
                <CalendarItemCard
                  key={item.id}
                  item={item}
                  onStatusChange={(id, status) => updateStatus.mutate({ id, pipelineStatus: status })}
                  onDelete={(id) => deleteItem.mutate({ id })}
                />
              ))}
            </div>
          )}

          {/* CTA to full system */}
          {items && items.length > 0 && (
            <Card className="mt-6 border-green-500/30 bg-green-500/5">
              <CardContent className="py-4 px-4">
                <p className="text-sm font-semibold mb-2">Complete the 4-Step System</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/idea-finder"><Wand2 className="w-3 h-3 mr-1" />Step 1: Find Hooks</Link>
                  </Button>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/script-studio"><Wand2 className="w-3 h-3 mr-1" />Step 2: Script</Link>
                  </Button>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                    <Calendar className="w-3 h-3 mr-1" />Step 3–4: Plan & Publish ✓
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
