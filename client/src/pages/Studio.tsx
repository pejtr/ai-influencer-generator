import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Sparkles, Shuffle, RotateCcw, Download, Loader2, 
  User, Palette, Eye, Heart, Wand2, Plus
} from "lucide-react";

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

interface CharacterSettings {
  type: string;
  gender: string;
  ethnicity: string;
  eyeColor: string;
  skinTone: string;
  skinCondition: string;
  age: number;
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
  customPrompt: "",
};

export default function Studio() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<CharacterSettings>(defaultSettings);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");

  const { data: userCredits, refetch: refetchCredits } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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
    
    // Physical features
    parts.push(`with ${settings.eyeColor} eyes`);
    parts.push(`and ${settings.skinTone} skin tone`);
    
    if (settings.skinCondition !== "none") {
      parts.push(`with ${settings.skinCondition}`);
    }
    
    // Style
    parts.push(". Professional influencer photo, high quality, studio lighting, social media ready");
    
    // Custom additions
    if (settings.customPrompt) {
      parts.push(`. ${settings.customPrompt}`);
    }
    
    return parts.join(" ");
  }, [settings]);

  const handleGenerate = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if ((userCredits?.credits ?? 0) < 1) {
      toast.error("Not enough credits. Please upgrade your plan.");
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      prompt: buildPrompt,
      characterSettings: settings,
    });
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
    showColor = false 
  }: { 
    options: { id: string; label: string; emoji?: string; icon?: string; color?: string }[];
    value: string;
    onChange: (id: string) => void;
    showColor?: boolean;
  }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`character-option p-3 rounded-lg text-center transition-all ${
            value === option.id ? "selected bg-primary/10" : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          {showColor && option.color && (
            <div 
              className="w-8 h-8 rounded-full mx-auto mb-2 border-2 border-border"
              style={{ backgroundColor: option.color }}
            />
          )}
          {option.emoji && <span className="text-2xl block mb-1">{option.emoji}</span>}
          {option.icon && <span className="text-xl block mb-1">{option.icon}</span>}
          <span className="text-xs font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-8">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-primary neon-text">AI Influencer</span> Studio
            </h1>
            <p className="text-muted-foreground">
              Design your unique AI influencer with our easy-to-use character builder
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            {/* Left: Preview */}
            <div className="order-2 lg:order-1">
              <div className="sticky top-24">
                <div className="aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden bg-card border border-border relative">
                  {generatedImage ? (
                    <>
                      <img 
                        src={generatedImage} 
                        alt="Generated AI Influencer"
                        className="w-full h-full object-cover"
                      />
                      {user?.tier === "free" && (
                        <div className="watermark-diagonal">AI Influencer Generator</div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <User className="w-10 h-10" />
                      </div>
                      <p className="text-center font-medium mb-2">Your AI influencer lives here</p>
                      <p className="text-center text-sm">Design and build your AI influencer from scratch</p>
                    </div>
                  )}
                  
                  {isGenerating && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="font-medium">Generating your influencer...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-4 max-w-md mx-auto">
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
                    {isAuthenticated && (
                      <span className="ml-2 text-xs opacity-80">
                        ({userCredits?.credits ?? 0} credits)
                      </span>
                    )}
                  </Button>
                  
                  {generatedImage && (
                    <Button variant="secondary" size="icon" className="h-12 w-12">
                      <Download className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                {/* Prompt preview */}
                <div className="mt-4 p-4 rounded-lg bg-secondary/50 max-w-md mx-auto">
                  <p className="text-xs text-muted-foreground mb-1">Generated prompt:</p>
                  <p className="text-sm">{buildPrompt}</p>
                </div>
              </div>
            </div>

            {/* Right: Builder */}
            <div className="order-1 lg:order-2">
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="border-b border-border p-2">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="builder" className="gap-2">
                        <Wand2 className="w-4 h-4" />
                        Builder
                      </TabsTrigger>
                      <TabsTrigger value="prompt" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Prompt
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-4">
                    {/* Quick actions */}
                    <div className="flex gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={handleRandomize} className="flex-1">
                        <Shuffle className="w-4 h-4 mr-2" />
                        Random
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>

                    <TabsContent value="builder" className="mt-0">
                      <ScrollArea className="h-[60vh]">
                        <div className="space-y-6 pr-4">
                          {/* Character Type */}
                          <div>
                            <Label className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4 text-primary" />
                              Character Type
                            </Label>
                            <OptionGrid
                              options={CHARACTER_TYPES}
                              value={settings.type}
                              onChange={(id) => updateSetting("type", id)}
                            />
                          </div>

                          {/* Gender */}
                          <div>
                            <Label className="flex items-center gap-2 mb-3">
                              <Heart className="w-4 h-4 text-primary" />
                              Gender
                            </Label>
                            <OptionGrid
                              options={GENDERS}
                              value={settings.gender}
                              onChange={(id) => updateSetting("gender", id)}
                            />
                          </div>

                          {/* Ethnicity */}
                          <div>
                            <Label className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4 text-primary" />
                              Ethnicity / Origin
                            </Label>
                            <OptionGrid
                              options={ETHNICITIES}
                              value={settings.ethnicity}
                              onChange={(id) => updateSetting("ethnicity", id)}
                            />
                          </div>

                          {/* Eye Color */}
                          <div>
                            <Label className="flex items-center gap-2 mb-3">
                              <Eye className="w-4 h-4 text-primary" />
                              Eye Color
                            </Label>
                            <OptionGrid
                              options={EYE_COLORS}
                              value={settings.eyeColor}
                              onChange={(id) => updateSetting("eyeColor", id)}
                              showColor
                            />
                          </div>

                          {/* Skin Tone */}
                          <div>
                            <Label className="flex items-center gap-2 mb-3">
                              <Palette className="w-4 h-4 text-primary" />
                              Skin Tone
                            </Label>
                            <OptionGrid
                              options={SKIN_TONES}
                              value={settings.skinTone}
                              onChange={(id) => updateSetting("skinTone", id)}
                              showColor
                            />
                          </div>

                          {/* Skin Condition */}
                          <div>
                            <Label className="flex items-center gap-2 mb-3">
                              <Heart className="w-4 h-4 text-primary" />
                              Skin Features
                            </Label>
                            <OptionGrid
                              options={SKIN_CONDITIONS}
                              value={settings.skinCondition}
                              onChange={(id) => updateSetting("skinCondition", id)}
                            />
                          </div>

                          {/* Age */}
                          <div>
                            <Label className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4 text-primary" />
                              Age: {settings.age}
                            </Label>
                            <Slider
                              value={[settings.age]}
                              onValueChange={([value]) => updateSetting("age", value)}
                              min={18}
                              max={70}
                              step={1}
                              className="py-4"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>18</span>
                              <span>70</span>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="prompt" className="mt-0">
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-2 block">Custom Prompt</Label>
                          <Textarea
                            placeholder="Add custom details to your influencer... (e.g., 'wearing a red dress', 'smiling', 'in a coffee shop')"
                            value={settings.customPrompt}
                            onChange={(e) => updateSetting("customPrompt", e.target.value)}
                            className="min-h-[200px] resize-none"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your custom prompt will be added to the generated description based on your builder selections.
                        </p>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Saved Characters */}
              {isAuthenticated && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Your Characters</h3>
                    <Button variant="ghost" size="sm" asChild>
                      <a href="/gallery">View all</a>
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
