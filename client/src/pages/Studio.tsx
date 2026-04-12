import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Sparkles, Shuffle, RotateCcw, Download, Loader2, 
  User, Palette, Eye, Heart, Wand2, Plus, Save, FolderOpen,
  Scissors, Shirt, Video, Edit3, Trash2, ChevronRight, Zap,
  Camera, Smile, ImageIcon, LayoutGrid, Copy, Clapperboard, Image, Film, Bell
} from "lucide-react";
import NotificationSettings from "@/components/NotificationSettings";
import {
  ALL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  ASPECT_RATIO_OPTIONS,
  buildPromptFromTemplate,
  getTemplatesByCategory,
  type PromptTemplate,
  type PromptCategory,
  type AspectRatio,
} from "@shared/promptTemplates";
import CinematographyPanel from "@/components/CinematographyPanel";
import SceneGenerator from "@/components/SceneGenerator";
import ElementsPanel from "@/components/ElementsPanel";
import TalkingAvatarPanel from "@/components/TalkingAvatarPanel";
import PullToRefresh from "@/components/PullToRefresh";
import { useSearch, useLocation } from "wouter";

// Character options data
const CHARACTER_TYPES = [
  { id: "human", label: "Human", emoji: "👤" },
  { id: "elf", label: "Elf", emoji: "🧝" },
  { id: "alien", label: "Alien", emoji: "👽" },
  { id: "robot", label: "Robot", emoji: "🤖" },
  { id: "vampire", label: "Vampire", emoji: "🧛" },
  { id: "angel", label: "Angel", emoji: "👼" },
  { id: "demon", label: "Demon", emoji: "😈" },
  { id: "fairy", label: "Fairy", emoji: "🧚" },
  { id: "mermaid", label: "Mermaid", emoji: "🧜" },
  { id: "cyborg", label: "Cyborg", emoji: "🦾" },
];

const GENDERS = [
  { id: "female", label: "Female", icon: "♀" },
  { id: "male", label: "Male", icon: "♂" },
  { id: "non-binary", label: "Non-binary", icon: "⚧" },
];

const ETHNICITIES = [
  { id: "european", label: "European" },
  { id: "african", label: "African" },
  { id: "asian", label: "Asian" },
  { id: "indian", label: "Indian" },
  { id: "middle-eastern", label: "Middle Eastern" },
  { id: "latino", label: "Latino" },
  { id: "mixed", label: "Mixed" },
];

const EYE_COLORS = [
  { id: "brown", label: "Brown", color: "#8B4513" },
  { id: "blue", label: "Blue", color: "#4169E1" },
  { id: "green", label: "Green", color: "#228B22" },
  { id: "hazel", label: "Hazel", color: "#8E7618" },
  { id: "gray", label: "Gray", color: "#708090" },
  { id: "amber", label: "Amber", color: "#FFBF00" },
  { id: "violet", label: "Violet", color: "#8B008B" },
  { id: "red", label: "Red", color: "#DC143C" },
  { id: "black", label: "Black", color: "#1a1a1a" },
  { id: "white", label: "White", color: "#F5F5F5" },
];

const SKIN_CONDITIONS = [
  { id: "none", label: "None" },
  { id: "freckles", label: "Freckles" },
  { id: "vitiligo", label: "Vitiligo" },
  { id: "scars", label: "Scars" },
  { id: "birthmarks", label: "Birthmarks" },
  { id: "tattoos", label: "Tattoos" },
  { id: "piercings", label: "Piercings" },
];

const SKIN_TONES = [
  { id: "fair", label: "Fair", color: "#FFE4C4" },
  { id: "light", label: "Light", color: "#F5DEB3" },
  { id: "medium", label: "Medium", color: "#D2B48C" },
  { id: "olive", label: "Olive", color: "#C4A484" },
  { id: "tan", label: "Tan", color: "#B8860B" },
  { id: "brown", label: "Brown", color: "#8B4513" },
  { id: "dark", label: "Dark", color: "#654321" },
  { id: "deep", label: "Deep", color: "#3D2314" },
];

// NEW: Body Types
const BODY_TYPES = [
  { id: "slim", label: "Slim", icon: "🧍" },
  { id: "athletic", label: "Athletic", icon: "💪" },
  { id: "average", label: "Average", icon: "👤" },
  { id: "curvy", label: "Curvy", icon: "🌊" },
  { id: "plus-size", label: "Plus Size", icon: "🌟" },
  { id: "muscular", label: "Muscular", icon: "🏋️" },
];

// NEW: Hair Styles
const HAIR_STYLES = [
  { id: "straight-long", label: "Straight Long" },
  { id: "straight-short", label: "Straight Short" },
  { id: "wavy-long", label: "Wavy Long" },
  { id: "wavy-medium", label: "Wavy Medium" },
  { id: "curly", label: "Curly" },
  { id: "coily", label: "Coily" },
  { id: "braids", label: "Braids" },
  { id: "ponytail", label: "Ponytail" },
  { id: "bun", label: "Bun" },
  { id: "pixie", label: "Pixie Cut" },
  { id: "bob", label: "Bob" },
  { id: "bald", label: "Bald" },
];

// NEW: Hair Colors
const HAIR_COLORS = [
  { id: "black", label: "Black", color: "#1a1a1a" },
  { id: "dark-brown", label: "Dark Brown", color: "#3d2314" },
  { id: "brown", label: "Brown", color: "#8B4513" },
  { id: "light-brown", label: "Light Brown", color: "#A0522D" },
  { id: "blonde", label: "Blonde", color: "#F5DEB3" },
  { id: "platinum", label: "Platinum", color: "#E8E8E8" },
  { id: "red", label: "Red", color: "#B22222" },
  { id: "auburn", label: "Auburn", color: "#A52A2A" },
  { id: "gray", label: "Gray", color: "#808080" },
  { id: "white", label: "White", color: "#FFFFFF" },
  { id: "pink", label: "Pink", color: "#FF69B4" },
  { id: "blue", label: "Blue", color: "#4169E1" },
  { id: "purple", label: "Purple", color: "#8B008B" },
  { id: "green", label: "Green", color: "#228B22" },
];

// NEW: Outfit Styles
const OUTFIT_STYLES = [
  { id: "casual", label: "Casual", icon: "👕" },
  { id: "formal", label: "Formal", icon: "👔" },
  { id: "sporty", label: "Sporty", icon: "🏃" },
  { id: "elegant", label: "Elegant", icon: "👗" },
  { id: "streetwear", label: "Streetwear", icon: "🧢" },
  { id: "bohemian", label: "Bohemian", icon: "🌸" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "swimwear", label: "Swimwear", icon: "👙" },
  { id: "lingerie", label: "Lingerie", icon: "🩱" },
  { id: "vintage", label: "Vintage", icon: "🎀" },
];

// NEW: Outfit Colors
const OUTFIT_COLORS = [
  { id: "black", label: "Black", color: "#1a1a1a" },
  { id: "white", label: "White", color: "#FFFFFF" },
  { id: "red", label: "Red", color: "#DC143C" },
  { id: "blue", label: "Blue", color: "#4169E1" },
  { id: "green", label: "Green", color: "#228B22" },
  { id: "pink", label: "Pink", color: "#FF69B4" },
  { id: "purple", label: "Purple", color: "#8B008B" },
  { id: "yellow", label: "Yellow", color: "#FFD700" },
  { id: "orange", label: "Orange", color: "#FF8C00" },
  { id: "nude", label: "Nude", color: "#E3BC9A" },
];

// NEW: Accessories
const ACCESSORIES = [
  { id: "none", label: "None" },
  { id: "necklace", label: "Necklace" },
  { id: "earrings", label: "Earrings" },
  { id: "glasses", label: "Glasses" },
  { id: "sunglasses", label: "Sunglasses" },
  { id: "hat", label: "Hat" },
  { id: "watch", label: "Watch" },
  { id: "bracelet", label: "Bracelet" },
];

// Template Card Component
function TemplateCard({ 
  template, 
  settings, 
  onApply, 
  onCopy 
}: { 
  template: PromptTemplate; 
  settings: CharacterSettings; 
  onApply: (prompt: string) => void; 
  onCopy: (prompt: string) => void; 
}) {
  const prompt = buildPromptFromTemplate(template, {
    gender: settings.gender,
    ethnicity: settings.ethnicity,
    age: settings.age,
    hairStyle: settings.hairStyle.replace("-", " "),
    hairColor: settings.hairColor.replace("-", " "),
    eyeColor: settings.eyeColor,
    skinTone: settings.skinTone,
    bodyType: settings.bodyType,
    outfit: settings.outfitStyle,
    outfitColor: settings.outfitColor,
  });

  return (
    <div className="p-2 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-xs font-medium">{template.name}</h4>
          <p className="text-[10px] text-muted-foreground">{template.description}</p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
          {template.category}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2 italic">
        "{prompt.slice(0, 100)}..."
      </p>
      <div className="flex gap-1">
        <Button
          variant="default"
          size="sm"
          className="flex-1 h-6 text-[10px]"
          onClick={() => onApply(prompt)}
        >
          <Zap className="w-2.5 h-2.5 mr-1" />
          Apply
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onCopy(prompt)}
        >
          <Copy className="w-2.5 h-2.5" />
        </Button>
      </div>
    </div>
  );
}

interface CharacterSettings {
  type: string;
  gender: string;
  ethnicity: string;
  eyeColor: string;
  skinTone: string;
  skinCondition: string;
  age: number;
  bodyType: string;
  hairStyle: string;
  hairColor: string;
  outfitStyle: string;
  outfitColor: string;
  accessory: string;
  customPrompt: string;
}

const defaultSettings: CharacterSettings = {
  type: "human",
  gender: "female",
  ethnicity: "european",
  eyeColor: "brown",
  skinTone: "medium",
  skinCondition: "none",
  age: 25,
  bodyType: "average",
  hairStyle: "straight-long",
  hairColor: "brown",
  outfitStyle: "casual",
  outfitColor: "black",
  accessory: "none",
  customPrompt: "",
};

// Builder section type
type BuilderSection = "basics" | "appearance" | "hair" | "outfit";

export default function Studio() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<CharacterSettings>(defaultSettings);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("builder");
  const [activeSection, setActiveSection] = useState<BuilderSection>("basics");
  const [savedPresets, setSavedPresets] = useState<{id: string; name: string; thumbnail?: string; settings: CharacterSettings}[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [selectedCameraMovement, setSelectedCameraMovement] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<PromptCategory>("portrait");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("1:1");
  const [templateLoaded, setTemplateLoaded] = useState(false);

  // Read URL params for video template auto-fill
  const searchString = useSearch();
  const [, navigate] = useLocation();

  const videoTemplateId = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("videoTemplate");
  }, [searchString]);

  // Fetch template data if videoTemplate param is present
  const { data: loadedTemplate } = trpc.videoTemplates.getById.useQuery(
    { id: Number(videoTemplateId) },
    { enabled: !!videoTemplateId && !templateLoaded }
  );

  // Auto-fill prompts when template is loaded
  useEffect(() => {
    if (loadedTemplate && !templateLoaded) {
      setVideoPrompt(loadedTemplate.videoPrompt);
      if (loadedTemplate.aspectRatio) {
        const ar = loadedTemplate.aspectRatio as AspectRatio;
        if (["1:1", "16:9", "9:16", "4:5", "3:4"].includes(ar)) {
          setSelectedAspectRatio(ar);
        }
      }
      setShowVideoDialog(true);
      setTemplateLoaded(true);
      toast.success(`Template "${loadedTemplate.name}" loaded! Generate an image first, then create the video.`, { duration: 5000 });
      // Update custom prompt with the template's image prompt
      setSettings(prev => ({ ...prev, customPrompt: loadedTemplate.imagePrompt }));
      // Clean URL
      navigate("/studio", { replace: true });
    }
  }, [loadedTemplate, templateLoaded]);

  const { data: userCredits, refetch: refetchCredits } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handlePullRefresh = async () => {
    await refetchCredits();
  };

  const { data: cameraMovements } = trpc.video.getCameraMovements.useQuery();

  const videoMutation = trpc.video.create.useMutation({
    onSuccess: (data) => {
      if (data.taskId) {
        setVideoTaskId(data.taskId);
        toast.info("Video generation started! This may take 1-2 minutes.");
      }
      if (data.videoUrl) {
        setGeneratedVideoUrl(data.videoUrl);
        toast.success("Video generated successfully!");
      }
      refetchCredits();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate video");
    },
    onSettled: () => {
      setIsGeneratingVideo(false);
    },
  });

  const handleGenerateVideo = () => {
    if (!generatedImage) {
      toast.error("Please generate an image first");
      return;
    }
    if (!videoPrompt.trim()) {
      toast.error("Please enter a video prompt");
      return;
    }
    if ((userCredits?.totalAvailable ?? 0) < 5) {
      toast.error("Not enough credits. Video generation costs 5 credits.");
      return;
    }
    
    setIsGeneratingVideo(true);
    videoMutation.mutate({
      prompt: videoPrompt,
      imageUrl: generatedImage,
      model: selectedCameraMovement ? "I2V-01-Director" : "I2V-01",
      cameraMovement: selectedCameraMovement || undefined,
    });
  };

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai-influencer-presets");
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error("Please enter a name for your preset");
      return;
    }
    const newPreset = {
      id: Date.now().toString(),
      name: presetName,
      thumbnail: generatedImage || undefined,
      settings: { ...settings },
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem("ai-influencer-presets", JSON.stringify(updated));
    setPresetName("");
    setShowSaveDialog(false);
    toast.success("Character preset saved!");
  };

  const loadPreset = (preset: typeof savedPresets[0]) => {
    setSettings(preset.settings);
    if (preset.thumbnail) {
      setGeneratedImage(preset.thumbnail);
    }
    toast.success(`Loaded "${preset.name}"`);
  };

  const deletePreset = (id: string) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem("ai-influencer-presets", JSON.stringify(updated));
    toast.success("Preset deleted");
  };

  const generateMutation = trpc.generation.create.useMutation({
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      refetchCredits();
      toast.success("Influencer generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate influencer");
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const buildPrompt = useMemo(() => {
    const parts = [];
    
    // Base description
    parts.push(`A photorealistic portrait of a ${settings.age}-year-old`);
    parts.push(`${settings.gender}`);
    parts.push(`${settings.ethnicity}`);
    parts.push(`${settings.type === "human" ? "person" : settings.type}`);
    
    // Body type
    if (settings.bodyType !== "average") {
      parts.push(`with a ${settings.bodyType} body type`);
    }
    
    // Physical features
    parts.push(`with ${settings.eyeColor} eyes`);
    parts.push(`and ${settings.skinTone} skin tone`);
    
    // Hair
    parts.push(`. ${settings.hairColor} ${settings.hairStyle} hair`);
    
    if (settings.skinCondition !== "none") {
      parts.push(`with ${settings.skinCondition}`);
    }
    
    // Outfit
    parts.push(`. Wearing ${settings.outfitColor} ${settings.outfitStyle} outfit`);
    
    // Accessories
    if (settings.accessory !== "none") {
      parts.push(`with ${settings.accessory}`);
    }
    
    // Style
    parts.push(". Professional influencer photo, high quality, studio lighting, social media ready");
    
    // Custom additions
    if (settings.customPrompt) {
      parts.push(`. ${settings.customPrompt}`);
    }
    
    return parts.join(" ");
  }, [settings]);

  // Progress simulation for loading indicator
  useEffect(() => {
    if (!isGenerating) {
      setGenerationStep(0);
      setGenerationProgress(0);
      return;
    }
    const steps = [0, 1, 2, 3];
    const timings = [0, 3000, 8000, 18000]; // ms for each step
    const progressValues = [10, 35, 65, 85];
    
    const timers = steps.map((step, i) => 
      setTimeout(() => {
        setGenerationStep(step);
        setGenerationProgress(progressValues[i]);
      }, timings[i])
    );
    
    // Slow progress fill between steps
    const progressTimer = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 1, 95));
    }, 500);
    
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(progressTimer);
    };
  }, [isGenerating]);

  const handleGenerate = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if ((userCredits?.totalAvailable ?? 0) < 1) {
      toast.error("Not enough credits. Please upgrade your plan or buy credits.");
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationProgress(0);
    generateMutation.mutate({
      prompt: buildPrompt,
      characterSettings: settings,
    });
  };

  const handleEditWithPrompt = () => {
    if (!editPrompt.trim()) {
      toast.error("Please enter an edit prompt");
      return;
    }
    // Add edit prompt to custom prompt and regenerate
    setSettings(prev => ({
      ...prev,
      customPrompt: prev.customPrompt ? `${prev.customPrompt}. ${editPrompt}` : editPrompt
    }));
    setShowEditDialog(false);
    setEditPrompt("");
    toast.info("Edit applied! Click Generate to see changes.");
  };

  const handleRandomize = () => {
    setSettings({
      type: CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)].id,
      gender: GENDERS[Math.floor(Math.random() * GENDERS.length)].id,
      ethnicity: ETHNICITIES[Math.floor(Math.random() * ETHNICITIES.length)].id,
      eyeColor: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)].id,
      skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].id,
      skinCondition: SKIN_CONDITIONS[Math.floor(Math.random() * SKIN_CONDITIONS.length)].id,
      age: Math.floor(Math.random() * 40) + 18,
      bodyType: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)].id,
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id,
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].id,
      outfitStyle: OUTFIT_STYLES[Math.floor(Math.random() * OUTFIT_STYLES.length)].id,
      outfitColor: OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)].id,
      accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id,
      customPrompt: "",
    });
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setGeneratedImage(null);
  };

  const updateSetting = <K extends keyof CharacterSettings>(key: K, value: CharacterSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Option selector component
  const OptionGrid = ({ 
    options, 
    value, 
    onChange, 
    showColor = false,
    columns = 4
  }: { 
    options: { id: string; label: string; emoji?: string; icon?: string; color?: string }[];
    value: string;
    onChange: (id: string) => void;
    showColor?: boolean;
    columns?: number;
  }) => (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`character-option p-2 rounded-lg text-center transition-all ${
            value === option.id ? "selected bg-primary/20 border-primary border-2" : "bg-secondary hover:bg-secondary/80 border border-border"
          }`}
        >
          {showColor && option.color && (
            <div 
              className="w-6 h-6 rounded-full mx-auto mb-1 border border-border"
              style={{ backgroundColor: option.color }}
            />
          )}
          {option.emoji && <span className="text-lg block">{option.emoji}</span>}
          {option.icon && <span className="text-lg block">{option.icon}</span>}
          <span className="text-[10px] font-medium leading-tight block">{option.label}</span>
        </button>
      ))}
    </div>
  );

  // Section navigation
  const sections: { id: BuilderSection; label: string; icon: React.ReactNode }[] = [
    { id: "basics", label: "Basics", icon: <User className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Eye className="w-4 h-4" /> },
    { id: "hair", label: "Hair", icon: <Scissors className="w-4 h-4" /> },
    { id: "outfit", label: "Outfit", icon: <Shirt className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <PullToRefresh onRefresh={handlePullRefresh} className="md:overflow-visible">
      <main className="pt-16">
        {/* Higgsfield-style 3-panel layout */}
        <div className="h-[calc(100vh-64px)] flex">
          
          {/* LEFT PANEL: Character Library */}
          <div className="w-64 border-r border-border bg-card/50 flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                Character Library
              </h2>
            </div>
            
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {/* Create New Button */}
                <button
                  onClick={handleReset}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-primary/50 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <Plus className="w-8 h-8 text-primary/70 group-hover:text-primary mb-1" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">Create New</span>
                </button>
                
                {/* Saved Presets */}
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="relative group rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => loadPreset(preset)}
                  >
                    {preset.thumbnail ? (
                      <img loading="lazy" decoding="async" 
                        src={preset.thumbnail} 
                        alt={preset.name}
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-secondary flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white font-medium truncate">{preset.name}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                      className="absolute top-2 right-2 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                
                {savedPresets.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No saved characters yet.<br />Generate and save your first one!
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* CENTER PANEL: Preview */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-background to-card/30">
            {/* Preview Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">
                  <span className="text-primary neon-text">AI Influencer</span> Studio
                </h1>
                <p className="text-xs text-muted-foreground">Design your unique AI influencer</p>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <div className="text-sm bg-secondary/50 px-3 py-1 rounded-full">
                    <span className="text-primary font-semibold">{userCredits?.totalAvailable ?? 0}</span>
                    <span className="text-muted-foreground ml-1">credits</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="relative w-full max-w-lg">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border shadow-2xl">
                  {generatedImage ? (
                    <>
                      <img loading="lazy" decoding="async" 
                        src={generatedImage} 
                        alt="Generated AI Influencer"
                        className="w-full h-full object-cover"
                      />
                      {user?.tier === "free" && (
                        <div className="watermark-diagonal">AI Influencer Generator</div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 bg-gradient-to-b from-secondary/30 to-secondary/10">
                      <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-4 border border-border">
                        <User className="w-12 h-12 text-primary/50" />
                      </div>
                      <p className="text-center font-medium mb-2">Your AI influencer preview</p>
                      <p className="text-center text-sm text-muted-foreground">Customize settings and click Generate</p>
                    </div>
                  )}
                  
                  {isGenerating && (
                    <div className="absolute inset-0 bg-background/95 flex items-center justify-center backdrop-blur-sm z-10">
                      <div className="text-center w-full max-w-xs px-6">
                        {/* Animated spinner */}
                        <div className="relative mb-6">
                          <div className="w-20 h-20 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-secondary rounded-full mb-4 overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${generationProgress}%` }}
                          />
                        </div>
                        
                        {/* Step indicators */}
                        <div className="space-y-2 mb-4">
                          {[
                            { label: "Analyzing prompt", icon: "✨" },
                            { label: "Creating image", icon: "🎨" },
                            { label: "Enhancing details", icon: "🔍" },
                            { label: "Uploading result", icon: "☁️" },
                          ].map((step, i) => (
                            <div 
                              key={i}
                              className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                                i < generationStep ? "text-primary" : i === generationStep ? "text-foreground font-medium" : "text-muted-foreground/50"
                              }`}
                            >
                              <span className="w-5 text-center">
                                {i < generationStep ? "✓" : i === generationStep ? step.icon : "○"}
                              </span>
                              <span>{step.label}</span>
                              {i === generationStep && (
                                <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">Usually takes 10-30 seconds</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons Below Preview */}
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 gradient-primary neon-glow h-12 text-lg font-semibold"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-5 h-5 mr-2" />
                    )}
                    Generate
                  </Button>
                  
                  {/* Scene Generator Button */}
                  <SceneGenerator
                    basePrompt={buildPrompt}
                    onGenerateScene={(prompts) => {
                      // For now, apply the first prompt to the custom prompt field
                      if (prompts.length > 0) {
                        updateSetting("customPrompt", prompts[0].prompt);
                        setActiveTab("prompt");
                        toast.success(`Storyboard with ${prompts.length} shots ready! First shot applied.`);
                      }
                    }}
                  />
                  
                  {generatedImage && (
                    <>
                      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-12 w-12">
                            <Save className="w-5 h-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Save Character Preset</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>Preset Name</Label>
                              <Input
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                placeholder="e.g., Summer Beach Model"
                                className="mt-2"
                              />
                            </div>
                            <Button onClick={savePreset} className="w-full">
                              <Save className="w-4 h-4 mr-2" />
                              Save Preset
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-12 w-12">
                            <Edit3 className="w-5 h-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit with Prompt</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>What would you like to change?</Label>
                              <Textarea
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="e.g., change the dress to red, add sunglasses, make her smile more..."
                                className="mt-2 min-h-[100px]"
                              />
                            </div>
                            <Button onClick={handleEditWithPrompt} className="w-full">
                              <Edit3 className="w-4 h-4 mr-2" />
                              Apply Edit
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="secondary" size="icon" className="h-12 w-12">
                        <Download className="w-5 h-5" />
                      </Button>

                      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-12 w-12">
                            <Video className="w-5 h-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Video className="w-5 h-5 text-primary" />
                              Generate Video
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="p-3 bg-secondary/30 rounded-lg text-sm">
                              <p className="text-muted-foreground">Video generation costs <span className="text-primary font-semibold">5 credits</span></p>
                              <p className="text-xs text-muted-foreground mt-1">Requires PRO or CREATOR subscription</p>
                            </div>
                            
                            <div>
                              <Label>Video Prompt</Label>
                              <Textarea
                                value={videoPrompt}
                                onChange={(e) => setVideoPrompt(e.target.value)}
                                placeholder="Describe the motion... e.g., 'She turns her head slowly and smiles', 'Wind blowing through her hair'"
                                className="mt-2 min-h-[80px]"
                              />
                            </div>

                            <div>
                              <Label>Camera Movement (Optional)</Label>
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                <button
                                  onClick={() => setSelectedCameraMovement("")}
                                  className={`p-2 rounded-lg text-xs transition-all ${
                                    !selectedCameraMovement ? "bg-primary/20 border-primary border-2" : "bg-secondary hover:bg-secondary/80 border border-border"
                                  }`}
                                >
                                  None
                                </button>
                                {cameraMovements?.slice(0, 8).map((movement) => (
                                  <button
                                    key={movement.id}
                                    onClick={() => setSelectedCameraMovement(movement.instruction)}
                                    className={`p-2 rounded-lg text-xs transition-all ${
                                      selectedCameraMovement === movement.instruction ? "bg-primary/20 border-primary border-2" : "bg-secondary hover:bg-secondary/80 border border-border"
                                    }`}
                                  >
                                    {movement.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {generatedVideoUrl && (
                              <div className="rounded-lg overflow-hidden border border-border">
                                <video 
                                  src={generatedVideoUrl} 
                                  controls 
                                  className="w-full"
                                  autoPlay
                                  loop
                                />
                              </div>
                            )}

                            <Button 
                              onClick={handleGenerateVideo} 
                              className="w-full gradient-primary"
                              disabled={isGeneratingVideo || !videoPrompt.trim()}
                            >
                              {isGeneratingVideo ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Generating Video...
                                </>
                              ) : (
                                <>
                                  <Video className="w-4 h-4 mr-2" />
                                  Generate Video (5 credits)
                                </>
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>

                {/* Prompt Preview */}
                <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Generated Prompt</p>
                  <p className="text-xs leading-relaxed">{buildPrompt}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Builder */}
          <div className="w-80 border-l border-border bg-card/50 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="border-b border-border p-2">
                <TabsList className="w-full grid grid-cols-6">
                  <TabsTrigger value="builder" className="gap-1 text-[10px] px-1">
                    <Wand2 className="w-3 h-3" />
                    Build
                  </TabsTrigger>
                  <TabsTrigger value="prompt" className="gap-1 text-[10px] px-1">
                    <Sparkles className="w-3 h-3" />
                    Prompt
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="gap-1 text-[10px] px-1">
                    <Zap className="w-3 h-3" />
                    Quick
                  </TabsTrigger>
                  <TabsTrigger value="cinema" className="gap-1 text-[10px] px-1">
                    <Clapperboard className="w-3 h-3" />
                    Cinema
                  </TabsTrigger>
                  <TabsTrigger value="elements" className="gap-1 text-[10px] px-1">
                    <Image className="w-3 h-3" />
                    Ref
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="gap-1 text-[10px] px-1">
                    <Film className="w-3 h-3" />
                    Voice
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-3 border-b border-border">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRandomize} className="flex-1 text-xs h-8">
                    <Shuffle className="w-3 h-3 mr-1" />
                    Random
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset} className="flex-1 text-xs h-8">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>

              <TabsContent value="builder" className="flex-1 flex flex-col mt-0 overflow-hidden">
                {/* Section Navigation */}
                <div className="flex border-b border-border">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex-1 p-2 text-xs flex flex-col items-center gap-1 transition-colors ${
                        activeSection === section.id 
                          ? "bg-primary/10 text-primary border-b-2 border-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {section.icon}
                      <span>{section.label}</span>
                    </button>
                  ))}
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-5">
                    {activeSection === "basics" && (
                      <>
                        {/* Character Type */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <User className="w-3 h-3 text-primary" />
                            Character Type
                          </Label>
                          <OptionGrid
                            options={CHARACTER_TYPES}
                            value={settings.type}
                            onChange={(id) => updateSetting("type", id)}
                            columns={5}
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Heart className="w-3 h-3 text-primary" />
                            Gender
                          </Label>
                          <OptionGrid
                            options={GENDERS}
                            value={settings.gender}
                            onChange={(id) => updateSetting("gender", id)}
                            columns={3}
                          />
                        </div>

                        {/* Ethnicity */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <User className="w-3 h-3 text-primary" />
                            Ethnicity
                          </Label>
                          <OptionGrid
                            options={ETHNICITIES}
                            value={settings.ethnicity}
                            onChange={(id) => updateSetting("ethnicity", id)}
                            columns={4}
                          />
                        </div>

                        {/* Body Type */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <User className="w-3 h-3 text-primary" />
                            Body Type
                          </Label>
                          <OptionGrid
                            options={BODY_TYPES}
                            value={settings.bodyType}
                            onChange={(id) => updateSetting("bodyType", id)}
                            columns={3}
                          />
                        </div>

                        {/* Age */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <User className="w-3 h-3 text-primary" />
                            Age: <span className="text-primary font-semibold">{settings.age}</span>
                          </Label>
                          <Slider
                            value={[settings.age]}
                            onValueChange={([value]) => updateSetting("age", value)}
                            min={18}
                            max={70}
                            step={1}
                            className="py-2"
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>18</span>
                            <span>70</span>
                          </div>
                        </div>
                      </>
                    )}

                    {activeSection === "appearance" && (
                      <>
                        {/* Eye Color */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Eye className="w-3 h-3 text-primary" />
                            Eye Color
                          </Label>
                          <OptionGrid
                            options={EYE_COLORS}
                            value={settings.eyeColor}
                            onChange={(id) => updateSetting("eyeColor", id)}
                            showColor
                            columns={5}
                          />
                        </div>

                        {/* Skin Tone */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Palette className="w-3 h-3 text-primary" />
                            Skin Tone
                          </Label>
                          <OptionGrid
                            options={SKIN_TONES}
                            value={settings.skinTone}
                            onChange={(id) => updateSetting("skinTone", id)}
                            showColor
                            columns={4}
                          />
                        </div>

                        {/* Skin Features */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Heart className="w-3 h-3 text-primary" />
                            Skin Features
                          </Label>
                          <OptionGrid
                            options={SKIN_CONDITIONS}
                            value={settings.skinCondition}
                            onChange={(id) => updateSetting("skinCondition", id)}
                            columns={4}
                          />
                        </div>
                      </>
                    )}

                    {activeSection === "hair" && (
                      <>
                        {/* Hair Style */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Scissors className="w-3 h-3 text-primary" />
                            Hair Style
                          </Label>
                          <OptionGrid
                            options={HAIR_STYLES}
                            value={settings.hairStyle}
                            onChange={(id) => updateSetting("hairStyle", id)}
                            columns={3}
                          />
                        </div>

                        {/* Hair Color */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Palette className="w-3 h-3 text-primary" />
                            Hair Color
                          </Label>
                          <OptionGrid
                            options={HAIR_COLORS}
                            value={settings.hairColor}
                            onChange={(id) => updateSetting("hairColor", id)}
                            showColor
                            columns={5}
                          />
                        </div>
                      </>
                    )}

                    {activeSection === "outfit" && (
                      <>
                        {/* Outfit Style */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Shirt className="w-3 h-3 text-primary" />
                            Outfit Style
                          </Label>
                          <OptionGrid
                            options={OUTFIT_STYLES}
                            value={settings.outfitStyle}
                            onChange={(id) => updateSetting("outfitStyle", id)}
                            columns={5}
                          />
                        </div>

                        {/* Outfit Color */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Palette className="w-3 h-3 text-primary" />
                            Outfit Color
                          </Label>
                          <OptionGrid
                            options={OUTFIT_COLORS}
                            value={settings.outfitColor}
                            onChange={(id) => updateSetting("outfitColor", id)}
                            showColor
                            columns={5}
                          />
                        </div>

                        {/* Accessories */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2 text-xs">
                            <Sparkles className="w-3 h-3 text-primary" />
                            Accessories
                          </Label>
                          <OptionGrid
                            options={ACCESSORIES}
                            value={settings.accessory}
                            onChange={(id) => updateSetting("accessory", id)}
                            columns={4}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="prompt" className="flex-1 p-4 mt-0">
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex-1">
                    <Label className="mb-2 block text-xs">Custom Prompt</Label>
                    <Textarea
                      placeholder="Add custom details... (e.g., 'on a beach at sunset', 'holding a coffee cup', 'laughing')"
                      value={settings.customPrompt}
                      onChange={(e) => updateSetting("customPrompt", e.target.value)}
                      className="min-h-[200px] resize-none text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Your custom prompt will be combined with the builder selections to create the final image.
                  </p>
                </div>
              </TabsContent>

              {/* QUICK PROMPTS TAB */}
              <TabsContent value="templates" className="flex-1 flex flex-col mt-0 overflow-hidden">
                {/* Category Selector */}
                <div className="p-2 border-b border-border">
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedTemplateCategory(cat.id)}
                        className={`px-2 py-1 rounded text-[10px] transition-colors ${
                          selectedTemplateCategory === cat.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                        }`}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="p-2 border-b border-border">
                  <Label className="text-[10px] mb-1 block text-muted-foreground">Aspect Ratio</Label>
                  <div className="flex flex-wrap gap-1">
                    {ASPECT_RATIO_OPTIONS.slice(0, 5).map((ar) => (
                      <button
                        key={ar.value}
                        onClick={() => setSelectedAspectRatio(ar.value)}
                        className={`px-2 py-1 rounded text-[10px] transition-colors ${
                          selectedAspectRatio === ar.value
                            ? "bg-primary/20 text-primary border border-primary"
                            : "bg-secondary/30 hover:bg-secondary/50 text-muted-foreground border border-transparent"
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template List */}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {getTemplatesByCategory(selectedTemplateCategory).map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        settings={settings}
                        onApply={(prompt) => {
                          updateSetting("customPrompt", prompt);
                          setActiveTab("prompt");
                          toast.success(`Applied: ${template.name}`);
                        }}
                        onCopy={(prompt) => {
                          navigator.clipboard.writeText(prompt);
                          toast.success("Prompt copied to clipboard!");
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>

                {/* Quick Actions */}
                <div className="p-2 border-t border-border space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={() => {
                      const charSheetTemplate = ALL_TEMPLATES.find(t => t.id === "sheet_angles");
                      if (charSheetTemplate) {
                        const prompt = buildPromptFromTemplate(charSheetTemplate, {
                          gender: settings.gender,
                          ethnicity: settings.ethnicity,
                          age: settings.age,
                          hairStyle: settings.hairStyle.replace("-", " "),
                          hairColor: settings.hairColor.replace("-", " "),
                          eyeColor: settings.eyeColor,
                          skinTone: settings.skinTone,
                          bodyType: settings.bodyType,
                        });
                        updateSetting("customPrompt", prompt);
                        setActiveTab("prompt");
                        toast.success("Character Sheet prompt applied!");
                      }
                    }}
                  >
                    <LayoutGrid className="w-3 h-3 mr-1" />
                    Generate Character Sheet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={() => {
                      const emotionTemplate = ALL_TEMPLATES.find(t => t.id === "sheet_emotions");
                      if (emotionTemplate) {
                        const prompt = buildPromptFromTemplate(emotionTemplate, {
                          gender: settings.gender,
                          ethnicity: settings.ethnicity,
                          age: settings.age,
                          hairStyle: settings.hairStyle.replace("-", " "),
                          hairColor: settings.hairColor.replace("-", " "),
                          eyeColor: settings.eyeColor,
                        });
                        updateSetting("customPrompt", prompt);
                        setActiveTab("prompt");
                        toast.success("Emotion Sheet prompt applied!");
                      }
                    }}
                  >
                    <Smile className="w-3 h-3 mr-1" />
                    Generate Emotion Sheet
                  </Button>
                </div>
              </TabsContent>

              {/* Cinema Tab */}
              <TabsContent value="cinema" className="flex-1 flex flex-col mt-0 overflow-hidden">
                <CinematographyPanel
                  onApplySettings={(cinematographyPrompt) => {
                    const currentPrompt = settings.customPrompt || buildPrompt;
                    updateSetting("customPrompt", `${currentPrompt}, ${cinematographyPrompt}`);
                    setActiveTab("prompt");
                    toast.success("Cinematography settings applied!");
                  }}
                />
              </TabsContent>

              {/* Elements Tab */}
              <TabsContent value="elements" className="flex-1 flex flex-col mt-0 overflow-hidden">
                <ElementsPanel
                  basePrompt={buildPrompt}
                  onApplyElements={(combinedPrompt) => {
                    updateSetting("customPrompt", combinedPrompt);
                    setActiveTab("prompt");
                    toast.success("Reference elements applied!");
                  }}
                />
              </TabsContent>

              {/* Voice/Talking Avatar Tab */}
              <TabsContent value="voice" className="flex-1 flex flex-col mt-0 overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-3">
                    <TalkingAvatarPanel
                      imageUrl={generatedImage || undefined}
                      characterName={settings.customPrompt?.split(' ')[0] || 'AI Influencer'}
                    />
                    
                    {/* Push Notification Settings */}
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Bell className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Notification Settings</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Get notified when your images and videos finish generating.
                      </p>
                      <NotificationSettings />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      </PullToRefresh>
    </div>
  );
}
