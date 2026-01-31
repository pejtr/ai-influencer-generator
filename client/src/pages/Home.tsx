import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  Sparkles, ArrowRight, Check, Star, Users, 
  Zap, Shield, Globe, Play, ChevronRight, Menu, X,
  Instagram, Twitter, Youtube, DollarSign, TrendingUp,
  Camera, Wand2, Video, MessageCircle, Image as ImageIcon
} from "lucide-react";

// Hero background images for rotation
const HERO_IMAGES = [
  "/hero/hero-bg-1.jpg",
  "/hero/hero-bg-2.jpg",
  "/hero/hero-bg-3.png",
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

const USE_CASES = [
  { icon: Instagram, label: "Instagram" },
  { icon: Twitter, label: "Twitter/X" },
  { icon: Youtube, label: "YouTube" },
  { icon: Camera, label: "OnlyFans" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Rotate hero background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal Top Navigation - APOB.ai Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg hidden sm:block">AI Influencer</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/affiliates" className="text-sm text-white/70 hover:text-white transition-colors">
                AFFILIATES
              </Link>
              <Link href="/pricing" className="text-sm text-white/70 hover:text-white transition-colors">
                PRICING
              </Link>
              <Link href="/blog" className="text-sm text-white/70 hover:text-white transition-colors">
                BLOG
              </Link>
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-4">
              <Button 
                asChild 
                className="bg-lime-400 hover:bg-lime-500 text-black font-semibold px-6"
              >
                {isAuthenticated ? (
                  <Link href="/studio">LAUNCH APP</Link>
                ) : (
                  <a href={getLoginUrl()}>LAUNCH APP</a>
                )}
              </Button>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2"
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
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link href="/affiliates" className="block text-white/70 hover:text-white">
                AFFILIATES
              </Link>
              <Link href="/pricing" className="block text-white/70 hover:text-white">
                PRICING
              </Link>
              <Link href="/blog" className="block text-white/70 hover:text-white">
                BLOG
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - APOB.ai Fullscreen Style */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image with Rotation */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((img, index) => (
            <div
              key={img}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>

        {/* Content - Left Aligned */}
        <div className="container mx-auto px-4 relative z-10 pt-20">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-400/20 text-lime-400 text-sm font-medium mb-6 border border-lime-400/30">
              <Sparkles className="w-4 h-4" />
              #1 AI Influencer Marketing Platform
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.9]">
              Create your{" "}
              <span className="text-lime-400">AI Influencer</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-xl">
              Generate ultra-realistic virtual influencers for TikTok, Instagram & YouTube. 
              Monetize your AI creations with built-in tools.
            </p>

            {/* Key Benefits */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-white/80">
                <Check className="w-5 h-5 text-lime-400" />
                <span>Scale Impact</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Check className="w-5 h-5 text-lime-400" />
                <span>Monetize Influence</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Check className="w-5 h-5 text-lime-400" />
                <span>No Design Skills</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                asChild 
                size="lg" 
                className="bg-lime-400 hover:bg-lime-500 text-black font-bold text-lg h-14 px-8 rounded-xl"
              >
                {isAuthenticated ? (
                  <Link href="/studio">
                    CREATE FOR FREE
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    CREATE FOR FREE
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                )}
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-white hover:bg-white/10 h-14 px-8 rounded-xl"
              >
                <Link href="/pricing">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* No Credit Card Notice */}
            <p className="text-sm text-white/50">
              No credit card required • 5 free generations daily
            </p>
          </div>
        </div>

        {/* Image Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex 
                  ? "bg-lime-400 w-8" 
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-black to-zinc-950 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-lime-400 mb-2">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Two Column Layout */}
      <section className="py-24 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Image Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900">
                  <img 
                    src="/hero/hero-bg-1.jpg" 
                    alt="AI Influencer" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900">
                  <img 
                    src="/hero/hero-bg-3.png" 
                    alt="AI Influencer" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900">
                  <img 
                    src="/hero/hero-bg-2.jpg" 
                    alt="AI Influencer" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center">
                  <div className="text-center p-6">
                    <Sparkles className="w-12 h-12 text-lime-400 mx-auto mb-4" />
                    <p className="text-white/60">Your AI Influencer Here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Text Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Studio-Quality{" "}
                <span className="text-lime-400">AI Influencer Generator</span>
              </h2>
              <p className="text-lg text-white/70 mb-8">
                Create photorealistic virtual influencers with our advanced AI technology. 
                Customize every detail from facial features to clothing, poses, and backgrounds. 
                Perfect for social media marketing, brand campaigns, and content creation.
              </p>

              {/* Feature List */}
              <div className="space-y-4 mb-8">
                {[
                  "Ultra-realistic image generation",
                  "Full body & portrait options",
                  "Video & motion capabilities",
                  "AI chat companion for engagement",
                  "Monetization tools included",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-lime-400/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-lime-400" />
                    </div>
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                asChild 
                size="lg" 
                className="bg-lime-400 hover:bg-lime-500 text-black font-bold rounded-xl"
              >
                {isAuthenticated ? (
                  <Link href="/studio">
                    CREATE NOW
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    CREATE NOW
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 bg-black border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-2">Perfect for Every Platform</h3>
            <p className="text-white/60">Create content optimized for any social network</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {USE_CASES.map((useCase, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                <useCase.icon className="w-5 h-5 text-lime-400" />
                <span className="text-white/80">{useCase.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-lime-400">Succeed</span>
            </h2>
            <p className="text-lg text-white/60">
              Our platform comes packed with powerful features to help you create, 
              monetize, and scale your AI influencer business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-lime-400/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-lime-400/10 flex items-center justify-center mb-4 group-hover:bg-lime-400/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-lime-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Create Your AI Influencer in{" "}
              <span className="text-lime-400">3 Steps</span>
            </h2>
            <p className="text-lg text-white/60">
              No design skills required. Our intuitive builder makes it easy for anyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                step: "1", 
                title: "Design Your Character", 
                description: "Choose gender, ethnicity, body type, hair, clothing, and more with our visual builder." 
              },
              { 
                step: "2", 
                title: "Generate with AI", 
                description: "Our advanced AI creates photorealistic images in seconds based on your specifications." 
              },
              { 
                step: "3", 
                title: "Monetize & Scale", 
                description: "Use built-in tools to publish, engage fans, and earn revenue from your AI influencer." 
              },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="w-20 h-20 rounded-full bg-lime-400 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-black">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%]">
                    <ChevronRight className="w-8 h-8 text-lime-400/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              asChild 
              size="lg" 
              className="bg-lime-400 hover:bg-lime-500 text-black font-bold rounded-xl h-14 px-8"
            >
              {isAuthenticated ? (
                <Link href="/studio">
                  Start Creating Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  Start Creating Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Create Your{" "}
              <span className="text-lime-400">AI Influencer</span>?
            </h2>
            <p className="text-xl text-white/60 mb-8">
              Join 50,000+ creators who are already building their AI influencer empire.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-lime-400 hover:bg-lime-500 text-black font-bold text-lg h-16 px-12 rounded-xl"
            >
              {isAuthenticated ? (
                <Link href="/studio">
                  CREATE FOR FREE
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  CREATE FOR FREE
                  <ArrowRight className="w-6 h-6 ml-2" />
                </a>
              )}
            </Button>
            <p className="text-sm text-white/40 mt-4">
              No credit card required • 5 free generations daily
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="font-bold text-lg">AI Influencer Generator</span>
              </Link>
              <p className="text-white/60 text-sm max-w-md">
                The #1 AI Influencer Marketing Platform. Generate ultra-realistic virtual influencers 
                for TikTok, Instagram & YouTube. Create your AI influencer in minutes.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm text-white/60">
                <Link href="/studio" className="block hover:text-white">Studio</Link>
                <Link href="/pricing" className="block hover:text-white">Pricing</Link>
                <Link href="/gallery" className="block hover:text-white">Gallery</Link>
                <Link href="/affiliates" className="block hover:text-white">Affiliates</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2 text-sm text-white/60">
                <Link href="/blog" className="block hover:text-white">Blog</Link>
                <Link href="/help" className="block hover:text-white">Help Center</Link>
                <Link href="/privacy" className="block hover:text-white">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-white">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/40">
              © 2026 AI Influencer Generator. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/40 hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-white">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/40 hover:text-white">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
