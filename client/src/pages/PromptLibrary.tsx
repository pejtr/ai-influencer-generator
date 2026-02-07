import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Sparkles, Copy, Check, Search, ArrowRight,
  Camera, Video, Mic, Layers, Star, Filter
} from "lucide-react";
import { toast } from "sonner";

interface PromptTemplate {
  id: string;
  title: string;
  category: "cinematic" | "historical" | "portrait" | "fashion" | "fantasy" | "commercial";
  model: string;
  prompt: string;
  negativePrompt?: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  rating: number;
  uses: number;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "skyfall-1",
    title: "Skyfall Cinematic Drop",
    category: "cinematic",
    model: "Kling 2.5 Turbo",
    prompt: "A person falling through the sky, cinematic aerial shot, dramatic clouds below, golden hour lighting, wind blowing through hair and clothes, hyper-realistic detail, 8K resolution, motion blur on edges, volumetric god rays, professional cinematography, IMAX quality",
    negativePrompt: "cartoon, anime, low quality, blurry, distorted face",
    tags: ["cinematic", "action", "dramatic", "aerial"],
    difficulty: "advanced",
    rating: 4.8,
    uses: 2340,
  },
  {
    id: "skyfall-2",
    title: "Skyfall Night Scene",
    category: "cinematic",
    model: "Kling 2.5 Turbo",
    prompt: "A person falling through the night sky, city lights below creating bokeh, dramatic moonlight illumination, wind-swept clothing, hyper-realistic skin detail, cinematic color grading, teal and orange palette, 8K, professional VFX quality",
    tags: ["cinematic", "night", "urban", "dramatic"],
    difficulty: "advanced",
    rating: 4.7,
    uses: 1890,
  },
  {
    id: "hist-egypt",
    title: "Ancient Egypt Era",
    category: "historical",
    model: "Flux 2.0 Pro",
    prompt: "Portrait of [PERSON] as an ancient Egyptian pharaoh, wearing golden headdress (nemes), kohl-lined eyes, ornate golden collar necklace, desert temple background with hieroglyphics, warm golden lighting, ultra-realistic skin texture, 8K resolution, identity preservation, photorealistic",
    tags: ["historical", "egypt", "pharaoh", "identity"],
    difficulty: "intermediate",
    rating: 4.9,
    uses: 3120,
  },
  {
    id: "hist-rome",
    title: "Roman Empire Era",
    category: "historical",
    model: "Flux 2.0 Pro",
    prompt: "Portrait of [PERSON] as a Roman senator, wearing white toga with purple trim, laurel wreath crown, marble columns and Roman forum background, dramatic side lighting, ultra-realistic skin pores, 8K resolution, identity preservation, photorealistic",
    tags: ["historical", "rome", "senator", "classical"],
    difficulty: "intermediate",
    rating: 4.8,
    uses: 2780,
  },
  {
    id: "hist-renaissance",
    title: "Renaissance Master",
    category: "historical",
    model: "Flux 2.0 Pro",
    prompt: "Portrait of [PERSON] in Renaissance style, wearing ornate velvet doublet with gold embroidery, Medici-era Florence background, oil painting lighting style by Raphael, ultra-realistic detail, 8K, identity preservation, photorealistic with painterly quality",
    tags: ["historical", "renaissance", "art", "classical"],
    difficulty: "intermediate",
    rating: 4.9,
    uses: 3450,
  },
  {
    id: "hist-viking",
    title: "Viking Warrior",
    category: "historical",
    model: "Flux 2.0 Pro",
    prompt: "Portrait of [PERSON] as a Viking warrior, braided hair, leather armor with metal studs, runic tattoos, misty fjord background, dramatic overcast lighting, battle-worn look, ultra-realistic skin detail, 8K resolution, identity preservation",
    tags: ["historical", "viking", "warrior", "nordic"],
    difficulty: "intermediate",
    rating: 4.7,
    uses: 2150,
  },
  {
    id: "portrait-studio",
    title: "Professional Studio Portrait",
    category: "portrait",
    model: "NanoBanana Pro",
    prompt: "Professional studio portrait, soft Rembrandt lighting, shallow depth of field f/1.4, clean background gradient, natural skin texture with pore-level detail, catchlight in eyes, 8K resolution, magazine quality, shot on Hasselblad",
    negativePrompt: "over-processed, plastic skin, harsh shadows",
    tags: ["portrait", "studio", "professional", "clean"],
    difficulty: "beginner",
    rating: 4.6,
    uses: 5670,
  },
  {
    id: "fashion-editorial",
    title: "Fashion Editorial",
    category: "fashion",
    model: "NanoBanana Pro",
    prompt: "High fashion editorial portrait, avant-garde styling, dramatic directional lighting, bold color palette, geometric shadows, ultra-sharp detail, Vogue magazine quality, shot by Annie Leibovitz style, 8K resolution",
    tags: ["fashion", "editorial", "vogue", "dramatic"],
    difficulty: "intermediate",
    rating: 4.8,
    uses: 3890,
  },
  {
    id: "fantasy-elf",
    title: "Fantasy Elf Character",
    category: "fantasy",
    model: "Flux 2.0 Pro",
    prompt: "Portrait of [PERSON] as a high elf, pointed ears, ethereal glow, silver circlet with gemstone, flowing silk robes, enchanted forest background with bioluminescent plants, magical particles, ultra-realistic, 8K, identity preservation",
    tags: ["fantasy", "elf", "magical", "character"],
    difficulty: "intermediate",
    rating: 4.7,
    uses: 2890,
  },
  {
    id: "commercial-product",
    title: "Product Influencer Shot",
    category: "commercial",
    model: "NanoBanana Pro",
    prompt: "Influencer holding product, natural lifestyle setting, soft window light, warm color grading, genuine smile, eye contact with camera, shallow depth of field, Instagram-ready composition, 4K quality, authentic and relatable",
    tags: ["commercial", "product", "influencer", "lifestyle"],
    difficulty: "beginner",
    rating: 4.5,
    uses: 4230,
  },
  {
    id: "hist-samurai",
    title: "Samurai Warrior",
    category: "historical",
    model: "Flux 2.0 Pro",
    prompt: "Portrait of [PERSON] as a samurai warrior, wearing traditional yoroi armor, katana at side, cherry blossom trees in background, dramatic low-angle shot, misty atmosphere, ultra-realistic detail, 8K resolution, identity preservation, photorealistic",
    tags: ["historical", "samurai", "japan", "warrior"],
    difficulty: "intermediate",
    rating: 4.8,
    uses: 2670,
  },
  {
    id: "cinematic-noir",
    title: "Film Noir Detective",
    category: "cinematic",
    model: "Kling 2.5 Turbo",
    prompt: "Film noir style portrait, dramatic chiaroscuro lighting, fedora hat, trench coat, rain-slicked streets reflection, cigarette smoke wisps, black and white with selective color, 1940s atmosphere, ultra-realistic, 8K",
    tags: ["cinematic", "noir", "detective", "vintage"],
    difficulty: "advanced",
    rating: 4.6,
    uses: 1980,
  },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: Layers },
  { id: "cinematic", label: "Cinematic", icon: Video },
  { id: "historical", label: "Historical", icon: Star },
  { id: "portrait", label: "Portrait", icon: Camera },
  { id: "fashion", label: "Fashion", icon: Sparkles },
  { id: "fantasy", label: "Fantasy", icon: Sparkles },
  { id: "commercial", label: "Commercial", icon: Mic },
];

const DIFFICULTY_COLORS = {
  beginner: "bg-green-500/20 text-green-400",
  intermediate: "bg-yellow-500/20 text-yellow-400",
  advanced: "bg-red-500/20 text-red-400",
};

export default function PromptLibrary() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPrompts = useMemo(() => {
    return PROMPT_TEMPLATES.filter((p) => {
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopy = async (prompt: PromptTemplate) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedId(prompt.id);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-black text-xl tracking-tight">
              AI Influencer
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/blog" className="text-sm text-white/70 hover:text-white">
                Blog
              </Link>
              <Link href="/studio">
                <Button className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-6">
                  ENTER APP
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-blue-950/30 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 text-blue-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              PROMPT LIBRARY
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
              READY-TO-USE<br />PROMPT TEMPLATES
            </h1>
            <p className="text-lg text-white/60 max-w-xl">
              Professional prompt templates for creating stunning AI influencer content. 
              Copy, customize, and create in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Prompt Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="group rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-blue-500/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{prompt.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[prompt.difficulty]}`}>
                        {prompt.difficulty}
                      </span>
                      <span className="text-xs text-white/40">{prompt.model}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(prompt)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-blue-600/20 transition-colors"
                  >
                    {copiedId === prompt.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                </div>

                {/* Prompt Preview */}
                <div className="bg-black/40 rounded-xl p-4 mb-4 border border-white/5">
                  <p className="text-sm text-white/60 line-clamp-4 font-mono leading-relaxed">
                    {prompt.prompt}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {prompt.rating}
                  </div>
                  <span>{prompt.uses.toLocaleString()} uses</span>
                </div>
              </div>
            ))}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-16">
              <Filter className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No prompts match your filters</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-black to-blue-950/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
            READY TO CREATE?
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Use these prompts in our AI studio to generate stunning influencer content.
          </p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-8">
            <Link href="/studio">
              OPEN STUDIO
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-sm text-white/40">
          © 2026 AI Influencer Generator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
