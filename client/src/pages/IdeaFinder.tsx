import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2, Zap, Plus, Trash2, Copy, Check, TrendingUp,
  Calculator, ChevronRight, Star, BookOpen, ArrowRight
} from "lucide-react";
import { Link } from "wouter";

// ─── Engagement Calculator ─────────────────────────────────────────────────

function EngagementCalculator({ onSave }: { onSave: (hook: string, engagementRate: number, outlierScore: number) => void }) {
  const [views, setViews] = useState("");
  const [comments, setComments] = useState("");
  const [likes, setLikes] = useState("");
  const [hookText, setHookText] = useState("");
  const [sourceNiche, setSourceNiche] = useState("");
  const [result, setResult] = useState<{
    engagementRate: number; outlierScore: number; loopDetected: boolean; insight: string;
  } | null>(null);

  const calc = trpc.contentSystem.hooks.calculateEngagement.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (e) => toast.error(e.message),
  });

  const handleCalc = () => {
    if (!views || !comments) { toast.error("Views and comments are required"); return; }
    calc.mutate({ views: Number(views), comments: Number(comments), likes: Number(likes) || 0 });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Views</label>
          <Input type="number" value={views} onChange={e => setViews(e.target.value)} placeholder="100000" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Comments</label>
          <Input type="number" value={comments} onChange={e => setComments(e.target.value)} placeholder="1500" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Likes (opt.)</label>
          <Input type="number" value={likes} onChange={e => setLikes(e.target.value)} placeholder="8000" />
        </div>
      </div>
      <Button onClick={handleCalc} disabled={calc.isPending} className="w-full" variant="outline">
        {calc.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
        Calculate Outlier Score
      </Button>

      {result && (
        <div className="p-3 rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Outlier Score</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${result.outlierScore >= 70 ? "bg-green-500" : result.outlierScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${result.outlierScore}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${result.outlierScore >= 70 ? "text-green-400" : result.outlierScore >= 40 ? "text-amber-400" : "text-red-400"}`}>
                {result.outlierScore}/100
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Engagement Rate</span>
            <span className="font-mono">{result.engagementRate.toFixed(2)}%</span>
          </div>
          {result.loopDetected && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              🔄 Loop Detected — hook opened strong conversation
            </Badge>
          )}
          <p className="text-xs">{result.insight}</p>

          {result.outlierScore >= 40 && (
            <div className="pt-2 border-t border-border space-y-2">
              <label className="text-xs font-medium block">Save this hook to swipe file</label>
              <Textarea
                value={hookText}
                onChange={e => setHookText(e.target.value)}
                placeholder="Paste the hook text here..."
                rows={2}
                className="text-xs"
              />
              <Input
                value={sourceNiche}
                onChange={e => setSourceNiche(e.target.value)}
                placeholder="Source niche (e.g. fitness, crypto, AI tools)"
                className="text-xs"
              />
              <Button
                size="sm"
                className="w-full"
                disabled={!hookText.trim()}
                onClick={() => {
                  if (hookText.trim()) {
                    onSave(hookText, result.engagementRate, result.outlierScore);
                    setHookText("");
                    setResult(null);
                    setViews(""); setComments(""); setLikes("");
                  }
                }}
              >
                <Plus className="w-3 h-3 mr-1" />Save to Swipe File
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hook Card ─────────────────────────────────────────────────────────────

function HookCard({ hook, onDelete, onUse }: {
  hook: {
    id: number; hookText: string; sourceNiche: string; engagementRate: string | number;
    outlierScore: number; tags: string; timesUsed: number; notes: string | null;
  };
  onDelete: () => void;
  onUse: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const er = typeof hook.engagementRate === "string" ? parseFloat(hook.engagementRate) : hook.engagementRate;

  const copy = () => {
    navigator.clipboard.writeText(hook.hookText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Hook copied!");
  };

  const scoreColor = hook.outlierScore >= 70 ? "text-green-400" : hook.outlierScore >= 40 ? "text-amber-400" : "text-muted-foreground";
  const scoreBg = hook.outlierScore >= 70 ? "bg-green-500/10 border-green-500/20" : hook.outlierScore >= 40 ? "bg-amber-500/10 border-amber-500/20" : "bg-muted/30";

  return (
    <Card className={`transition-all hover:border-primary/30 ${scoreBg}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-center">
            <div className={`text-xl font-bold ${scoreColor}`}>{hook.outlierScore}</div>
            <div className="text-xs text-muted-foreground">score</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed mb-2">{hook.hookText}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {hook.sourceNiche && (
                <Badge variant="outline" className="text-xs">{hook.sourceNiche}</Badge>
              )}
              <span className="text-xs text-muted-foreground">{er.toFixed(2)}% engagement</span>
              {hook.timesUsed > 0 && (
                <span className="text-xs text-muted-foreground">Used {hook.timesUsed}×</span>
              )}
              {hook.tags && hook.tags.split(",").filter(Boolean).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag.trim()}</Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Button size="sm" variant="ghost" onClick={copy}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={onUse} title="Use in Script Studio">
              <ArrowRight className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function IdeaFinder() {
  const { isAuthenticated, loading } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [newHook, setNewHook] = useState("");
  const [newNiche, setNewNiche] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const utils = trpc.useUtils();

  const { data: hooks, isLoading } = trpc.contentSystem.hooks.getAll.useQuery(
    {}, { enabled: isAuthenticated }
  );

  const addHook = trpc.contentSystem.hooks.add.useMutation({
    onSuccess: () => {
      utils.contentSystem.hooks.getAll.invalidate();
      setAddOpen(false);
      setNewHook(""); setNewNiche(""); setNewUrl(""); setNewTags(""); setNewNotes("");
      toast.success("Hook added to swipe file!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteHook = trpc.contentSystem.hooks.delete.useMutation({
    onSuccess: () => {
      utils.contentSystem.hooks.getAll.invalidate();
      toast.success("Hook removed");
    },
  });

  const incrementUsed = trpc.contentSystem.hooks.incrementUsed.useMutation();

  const handleSaveFromCalc = (hookText: string, engagementRate: number, outlierScore: number) => {
    addHook.mutate({ hookText, engagementRate, outlierScore });
    setCalcOpen(false);
  };

  const handleUseHook = (hookText: string, id: number) => {
    incrementUsed.mutate({ id });
    // Store in sessionStorage for Script Studio to pick up
    sessionStorage.setItem("pendingHook", hookText);
    window.location.href = "/script-studio";
  };

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

  const topHooks = hooks?.filter(h => h.outlierScore >= 70) ?? [];
  const avgScore = hooks?.length ? Math.round(hooks.reduce((s, h) => s + h.outlierScore, 0) / hooks.length) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold">Viral Idea Finder</h1>
                <Badge variant="secondary" className="text-xs">Step 1 — Nicola Urbini System</Badge>
              </div>
              <p className="text-muted-foreground text-sm max-w-xl">
                Your hook swipe file. Score viral potential with the Loop Detector. Steal structure, not subject.
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calculator className="w-4 h-4 mr-2" />Outlier Calculator
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Loop Detector — Outlier Score Calculator</DialogTitle>
                  </DialogHeader>
                  <p className="text-xs text-muted-foreground mb-3">
                    High comment-to-view ratio = hook opened a loop. That's the signal to steal the structure.
                  </p>
                  <EngagementCalculator onSave={handleSaveFromCalc} />
                </DialogContent>
              </Dialog>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Hook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Hook to Swipe File</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Hook Text <span className="text-red-400">*</span></label>
                      <Textarea
                        value={newHook}
                        onChange={e => setNewHook(e.target.value)}
                        placeholder="The reason most people never make money online is not what you think..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Source Niche</label>
                        <Input value={newNiche} onChange={e => setNewNiche(e.target.value)} placeholder="fitness, crypto, AI..." />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Source URL</label>
                        <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
                      <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="curiosity, contrarian, story..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Notes</label>
                      <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Why this hook works..." rows={2} />
                    </div>
                    <Button
                      className="w-full"
                      disabled={!newHook.trim() || addHook.isPending}
                      onClick={() => addHook.mutate({
                        hookText: newHook, sourceNiche: newNiche, sourceUrl: newUrl,
                        tags: newTags, notes: newNotes,
                      })}
                    >
                      {addHook.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add to Swipe File
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Hooks", value: hooks?.length ?? 0, icon: BookOpen, color: "text-blue-400" },
              { label: "High Outliers (70+)", value: topHooks.length, icon: Star, color: "text-green-400" },
              { label: "Avg Outlier Score", value: avgScore, icon: TrendingUp, color: "text-amber-400" },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="py-4 px-4 flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How It Works */}
          <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1">Nicola's Loop Detector Method</p>
                  <p className="text-xs text-muted-foreground">
                    Find a viral video → calculate comment-to-view ratio → if {">"}1% comments = hook opened a loop = steal the structure.
                    Rule: <strong className="text-foreground">steal the structure, not the subject</strong>. Change 3–7 niche-specific words. Keep the emotional trigger.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hook List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !hooks || hooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Your swipe file is empty</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                Start by finding viral videos in your niche, calculate their outlier score, and save the best hooks here.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setCalcOpen(true)} variant="outline">
                  <Calculator className="w-4 h-4 mr-2" />Calculate Outlier Score
                </Button>
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />Add First Hook
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {hooks.map(hook => (
                <HookCard
                  key={hook.id}
                  hook={hook}
                  onDelete={() => deleteHook.mutate({ id: hook.id })}
                  onUse={() => handleUseHook(hook.hookText, hook.id)}
                />
              ))}
            </div>
          )}

          {/* CTA to Script Studio */}
          {hooks && hooks.length > 0 && (
            <Card className="mt-6 border-violet-500/30 bg-violet-500/5">
              <CardContent className="py-4 px-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Ready to script?</p>
                  <p className="text-xs text-muted-foreground">Take your best hook to Script Studio and generate 3 variations.</p>
                </div>
                <Button asChild className="bg-violet-600 hover:bg-violet-700">
                  <Link href="/script-studio">
                    Script Studio <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
