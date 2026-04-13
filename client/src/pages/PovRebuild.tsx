/**
 * PovRebuild.tsx
 *
 * POV Scene Rebuild — AI-powered scene reconstruction from a character's
 * point of view. Generates Higgsfield/Kling-ready prompts.
 *
 * Features:
 * - Single POV generation with full controls
 * - Batch mode: generate 3 POVs simultaneously
 * - History panel with copy/delete
 * - Export to Workflow Builder
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Eye,
  Zap,
  Copy,
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Layers,
  Sparkles,
  Film,
  Clock,
  CheckCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type CharacterId = "protagonist" | "antagonist" | "bystander" | "camera_operator" | "child" | "predator" | "custom";
type EmotionId = "fear" | "excitement" | "curiosity" | "determination" | "grief" | "awe" | "rage" | "calm";

const EMOTION_COLORS: Record<string, string> = {
  fear: "border-blue-500/50 bg-blue-500/10 text-blue-300",
  excitement: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",
  curiosity: "border-purple-500/50 bg-purple-500/10 text-purple-300",
  determination: "border-red-500/50 bg-red-500/10 text-red-300",
  grief: "border-gray-500/50 bg-gray-500/10 text-gray-300",
  awe: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
  rage: "border-orange-500/50 bg-orange-500/10 text-orange-300",
  calm: "border-green-500/50 bg-green-500/10 text-green-300",
};

const MODEL_COLORS: Record<string, string> = {
  higgsfield: "text-purple-400",
  kling: "text-blue-400",
  veo3: "text-green-400",
  seedance: "text-orange-400",
};

// ── Example scenes ────────────────────────────────────────────────────────────
const EXAMPLE_SCENES = [
  "A lone figure walks through a neon-lit rain-soaked alley at midnight. Shadows flicker. A cat knocks over a trash can. The figure stops and looks up at a glowing window.",
  "Two warriors face each other on a cliff edge at sunset. The wind howls. One raises their sword. The ocean crashes below.",
  "A child discovers a hidden door in a forest. Soft golden light spills through the cracks. Strange sounds come from the other side.",
  "A scientist in a lab makes a breakthrough discovery. Screens flash with data. Colleagues rush in. Outside, a storm is brewing.",
];

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
      {copied ? <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

// ── Result Card ───────────────────────────────────────────────────────────────
function ResultCard({
  prompt,
  characterLabel,
  characterIcon,
  emotion,
  targetModel,
  wordCount,
}: {
  prompt: string;
  characterLabel: string;
  characterIcon: string;
  emotion: string;
  targetModel: string;
  wordCount?: number;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{characterIcon}</span>
          <span className="text-sm font-medium">{characterLabel}</span>
          <Badge variant="outline" className={`text-xs ${EMOTION_COLORS[emotion] ?? "border-border"}`}>
            {emotion}
          </Badge>
          <Badge variant="outline" className={`text-xs ${MODEL_COLORS[targetModel] ?? "text-muted-foreground"} border-border`}>
            {targetModel}
          </Badge>
          {wordCount && (
            <span className="text-xs text-muted-foreground">{wordCount}w</span>
          )}
        </div>
        <CopyBtn text={prompt} />
      </div>
      <p className="text-sm text-foreground leading-relaxed font-mono bg-background/50 rounded-lg p-3 border border-border">
        {prompt}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PovRebuild() {
  const [sceneDescription, setSceneDescription] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("protagonist");
  const [customCharacter, setCustomCharacter] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId>("determination");
  const [selectedModel, setSelectedModel] = useState("higgsfield");
  const [batchMode, setBatchMode] = useState(false);
  const [batchCharacters, setBatchCharacters] = useState<CharacterId[]>(["protagonist", "antagonist", "bystander"]);
  const [showHistory, setShowHistory] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    prompt: string;
    metadata: { character: string; characterIcon: string; emotion: string; targetModel: string; wordCount: number };
  } | null>(null);
  const [batchResults, setBatchResults] = useState<Array<{ characterId: string; characterLabel: string; characterIcon: string; prompt: string }>>([]);

  // Queries
  const { data: options } = trpc.povRebuild.getOptions.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.povRebuild.getHistory.useQuery(
    { limit: 20 },
    { enabled: showHistory }
  );

  // Mutations
  const generatePov = trpc.povRebuild.generatePovPrompt.useMutation({
    onSuccess: (data) => {
      setGeneratedResult(data);
      toast.success("POV prompt generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const generateBatch = trpc.povRebuild.generateBatchPov.useMutation({
    onSuccess: (data) => {
      setBatchResults(data.results);
      toast.success(`${data.results.length} POV prompts generated!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteHistory = trpc.povRebuild.deleteHistory.useMutation({
    onSuccess: () => {
      refetchHistory();
      toast.success("Deleted");
    },
  });

  const handleGenerate = () => {
    if (!sceneDescription.trim()) {
      toast.error("Please describe a scene first");
      return;
    }
    if (batchMode) {
      generateBatch.mutate({
        sceneDescription,
        characterIds: batchCharacters,
        emotion: selectedEmotion,
        targetModel: selectedModel,
      });
    } else {
      generatePov.mutate({
        sceneDescription,
        characterId: selectedCharacter,
        customCharacter: selectedCharacter === "custom" ? customCharacter : undefined,
        emotion: selectedEmotion,
        targetModel: selectedModel,
        saveToHistory: true,
      });
    }
  };

  const isGenerating = generatePov.isPending || generateBatch.isPending;
  const characters = options?.characters ?? [];
  const emotions = options?.emotions ?? [];
  const videoModels = options?.videoModels ?? [];

  const toggleBatchCharacter = (id: CharacterId) => {
    setBatchCharacters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">POV Scene Rebuild</h1>
              <p className="text-sm text-muted-foreground">
                Reconstruct any scene from a character's point of view — generate Higgsfield/Kling-ready prompts instantly
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Scene Input */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Film className="h-4 w-4 text-indigo-400" />
                  Scene Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Describe the scene to rebuild from a POV perspective..."
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  className="min-h-[120px] text-sm bg-background resize-none"
                />
                <div className="flex flex-wrap gap-1">
                  {EXAMPLE_SCENES.map((scene, i) => (
                    <button
                      key={i}
                      onClick={() => setSceneDescription(scene)}
                      className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/50 transition-colors"
                    >
                      Example {i + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                className={`flex-1 py-2 text-xs font-medium transition-colors ${!batchMode ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setBatchMode(false)}
              >
                Single POV
              </button>
              <button
                className={`flex-1 py-2 text-xs font-medium transition-colors ${batchMode ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setBatchMode(true)}
              >
                <Layers className="h-3.5 w-3.5 inline mr-1" />
                Batch (up to 4)
              </button>
            </div>

            {/* Character Selector */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {batchMode ? "Select Characters (max 4)" : "Character POV"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {characters.map((char) => {
                  const isSelected = batchMode
                    ? batchCharacters.includes(char.id as CharacterId)
                    : selectedCharacter === char.id;
                  return (
                    <button
                      key={char.id}
                      onClick={() => {
                        if (batchMode) {
                          toggleBatchCharacter(char.id as CharacterId);
                        } else {
                          setSelectedCharacter(char.id as CharacterId);
                        }
                      }}
                      className={`w-full flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-indigo-500/60 bg-indigo-500/10"
                          : "border-border hover:border-border/80 hover:bg-muted/20"
                      }`}
                    >
                      <span className="text-lg leading-none mt-0.5">{char.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight">{char.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">{char.description}</p>
                      </div>
                    </button>
                  );
                })}

                {/* Custom character input */}
                {((!batchMode && selectedCharacter === "custom") || (batchMode && batchCharacters.includes("custom"))) && (
                  <Textarea
                    placeholder="Describe your custom character's traits, perspective, and motivation..."
                    value={customCharacter}
                    onChange={(e) => setCustomCharacter(e.target.value)}
                    className="text-xs bg-background min-h-[80px]"
                  />
                )}
              </CardContent>
            </Card>

            {/* Emotion */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Emotional State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-1.5">
                  {emotions.map((em) => (
                    <button
                      key={em.id}
                      onClick={() => setSelectedEmotion(em.id as EmotionId)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedEmotion === em.id
                          ? EMOTION_COLORS[em.id] + " border-opacity-100"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {em.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Target Model */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Target AI Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {videoModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                      selectedModel === model.id
                        ? "border-indigo-500/60 bg-indigo-500/10"
                        : "border-border hover:bg-muted/20"
                    }`}
                  >
                    <span className={`text-xs font-medium ${MODEL_COLORS[model.id] ?? "text-foreground"}`}>
                      {model.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{model.promptStyle}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !sceneDescription.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold h-11"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Rebuilding scene...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {batchMode ? `Generate ${batchCharacters.length} POV Prompts` : "Rebuild from POV"}
                </>
              )}
            </Button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Single Result */}
            {!batchMode && generatedResult && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    Generated POV Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResultCard
                    prompt={generatedResult.prompt}
                    characterLabel={generatedResult.metadata.character}
                    characterIcon={generatedResult.metadata.characterIcon}
                    emotion={generatedResult.metadata.emotion}
                    targetModel={generatedResult.metadata.targetModel}
                    wordCount={generatedResult.metadata.wordCount}
                  />
                </CardContent>
              </Card>
            )}

            {/* Batch Results */}
            {batchMode && batchResults.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    Batch POV Results ({batchResults.length} perspectives)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {batchResults.map((result, i) => (
                    <ResultCard
                      key={i}
                      prompt={result.prompt}
                      characterLabel={result.characterLabel}
                      characterIcon={result.characterIcon}
                      emotion={selectedEmotion}
                      targetModel={selectedModel}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!generatedResult && batchResults.length === 0 && (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-4">
                  <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <Eye className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">No POV generated yet</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Describe a scene, choose a character and emotion, then click "Rebuild from POV" to generate a cinematic AI video prompt.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400">Higgsfield-ready</Badge>
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">Kling-optimized</Badge>
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Veo 3 compatible</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How it works */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">How POV Rebuild Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      icon: "📝",
                      title: "Describe the scene",
                      desc: "Write a neutral scene description — who, what, where, atmosphere",
                    },
                    {
                      icon: "🎭",
                      title: "Choose a character",
                      desc: "Select whose eyes the camera sees through — hero, villain, bystander, or custom",
                    },
                    {
                      icon: "💫",
                      title: "Set emotional state",
                      desc: "Fear, excitement, rage, awe — the emotion shapes camera movement and lighting",
                    },
                    {
                      icon: "🎬",
                      title: "Get AI video prompt",
                      desc: "Receive a model-optimized prompt with camera style, lighting, and sensory details",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border">
                      <span className="text-xl">{step.icon}</span>
                      <div>
                        <p className="text-xs font-medium">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* History */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Rebuild History
                  </CardTitle>
                  {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </CardHeader>
              {showHistory && (
                <CardContent className="space-y-3">
                  {!history || history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No history yet — generate your first POV prompt!</p>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg border border-border bg-muted/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              {item.characterId}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${EMOTION_COLORS[item.emotion] ?? "border-border"}`}>
                              {item.emotion}
                            </Badge>
                            <span className={`text-xs ${MODEL_COLORS[item.targetModel] ?? "text-muted-foreground"}`}>
                              {item.targetModel}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <CopyBtn text={item.generatedPrompt} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteHistory.mutate({ id: item.id })}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic truncate">"{item.sceneDescription}"</p>
                        <p className="text-xs text-foreground font-mono bg-background/50 rounded p-2 border border-border line-clamp-3">
                          {item.generatedPrompt}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
