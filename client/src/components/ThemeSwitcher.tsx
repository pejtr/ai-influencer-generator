import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Check, Globe } from "lucide-react";

// Theme variants configuration
export const THEME_VARIANTS = {
  // English variants
  "en-a": {
    id: "en-a",
    name: "Dark Neon",
    language: "en",
    description: "Dark theme with neon lime accents",
    colors: {
      primary: "#BFFF00",
      background: "#0a0a0a",
      foreground: "#ffffff",
      accent: "#BFFF00",
      card: "rgba(255,255,255,0.05)",
    },
  },
  "en-b": {
    id: "en-b",
    name: "Luxury Gold",
    language: "en",
    description: "Dark luxury theme with gold accents",
    colors: {
      primary: "#D4AF37",
      background: "#0f0f0f",
      foreground: "#ffffff",
      accent: "#D4AF37",
      card: "rgba(212,175,55,0.1)",
    },
  },
  "en-c": {
    id: "en-c",
    name: "Fresh Blue",
    language: "en",
    description: "Light theme with blue accents",
    colors: {
      primary: "#3B82F6",
      background: "#f0f9ff",
      foreground: "#1e3a5f",
      accent: "#3B82F6",
      card: "rgba(59,130,246,0.1)",
    },
  },
  // Czech variants
  "cz-a": {
    id: "cz-a",
    name: "Světlý Čistý",
    language: "cz",
    description: "Světlé téma se žlutými akcenty",
    colors: {
      primary: "#EAB308",
      background: "#fefefe",
      foreground: "#1a1a1a",
      accent: "#EAB308",
      card: "rgba(234,179,8,0.1)",
    },
  },
  "cz-b": {
    id: "cz-b",
    name: "Urgence",
    language: "cz",
    description: "Tmavé téma s fialovými akcenty",
    colors: {
      primary: "#A855F7",
      background: "#0f0a1a",
      foreground: "#ffffff",
      accent: "#EAB308",
      card: "rgba(168,85,247,0.15)",
    },
  },
  "cz-c": {
    id: "cz-c",
    name: "Lifestyle Luxus",
    language: "cz",
    description: "Tmavé téma s luxusním stylem",
    colors: {
      primary: "#D4AF37",
      background: "#0a0a0a",
      foreground: "#ffffff",
      accent: "#D4AF37",
      card: "rgba(212,175,55,0.1)",
    },
  },
} as const;

export type ThemeVariantId = keyof typeof THEME_VARIANTS;

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeVariantId>("en-a");
  const [isOpen, setIsOpen] = useState(false);

  // Load saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme-variant") as ThemeVariantId;
    if (saved && THEME_VARIANTS[saved]) {
      setCurrentTheme(saved);
      applyTheme(saved);
    }
  }, []);

  // Apply theme CSS variables
  const applyTheme = (themeId: ThemeVariantId) => {
    const theme = THEME_VARIANTS[themeId];
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty("--theme-primary", theme.colors.primary);
    root.style.setProperty("--theme-background", theme.colors.background);
    root.style.setProperty("--theme-foreground", theme.colors.foreground);
    root.style.setProperty("--theme-accent", theme.colors.accent);
    root.style.setProperty("--theme-card", theme.colors.card);
    
    // Set data attribute for conditional styling
    root.setAttribute("data-theme-variant", themeId);
    root.setAttribute("data-theme-language", theme.language);
    
    // Toggle dark/light mode
    const isDark = theme.colors.background.startsWith("#0") || theme.colors.background.startsWith("#1");
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  };

  const handleThemeChange = (themeId: ThemeVariantId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem("theme-variant", themeId);
    setIsOpen(false);
  };

  const currentThemeData = THEME_VARIANTS[currentTheme];
  const enVariants = Object.values(THEME_VARIANTS).filter(t => t.language === "en");
  const czVariants = Object.values(THEME_VARIANTS).filter(t => t.language === "cz");

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="rounded-full shadow-2xl h-14 w-14 p-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-2 border-white/20"
            style={{
              boxShadow: `0 0 20px ${currentThemeData.colors.primary}40, 0 4px 20px rgba(0,0,0,0.3)`,
            }}
          >
            <Palette className="h-6 w-6 text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 mb-2 bg-black/90 backdrop-blur-xl border-white/20"
        >
          <DropdownMenuLabel className="flex items-center gap-2 text-white">
            <Palette className="h-4 w-4" />
            Přepnout Vzhled / Switch Theme
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/20" />
          
          {/* English Variants */}
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-gray-400">
            <Globe className="h-3 w-3" />
            English Variants
          </DropdownMenuLabel>
          {enVariants.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => handleThemeChange(theme.id as ThemeVariantId)}
              className="flex items-center gap-3 cursor-pointer hover:bg-white/10 text-white"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white/30"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div className="flex-1">
                <div className="font-medium">{theme.name}</div>
                <div className="text-xs text-gray-400">{theme.description}</div>
              </div>
              {currentTheme === theme.id && (
                <Check className="h-4 w-4 text-green-400" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator className="bg-white/20" />
          
          {/* Czech Variants */}
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-gray-400">
            <Globe className="h-3 w-3" />
            České Varianty
          </DropdownMenuLabel>
          {czVariants.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => handleThemeChange(theme.id as ThemeVariantId)}
              className="flex items-center gap-3 cursor-pointer hover:bg-white/10 text-white"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white/30"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div className="flex-1">
                <div className="font-medium">{theme.name}</div>
                <div className="text-xs text-gray-400">{theme.description}</div>
              </div>
              {currentTheme === theme.id && (
                <Check className="h-4 w-4 text-green-400" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ThemeSwitcher;
