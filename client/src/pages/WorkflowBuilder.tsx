import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Wand2, Film, Camera, Zap, BookOpen, ChevronRight, Star, TrendingUp, Play, Layers, RefreshCw } from "lucide-react";

// ── Kayvon.ai VIP Tips Data ─────────────────────────────────────────────────
const VIP_TIPS = [
  {
    icon: "🎬",
    title: "Multi-Image Animator (Kling 2.5)",
    badge: "105K likes",
    badgeVariant: "destructive" as const,
    tip: "Upload 2-5 images instead of one. Kling 2.5 creates motion continuity between frames — this is how kayvon.ai creates cinematic sequences that look studio-quality.",
    action: "Use in Prompt Builder →",
  },
  {
    icon: "🤖",
    title: "Motion Control Workflow (Kling 3.0)",
    badge: "VIP",
    badgeVariant: "default" as const,
    tip: "Film yourself performing actions → upload as motion reference. AI maps your exact movements onto your AI character. No camera needed for the final output.",
    action: null,
  },
  {
    icon: "💰",
    title: "Budget Trick for Realism",
    badge: "Pro Tip",
    badgeVariant: "secondary" as const,
    tip: "Set budget to $100M (not $250M). Lower budget simulates slightly grittier cameras — fewer 'AI tells', more realistic output. Counter-intuitive but it works.",
    action: null,
  },
  {
    icon: "⚡",
    title: "Batch Generation Strategy",
    badge: "Always Do This",
    badgeVariant: "default" as const,
    tip: "Always generate 4-5 variants per scene. It's cheap credit-wise and gives you the variety to find the perfect asset. Never settle for the first output.",
    action: null,
  },
  {
    icon: "🎯",
    title: "Always Use Start Frames",
    badge: "Critical",
    badgeVariant: "destructive" as const,
    tip: "When generating video, providing a Start Frame image is crucial. It gives the AI a concrete visual starting point — drastically improves consistency vs text-only generation.",
    action: null,
  },
  {
    icon: "🎞️",
    title: "Embrace Imperfections",
    badge: "Realism Hack",
    badgeVariant: "secondary" as const,
    tip: "Add grain, adjust exposure, add halation in color grading. AI generates overly perfect images — adding these flaws makes footage feel like actual film.",
    action: null,
  },
];

const JSON_PROMPT_FIELDS = [
  { key: "scene", label: "Scene", placeholder: "A rugged western town at golden hour, dusty streets glowing in warm sunset light", hint: "Describe the environment, time of day, atmosphere" },
  { key: "camera", label: "Camera", placeholder: "Slow dolly in from wide establishing shot to medium close-up", hint: "Camera movement, shot type, angle" },
  { key: "lighting", label: "Lighting", placeholder: "Warm golden hour backlighting, long shadows, lens flare", hint: "Light source, quality, color temperature" },
  { key: "subject", label: "Subject / Action", placeholder: "A man and woman stand facing each other, tension and chemistry between them", hint: "Who is in the scene, what are they doing" },
  { key: "audio", label: "Audio / Mood", placeholder: "Tense orchestral swell, distant wind, boots on gravel", hint: "Sound design, music mood, ambient audio" },
  { key: "style", label: "Style / Grade", placeholder: "Cinematic film grain, desaturated warm tones, anamorphic lens", hint: "Visual style, color grade, film look" },
];

const GENRE_PRESETS = [
  { id: "action", label: "Action", emoji: "💥", prompt: "Fast-paced, high-energy, dynamic camera movements, impact frames" },
  { id: "horror", label: "Horror", emoji: "👻", prompt: "Dark, unsettling, slow creeping camera, deep shadows, tension" },
  { id: "comedy", label: "Comedy", emoji: "😂", prompt: "Bright, warm colors, quick cuts, expressive reactions" },
  { id: "noir", label: "Noir", emoji: "🕵️", prompt: "High contrast black and white, rain-slicked streets, moody shadows" },
  { id: "drama", label: "Drama", emoji: "🎭", prompt: "Intimate close-ups, natural lighting, emotional depth, slow pacing" },
  { id: "epic", label: "Epic", emoji: "🏔️", prompt: "Grand wide shots, sweeping orchestral, heroic framing, scale" },
  { id: "commercial", label: "Commercial", emoji: "📱", prompt: "Clean, product-focused, bright studio lighting, modern aesthetic" },
  { id: "documentary", label: "Documentary", emoji: "📹", prompt: "Handheld, natural light, authentic moments, observational" },
];

const MOTION_CONTROL_STEPS = [
  { step: 1, title: "Film Yourself", desc: "Record yourself performing the desired actions, speaking, and making facial expressions in your living room." },
  { step: 2, title: "Open Higgsfield", desc: "Go to Video tab → select Kling 3.0 Motion Control." },
  { step: 3, title: "Upload Motion Reference", desc: "Upload your base video as the motion reference source." },
  { step: 4, title: "Add AI Character Image", desc: "Upload a static image of your desired AI character (generated in Cinema Studio or any reference photo)." },
  { step: 5, title: "Generate", desc: "AI maps your exact movements, timing, and facial expressions onto the AI character. Your living room becomes any location." },
];

export default function WorkflowBuilder() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("prompt-builder");
  const [selectedModel, setSelectedModel] = useState("kling_3");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [jsonFields, setJsonFields] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [cinematicBibleForm, setCinematicBibleForm] = useState({
    characterName: "", genre: "", visualStyle: "", colorPalette: "", characterDescription: "", setting: ""
  });
  const [generatedBible, setGeneratedBible] = useState("");
  const [voiceoverScenes, setVoiceoverScenes] = useState(["", "", ""]);
  const [voiceoverStyle, setVoiceoverStyle] = useState<"thriller" | "dramatic" | "inspirational" | "documentary" | "commercial">("thriller");
  const [generatedScript, setGeneratedScript] = useState("");

  const { data: models } = trpc.workflowBuilder.getModels.useQuery();
  const { data: cameraMovements } = trpc.workflowBuilder.getCameraMovements.useQuery();

  const generatePromptMutation = trpc.workflowBuilder.generateFullPrompt.useMutation({
    onSuccess: (data) => {
      setGeneratedPrompt(data.fullPrompt);
      toast.success("Prompt generated!", { description: "Your cinematic prompt is ready." });
    },
    onError: () => toast.error("Failed to generate prompt. Please try again."),
  });

  const generateBibleMutation = trpc.workflowBuilder.generateCinematicBible.useMutation({
    onSuccess: (data) => {
      setGeneratedBible(data.cinematicBible);
      toast.success("Cinematic Bible created!", { description: "Character consistency locked in." });
    },
    onError: () => toast.error("Failed to generate cinematic bible."),
  });

  const generateVoiceoverMutation = trpc.workflowBuilder.generateVoiceoverScript.useMutation({
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      toast.success("Voiceover script ready!", { description: "ElevenLabs-ready script generated." });
    },
    onError: () => toast.error("Failed to generate script."),
  });

  const handleGeneratePrompt = () => {
    if (!user) { toast.error("Login required", { description: "Please log in to use AI features." }); return; }
    const genrePreset = GENRE_PRESETS.find(g => g.id === selectedGenre);
    generatePromptMutation.mutate({
      composition: jsonFields.scene || "",
      subject: jsonFields.subject || "",
      cameraMovement: jsonFields.camera || "",
      mood: `${jsonFields.lighting || ""} ${jsonFields.audio || ""} ${jsonFields.style || ""} ${genrePreset ? genrePreset.prompt : ""}`.trim(),
      modelId: selectedModel,
    });
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
  };

  const selectedModelData = useMemo(() => models?.find(m => m.id === selectedModel), [models, selectedModel]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Higgsfield Workflow Builder</h1>
              <p className="text-sm text-white/50">Cinematic AI Video Production System — Best Practices from @kayvon.ai</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">Kling 3.0 Motion Control</Badge>
            <Badge variant="outline" className="border-blue-500/50 text-blue-300 text-xs">Veo 3 JSON Prompts</Badge>
            <Badge variant="outline" className="border-green-500/50 text-green-300 text-xs">Cinema Studio 3.0</Badge>
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-300 text-xs">Cinematic Bible System</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="prompt-builder" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm">
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />Prompt Builder
            </TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm">
              <Zap className="w-3.5 h-3.5 mr-1.5" />Model Selector
            </TabsTrigger>
            <TabsTrigger value="motion-control" className="data-[state=active]:bg-green-600 text-xs sm:text-sm">
              <Play className="w-3.5 h-3.5 mr-1.5" />Motion Control
            </TabsTrigger>
            <TabsTrigger value="cinematic-bible" className="data-[state=active]:bg-yellow-600 text-xs sm:text-sm">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />Cinematic Bible
            </TabsTrigger>
            <TabsTrigger value="voiceover" className="data-[state=active]:bg-red-600 text-xs sm:text-sm">
              <Layers className="w-3.5 h-3.5 mr-1.5" />Voiceover Script
            </TabsTrigger>
            <TabsTrigger value="vip-tips" className="data-[state=active]:bg-orange-600 text-xs sm:text-sm">
              <Star className="w-3.5 h-3.5 mr-1.5" />VIP Tips
            </TabsTrigger>
          </TabsList>

          {/* ── PROMPT BUILDER ── */}
          <TabsContent value="prompt-builder">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-400" />
                      JSON Prompt Structure (Veo 3 / Kayvon.ai Method)
                    </CardTitle>
                    <p className="text-white/50 text-xs">Break your vision into structured fields — treat AI like a professional film crew</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Genre Presets */}
                    <div>
                      <Label className="text-white/70 text-xs mb-2 block">Genre Preset (Cinema Studio 3.0)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {GENRE_PRESETS.map(genre => (
                          <button
                            key={genre.id}
                            onClick={() => setSelectedGenre(selectedGenre === genre.id ? "" : genre.id)}
                            className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                              selectedGenre === genre.id
                                ? "bg-purple-600 border-purple-500 text-white"
                                : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                            }`}
                          >
                            <div className="text-base mb-0.5">{genre.emoji}</div>
                            {genre.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* JSON Fields */}
                    {JSON_PROMPT_FIELDS.map(field => (
                      <div key={field.key}>
                        <Label className="text-white/70 text-xs mb-1 block">
                          {field.label}
                          <span className="text-white/30 ml-2 font-normal">{field.hint}</span>
                        </Label>
                        <Textarea
                          value={jsonFields[field.key] || ""}
                          onChange={e => setJsonFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm resize-none h-16"
                        />
                      </div>
                    ))}

                    {/* Model Selector */}
                    <div>
                      <Label className="text-white/70 text-xs mb-1 block">Optimize for Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          {models?.map(m => (
                            <SelectItem key={m.id} value={m.id} className="text-white hover:bg-white/10">
                              {m.badge} {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleGeneratePrompt}
                      disabled={generatePromptMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {generatePromptMutation.isPending ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-2" />Generate Cinematic Prompt</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Generated Prompt Output */}
                {generatedPrompt && (
                  <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-purple-400" />Generated Prompt</span>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyPrompt(generatedPrompt)} className="text-white/60 hover:text-white h-7">
                          <Copy className="w-3.5 h-3.5 mr-1" />Copy
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/90 text-sm leading-relaxed bg-black/30 rounded-lg p-3">{generatedPrompt}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar: Camera Movements */}
              <div className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-400" />
                      Camera Movement Library
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                      {cameraMovements?.map(move => (
                        <button
                          key={move.id}
                          onClick={() => {
                            setJsonFields(prev => ({ ...prev, camera: move.example }));
                            toast.success(`Camera: ${move.label}`);
                          }}
                          className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                        >
                          <div className="text-white/80 text-xs font-medium group-hover:text-white">{move.label}</div>
                          <div className="text-white/30 text-xs mt-0.5 truncate">{move.example}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Model Info */}
                {selectedModelData && (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-4">
                      <div className="text-white font-medium text-sm">{selectedModelData.badge}</div>
                      <div className="text-white/50 text-xs mt-1">{selectedModelData.bestFor}</div>
                      <div className="mt-2 space-y-1">
                        {selectedModelData.features.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                            <ChevronRight className="w-3 h-3 text-purple-400 flex-shrink-0" />{f}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline" className="text-xs border-white/20 text-white/50">{selectedModelData.creditCost} credits</Badge>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/50">{selectedModelData.resolution}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── MODEL SELECTOR ── */}
          <TabsContent value="models">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {models?.map(model => (
                <Card
                  key={model.id}
                  onClick={() => { setSelectedModel(model.id); setActiveTab("prompt-builder"); toast.success(`${model.name} selected!`); }}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedModel === model.id
                      ? "bg-purple-900/30 border-purple-500"
                      : "bg-white/5 border-white/10 hover:border-white/30"
                  }`}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold text-sm">{model.name}</div>
                        <div className="text-white/40 text-xs">{model.provider}</div>
                      </div>
                      <Badge className="text-xs bg-white/10 text-white/70 border-0">{model.badge}</Badge>
                    </div>
                    <p className="text-white/60 text-xs mb-3">{model.bestFor}</p>
                    <div className="space-y-1 mb-3">
                      {model.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-white/50">
                          <div className="w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />{f}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-white/10">
                      <Badge variant="outline" className="text-xs border-white/20 text-white/50">{model.creditCost} cr/gen</Badge>
                      <Badge variant="outline" className="text-xs border-white/20 text-white/50">{model.resolution}</Badge>
                      <Badge variant="outline" className="text-xs border-white/20 text-white/50">{model.outputLength}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── MOTION CONTROL ── */}
          <TabsContent value="motion-control">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-400" />
                    Kling 3.0 Motion Control Workflow
                  </CardTitle>
                  <p className="text-white/50 text-xs">Film yourself → AI maps your movements onto your AI character. Used by @kayvon.ai for faceless AI influencer videos.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {MOTION_CONTROL_STEPS.map(s => (
                      <div key={s.step} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{s.title}</div>
                          <div className="text-white/50 text-xs mt-0.5">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-green-500/20">
                  <CardContent className="pt-5">
                    <div className="text-green-400 font-semibold text-sm mb-2">Why This Works</div>
                    <p className="text-white/70 text-sm leading-relaxed">
                      You film the content yourself in your living room. The AI translates it into a completely different character in any setting. 
                      This is how faceless channels build an online presence using an AI avatar — your movements, your timing, your expressions — but a completely different visual identity.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Multi-Shot Manual (Director Mode)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-white/70">
                    <div className="flex gap-2"><span className="text-purple-400">→</span> Video tab → Multi-shot Manual</div>
                    <div className="flex gap-2"><span className="text-purple-400">→</span> Set total duration (up to 12s), divide into shots (e.g., 4s+3s+3s+2s)</div>
                    <div className="flex gap-2"><span className="text-purple-400">→</span> Each shot: Start Frame + Characters + Emotion slider + Action prompt</div>
                    <div className="flex gap-2"><span className="text-yellow-400">★</span> <span className="text-yellow-300">Budget trick: $100M = more realistic than $250M</span></div>
                    <div className="flex gap-2"><span className="text-yellow-400">★</span> <span className="text-yellow-300">Always generate 4-5 variants per scene</span></div>
                    <div className="flex gap-2"><span className="text-yellow-400">★</span> <span className="text-yellow-300">Add grain + halation in color grading for film look</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── CINEMATIC BIBLE ── */}
          <TabsContent value="cinematic-bible">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-yellow-400" />
                    Generate Cinematic Bible
                  </CardTitle>
                  <p className="text-white/50 text-xs">Locks in character consistency across all scenes. Essential for AI influencer content series.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "characterName", label: "Character Name", placeholder: "e.g. Silas Cole, Luna Vex" },
                    { key: "genre", label: "Genre", placeholder: "e.g. Sci-Fi Thriller, Western Drama" },
                    { key: "visualStyle", label: "Visual Style", placeholder: "e.g. Blade Runner neon noir, Golden hour western" },
                    { key: "colorPalette", label: "Color Palette", placeholder: "e.g. Deep blues and oranges, Desaturated warm tones" },
                    { key: "characterDescription", label: "Character Description", placeholder: "e.g. 30s male, dark hair, leather jacket, scar on left cheek" },
                    { key: "setting", label: "Setting / World", placeholder: "e.g. 2087 Neo-Tokyo, 1880s American frontier" },
                  ].map(f => (
                    <div key={f.key}>
                      <Label className="text-white/70 text-xs mb-1 block">{f.label}</Label>
                      <Input
                        value={cinematicBibleForm[f.key as keyof typeof cinematicBibleForm]}
                        onChange={e => setCinematicBibleForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm"
                      />
                    </div>
                  ))}
                  <Button
                    onClick={() => {
                      if (!user) { toast.error("Login required"); return; }
                      generateBibleMutation.mutate(cinematicBibleForm);
                    }}
                    disabled={generateBibleMutation.isPending}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                  >
                    {generateBibleMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><BookOpen className="w-4 h-4 mr-2" />Generate Cinematic Bible</>}
                  </Button>
                </CardContent>
              </Card>

              <div>
                {generatedBible ? (
                  <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center justify-between">
                        <span>Cinematic Bible</span>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyPrompt(generatedBible)} className="text-white/60 hover:text-white h-7">
                          <Copy className="w-3.5 h-3.5 mr-1" />Copy
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-white/80 text-xs leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3 max-h-[500px] overflow-y-auto">{generatedBible}</pre>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/5 border-white/10 h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">Fill in the form and generate your cinematic bible</p>
                      <p className="text-white/20 text-xs mt-1">Ensures character consistency across all your AI video scenes</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── VOICEOVER SCRIPT ── */}
          <TabsContent value="voiceover">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-400" />
                    ElevenLabs Voiceover Script Generator
                  </CardTitle>
                  <p className="text-white/50 text-xs">10-14 words per scene, present tense, film trailer style. Ready for ElevenLabs voice synthesis.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white/70 text-xs mb-2 block">Voiceover Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["thriller", "dramatic", "inspirational", "documentary", "commercial"] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => setVoiceoverStyle(style)}
                          className={`p-2 rounded-lg border text-xs capitalize transition-all ${
                            voiceoverStyle === style
                              ? "bg-red-600 border-red-500 text-white"
                              : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/70 text-xs block">Scene Descriptions (one per line)</Label>
                    {voiceoverScenes.map((scene, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="w-6 h-8 flex items-center justify-center text-white/30 text-xs flex-shrink-0">{i + 1}</div>
                        <Input
                          value={scene}
                          onChange={e => {
                            const updated = [...voiceoverScenes];
                            updated[i] = e.target.value;
                            setVoiceoverScenes(updated);
                          }}
                          placeholder={`Scene ${i + 1}: e.g. Character walks through neon-lit alley`}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVoiceoverScenes(prev => [...prev, ""])}
                      className="border-white/20 text-white/60 hover:text-white text-xs"
                    >
                      + Add Scene
                    </Button>
                  </div>

                  <Button
                    onClick={() => {
                      if (!user) { toast.error("Login required"); return; }
                      const scenes = voiceoverScenes.filter(s => s.trim());
                      if (scenes.length === 0) { toast.error("Add at least one scene"); return; }
                      generateVoiceoverMutation.mutate({ scenes, style: voiceoverStyle });
                    }}
                    disabled={generateVoiceoverMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  >
                    {generateVoiceoverMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Layers className="w-4 h-4 mr-2" />Generate Voiceover Script</>}
                  </Button>
                </CardContent>
              </Card>

              <div>
                {generatedScript ? (
                  <Card className="bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-500/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center justify-between">
                        <span>Voiceover Script (ElevenLabs Ready)</span>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyPrompt(generatedScript)} className="text-white/60 hover:text-white h-7">
                          <Copy className="w-3.5 h-3.5 mr-1" />Copy
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap bg-black/30 rounded-lg p-3">{generatedScript}</pre>
                      <div className="mt-3 p-2 bg-white/5 rounded-lg">
                        <p className="text-white/40 text-xs">Recommended ElevenLabs voices: <span className="text-white/60">Adam (thriller), Rachel (drama), Josh (documentary)</span></p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/5 border-white/10 h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <Layers className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 text-sm">Add your scenes and generate a voiceover script</p>
                      <p className="text-white/20 text-xs mt-1">10-14 words per scene, present tense, ready for ElevenLabs</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── VIP TIPS ── */}
          <TabsContent value="vip-tips">
            <div className="mb-4 p-4 bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-xl border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span className="text-orange-300 font-semibold text-sm">@kayvon.ai Growth System</span>
                <Badge className="bg-orange-600 text-white text-xs border-0">400K Followers</Badge>
              </div>
              <p className="text-white/60 text-xs">These are the exact techniques extracted from kayvon.ai's most viral videos (105K+ likes). Implement them in your workflow for maximum results.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {VIP_TIPS.map((tip, i) => (
                <Card key={i} className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl">{tip.icon}</div>
                      <Badge variant={tip.badgeVariant} className="text-xs">{tip.badge}</Badge>
                    </div>
                    <div className="text-white font-medium text-sm mb-2">{tip.title}</div>
                    <p className="text-white/60 text-xs leading-relaxed">{tip.tip}</p>
                    {tip.action && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveTab("prompt-builder")}
                        className="mt-3 text-purple-400 hover:text-purple-300 text-xs p-0 h-auto"
                      >
                        {tip.action} <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comment-to-DM Funnel */}
            <Card className="mt-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Comment-to-DM Funnel Strategy (kayvon.ai Growth Hack)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-blue-400 font-semibold mb-1">Step 1: Hook</div>
                    <p className="text-white/60 text-xs">End every video with: "Comment [KEYWORD] and I'll send you my full guide"</p>
                    <div className="mt-2 text-white/40 text-xs">Examples: FIRE, COOL, PLAY, FAST, OPEN</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-purple-400 font-semibold mb-1">Step 2: Automate</div>
                    <p className="text-white/60 text-xs">Use ManyChat or Instagram automation to auto-DM the guide when someone comments the keyword</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-green-400 font-semibold mb-1">Step 3: Convert</div>
                    <p className="text-white/60 text-xs">Guide contains your offer/affiliate link. Comment engagement also boosts algorithm reach significantly</p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-white/5 rounded-lg">
                  <p className="text-white/40 text-xs">This system is how @kayvon.ai grew to 400K followers — Day 203+ of posting every day with this exact funnel.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
