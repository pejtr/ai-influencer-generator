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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2, Wand2, BookOpen, Copy, Check, Trash2, Star, Plus,
  ChevronRight, Zap, FileText, Settings2, History, Pencil
} from "lucide-react";
import { Link } from "wouter";

// ─── Brand Voice Editor ────────────────────────────────────────────────────

function BrandVoiceEditor({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("My Brand Voice");
  const [tone, setTone] = useState("Conversational, direct, no fluff. Like talking to a smart friend.");
  const [vocabulary, setVocabulary] = useState("Simple words. Short sentences. Action verbs.");
  const [doNotSay, setDoNotSay] = useState("Don't say: 'In today's video', 'Don't forget to like', 'Let's dive in', 'Amazing', 'Incredible'");
  const [sampleScripts, setSampleScripts] = useState("");

  const upsert = trpc.contentSystem.brandVoice.upsert.useMutation({
    onSuccess: () => {
      toast.success("Brand Voice saved!");
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="My Brand Voice" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Tone & Style</label>
        <Textarea
          value={tone}
          onChange={e => setTone(e.target.value)}
          placeholder="Conversational, direct, no fluff..."
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Vocabulary to Use</label>
        <Textarea
          value={vocabulary}
          onChange={e => setVocabulary(e.target.value)}
          placeholder="Simple words, short sentences, action verbs..."
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Do NOT Say (Banned Words/Phrases)</label>
        <Textarea
          value={doNotSay}
          onChange={e => setDoNotSay(e.target.value)}
          placeholder="'In today's video', 'Don't forget to like', em dashes..."
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Sample Scripts (3–5 best performers)</label>
        <Textarea
          value={sampleScripts}
          onChange={e => setSampleScripts(e.target.value)}
          placeholder="Paste your best-performing scripts here. AI will match your cadence, sentence length, and verbal tics..."
          rows={6}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          The more samples you provide, the better AI matches your voice.
        </p>
      </div>
      <Button
        onClick={() => upsert.mutate({ name, tone, vocabulary, doNotSay, sampleScripts })}
        disabled={upsert.isPending}
        className="w-full"
      >
        {upsert.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><BookOpen className="w-4 h-4 mr-2" />Save Brand Voice</>}
      </Button>
    </div>
  );
}

// ─── Script Card ───────────────────────────────────────────────────────────

function ScriptCard({
  label, content, variation, scriptId, isSelected, onSelect, onSendToCalendar
}: {
  label: string; content: string; variation: "A" | "B" | "C";
  scriptId: number; isSelected: boolean;
  onSelect: () => void; onSendToCalendar: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.round(wordCount / 2.5); // ~150wpm spoken

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Script copied!");
  };

  const angleLabels: Record<string, string> = {
    A: "Story / Personal Experience",
    B: "Contrarian / Surprising Fact",
    C: "Step-by-Step / How-To",
  };

  return (
    <Card className={`transition-all ${isSelected ? "border-primary ring-1 ring-primary" : "border-border"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
              Variation {label}
            </Badge>
            <span className="text-xs text-muted-foreground">{angleLabels[variation]}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{wordCount}w</span>
            <span>·</span>
            <span>~{readTime}s</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/30 rounded-lg p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
          {content || <span className="text-muted-foreground italic">No content generated</span>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copy} className="flex-1">
            {copied ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
          </Button>
          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            onClick={onSelect}
            className="flex-1"
          >
            <Star className="w-3 h-3 mr-1" />
            {isSelected ? "Selected" : "Select"}
          </Button>
          <Button size="sm" variant="outline" onClick={onSendToCalendar}>
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ScriptStudio() {
  const { isAuthenticated, loading } = useAuth();
  const [hook, setHook] = useState("");
  const [topic, setTopic] = useState("");
  const [offerContext, setOfferContext] = useState("");
  const [activeTab, setActiveTab] = useState("generate");
  const [brandVoiceOpen, setBrandVoiceOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<"A" | "B" | "C" | null>(null);
  const [currentResult, setCurrentResult] = useState<{
    id: number; variationA: string; variationB: string; variationC: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const { data: activeVoice, refetch: refetchVoice } = trpc.contentSystem.brandVoice.getActive.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const { data: history } = trpc.contentSystem.scripts.getHistory.useQuery(
    { limit: 10 }, { enabled: isAuthenticated && activeTab === "history" }
  );

  const generate = trpc.contentSystem.scripts.generate.useMutation({
    onSuccess: (data) => {
      setCurrentResult(data);
      setSelectedVariation(null);
      setActiveTab("results");
      toast.success("3 script variations generated!", { description: "Pick the best one." });
    },
    onError: (e) => toast.error("Generation failed", { description: e.message }),
  });

  const selectVariation = trpc.contentSystem.scripts.selectVariation.useMutation({
    onSuccess: () => {
      utils.contentSystem.scripts.getHistory.invalidate();
      toast.success("Variation selected and saved!");
    },
  });

  const deleteScript = trpc.contentSystem.scripts.delete.useMutation({
    onSuccess: () => {
      utils.contentSystem.scripts.getHistory.invalidate();
      toast.success("Script deleted");
    },
  });

  const handleGenerate = () => {
    if (!hook.trim() || !topic.trim()) {
      toast.error("Hook and topic are required");
      return;
    }
    generate.mutate({
      hook,
      topic,
      offerContext,
      brandVoiceDocId: activeVoice?.id,
    });
  };

  const handleSelectVariation = (variation: "A" | "B" | "C") => {
    if (!currentResult) return;
    setSelectedVariation(variation);
    selectVariation.mutate({ id: currentResult.id, variation });
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
          <CardHeader className="text-center">
            <CardTitle>Sign in to use Script Studio</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild><Link href="/">Go Home</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-violet-400" />
                </div>
                <h1 className="text-2xl font-bold">AI Script Studio</h1>
                <Badge variant="secondary" className="text-xs">Step 2 — Nicola Urbini System</Badge>
              </div>
              <p className="text-muted-foreground text-sm max-w-xl">
                Generate 3 script variations from any hook. Brand voice matching, spoken-word rules enforced, 60–90s format.
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={brandVoiceOpen} onOpenChange={setBrandVoiceOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="w-4 h-4 mr-2" />
                    {activeVoice ? `Voice: ${activeVoice.name}` : "Set Brand Voice"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Brand Voice Document</DialogTitle>
                  </DialogHeader>
                  <BrandVoiceEditor onSaved={() => { setBrandVoiceOpen(false); refetchVoice(); }} />
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" asChild>
                <Link href="/idea-finder">
                  <Zap className="w-4 h-4 mr-2" />
                  Hook Finder
                </Link>
              </Button>
            </div>
          </div>

          {/* Spoken-Word Rules Banner */}
          <Card className="mb-6 border-violet-500/30 bg-violet-500/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Spoken-Word Rules (Auto-Enforced)</span>
                {["Max 12 words/sentence", "No em dashes", "Periods = stops", "Commas = pauses", "60–90 sec format", "No filler phrases"].map(r => (
                  <Badge key={r} variant="outline" className="text-xs border-violet-500/30 text-violet-300">{r}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: Input Panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-violet-400" />
                    Script Generator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Paste a proven hook, add your topic, and get 3 variations in 30 seconds.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Hook <span className="text-red-400">*</span>
                    </label>
                    <Textarea
                      value={hook}
                      onChange={e => setHook(e.target.value)}
                      placeholder="e.g. 'The reason most people never make money online is not what you think...'"
                      rows={3}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use a proven hook from your swipe file for best results.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Topic / Core Message <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. AI tools for content creation save 4 hours/day"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Offer / CTA Context
                    </label>
                    <Input
                      value={offerContext}
                      onChange={e => setOfferContext(e.target.value)}
                      placeholder="e.g. Comment 'SYSTEM' to get my full workflow guide"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      What do you want viewers to do? (Comment, DM, book call, etc.)
                    </p>
                  </div>

                  {activeVoice && (
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span className="text-xs text-green-300">Brand voice "{activeVoice.name}" will be applied</span>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={generate.isPending || !hook.trim() || !topic.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    {generate.isPending
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating 3 variations...</>
                      : <><Wand2 className="w-4 h-4 mr-2" />Generate 3 Scripts</>
                    }
                  </Button>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="py-3 px-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-400">Nicola's Tips</p>
                  <ul className="space-y-1">
                    {[
                      "Steal the structure, not the subject",
                      "Always generate 3 — never pick the first",
                      "Feed 5 sample scripts for voice matching",
                      "Offer context = higher conversion rate",
                    ].map(tip => (
                      <li key={tip} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-amber-400 mt-0.5">→</span> {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right: Results Panel */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="generate" className="flex-1">Generate</TabsTrigger>
                  <TabsTrigger value="results" className="flex-1">
                    Results {currentResult && <Badge className="ml-1 text-xs" variant="secondary">3</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">
                    <History className="w-3 h-3 mr-1" />History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate">
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-violet-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Script</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      Fill in the hook and topic on the left, then click Generate. You'll get 3 variations in ~30 seconds.
                    </p>
                    {!activeVoice && (
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setBrandVoiceOpen(true)}>
                        <Plus className="w-3 h-3 mr-1" />Set up Brand Voice first
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="results">
                  {generate.isPending ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-10 h-10 animate-spin text-violet-400 mb-4" />
                      <p className="text-muted-foreground text-sm">Generating 3 script variations...</p>
                      <p className="text-xs text-muted-foreground mt-1">Applying brand voice + spoken-word rules</p>
                    </div>
                  ) : currentResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Pick the best variation — or use all 3 for A/B testing</p>
                        {selectedVariation && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Variation {selectedVariation} selected
                          </Badge>
                        )}
                      </div>
                      {(["A", "B", "C"] as const).map(v => (
                        <ScriptCard
                          key={v}
                          label={v}
                          variation={v}
                          content={currentResult[`variation${v}` as "variationA" | "variationB" | "variationC"]}
                          scriptId={currentResult.id}
                          isSelected={selectedVariation === v}
                          onSelect={() => handleSelectVariation(v)}
                          onSendToCalendar={() => {
                            toast.success("Go to Content Calendar to schedule this script", {
                              action: { label: "Open Calendar", onClick: () => window.location.href = "/content-calendar" }
                            });
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <p className="text-muted-foreground text-sm">Generate scripts to see results here</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history">
                  {!history || history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <History className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground text-sm">No scripts generated yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map(script => (
                        <Card key={script.id} className="hover:border-primary/30 transition-colors">
                          <CardContent className="py-3 px-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{script.hook}</p>
                                <p className="text-xs text-muted-foreground truncate">{script.topic}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(script.createdAt).toLocaleDateString()}
                                  </span>
                                  {script.selectedVariation && (
                                    <Badge variant="outline" className="text-xs">
                                      Variation {script.selectedVariation} selected
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">{script.status}</Badge>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setCurrentResult({ id: script.id, variationA: script.variationA, variationB: script.variationB, variationC: script.variationC });
                                    setHook(script.hook);
                                    setTopic(script.topic);
                                    setActiveTab("results");
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => deleteScript.mutate({ id: script.id })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
