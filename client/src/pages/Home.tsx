import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  ArrowRight, Menu, X, ChevronRight,
  Instagram, Twitter, Youtube, Sparkles,
  Wand2, Video, MessageCircle, DollarSign, TrendingUp, Users,
  Camera, Mic, Clapperboard, Layers
} from "lucide-react";
import ABTestCTA from "../components/ABTestCTA";

// CDN hero images
const HERO_SLIDES = [
  {
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/89740521/EAXRJJptubVhhFTM.jpg",
    badge: "WORLD FIRST",
    subtitle: "THE FIRST AI INFLUENCER PLATFORM",
    headline: "CREATE\nYOUR AI",
    description: "Generate ultra-realistic virtual influencers with pore-level detail and natural expressions using our foundational AI model.",
    cta: "CREATE NOW",
    ctaSecondary: "LEARN MORE",
  },
  {
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/89740521/uaJkZUWiCwDAfFOz.jpg",
    badge: "AI VOICES",
    subtitle: "ADVANCED VOICE CLONING",
    headline: "CLONE\nANY VOICE",
    description: "Create hyper-realistic voice clones with natural intonation and emotion. Perfect for content creation and fan engagement.",
    cta: "CLONE VOICE",
    ctaSecondary: "LEARN MORE",
  },
  {
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/89740521/RZloVHYfFNVFTCBI.png",
    badge: "DIGITAL HUMANS",
    subtitle: "ADVANCED AVATAR GENERATION",
    headline: "BUILD\nINFLUENCERS",
    description: "Create hyper-realistic digital subjects with pore-level detail and natural human movement using our foundational model.",
    cta: "BUILD NOW",
    ctaSecondary: "LEARN MORE",
  },
];

const CORE_TECH = [
  { label: "FACE GENERATION", icon: Wand2 },
  { label: "VOICE CLONING", icon: Mic },
  { label: "VIDEO MOTION", icon: Clapperboard },
  { label: "MULTI-MODEL", icon: Layers },
];

const AI_MODELS = [
  {
    badge: "IMAGE",
    badgeColor: "bg-blue-600",
    title: "Face Generator Pro",
    description: "Ultra-realistic AI face generation with 8K resolution and natural skin textures.",
    tag: "NEW",
  },
  {
    badge: "VIDEO",
    badgeColor: "bg-purple-600",
    title: "Motion Transfer",
    description: "Transfer motion from any video to your AI character with lip sync support.",
    tag: "HOT",
  },
  {
    badge: "VOICE",
    badgeColor: "bg-green-600",
    title: "Voice Clone AI",
    description: "Clone any voice from a 30-second sample. 29 languages supported.",
    tag: "NEW",
  },
  {
    badge: "CREATIVE",
    badgeColor: "bg-orange-600",
    title: "Scene Composer",
    description: "Generate cinematic scenes with professional lighting and camera presets.",
    tag: "",
  },
  {
    badge: "UNCENSORED",
    badgeColor: "bg-red-600",
    title: "Artistic Freedom",
    description: "Full creative control with no content restrictions for mature platforms.",
    tag: "PRO",
  },
];

const FEATURES = [
  {
    icon: Wand2,
    title: "AI-Powered Generation",
    description: "Create photorealistic AI influencers in seconds with our advanced image generation technology."
  },
  {
    icon: Users,
    title: "Endless Customization",
    description: "Choose from dozens of character types, ethnicities, features, and styles to create your perfect influencer."
  },
  {
    icon: Video,
    title: "Video & Motion",
    description: "Bring your AI influencers to life with talking avatars, lip sync, and motion transfer technology."
  },
  {
    icon: MessageCircle,
    title: "AI Chat Companion",
    description: "Engage fans with AI-powered chat that responds in your influencer's unique personality."
  },
  {
    icon: DollarSign,
    title: "Monetization Ready",
    description: "Built-in tools for Fanvue integration, exclusive content sales, and subscription management."
  },
  {
    icon: TrendingUp,
    title: "Analytics Dashboard",
    description: "Track engagement, revenue, and growth with comprehensive analytics and insights."
  },
];

const STATS = [
  { value: "600K+", label: "AI Influencers Created" },
  { value: "50K+", label: "Active Creators" },
  { value: "4.9/5", label: "User Rating" },
  { value: "$2M+", label: "Creator Earnings" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeModelCard, setActiveModelCard] = useState(0);
  const modelScrollRef = useRef<HTMLDivElement>(null);

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

  const slide = HERO_SLIDES[currentSlide];
  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Navigation - Enhancor.ai Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
                AI Influencer
              </span>
            </Link>

            {/* Desktop Navigation - Feature Categories */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/studio" className="text-sm text-white/60 hover:text-white transition-colors tracking-wider">
                Face Gen
              </Link>
              <Link href="/studio" className="text-sm text-white/60 hover:text-white transition-colors tracking-wider">
                Upscaler
              </Link>
              <Link href="/studio" className="text-sm text-white/60 hover:text-white transition-colors tracking-wider">
                Voice Clone
              </Link>
              <Link href="/studio" className="text-sm text-white/60 hover:text-white transition-colors tracking-wider">
                Motion
              </Link>
            </div>

            {/* CTA Button - White pill like Enhancor */}
            <div className="flex items-center gap-4">
              <Button 
                asChild 
                className="bg-white hover:bg-white/90 text-black font-semibold px-6 rounded-full"
              >
                {isAuthenticated ? (
                  <Link href="/studio">ENTER APP</Link>
                ) : (
                  <a href={loginUrl}>ENTER APP</a>
                )}
              </Button>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2 text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 border-t border-white/10">
            <div className="px-6 py-4 space-y-4">
              <Link href="/studio" className="block text-white/70 hover:text-white tracking-wider">Face Gen</Link>
              <Link href="/studio" className="block text-white/70 hover:text-white tracking-wider">Upscaler</Link>
              <Link href="/studio" className="block text-white/70 hover:text-white tracking-wider">Voice Clone</Link>
              <Link href="/studio" className="block text-white/70 hover:text-white tracking-wider">Motion</Link>
              <Link href="/pricing" className="block text-white/70 hover:text-white tracking-wider">Pricing</Link>
              <Link href="/blog" className="block text-white/70 hover:text-white tracking-wider">Blog</Link>
              <Link href="/affiliate" className="block text-white/70 hover:text-white tracking-wider">Affiliates</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Enhancor.ai Fullscreen Carousel */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Images */}
        {HERO_SLIDES.map((s, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: index === currentSlide ? 1 : 0 }}
          >
            <img
              src={s.image}
              alt=""
              className="w-full h-full object-cover object-top"
            />
          </div>
        ))}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-[1400px] mx-auto px-6 w-full">
            <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
              {/* Left Content */}
              <div className="max-w-2xl pt-16">
                {/* Badge */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold tracking-widest uppercase">
                    {slide.badge}
                  </span>
                  <span className="text-white/50 text-xs tracking-[0.3em] uppercase">
                    {slide.subtitle}
                  </span>
                </div>

                {/* Giant Headline */}
                <h1 
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold leading-[0.85] mb-8 uppercase tracking-tight"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {slide.headline.split('\n').map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </h1>

                {/* CTA Buttons - A/B Test on first slide */}
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                  {currentSlide === 0 ? (
                    <ABTestCTA size="lg" />
                  ) : (
                    <Button 
                      asChild 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-base h-14 px-8 rounded-full"
                    >
                      {isAuthenticated ? (
                        <Link href="/studio">
                          {slide.cta}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                      ) : (
                        <a href={loginUrl}>
                          {slide.cta}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </a>
                      )}
                    </Button>
                  )}
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg" 
                    className="border-white/20 text-white hover:bg-white/10 h-14 px-8 rounded-full bg-white/5"
                  >
                    <Link href="/pricing">
                      {slide.ctaSecondary}
                    </Link>
                  </Button>
                </div>

                {/* Description */}
                <p className="text-base text-white/60 max-w-lg leading-relaxed">
                  {slide.description}
                </p>
              </div>

              {/* Right Side - Core Technologies */}
              <div className="hidden lg:flex flex-col gap-4 pr-8">
                <span className="text-xs text-white/40 tracking-[0.3em] uppercase mb-2">
                  Core Technologies
                </span>
                {CORE_TECH.map((tech, i) => (
                  <button
                    key={i}
                    className="flex items-center gap-3 text-left group"
                  >
                    <tech.icon className="w-4 h-4 text-white/30 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm text-white/40 group-hover:text-white transition-colors tracking-wider">
                      {tech.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators - Bottom Right */}
        <div className="absolute bottom-24 right-12 flex gap-2 z-10">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentSlide 
                  ? "bg-blue-500 w-10" 
                  : "bg-white/20 w-6 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
          <span className="text-[10px] text-white/30 tracking-[0.4em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black border-y border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-500 mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  {stat.value}
                </div>
                <div className="text-sm text-white/40 tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's New - AI Models Section */}
      <section className="py-24 bg-zinc-950 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 overflow-hidden">
          <div className="mb-12">
            <span className="text-xs text-blue-500 tracking-[0.3em] uppercase font-medium">AI Models</span>
            <h2 className="text-5xl md:text-6xl font-bold mt-2 uppercase tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
              What's <span className="text-blue-500">New</span>
            </h2>
          </div>

          {/* Horizontal Scrollable Cards */}
          <div
            ref={modelScrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const cardWidth = 300;
              const idx = Math.round(el.scrollLeft / cardWidth);
              setActiveModelCard(Math.min(idx, AI_MODELS.length - 1));
            }}
          >
            {AI_MODELS.map((model, i) => (
              <div 
                key={i} 
                className="min-w-[280px] md:min-w-[320px] bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col snap-start hover:border-blue-500/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full text-white ${model.badgeColor}`}>
                    {model.badge}
                  </span>
                  {model.tag && (
                    <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-white/60">
                      {model.tag}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{model.title}</h3>
                <p className="text-sm text-white/40 mb-6 flex-1">{model.description}</p>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-white/10 text-white hover:bg-blue-600 hover:border-blue-600 hover:text-white rounded-full w-full"
                >
                  {isAuthenticated ? (
                    <Link href="/studio">
                      TRY IT
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  ) : (
                    <a href={loginUrl}>
                      TRY IT
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Scroll indicator dots - mobile only */}
          <div className="flex md:hidden justify-center gap-2 mt-4">
            {AI_MODELS.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeModelCard === i
                    ? 'bg-blue-500 w-5'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
                onClick={() => {
                  const el = modelScrollRef.current;
                  if (el) {
                    const cardWidth = 300;
                    el.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
                  }
                }}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement Section - Enhancor Style */}
      <section className="py-24 bg-black border-y border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Large Italic Statement */}
            <div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-light italic leading-tight text-white/80">
                "Eliminating the artificial look of AI-generated imagery through advanced character reconstruction."
              </p>
            </div>

            {/* Right - Description + CTA */}
            <div>
              <p className="text-lg text-white/50 mb-8 leading-relaxed">
                Our platform combines cutting-edge AI models with professional photography principles 
                to create virtual influencers that are indistinguishable from real humans. From skin 
                texture to natural lighting, every detail is crafted for production-ready quality.
              </p>
              <Button 
                asChild 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full h-14 px-8"
              >
                {isAuthenticated ? (
                  <Link href="/studio">
                    START CREATING NOW
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                ) : (
                  <a href={loginUrl}>
                    START CREATING NOW
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs text-blue-500 tracking-[0.3em] uppercase font-medium">Platform</span>
            <h2 className="text-5xl md:text-6xl font-bold mt-2 mb-4 uppercase tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Everything You <span className="text-blue-500">Need</span>
            </h2>
            <p className="text-lg text-white/40">
              Our platform comes packed with powerful features to help you create, 
              monetize, and scale your AI influencer business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/40">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-black">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs text-blue-500 tracking-[0.3em] uppercase font-medium">Workflow</span>
            <h2 className="text-5xl md:text-6xl font-bold mt-2 mb-4 uppercase tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
              3 Simple <span className="text-blue-500">Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                step: "01", 
                title: "Design Character", 
                description: "Choose gender, ethnicity, body type, hair, clothing, and more with our visual builder." 
              },
              { 
                step: "02", 
                title: "Generate with AI", 
                description: "Our advanced AI creates photorealistic images in seconds based on your specifications." 
              },
              { 
                step: "03", 
                title: "Monetize & Scale", 
                description: "Use built-in tools to publish, engage fans, and earn revenue from your AI influencer." 
              },
            ].map((item, i) => (
              <div key={i} className="text-center relative group">
                <div className="text-7xl font-bold text-white/[0.05] mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3 -mt-8 group-hover:text-blue-400 transition-colors">{item.title}</h3>
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

      {/* Use Cases */}
      <section className="py-16 bg-zinc-950 border-y border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
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
              <div key={i} className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/30 transition-colors">
                <uc.icon className="w-5 h-5 text-blue-500" />
                <span className="text-white/60 text-sm">{uc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent" />
        
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 uppercase tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Ready to <span className="text-blue-500">Create</span>?
            </h2>
            <p className="text-xl text-white/40 mb-10">
              Join 50,000+ creators who are already building their AI influencer empire.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg h-16 px-12 rounded-full"
            >
              {isAuthenticated ? (
                <Link href="/studio">
                  GET STARTED FREE
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Link>
              ) : (
                <a href={loginUrl}>
                  GET STARTED FREE
                  <ArrowRight className="w-6 h-6 ml-2" />
                </a>
              )}
            </Button>
            <p className="text-sm text-white/30 mt-4">
              No credit card required · 5 free generations daily
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 pb-24 md:pb-12 bg-black border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  AI Influencer
                </span>
              </Link>
              <p className="text-white/40 text-sm max-w-md leading-relaxed">
                The #1 AI Influencer Marketing Platform. Generate ultra-realistic virtual influencers 
                for TikTok, Instagram & YouTube. Create your AI influencer in minutes.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/60">Product</h4>
              <div className="space-y-2 text-sm text-white/40">
                <Link href="/studio" className="block hover:text-white transition-colors">Studio</Link>
                <Link href="/pricing" className="block hover:text-white transition-colors">Pricing</Link>
                <Link href="/gallery" className="block hover:text-white transition-colors">Gallery</Link>
                <Link href="/affiliate" className="block hover:text-white transition-colors">Affiliates</Link>
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
            <p className="text-sm text-white/30">
              © 2026 AI Influencer Generator. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/30 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/30 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/30 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
