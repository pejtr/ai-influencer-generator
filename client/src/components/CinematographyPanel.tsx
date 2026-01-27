import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, Aperture, Film, Sun, Clapperboard, Palette,
  ChevronDown, ChevronUp, Check
} from "lucide-react";
import {
  CAMERA_PRESETS,
  LENS_PRESETS,
  APERTURE_PRESETS,
  FILM_STOCK_PRESETS,
  LIGHTING_PRESETS,
  DIRECTOR_STYLE_PRESETS,
  COLOR_GRADE_PRESETS,
  buildCinematographyPrompt,
  type CameraPreset,
  type LensPreset,
  type AperturePreset,
  type FilmStockPreset,
  type LightingPreset,
  type DirectorStylePreset,
  type ColorGradePreset,
} from "@shared/cinematography";

interface CinematographySettings {
  camera: string;
  lens: string;
  aperture: string;
  filmStock: string;
  lighting: string;
  directorStyle: string;
  colorGrade: string;
}

interface CinematographyPanelProps {
  onApplySettings: (prompt: string) => void;
  onSettingsChange?: (settings: CinematographySettings) => void;
}

// Collapsible section component
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Preset selector grid
function PresetGrid<T extends { id: string; name: string }>({ 
  presets, 
  selected, 
  onSelect,
  renderLabel,
  columns = 2
}: { 
  presets: T[]; 
  selected: string;
  onSelect: (id: string) => void;
  renderLabel?: (preset: T) => React.ReactNode;
  columns?: number;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset.id === selected ? "" : preset.id)}
          className={`p-2 rounded-lg text-left transition-all ${
            selected === preset.id 
              ? "bg-primary/20 border-primary border-2" 
              : "bg-secondary/50 hover:bg-secondary border border-border"
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium line-clamp-1">{preset.name}</span>
            {selected === preset.id && (
              <Check className="w-3 h-3 text-primary flex-shrink-0" />
            )}
          </div>
          {renderLabel && (
            <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {renderLabel(preset)}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default function CinematographyPanel({ onApplySettings, onSettingsChange }: CinematographyPanelProps) {
  const [settings, setSettings] = useState<CinematographySettings>({
    camera: "",
    lens: "",
    aperture: "",
    filmStock: "",
    lighting: "",
    directorStyle: "",
    colorGrade: "",
  });
  
  const [activeTab, setActiveTab] = useState("camera");

  const updateSetting = (key: keyof CinematographySettings, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleApply = () => {
    const prompt = buildCinematographyPrompt(settings);
    onApplySettings(prompt);
  };

  const handleReset = () => {
    const emptySettings: CinematographySettings = {
      camera: "",
      lens: "",
      aperture: "",
      filmStock: "",
      lighting: "",
      directorStyle: "",
      colorGrade: "",
    };
    setSettings(emptySettings);
    onSettingsChange?.(emptySettings);
  };

  const selectedCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-primary" />
            Cinematography
          </h3>
          <span className="text-xs text-muted-foreground">
            {selectedCount} selected
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Professional camera, lighting, and film style presets
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border px-2">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="camera" className="text-[10px] px-1">
              <Camera className="w-3 h-3 mr-1" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="light" className="text-[10px] px-1">
              <Sun className="w-3 h-3 mr-1" />
              Light
            </TabsTrigger>
            <TabsTrigger value="film" className="text-[10px] px-1">
              <Film className="w-3 h-3 mr-1" />
              Film
            </TabsTrigger>
            <TabsTrigger value="style" className="text-[10px] px-1">
              <Palette className="w-3 h-3 mr-1" />
              Style
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Camera Tab */}
          <TabsContent value="camera" className="mt-0 p-0">
            <CollapsibleSection title="Camera Body" icon={Camera} defaultOpen>
              <PresetGrid
                presets={CAMERA_PRESETS}
                selected={settings.camera}
                onSelect={(id) => updateSetting("camera", id)}
                renderLabel={(p) => p.brand}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Lens" icon={Aperture} defaultOpen>
              <PresetGrid
                presets={LENS_PRESETS}
                selected={settings.lens}
                onSelect={(id) => updateSetting("lens", id)}
                renderLabel={(p) => p.focalLength}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Aperture / DOF" icon={Aperture}>
              <PresetGrid
                presets={APERTURE_PRESETS}
                selected={settings.aperture}
                onSelect={(id) => updateSetting("aperture", id)}
                renderLabel={(p) => p.dofDescription}
              />
            </CollapsibleSection>
          </TabsContent>

          {/* Lighting Tab */}
          <TabsContent value="light" className="mt-0 p-0">
            <CollapsibleSection title="Studio Lighting" icon={Sun} defaultOpen>
              <PresetGrid
                presets={LIGHTING_PRESETS.filter(l => l.category === "studio")}
                selected={settings.lighting}
                onSelect={(id) => updateSetting("lighting", id)}
                renderLabel={(p) => p.mood}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Natural Lighting" icon={Sun}>
              <PresetGrid
                presets={LIGHTING_PRESETS.filter(l => l.category === "natural")}
                selected={settings.lighting}
                onSelect={(id) => updateSetting("lighting", id)}
                renderLabel={(p) => p.mood}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Cinematic Lighting" icon={Sun}>
              <PresetGrid
                presets={LIGHTING_PRESETS.filter(l => l.category === "cinematic")}
                selected={settings.lighting}
                onSelect={(id) => updateSetting("lighting", id)}
                renderLabel={(p) => p.mood}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Creative Lighting" icon={Sun}>
              <PresetGrid
                presets={LIGHTING_PRESETS.filter(l => l.category === "creative")}
                selected={settings.lighting}
                onSelect={(id) => updateSetting("lighting", id)}
                renderLabel={(p) => p.mood}
              />
            </CollapsibleSection>
          </TabsContent>

          {/* Film Tab */}
          <TabsContent value="film" className="mt-0 p-0">
            <CollapsibleSection title="Color Film Stocks" icon={Film} defaultOpen>
              <PresetGrid
                presets={FILM_STOCK_PRESETS.filter(f => f.type === "color_negative")}
                selected={settings.filmStock}
                onSelect={(id) => updateSetting("filmStock", id)}
                renderLabel={(p) => p.colorProfile}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Cinema Film" icon={Film}>
              <PresetGrid
                presets={FILM_STOCK_PRESETS.filter(f => f.type === "cinema")}
                selected={settings.filmStock}
                onSelect={(id) => updateSetting("filmStock", id)}
                renderLabel={(p) => p.colorProfile}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Black & White" icon={Film}>
              <PresetGrid
                presets={FILM_STOCK_PRESETS.filter(f => f.type === "bw")}
                selected={settings.filmStock}
                onSelect={(id) => updateSetting("filmStock", id)}
                renderLabel={(p) => p.colorProfile}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Digital" icon={Film}>
              <PresetGrid
                presets={FILM_STOCK_PRESETS.filter(f => f.type === "digital")}
                selected={settings.filmStock}
                onSelect={(id) => updateSetting("filmStock", id)}
                renderLabel={(p) => p.colorProfile}
              />
            </CollapsibleSection>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="mt-0 p-0">
            <CollapsibleSection title="Director Styles" icon={Clapperboard} defaultOpen>
              <PresetGrid
                presets={DIRECTOR_STYLE_PRESETS.filter(d => d.type === "director")}
                selected={settings.directorStyle}
                onSelect={(id) => updateSetting("directorStyle", id)}
                renderLabel={(p) => p.knownFor.substring(0, 30) + "..."}
                columns={1}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Photographer Styles" icon={Camera}>
              <PresetGrid
                presets={DIRECTOR_STYLE_PRESETS.filter(d => d.type === "photographer")}
                selected={settings.directorStyle}
                onSelect={(id) => updateSetting("directorStyle", id)}
                renderLabel={(p) => p.knownFor.substring(0, 30) + "..."}
                columns={1}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Color Grading" icon={Palette}>
              <PresetGrid
                presets={COLOR_GRADE_PRESETS}
                selected={settings.colorGrade}
                onSelect={(id) => updateSetting("colorGrade", id)}
                renderLabel={(p) => p.description}
              />
            </CollapsibleSection>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-3 border-t border-border space-y-2">
        {selectedCount > 0 && (
          <div className="p-2 bg-secondary/30 rounded-lg">
            <p className="text-[10px] text-muted-foreground mb-1">Preview:</p>
            <p className="text-xs line-clamp-2">
              {buildCinematographyPrompt(settings) || "No settings selected"}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1 text-xs h-8"
            disabled={selectedCount === 0}
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="flex-1 text-xs h-8 gradient-primary"
            disabled={selectedCount === 0}
          >
            Apply to Prompt
          </Button>
        </div>
      </div>
    </div>
  );
}
