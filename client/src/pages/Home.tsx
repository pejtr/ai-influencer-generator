import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  ArrowRight, Menu, X, ChevronRight,
  Instagram, Twitter, Youtube, Sparkles,
  Wand2, Video, MessageCircle, DollarSign, TrendingUp, Users,
  Camera, Mic, Clapperboard, Layers, Star, Shield, Zap,
  Check, Clock, Eye, Award, Crown, ChevronDown
} from "lucide-react";
import ABTestCTA from "../components/ABTestCTA";
import { hapticSwipe } from "@/lib/haptics";

// CDN hero images — AI-generated showcase photos
const HERO_SLIDES = [
  {
    image: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_01_a13d581d.png",
    badge: "WORLD FIRST",
    subtitle: "THE FIRST AI INFLUENCER PLATFORM",
    headline: "CREATE\nYOUR AI",
    description: "Generate ultra-realistic virtual influencers with pore-level detail and natural expressions using our foundational AI model.",
    cta: "CREATE NOW",
    ctaSecondary: "SEE PRICING",
  },
  {
    image: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_03_7073e44d.png",
    badge: "AI VOICES",
    subtitle: "ADVANCED VOICE CLONING",
    headline: "CLONE\nANY VOICE",
    description: "Create hyper-realistic voice clones with natural intonation and emotion. Perfect for content creation and fan engagement.",
    cta: "CLONE VOICE",
    ctaSecondary: "LEARN MORE",
  },
  {
    image: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_07_19ef1452.png",
    badge: "DIGITAL HUMANS",
    subtitle: "ADVANCED AVATAR GENERATION",
    headline: "BUILD\nINFLUENCERS",
    description: "Create hyper-realistic digital subjects with pore-level detail and natural human movement using our foundational model.",
    cta: "BUILD NOW",
    ctaSecondary: "LEARN MORE",
  },
];

// All 9 showcase images for gallery section
const SHOWCASE_IMAGES = [
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_01_a13d581d.png", label: "European · Blonde" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_02_6396728f.png", label: "Asian · Streetwear" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_03_7073e44d.png", label: "Latina · Beach" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_04_d9387d50.png", label: "African · Athletic" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_05_5d9d4431.png", label: "Mixed · Elegant" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_06_f185c33a.png", label: "Scandinavian · Winter" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_07_19ef1452.png", label: "Middle Eastern · Gala" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_08_f0c7f65e.png", label: "Indian · Fashion" },
  { url: "https://d2xsxph8kpxj0f.cloudfront.net/89740521/DtHx6xuQiQvSJ7iXUMCHPD/influencer_09_1a17f63f.png", label: "Eastern European · Minimal" },
];

const CORE_TECH = [
  { label: "FACE GENERATION", icon: Wand2 },
  { label: "VOICE CLONING", icon: Mic },
  { label: "VIDEO MOTION", icon: Clapperboard },
  { label: "MULTI-MODEL", icon: Layers },
];

const STATS = [
  { value: "600K+", label: "AI Influencers Created" },
  { value: "50K+", label: "Active Creators" },
  { value: "4.9/5", label: "User Rating" },
  { value: "$2M+", label: "Creator Earnings" },
];

const FEATURES = [
  { icon: Wand2, title: "AI-Powered Generation", description: "Create photorealistic AI influencers in seconds with our advanced image generation technology." },
  { icon: Users, title: "Endless Customization", description: "Choose from dozens of character types, ethnicities, features, and styles to create your perfect influencer." },
  { icon: Video, title: "Video & Motion", description: "Bring your AI influencers to life with talking avatars, lip sync, and motion transfer technology." },
  { icon: MessageCircle, title: "AI Chat Companion", description: "Engage fans with AI-powered chat that responds in your influencer's unique personality." },
  { icon: DollarSign, title: "Monetization Ready", description: "Built-in tools for Fanvue integration, exclusive content sales, and subscription management." },
  { icon: TrendingUp, title: "Analytics Dashboard", description: "Track engagement, revenue, and growth with comprehensive analytics and insights." },
];

const TESTIMONIALS = [
  {
    name: "Sophia M.",
    role: "OnlyFans Creator",
    avatar: "SM",
    rating: 5,
    text: "I went from $800/month to over $12,000 in just 3 months using AI Influencer. The AI chat feature alone doubled my subscriber retention.",
    earnings: "$12,400/mo",
    location: "Los Angeles, CA",
  },
  {
    name: "Marcus K.",
    role: "Digital Agency Owner",
    avatar: "MK",
    rating: 5,
    text: "We manage 8 AI influencer accounts for clients. The batch generation and auto-publish features save us 40+ hours per week. ROI is insane.",
    earnings: "40h/week saved",
    location: "Miami, FL",
  },
  {
    name: "Aria Chen",
    role: "Content Creator",
    avatar: "AC",
    rating: 5,
    text: "The quality is unbelievable. My fans can't tell the difference between my AI content and real photos. Best investment I've made this year.",
    earnings: "8,200 subscribers",
    location: "New York, NY",
  },
  {
    name: "David R.",
    role: "Fanvue Model",
    avatar: "DR",
    rating: 5,
    text: "Started with 0 experience. Within 6 weeks I had 500 paying subscribers. The platform handles everything — creation, posting, even fan chat.",
    earnings: "$6,800/mo",
    location: "Austin, TX",
  },
];

// Social proof notifications
const SOCIAL_PROOF = [
  { name: "Emma", city: "Berlin", action: "just upgraded to Creator Plan" },
  { name: "Lucas", city: "London", action: "generated 30 images in batch" },
  { name: "Sofia", city: "Miami", action: "earned $450 from AI chat today" },
  { name: "James", city: "Sydney", action: "just started free trial" },
  { name: "Mia", city: "Paris", action: "published to Fanvue automatically" },
  { name: "Noah", city: "Toronto", action: "just upgraded to Pro Plan" },
  { name: "Isabella", city: "Madrid", action: "cloned her first voice" },
  { name: "Ethan", city: "Amsterdam", action: "earned $1,200 this week" },
];

const GUARANTEES = [
  { icon: Shield, title: "Money-Back Guarantee", desc: "Not satisfied? Get a full refund within 14 days, no questions asked." },
  { icon: Zap, title: "5 Free Generations Daily", desc: "Start creating immediately — no credit card required to try." },
  { icon: Award, title: "Commercial License", desc: "All Pro+ plans include full commercial rights to your generated content." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [socialProofIndex, setSocialProofIndex] = useState(0);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [viewerCount] = useState(() => Math.floor(Math.random() * 30) + 47);
  const [spotsLeft] = useState(() => Math.floor(Math.random() * 15) + 8);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const modelScrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning]);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      goToSlide((currentSlide + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [currentSlide, goToSlide]);

  // Sticky CTA on scroll past hero
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = heroRef.current?.offsetHeight ?? 600;
      setShowStickyCTA(window.scrollY > heroHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Social proof notifications
  useEffect(() => {
    const showNext = () => {
      setShowSocialProof(true);
      setTimeout(() => setShowSocialProof(false), 4000);
      setTimeout(() => {
        setSocialProofIndex(i => (i + 1) % SOCIAL_PROOF.length);
      }, 4500);
    };
    const timer = setTimeout(showNext, 3000);
    const interval = setInterval(showNext, 9000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  const slide = HERO_SLIDES[currentSlide];
  const loginUrl = getLoginUrl();
  const proof = SOCIAL_PROOF[socialProofIndex];

  const faqs = [
    { q: "How realistic are the AI influencers?", a: "Our models produce photorealistic images at 8K resolution with pore-level skin detail, natural lighting, and authentic expressions. Most viewers cannot distinguish them from real photos." },
    { q: "Can I use the content commercially?", a: "Yes — all Pro and Creator plan subscribers receive a full commercial license. You can use generated content for marketing, social media, OnlyFans, Fanvue, and any other commercial purpose." },
    { q: "How does the AI chat work?", a: "You define your influencer's personality, tone, and backstory. Our AI then responds to fan messages in that voice 24/7, maintaining consistent character across thousands of conversations." },
    { q: "Is my content private?", a: "Absolutely. Your generated content is stored privately and never shared or used to train other models. You have full ownership of everything you create." },
    { q: "What platforms can I publish to?", a: "We support direct integration with Fanvue. Content can also be downloaded and manually uploaded to OnlyFans, Instagram, TikTok, YouTube, and any other platform." },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Social Proof Notification ── */}
      <div
        className={`fixed bottom-24 left-4 z-50 transition-all duration-500 ${
          showSocialProof ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="gold-glass rounded-xl px-4 py-3 flex items-center gap-3 max-w-xs shadow-2xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black text-xs font-bold shrink-0">
            {proof.name[0]}
          </div>
          <div>
            <p className="text-xs text-white/90 font-medium">
              <span className="gold-text font-bold">{proof.name}</span> from {proof.city}
            </p>
            <p className="text-xs text-white/50">{proof.action}</p>
          </div>
        </div>
      </div>

      {/* ── Sticky CTA Bar ── */}
      <div className={`sticky-cta ${showStickyCTA ? "visible" : ""} hidden md:block`}>
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-white">AI Influencer Generator</span>
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              <span className="text-xs text-white/50 ml-1">4.9/5 (10,000+ reviews)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">
              <span className="scarcity-dot inline-block mr-1.5" />
              {viewerCount} people viewing right now
            </span>
            <Button
              asChild
              size="sm"
              className="btn-gold rounded-full px-6 text-sm"
            >
              {isAuthenticated ? (
                <Link href="/studio">Start Creating Free <ArrowRight className="w-4 h-4 ml-1" /></Link>
              ) : (
                <a href={loginUrl}>Start Creating Free <ArrowRight className="w-4 h-4 ml-1" /></a>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
                AI <span className="gold-gradient-text">Influencer</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/studio" className="text-sm text-white/60 hover:text-white transition-colors tracking-wider">Studio</Link>
              <Link href="/video-templates" className="text-sm text-white/60 hover:text-white transition-colors tracking-wider">Templates</Link>
              <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors tracking-wider">Pricing</Link>
              <Link href="/affiliate" className="text-sm text-white/60 hover:text-white transition-colors tracking-wider">Affiliates</Link>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                className="btn-gold rounded-full px-5 text-sm h-9 hidden md:flex"
              >
                {isAuthenticated ? (
                  <Link href="/studio">ENTER APP</Link>
                ) : (
                  <a href={loginUrl}>START FREE</a>
                )}
              </Button>
              <button className="md:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 border-t border-white/10">
            <div className="px-6 py-4 space-y-4">
              <Link href="/studio" className="block text-white/70 hover:text-white tracking-wider">Studio</Link>
              <Link href="/video-templates" className="block text-white/70 hover:text-white tracking-wider">Templates</Link>
              <Link href="/pricing" className="block text-white/70 hover:text-white tracking-wider">Pricing</Link>
              <Link href="/affiliate" className="block text-white/70 hover:text-white tracking-wider">Affiliates</Link>
              <Link href="/aifluencer-studio" className="block text-white/70 hover:text-white tracking-wider">Course</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        {HERO_SLIDES.map((s, index) => (
          <div key={index} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: index === currentSlide ? 1 : 0 }}>
            <img src={s.image} alt="" className="w-full h-full object-cover object-top" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-[1400px] mx-auto px-6 w-full">
            <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
              <div className="max-w-2xl pt-16">
                {/* Scarcity badge */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="trust-badge">
                    <span className="scarcity-dot" />
                    Only {spotsLeft} Creator spots left this week
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold tracking-widest uppercase">
                    {slide.badge}
                  </span>
                  <span className="text-white/50 text-xs tracking-[0.3em] uppercase">{slide.subtitle}</span>
                </div>

                <h1
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold leading-[0.85] mb-4 uppercase tracking-tight"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {slide.headline.split('\n').map((line, i) => (
                    <span key={i} className={`block ${i === 1 ? "gold-shimmer-text" : ""}`}>{line}</span>
                  ))}
                </h1>

                {/* Star rating */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <span className="text-sm text-white/60">4.9/5 from <span className="text-white/80">10,000+</span> creators</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                  {currentSlide === 0 ? (
                    <ABTestCTA size="lg" />
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="btn-gold text-black font-bold text-base h-14 px-8 rounded-full"
                    >
                      {isAuthenticated ? (
                        <Link href="/studio">{slide.cta} <ArrowRight className="w-5 h-5 ml-2" /></Link>
                      ) : (
                        <a href={loginUrl}>{slide.cta} <ArrowRight className="w-5 h-5 ml-2" /></a>
                      )}
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-white/20 text-white hover:bg-white/10 h-14 px-8 rounded-full bg-white/5"
                  >
                    <Link href="/pricing">{slide.ctaSecondary}</Link>
                  </Button>
                </div>

                <p className="text-sm text-white/40 mb-2">{slide.description}</p>
                <p className="text-xs text-white/30">✓ No credit card required &nbsp;·&nbsp; ✓ 5 free generations daily &nbsp;·&nbsp; ✓ Cancel anytime</p>
              </div>

              <div className="hidden lg:flex flex-col gap-4 pr-8">
                <span className="text-xs text-white/40 tracking-[0.3em] uppercase mb-2">Core Technologies</span>
                {CORE_TECH.map((tech, i) => (
                  <button key={i} className="flex items-center gap-3 text-left group">
                    <tech.icon className="w-4 h-4 text-amber-500/50 group-hover:text-amber-400 transition-colors" />
                    <span className="text-sm text-white/40 group-hover:text-white transition-colors tracking-wider">{tech.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-24 right-12 flex gap-2 z-10">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentSlide ? "w-10" : "bg-white/20 w-6 hover:bg-white/40"
              }`}
              style={index === currentSlide ? { background: "var(--gold)" } : {}}
            />
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
          <span className="text-[10px] text-white/30 tracking-[0.4em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── Trust Bar (immediately below hero) ── */}
      <section className="py-12 bg-black border-y border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center group">
                <div
                  className="text-4xl md:text-5xl font-bold mb-2 gold-gradient-text"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-white/40 tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission Statement (alternating light section) ── */}
      <section className="py-24 bg-zinc-950 border-y border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-3xl md:text-4xl lg:text-5xl font-light italic leading-tight text-white/80"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                "The future of content creation is AI — and we're giving you the keys to that future."
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="section-divider flex-1" />
                <span className="text-xs text-white/30 tracking-widest uppercase">Est. 2024</span>
              </div>
            </div>
            <div>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Our platform combines cutting-edge AI models with professional photography principles
                to create virtual influencers that are indistinguishable from real humans. From skin
                texture to natural lighting, every detail is crafted for production-ready quality.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Image Quality", value: "8K" },
                  { label: "Languages", value: "29" },
                  { label: "Uptime", value: "99.9%" },
                ].map((m, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-2xl font-bold gold-text" style={{ fontFamily: "'Oswald', sans-serif" }}>{m.value}</div>
                    <div className="text-xs text-white/40 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="btn-gold rounded-full h-14 px-8 font-bold">
                {isAuthenticated ? (
                  <Link href="/studio">START CREATING NOW <ArrowRight className="w-5 h-5 ml-2" /></Link>
                ) : (
                  <a href={loginUrl}>START CREATING NOW <ArrowRight className="w-5 h-5 ml-2" /></a>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 bg-black">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs tracking-[0.3em] uppercase font-medium gold-text">Platform</span>
            <h2
              className="text-5xl md:text-6xl font-bold mt-2 mb-4 uppercase tracking-tight"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Everything You <span className="gold-gradient-text">Need</span>
            </h2>
            <p className="text-lg text-white/40">
              Our platform comes packed with powerful features to help you create,
              monetize, and scale your AI influencer business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <div key={i} className="premium-card p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--gold-muted)" }}>
                  <feature.icon className="w-6 h-6 gold-text" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/40">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Showcase Gallery ── */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs tracking-[0.3em] uppercase font-medium gold-text">Gallery</span>
            <h2
              className="text-5xl md:text-6xl font-bold mt-2 mb-4 uppercase tracking-tight"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Real <span className="gold-gradient-text">AI Results</span>
            </h2>
            <p className="text-lg text-white/40">
              Every image below was generated by our platform in under 30 seconds.
              Zero photographers. Zero studios. 100% AI.
            </p>
          </div>

          {/* 3x3 masonry-style grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {SHOWCASE_IMAGES.map((img, i) => (
              <div
                key={i}
                className="relative group overflow-hidden rounded-2xl aspect-[2/3] cursor-pointer"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Gold overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="text-xs tracking-widest uppercase gold-text font-medium">{img.label}</div>
                  <div className="text-white/60 text-xs mt-1">AI Generated · 30 seconds</div>
                </div>
                {/* Corner badge */}
                {i === 0 && (
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold text-black" style={{ background: "var(--gold)" }}>FEATURED</div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/30 text-sm mb-6">Join 50,000+ creators already building with AI</p>
            <Button asChild size="lg" className="btn-gold rounded-full h-14 px-10 font-bold text-base">
              {isAuthenticated ? (
                <Link href="/studio">Generate Your AI Influencer <ArrowRight className="w-5 h-5 ml-2" /></Link>
              ) : (
                <a href={loginUrl}>Generate Your AI Influencer <ArrowRight className="w-5 h-5 ml-2" /></a>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-black">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs gold-text tracking-[0.3em] uppercase font-medium">Workflow</span>
            <h2
              className="text-5xl md:text-6xl font-bold mt-2 mb-4 uppercase tracking-tight"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              3 Simple <span className="gold-gradient-text">Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Design Character", description: "Choose gender, ethnicity, body type, hair, clothing, and more with our visual builder." },
              { step: "02", title: "Generate with AI", description: "Our advanced AI creates photorealistic images in seconds based on your specifications." },
              { step: "03", title: "Monetize & Scale", description: "Use built-in tools to publish, engage fans, and earn revenue from your AI influencer." },
            ].map((item, i) => (
              <div key={i} className="text-center relative group">
                <div
                  className="text-7xl font-bold mb-4 gold-gradient-text opacity-20"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3 -mt-8 group-hover:gold-text transition-colors">{item.title}</h3>
                <p className="text-white/40">{item.description}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ChevronRight className="w-6 h-6 text-white/10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-black">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs gold-text tracking-[0.3em] uppercase font-medium">Social Proof</span>
            <h2
              className="text-5xl md:text-6xl font-bold mt-2 mb-4 uppercase tracking-tight"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Real <span className="gold-gradient-text">Results</span>
            </h2>
            <p className="text-lg text-white/40">
              Join thousands of creators who are already earning with AI Influencer Generator.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="premium-card p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-black font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role} · {t.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold gold-text">{t.earnings}</div>
                    <div className="flex mt-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed italic">"{t.text}"</p>
              </div>
            ))}
          </div>

          {/* Trust indicators row */}
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            <div className="trust-badge"><Check className="w-3.5 h-3.5" /> Verified Reviews</div>
            <div className="trust-badge"><Shield className="w-3.5 h-3.5" /> 14-Day Money Back</div>
            <div className="trust-badge"><Crown className="w-3.5 h-3.5" /> Commercial License</div>
            <div className="trust-badge"><Zap className="w-3.5 h-3.5" /> No Credit Card Required</div>
          </div>
        </div>
      </section>

      {/* ── Guarantees Section ── */}
      <section className="py-20 bg-zinc-950 border-y border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {GUARANTEES.map((g, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-2xl gold-glass">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gold-muted)" }}>
                  <g.icon className="w-6 h-6 gold-text" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{g.title}</h3>
                  <p className="text-sm text-white/50">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Compatibility ── */}
      <section className="py-16 bg-black border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-10">
            <h3
              className="text-2xl font-bold uppercase tracking-wider"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Perfect for Every Platform
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Instagram, label: "Instagram" },
              { icon: Twitter, label: "Twitter/X" },
              { icon: Youtube, label: "YouTube" },
              { icon: Camera, label: "OnlyFans" },
              { icon: Sparkles, label: "Fanvue" },
            ].map((uc, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/30 transition-colors">
                <uc.icon className="w-5 h-5 gold-text" />
                <span className="text-white/60 text-sm">{uc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs gold-text tracking-[0.3em] uppercase font-medium">FAQ</span>
            <h2
              className="text-5xl md:text-6xl font-bold mt-2 uppercase tracking-tight"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Common <span className="gold-gradient-text">Questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  openFaq === i
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-white pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180 gold-text" : "text-white/40"
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA Section ── */}
      <section className="py-32 bg-black relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, oklch(0.78 0.14 85 / 0.06) 0%, transparent 70%)" }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="trust-badge mx-auto mb-6 inline-flex">
              <Eye className="w-3.5 h-3.5" />
              {viewerCount} people viewing this page right now
            </div>
            <h2
              className="text-5xl md:text-7xl font-bold mb-4 uppercase tracking-tight"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Ready to <span className="gold-shimmer-text">Create</span>?
            </h2>
            <p
              className="text-xl md:text-2xl text-white/60 mb-3 italic"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              "The best time to start was yesterday. The second best time is now."
            </p>
            <p className="text-base text-white/40 mb-10">
              Join 50,000+ creators who are already building their AI influencer empire.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button
                asChild
                size="lg"
                className="btn-gold text-black font-bold text-lg h-16 px-12 rounded-full"
              >
                {isAuthenticated ? (
                  <Link href="/studio">GET STARTED FREE <ArrowRight className="w-6 h-6 ml-2" /></Link>
                ) : (
                  <a href={loginUrl}>GET STARTED FREE <ArrowRight className="w-6 h-6 ml-2" /></a>
                )}
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 h-16 px-10 rounded-full bg-white/5">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/30">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> 5 free generations daily</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> 14-day money-back guarantee</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 pb-24 md:pb-12 bg-black border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  AI <span className="gold-gradient-text">Influencer</span>
                </span>
              </Link>
              <p className="text-white/40 text-sm max-w-md leading-relaxed">
                The #1 AI Influencer Marketing Platform. Generate ultra-realistic virtual influencers
                for TikTok, Instagram & YouTube. Create your AI influencer in minutes.
              </p>
              <div className="flex gap-3 mt-4">
                {[Twitter, Instagram, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-full gold-glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/60">Product</h4>
              <div className="space-y-2 text-sm text-white/40">
                <Link href="/studio" className="block hover:text-white transition-colors">Studio</Link>
                <Link href="/pricing" className="block hover:text-white transition-colors">Pricing</Link>
                <Link href="/video-templates" className="block hover:text-white transition-colors">Templates</Link>
                <Link href="/affiliate" className="block hover:text-white transition-colors">Affiliates</Link>
                <Link href="/aifluencer-studio" className="block hover:text-white transition-colors">Course</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/60">Resources</h4>
              <div className="space-y-2 text-sm text-white/40">
                <Link href="/blog" className="block hover:text-white transition-colors">Blog</Link>
                <Link href="/models" className="block hover:text-white transition-colors">My Models</Link>
                <Link href="/companions" className="block hover:text-white transition-colors">AI Companions</Link>
                <Link href="/creator" className="block hover:text-white transition-colors">Creator Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/30">© 2026 AI Influencer Generator. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="scarcity-dot" />
                <span className="text-xs text-white/30">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
