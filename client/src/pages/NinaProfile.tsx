import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BadgeCheck, Grid3X3, Play, RefreshCw, User,
  Link2, MapPin, ArrowLeft, Heart, MessageCircle,
  Bookmark, Send, MoreHorizontal, ExternalLink
} from "lucide-react";

// ── Sample content grid data ─────────────────────────────────────────────────
const GRID_POSTS = [
  {
    id: 1, pinned: true, type: "image",
    gradient: "from-slate-300 via-zinc-200 to-slate-400",
    caption: "Ice rink editorial — AI-generated fashion shoot ✨ #AIInfluencer #FashionAI",
    likes: 2847, comments: 142,
    style: "Sequin dress, ice rink, dramatic lighting, editorial fashion photography",
  },
  {
    id: 2, pinned: true, type: "image",
    gradient: "from-stone-200 via-amber-50 to-stone-300",
    caption: "White summer aesthetic — your AI twin can model any look, any location 🤍",
    likes: 3201, comments: 189,
    style: "White outfit, Mediterranean architecture, golden hour, lifestyle photography",
  },
  {
    id: 3, pinned: true, type: "image",
    gradient: "from-amber-900 via-stone-700 to-zinc-800",
    caption: "Luxury brand collab — FENDI x AI Identity 🏆 #LuxuryFashion",
    likes: 4102, comments: 267,
    style: "Luxury fashion, FENDI bag, dark moody, high-fashion editorial",
  },
  {
    id: 4, type: "image",
    gradient: "from-zinc-800 via-stone-700 to-amber-900",
    caption: "Why I create in series, not singles — thread in bio 🧵",
    likes: 1893, comments: 98,
    style: "Close-up portrait, warm bokeh, editorial beauty photography",
  },
  {
    id: 5, type: "reel",
    gradient: "from-slate-700 via-zinc-600 to-stone-800",
    caption: "Festival season AI content — Coachella vibes without leaving home 🎪",
    likes: 5634, comments: 312,
    style: "Festival fashion, sunset, crowd, energetic lifestyle reel",
  },
  {
    id: 6, type: "reel",
    gradient: "from-amber-800 via-yellow-700 to-stone-700",
    caption: "Gold hour editorial — how I batch 30 posts in one afternoon ⚡",
    likes: 4211, comments: 234,
    style: "Gold metallic outfit, evening light, luxury lifestyle reel",
  },
  {
    id: 7, type: "image",
    gradient: "from-stone-300 via-zinc-200 to-slate-300",
    caption: "Minimal editorial — less is more in AI fashion photography 🤍",
    likes: 2109, comments: 87,
    style: "Minimalist fashion, clean background, editorial photography",
  },
  {
    id: 8, type: "image",
    gradient: "from-zinc-900 via-slate-800 to-stone-900",
    caption: "Dark academia aesthetic — AI personas can embody any style universe 📚",
    likes: 3456, comments: 201,
    style: "Dark academia, library, moody lighting, intellectual aesthetic",
  },
  {
    id: 9, type: "image",
    gradient: "from-amber-200 via-yellow-100 to-stone-200",
    caption: "Morning routine content — AI influencers never have bad hair days ☀️",
    likes: 1987, comments: 134,
    style: "Morning light, bedroom, soft aesthetic, lifestyle photography",
  },
];

const HIGHLIGHTS = [
  { label: "SERVICES", gradient: "from-amber-200 via-stone-300 to-zinc-300" },
  { label: "STUDIO", gradient: "from-stone-300 via-amber-200 to-yellow-200" },
  { label: "WORK", gradient: "from-zinc-300 via-stone-200 to-amber-100" },
  { label: "METHOD", gradient: "from-amber-300 via-yellow-200 to-stone-200" },
];

type TabType = "grid" | "reels" | "collab" | "tagged";

export default function NinaProfile() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("grid");
  const [selectedPost, setSelectedPost] = useState<typeof GRID_POSTS[0] | null>(null);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const filteredPosts = activeTab === "reels"
    ? GRID_POSTS.filter(p => p.type === "reel")
    : GRID_POSTS;

  const toggleLike = (id: number) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">ninastudio.ai</span>
            <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400" />
          </div>
          <button className="text-white/70 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* ── Profile Header ───────────────────────────────────────────── */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-start gap-6 mb-4">
            {/* Avatar with gradient ring */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2.5px]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-stone-300 via-amber-100 to-zinc-300 flex items-center justify-center overflow-hidden">
                  {/* Simulated AI face placeholder */}
                  <div className="w-full h-full bg-gradient-to-b from-amber-100 via-stone-200 to-amber-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-stone-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 flex items-center justify-around pt-2">
              {[
                { value: "329", label: "příspěvky" },
                { value: "100", label: "sledující" },
                { value: "179", label: "sleduji" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-bold text-base leading-tight">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Name + category */}
          <div className="mb-1">
            <div className="font-semibold text-sm">Nina Koskivaara | AI Identity & Story</div>
            <div className="text-xs text-white/50 mt-0.5">Produkt / služba</div>
          </div>

          {/* Bio */}
          <div className="text-sm text-white/80 leading-relaxed mb-2 space-y-0.5">
            <p>I direct AI visuals — not just generate them.</p>
            <p>Editorial aesthetics. Your AI twin. Your brand.</p>
            <p>Grab the free framework ↓</p>
          </div>

          {/* Link */}
          <a
            href="/aifluencer-studio"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="truncate">stan.store/Nina_Ann/p/ai-twin-storytel...</span>
          </a>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => navigate("/aifluencer-studio")}
              className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm h-8 rounded-lg"
            >
              Sledovat
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-white/20 text-white bg-white/5 hover:bg-white/10 font-semibold text-sm h-8 rounded-lg"
            >
              Zpráva
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-white/20 text-white bg-white/5 hover:bg-white/10 font-semibold text-sm h-8 rounded-lg"
            >
              Kontakty
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white bg-white/5 hover:bg-white/10 h-8 w-8 p-0 rounded-lg"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Story Highlights ─────────────────────────────────────────── */}
        <div className="px-4 pb-4">
          <div className="flex gap-5 overflow-x-auto pb-1 scrollbar-none">
            {HIGHLIGHTS.map((h) => (
              <button
                key={h.label}
                onClick={() => navigate("/aifluencer-studio")}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${h.gradient} flex items-center justify-center border-2 border-white/10 hover:border-white/30 transition-all`}>
                  <span className="text-stone-700 font-bold text-[9px] tracking-wider text-center leading-tight px-1">
                    {h.label}
                  </span>
                </div>
                <span className="text-xs text-white/70">{h.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── AI Creator Banner ─────────────────────────────────────────── */}
        <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-amber-950/40 to-stone-900/40 rounded-xl border border-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-400 mb-0.5">Vzorový AI Influencer Profil</p>
              <p className="text-xs text-white/50 leading-relaxed">
                Tento profil demonstruje, jak může vypadat váš AI influencer. Každý post byl vygenerován pomocí AI — žádné focení, žádná kamera.
              </p>
              <button
                onClick={() => navigate("/aifluencer-studio")}
                className="mt-2 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Vytvořte svůj AI profil <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content Tabs ─────────────────────────────────────────────── */}
        <div className="border-t border-white/10">
          <div className="flex">
            {([
              { id: "grid", Icon: Grid3X3 },
              { id: "reels", Icon: Play },
              { id: "collab", Icon: RefreshCw },
              { id: "tagged", Icon: User },
            ] as { id: TabType; Icon: any }[]).map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-all ${
                  activeTab === id
                    ? "border-white text-white"
                    : "border-transparent text-white/40 hover:text-white/60"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Content Grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-0.5">
          {filteredPosts.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square group overflow-hidden"
            >
              {/* Gradient placeholder for AI image */}
              <div className={`w-full h-full bg-gradient-to-br ${post.gradient} transition-all group-hover:brightness-75`} />

              {/* Overlays */}
              {post.pinned && (
                <div className="absolute top-1.5 right-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-white drop-shadow-lg fill-white" />
                </div>
              )}
              {post.type === "reel" && (
                <div className="absolute top-1.5 right-1.5">
                  <Play className="w-4 h-4 text-white drop-shadow-lg fill-white" />
                </div>
              )}

              {/* Hover overlay with stats */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-white text-xs font-semibold">
                  <Heart className="w-4 h-4 fill-white" />
                  {(post.likes / 1000).toFixed(1)}k
                </div>
                <div className="flex items-center gap-1 text-white text-xs font-semibold">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  {post.comments}
                </div>
              </div>

              {/* AI badge */}
              <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge className="bg-black/70 text-amber-400 border-amber-500/30 text-[9px] px-1 py-0">
                  AI
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* ── CTA Footer ───────────────────────────────────────────────── */}
        <div className="px-4 py-8 text-center border-t border-white/5 mt-4">
          <p className="text-white/50 text-sm mb-4">
            Chcete vytvořit podobný profil pro sebe?
          </p>
          <Button
            onClick={() => navigate("/aifluencer-studio")}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold px-8 py-5 rounded-full"
          >
            Získejte bezplatný framework →
          </Button>
        </div>
      </div>

      {/* ── Post Detail Modal ─────────────────────────────────────────────── */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-zinc-900 rounded-2xl overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Post header */}
            <div className="flex items-center gap-3 p-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-stone-300 flex items-center justify-center">
                  <User className="w-4 h-4 text-stone-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">ninastudio.ai</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                </div>
                <div className="text-xs text-white/40">AI Generated Content</div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="ml-auto text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Post image */}
            <div className={`aspect-square bg-gradient-to-br ${selectedPost.gradient} relative`}>
              <div className="absolute inset-0 flex items-end p-4">
                <div className="bg-black/50 rounded-lg p-2 text-xs text-white/70 backdrop-blur-sm">
                  <span className="text-amber-400 font-medium">AI Prompt: </span>
                  {selectedPost.style}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3">
              <div className="flex items-center gap-4 mb-3">
                <button onClick={() => toggleLike(selectedPost.id)}>
                  <Heart className={`w-6 h-6 transition-colors ${liked.has(selectedPost.id) ? "fill-red-500 text-red-500" : "text-white/70 hover:text-white"}`} />
                </button>
                <MessageCircle className="w-6 h-6 text-white/70 hover:text-white cursor-pointer" />
                <Send className="w-6 h-6 text-white/70 hover:text-white cursor-pointer" />
                <Bookmark className="w-6 h-6 text-white/70 hover:text-white cursor-pointer ml-auto" />
              </div>
              <div className="text-sm font-semibold mb-1">
                {(selectedPost.likes + (liked.has(selectedPost.id) ? 1 : 0)).toLocaleString()} likes
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{selectedPost.caption}</p>
              <button
                onClick={() => navigate("/aifluencer-studio")}
                className="mt-3 w-full py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
              >
                Vytvořte podobný obsah s AI →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
