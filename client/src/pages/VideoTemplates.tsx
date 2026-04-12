import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Search, Film, Play, Copy, Bookmark, Sparkles, Camera,
  Clock, Star, ChevronRight, Zap, Eye, Palette,
  Mountain, Moon, Timer, Wand2, UserRound, Layers,
  ArrowRight, Filter, TrendingUp, BookmarkPlus, Edit3,
  Video, Clapperboard
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  cinematic_ads: { label: "Cinematic Ads", icon: Clapperboard, color: "text-amber-400", description: "Professional ad-quality videos" },
  emotional_atmospheric: { label: "Emotional", icon: Moon, color: "text-blue-400", description: "Moody, atmospheric scenes" },
  action_adventure: { label: "Action", icon: Mountain, color: "text-emerald-400", description: "Epic adventure sequences" },
  dark_moody: { label: "Dark & Moody", icon: Eye, color: "text-purple-400", description: "Noir and cyberpunk aesthetics" },
  timelapse: { label: "Timelapse", icon: Timer, color: "text-orange-400", description: "Viral timelapse transformations" },
  vfx_integration: { label: "VFX", icon: Wand2, color: "text-pink-400", description: "Visual effects and magic" },
  character_animation: { label: "Character", icon: UserRound, color: "text-cyan-400", description: "Character motion and dance" },
  scene_transformation: { label: "Transform", icon: Layers, color: "text-lime-400", description: "Scene morphing and transitions" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function VideoTemplates() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editedImagePrompt, setEditedImagePrompt] = useState("");
  const [editedVideoPrompt, setEditedVideoPrompt] = useState("");

  // Queries
  const { data: templates = [], isLoading } = trpc.videoTemplates.list.useQuery({
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    search: searchQuery || undefined,
  });

  const { data: featuredTemplates = [] } = trpc.videoTemplates.featured.useQuery({});
  const { data: categories = [] } = trpc.videoTemplates.categories.useQuery();

  const useMutation = trpc.videoTemplates.use.useMutation({
    onSuccess: (template) => {
      toast.success("Template loaded! Redirecting to Studio...");
      // Navigate to studio with template prompts
      navigate(`/studio?videoTemplate=${template.id}`);
    },
  });

  const saveMutation = trpc.videoTemplates.saveCustom.useMutation({
    onSuccess: () => {
      toast.success("Template saved to your collection!");
    },
  });

  const handleUseTemplate = (template: any) => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    useMutation.mutate({ id: template.id });
  };

  const handleOpenDetail = (template: any) => {
    setSelectedTemplate(template);
    setEditedImagePrompt(template.imagePrompt);
    setEditedVideoPrompt(template.videoPrompt);
    setShowDetailDialog(true);
  };

  const handleSaveCustom = () => {
    if (!user || !selectedTemplate) return;
    saveMutation.mutate({
      templateId: selectedTemplate.id,
      name: `My ${selectedTemplate.name}`,
      customImagePrompt: editedImagePrompt !== selectedTemplate.imagePrompt ? editedImagePrompt : undefined,
      customVideoPrompt: editedVideoPrompt !== selectedTemplate.videoPrompt ? editedVideoPrompt : undefined,
    });
  };

  const handleCopyPrompt = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const totalTemplates = useMemo(() => {
    return categories.reduce((sum: number, c: any) => sum + Number(c.count), 0);
  }, [categories]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              <Film className="w-3 h-3 mr-1" />
              Inspired by @chalkleyvisuals
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Video Templates
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Professional AI video generation templates with pre-built prompts, camera movements, and lighting setups.
              One-click to generate cinematic videos.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="pb-8">
        <div className="container">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2 justify-center flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="rounded-full"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                All Templates
                {totalTemplates > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {totalTemplates}
                  </Badge>
                )}
              </Button>
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const catCount = categories.find((c: any) => c.category === key);
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(key)}
                    className="rounded-full"
                  >
                    <Icon className={`w-3.5 h-3.5 mr-1.5 ${selectedCategory !== key ? meta.color : ""}`} />
                    {meta.label}
                    {catCount && (
                      <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                        {String(catCount.count)}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </section>

      {/* Featured Section (only when "all" is selected and no search) */}
      {selectedCategory === "all" && !searchQuery && featuredTemplates.length > 0 && (
        <section className="pb-12">
          <div className="container">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold">Featured Templates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTemplates.map((tpl: any) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  onUse={handleUseTemplate}
                  onDetail={handleOpenDetail}
                  featured
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Templates Grid */}
      <section className="pb-20">
        <div className="container">
          {selectedCategory !== "all" && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {CATEGORY_META[selectedCategory]?.icon && (
                  <span className={CATEGORY_META[selectedCategory].color}>
                    {(() => { const Icon = CATEGORY_META[selectedCategory].icon; return <Icon className="w-5 h-5" />; })()}
                  </span>
                )}
                {CATEGORY_META[selectedCategory]?.label || selectedCategory}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {CATEGORY_META[selectedCategory]?.description}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-72 animate-pulse bg-card/50" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16">
              <Film className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No templates found</p>
              {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="mt-2">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl: any) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  onUse={handleUseTemplate}
                  onDetail={handleOpenDetail}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Template Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={DIFFICULTY_COLORS[selectedTemplate.difficulty || "beginner"]}>
                    {selectedTemplate.difficulty}
                  </Badge>
                  <Badge variant="outline" className="border-border/50">
                    {CATEGORY_META[selectedTemplate.category]?.label || selectedTemplate.category}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{selectedTemplate.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Settings Overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card/50 rounded-lg p-3 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Camera
                    </div>
                    <div className="text-sm font-medium">{selectedTemplate.cameraMovement?.replace(/_/g, " ") || "Default"}</div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-3 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Lighting
                    </div>
                    <div className="text-sm font-medium truncate">{selectedTemplate.lighting || "Natural"}</div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-3 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Duration
                    </div>
                    <div className="text-sm font-medium">{selectedTemplate.duration || 5}s</div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-3 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Film className="w-3 h-3" /> Aspect Ratio
                    </div>
                    <div className="text-sm font-medium">{selectedTemplate.aspectRatio || "16:9"}</div>
                  </div>
                </div>

                {/* Models */}
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Image: {selectedTemplate.imageModel?.replace(/_/g, " ") || "Nano Banana Pro"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Video: {selectedTemplate.videoModel?.replace(/_/g, " ") || "Kling 3.0"}
                  </Badge>
                </div>

                {/* Image Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Image Generation Prompt
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPrompt(editedImagePrompt, "Image prompt")}
                      className="h-7 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <Textarea
                    value={editedImagePrompt}
                    onChange={(e) => setEditedImagePrompt(e.target.value)}
                    rows={4}
                    className="text-sm bg-card/30 border-border/30 font-mono"
                  />
                </div>

                {/* Video Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-primary" />
                      Video Animation Prompt
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPrompt(editedVideoPrompt, "Video prompt")}
                      className="h-7 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <Textarea
                    value={editedVideoPrompt}
                    onChange={(e) => setEditedVideoPrompt(e.target.value)}
                    rows={4}
                    className="text-sm bg-card/30 border-border/30 font-mono"
                  />
                </div>

                {/* Negative Prompt */}
                {selectedTemplate.negativePrompt && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Negative Prompt (avoid)</label>
                    <div className="text-xs bg-red-500/5 border border-red-500/20 rounded-md p-2 text-red-400 font-mono">
                      {selectedTemplate.negativePrompt}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs border-border/30">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleUseTemplate(selectedTemplate);
                    }}
                    className="flex-1"
                    disabled={useMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Generate Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveCustom}
                    disabled={saveMutation.isPending || !user}
                  >
                    <BookmarkPlus className="w-4 h-4 mr-1.5" />
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onUse,
  onDetail,
  featured = false,
}: {
  template: any;
  onUse: (t: any) => void;
  onDetail: (t: any) => void;
  featured?: boolean;
}) {
  const meta = CATEGORY_META[template.category];
  const Icon = meta?.icon || Film;

  return (
    <Card
      className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 ${
        featured ? "border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5" : "bg-card/50"
      }`}
      onClick={() => onDetail(template)}
    >
      {/* Gradient overlay for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-card border border-border/30 ${meta?.color || "text-muted-foreground"}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{template.name}</h3>
              <span className="text-xs text-muted-foreground">{meta?.label || template.category}</span>
            </div>
          </div>
          {featured && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              <Star className="w-3 h-3 mr-0.5" /> Featured
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {template.description}
        </p>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="outline" className={`text-xs ${DIFFICULTY_COLORS[template.difficulty || "beginner"]}`}>
            {template.difficulty}
          </Badge>
          <Badge variant="outline" className="text-xs border-border/30">
            <Camera className="w-2.5 h-2.5 mr-0.5" />
            {template.cameraMovement?.replace(/_/g, " ") || "default"}
          </Badge>
          <Badge variant="outline" className="text-xs border-border/30">
            <Clock className="w-2.5 h-2.5 mr-0.5" />
            {template.duration || 5}s
          </Badge>
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 4).map((tag: string) => (
              <span key={tag} className="text-[10px] text-muted-foreground/60">
                #{tag}
              </span>
            ))}
            {template.tags.length > 4 && (
              <span className="text-[10px] text-muted-foreground/40">+{template.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            {template.usageCount || 0} uses
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onUse(template);
            }}
          >
            <Play className="w-3 h-3 mr-1" /> Use
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
