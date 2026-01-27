import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Image, Upload, Trash2, Plus, User, Shirt, Mountain, 
  Package, Palette, Check, X, Loader2
} from "lucide-react";
import {
  ELEMENT_CATEGORIES,
  ELEMENT_PRESETS,
  DEFAULT_STRENGTHS,
  buildReferencePrompt,
  combineReferencePrompts,
  createReferenceElement,
  type ElementType,
  type ReferenceElement,
  type ElementPreset,
} from "@shared/elementsSystem";

interface ElementsPanelProps {
  onApplyElements: (prompt: string) => void;
  basePrompt: string;
}

// Icon mapping for element types
const ELEMENT_ICONS: Record<ElementType, React.ElementType> = {
  character: User,
  outfit: Shirt,
  scene: Mountain,
  object: Package,
  style: Palette,
};

export default function ElementsPanel({ onApplyElements, basePrompt }: ElementsPanelProps) {
  const [elements, setElements] = useState<ReferenceElement[]>([]);
  const [isAddingElement, setIsAddingElement] = useState(false);
  const [selectedType, setSelectedType] = useState<ElementType>("character");
  const [newElementName, setNewElementName] = useState("");
  const [newElementDescription, setNewElementDescription] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddElement = () => {
    if (!newElementName.trim()) return;

    const newElement = createReferenceElement(selectedType, newElementName, {
      imageUrl: uploadedImageUrl,
      description: newElementDescription,
      strength: DEFAULT_STRENGTHS[selectedType],
    });

    setElements([...elements, newElement]);
    resetAddForm();
  };

  const handleAddPreset = (preset: ElementPreset) => {
    const newElement = createReferenceElement(preset.type, preset.name, {
      description: preset.description,
      features: preset.features,
      strength: DEFAULT_STRENGTHS[preset.type],
    });

    setElements([...elements, newElement]);
  };

  const handleRemoveElement = (id: string) => {
    setElements(elements.filter(e => e.id !== id));
  };

  const handleUpdateStrength = (id: string, strength: number) => {
    setElements(elements.map(e => 
      e.id === id ? { ...e, strength } : e
    ));
  };

  const handleApply = () => {
    const combinedPrompt = combineReferencePrompts(elements, basePrompt);
    onApplyElements(combinedPrompt);
  };

  const resetAddForm = () => {
    setIsAddingElement(false);
    setNewElementName("");
    setNewElementDescription("");
    setUploadedImageUrl("");
    setSelectedType("character");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // For now, create a local URL - in production this would upload to S3
      const localUrl = URL.createObjectURL(file);
      setUploadedImageUrl(localUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const groupedPresets = ELEMENT_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.type]) acc[preset.type] = [];
    acc[preset.type].push(preset);
    return acc;
  }, {} as Record<ElementType, ElementPreset[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            Elements
          </h3>
          <span className="text-xs text-muted-foreground">
            {elements.length} active
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Reference images for character consistency
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Active Elements */}
          {elements.length > 0 && (
            <div>
              <Label className="text-xs mb-2 block">Active Elements</Label>
              <div className="space-y-2">
                {elements.map((element) => {
                  const Icon = ELEMENT_ICONS[element.type];
                  return (
                    <div 
                      key={element.id}
                      className="p-3 bg-secondary/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            {element.imageUrl ? (
                              <img 
                                src={element.imageUrl} 
                                alt={element.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Icon className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{element.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {element.type}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveElement(element.id)}
                          className="p-1 hover:bg-destructive/20 rounded transition-colors"
                        >
                          <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Strength</span>
                          <span className="text-[10px] font-medium">{element.strength}%</span>
                        </div>
                        <Slider
                          value={[element.strength]}
                          onValueChange={([value]) => handleUpdateStrength(element.id, value)}
                          min={0}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add New Element */}
          {isAddingElement ? (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Add New Element</Label>
                <button onClick={resetAddForm}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Type Selection */}
              <div className="grid grid-cols-5 gap-1">
                {(Object.keys(ELEMENT_CATEGORIES) as ElementType[]).map((type) => {
                  const Icon = ELEMENT_ICONS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                        selectedType === type
                          ? "bg-primary/20 border-primary border"
                          : "bg-secondary/50 hover:bg-secondary border border-transparent"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[8px] capitalize">{type}</span>
                    </button>
                  );
                })}
              </div>

              {/* Image Upload */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                {uploadedImageUrl ? (
                  <div className="relative">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Uploaded reference"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setUploadedImageUrl("")}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Upload Reference</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Name & Description */}
              <div className="space-y-2">
                <Input
                  value={newElementName}
                  onChange={(e) => setNewElementName(e.target.value)}
                  placeholder="Element name..."
                  className="text-xs h-8"
                />
                <Input
                  value={newElementDescription}
                  onChange={(e) => setNewElementDescription(e.target.value)}
                  placeholder="Description (optional)..."
                  className="text-xs h-8"
                />
              </div>

              <Button
                onClick={handleAddElement}
                disabled={!newElementName.trim()}
                className="w-full h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Element
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAddingElement(true)}
              className="w-full h-10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reference Element
            </Button>
          )}

          {/* Presets */}
          <div>
            <Label className="text-xs mb-2 block">Quick Presets</Label>
            {(Object.keys(groupedPresets) as ElementType[]).map((type) => {
              const presets = groupedPresets[type];
              if (!presets || presets.length === 0) return null;
              
              const Icon = ELEMENT_ICONS[type];
              return (
                <div key={type} className="mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground capitalize">{type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleAddPreset(preset)}
                        className="p-2 text-left bg-secondary/50 hover:bg-secondary rounded-lg border border-border transition-all"
                      >
                        <span className="text-[10px] font-medium block truncate">{preset.name}</span>
                        <span className="text-[8px] text-muted-foreground line-clamp-1">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {elements.length > 0 && (
          <div className="p-2 bg-secondary/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Combined prompt preview:</p>
            <p className="text-xs line-clamp-2">
              {combineReferencePrompts(elements, "").substring(0, 100)}...
            </p>
          </div>
        )}
        <Button
          onClick={handleApply}
          disabled={elements.length === 0}
          className="w-full h-8 text-xs gradient-primary"
        >
          Apply Elements to Prompt
        </Button>
      </div>
    </div>
  );
}
