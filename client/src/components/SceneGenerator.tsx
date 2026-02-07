import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  LayoutGrid, Camera, Play, Check, Grid3X3, Clapperboard,
  ChevronRight, Loader2, Download
} from "lucide-react";
import {
  SHOT_TYPES,
  ACTION_POSES,
  STORYBOARD_LAYOUTS,
  SCENE_SEQUENCES,
  generateScenePrompts,
  generateCustomStoryboard,
  CONSISTENCY_MODIFIERS,
  type SceneShot,
  type ActionPose,
  type StoryboardLayout,
  type SceneSequence,
} from "@shared/sceneGenerator";

interface SceneGeneratorProps {
  basePrompt: string;
  onGenerateScene: (prompts: { shotId: string; actionId?: string; prompt: string }[]) => void;
  isGenerating?: boolean;
  generatedImages?: { shotId: string; imageUrl: string }[];
}

export default function SceneGenerator({ 
  basePrompt, 
  onGenerateScene, 
  isGenerating = false,
  generatedImages = []
}: SceneGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<StoryboardLayout>(STORYBOARD_LAYOUTS[1]); // 2x2 default
  const [selectedSequence, setSelectedSequence] = useState<SceneSequence | null>(null);
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"sequence" | "custom">("sequence");

  const handleSelectSequence = (sequence: SceneSequence) => {
    setSelectedSequence(sequence);
    setSelectedShots(sequence.shots.slice(0, selectedLayout.totalShots));
    setSelectedActions(new Array(sequence.shots.length).fill("standing_neutral"));
  };

  const handleToggleShot = (shotId: string) => {
    if (selectedShots.includes(shotId)) {
      setSelectedShots(selectedShots.filter(s => s !== shotId));
    } else if (selectedShots.length < selectedLayout.totalShots) {
      setSelectedShots([...selectedShots, shotId]);
      // Add default action for new shot
      setSelectedActions([...selectedActions, "standing_neutral"]);
    }
  };

  const handleSetAction = (index: number, actionId: string) => {
    const newActions = [...selectedActions];
    newActions[index] = actionId;
    setSelectedActions(newActions);
  };

  const handleGenerate = () => {
    let prompts;
    
    if (selectedSequence && activeTab === "sequence") {
      prompts = generateScenePrompts(basePrompt, selectedSequence);
    } else {
      prompts = generateCustomStoryboard(basePrompt, selectedShots, selectedActions);
    }
    
    onGenerateScene(prompts);
  };

  const canGenerate = selectedShots.length > 0 || selectedSequence;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutGrid className="w-4 h-4" />
          Scene Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-primary" />
            Scene Generator - Storyboard Mode
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Left: Configuration */}
          <div className="w-1/2 flex flex-col">
            {/* Layout Selection */}
            <div className="mb-4">
              <Label className="text-xs mb-2 block">Storyboard Layout</Label>
              <div className="flex gap-2 flex-wrap">
                {STORYBOARD_LAYOUTS.slice(0, 4).map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      selectedLayout.id === layout.id
                        ? "bg-primary/20 border-primary border-2"
                        : "bg-secondary hover:bg-secondary/80 border border-border"
                    }`}
                  >
                    {layout.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("sequence")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "sequence"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                Pre-built Sequences
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "custom"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                Custom Selection
              </button>
            </div>

            <ScrollArea className="flex-1">
              {activeTab === "sequence" ? (
                /* Pre-built Sequences */
                <div className="space-y-2 pr-4">
                  <Label className="text-xs mb-2 block">Select a Sequence</Label>
                  {SCENE_SEQUENCES.map((sequence) => (
                    <button
                      key={sequence.id}
                      onClick={() => handleSelectSequence(sequence)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedSequence?.id === sequence.id
                          ? "bg-primary/20 border-primary border-2"
                          : "bg-secondary/50 hover:bg-secondary border border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{sequence.name}</span>
                        {selectedSequence?.id === sequence.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{sequence.description}</p>
                      <div className="flex gap-1 flex-wrap">
                        {sequence.shots.slice(0, 4).map((shotId) => {
                          const shot = SHOT_TYPES.find(s => s.id === shotId);
                          return (
                            <span key={shotId} className="text-[10px] px-1.5 py-0.5 bg-background rounded">
                              {shot?.name || shotId}
                            </span>
                          );
                        })}
                        {sequence.shots.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-background rounded">
                            +{sequence.shots.length - 4} more
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Custom Selection */
                <div className="space-y-4 pr-4">
                  <div>
                    <Label className="text-xs mb-2 block">
                      Select Shots ({selectedShots.length}/{selectedLayout.totalShots})
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {SHOT_TYPES.map((shot) => (
                        <button
                          key={shot.id}
                          onClick={() => handleToggleShot(shot.id)}
                          disabled={!selectedShots.includes(shot.id) && selectedShots.length >= selectedLayout.totalShots}
                          className={`p-2 rounded-lg text-left transition-all ${
                            selectedShots.includes(shot.id)
                              ? "bg-primary/20 border-primary border-2"
                              : selectedShots.length >= selectedLayout.totalShots
                              ? "bg-secondary/30 border border-border opacity-50 cursor-not-allowed"
                              : "bg-secondary/50 hover:bg-secondary border border-border"
                          }`}
                        >
                          <span className="text-[10px] font-medium block">{shot.name}</span>
                          <span className="text-[8px] text-muted-foreground line-clamp-1">{shot.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedShots.length > 0 && (
                    <div>
                      <Label className="text-xs mb-2 block">Assign Actions</Label>
                      <div className="space-y-2">
                        {selectedShots.map((shotId, index) => {
                          const shot = SHOT_TYPES.find(s => s.id === shotId);
                          return (
                            <div key={`${shotId}-${index}`} className="flex items-center gap-2">
                              <span className="text-xs w-24 truncate">{shot?.name}</span>
                              <select
                                value={selectedActions[index] || "standing_neutral"}
                                onChange={(e) => handleSetAction(index, e.target.value)}
                                className="flex-1 text-xs p-1.5 rounded bg-secondary border border-border"
                              >
                                {ACTION_POSES.map((action) => (
                                  <option key={action.id} value={action.id}>
                                    {action.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: Preview */}
          <div className="w-1/2 flex flex-col">
            <Label className="text-xs mb-2">Storyboard Preview</Label>
            <div 
              className="flex-1 bg-secondary/30 rounded-lg p-4 grid gap-2"
              style={{ 
                gridTemplateColumns: `repeat(${selectedLayout.cols}, 1fr)`,
                gridTemplateRows: `repeat(${selectedLayout.rows}, 1fr)`
              }}
            >
              {Array.from({ length: selectedLayout.totalShots }).map((_, index) => {
                const shotId = selectedShots[index];
                const shot = shotId ? SHOT_TYPES.find(s => s.id === shotId) : null;
                const generatedImage = generatedImages.find(img => img.shotId === shotId);
                
                return (
                  <div 
                    key={index}
                    className="aspect-[4/3] bg-background rounded-lg border border-border flex flex-col items-center justify-center overflow-hidden"
                  >
                    {generatedImage ? (
                      <img loading="lazy" decoding="async" 
                        src={generatedImage.imageUrl} 
                        alt={shot?.name || `Shot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : shot ? (
                      <>
                        <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-center px-2">{shot.name}</span>
                      </>
                    ) : (
                      <>
                        <Grid3X3 className="w-6 h-6 text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground">Empty</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Consistency Info */}
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-primary mb-1">Character Consistency</p>
              <p className="text-[10px] text-muted-foreground">
                All shots will include: "{CONSISTENCY_MODIFIERS.sameCharacter}"
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {selectedShots.length} shots selected • {selectedLayout.totalShots} max
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="gradient-primary"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Storyboard
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
