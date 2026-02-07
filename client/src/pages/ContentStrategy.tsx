import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DollarSign, TrendingUp, Users, Zap, Target, ArrowRight,
  ChevronDown, ChevronUp, Star, Clock, BarChart3, Lightbulb,
  Instagram, Youtube, Twitter, Pin, Sparkles, BookOpen
} from "lucide-react";

// Earn Program Tiers
const EARN_TIERS = [
  {
    name: "Starter",
    icon: "🌱",
    minViews: "0",
    rate: "$0.001/view",
    color: "from-gray-600 to-gray-700",
    borderColor: "border-gray-500",
    benefits: ["Basic analytics", "Monthly payouts", "Community access"],
  },
  {
    name: "Rising Star",
    icon: "⭐",
    minViews: "10K",
    rate: "$0.002/view",
    color: "from-blue-600 to-blue-700",
    borderColor: "border-blue-500",
    benefits: ["Enhanced analytics", "Bi-weekly payouts", "Priority support", "Featured placement"],
  },
  {
    name: "Established",
    icon: "💎",
    minViews: "100K",
    rate: "$0.003/view",
    color: "from-purple-600 to-purple-700",
    borderColor: "border-purple-500",
    benefits: ["Advanced analytics", "Weekly payouts", "Brand deal matching", "Custom branding"],
  },
  {
    name: "Elite Creator",
    icon: "👑",
    minViews: "1M",
    rate: "$0.005/view",
    color: "from-amber-600 to-amber-700",
    borderColor: "border-amber-500",
    benefits: ["Real-time analytics", "Daily payouts", "Exclusive brand deals", "Dedicated manager"],
  },
  {
    name: "Legend",
    icon: "🔥",
    minViews: "10M",
    rate: "$0.008/view",
    color: "from-red-600 to-red-700",
    borderColor: "border-red-500",
    benefits: ["All Elite benefits", "Revenue share boost", "Platform spotlight", "Custom features"],
  },
];

// Monetization strategies
const STRATEGIES = [
  {
    id: "earn-program",
    title: "Earn Program",
    description: "Get paid directly for your content views. The more your AI influencer's content is seen, the more you earn.",
    icon: DollarSign,
    difficulty: "Easy",
    difficultyColor: "text-green-400",
    revenue: "$100 - $10,000+/month",
    steps: [
      "Create your AI influencer character",
      "Generate consistent, high-quality content",
      "Post daily on social media platforms",
      "Track views and earnings in your dashboard",
      "Withdraw earnings when you reach minimum payout",
    ],
  },
  {
    id: "brand-collaborations",
    title: "Brand Collaborations",
    description: "Partner with brands as a digital UGC creator. Your AI influencer can promote products without you ever showing your face.",
    icon: Users,
    difficulty: "Medium",
    difficultyColor: "text-yellow-400",
    revenue: "$500 - $50,000+/campaign",
    steps: [
      "Build a portfolio of AI influencer content",
      "Reach 10K+ followers on at least one platform",
      "Create a media kit showcasing your AI influencer",
      "Pitch to brands or join influencer marketplaces",
      "Negotiate rates based on engagement metrics",
    ],
  },
  {
    id: "affiliate-marketing",
    title: "Affiliate Marketing",
    description: "Promote products through your AI influencer and earn commissions on every sale. Build automated DM funnels for passive income.",
    icon: Target,
    difficulty: "Medium",
    difficultyColor: "text-yellow-400",
    revenue: "$200 - $20,000+/month",
    steps: [
      "Choose a niche (beauty, fashion, tech, fitness)",
      "Join affiliate programs (Amazon, ShareASale, etc.)",
      "Create product review content with your AI influencer",
      "Set up automated DM funnels for link sharing",
      "Track conversions and optimize top performers",
    ],
  },
  {
    id: "digital-products",
    title: "Digital Products",
    description: "Sell digital products through your AI influencer's landing page. E-books, courses, presets, and templates.",
    icon: BookOpen,
    difficulty: "Hard",
    difficultyColor: "text-red-400",
    revenue: "$1,000 - $100,000+/month",
    steps: [
      "Identify what your audience wants to learn",
      "Create a digital product (e-book, course, template)",
      "Build a landing page with your AI influencer as the face",
      "Drive traffic through social media content",
      "Automate delivery and upsell sequences",
    ],
  },
  {
    id: "fan-subscriptions",
    title: "Fan Subscriptions",
    description: "Create exclusive content for paying subscribers. Use platforms like Fanvue, Patreon, or your own membership site.",
    icon: Star,
    difficulty: "Medium",
    difficultyColor: "text-yellow-400",
    revenue: "$500 - $50,000+/month",
    steps: [
      "Build a loyal following with free content",
      "Create exclusive behind-the-scenes content",
      "Set up subscription tiers ($5, $15, $50/month)",
      "Engage subscribers with personalized AI chat",
      "Upsell premium content and experiences",
    ],
  },
  {
    id: "content-licensing",
    title: "Content Licensing",
    description: "License your AI influencer's image and content to other creators, agencies, and brands.",
    icon: BarChart3,
    difficulty: "Hard",
    difficultyColor: "text-red-400",
    revenue: "$2,000 - $30,000+/month",
    steps: [
      "Build a recognizable AI influencer brand",
      "Create a diverse content library",
      "Register your AI character as intellectual property",
      "Approach agencies and content platforms",
      "Set licensing terms and pricing",
    ],
  },
];

// Content strategy tips
const STRATEGY_TIPS = [
  {
    category: "Consistency",
    icon: Clock,
    tips: [
      "Post at least once daily on your primary platform",
      "Consistency beats perfection - done is better than perfect",
      "Use batch generation to create a week's content in one session",
      "Schedule posts in advance using the Content Scheduler",
      "Maintain the same character across all content for brand recognition",
    ],
  },
  {
    category: "Platform Strategy",
    icon: TrendingUp,
    tips: [
      "Start with one platform, master it, then expand",
      "Instagram: Focus on Reels and Stories for maximum reach",
      "TikTok: Trend-jack with your AI influencer for viral potential",
      "YouTube: Create longer-form content for ad revenue",
      "Pinterest: Pin AI influencer images for passive traffic",
    ],
  },
  {
    category: "Content Types",
    icon: Lightbulb,
    tips: [
      "Day-in-the-life content performs well across all platforms",
      "Product reviews and unboxings drive affiliate sales",
      "Talking head videos build trust and engagement",
      "Before/after transformations get high engagement",
      "Educational content positions your AI as an authority",
    ],
  },
  {
    category: "Growth Hacks",
    icon: Zap,
    tips: [
      "Collaborate with other AI influencer creators",
      "Cross-promote across multiple platforms",
      "Use trending audio and hashtags on short-form video",
      "Engage with your audience through AI chat companions",
      "Repurpose one piece of content across 5+ platforms",
    ],
  },
  {
    category: "Monetization Timeline",
    icon: BarChart3,
    tips: [
      "Month 1-2: Focus on content creation and consistency",
      "Month 3-4: Start affiliate marketing and earn program",
      "Month 5-6: Approach brands for collaborations",
      "Month 7-9: Launch digital products or fan subscriptions",
      "Month 10-12: Scale with multiple revenue streams",
    ],
  },
];

// Pinterest strategy
const PINTEREST_STEPS = [
  { step: 1, title: "Create a Business Account", description: "Set up a Pinterest Business account with your AI influencer's brand name. Enable Rich Pins for better visibility." },
  { step: 2, title: "Design Pin-Worthy Images", description: "Use 2:3 aspect ratio (1000x1500px). Add text overlays with tips or quotes. Use your AI influencer as the visual anchor." },
  { step: 3, title: "Optimize for SEO", description: "Use keyword-rich titles and descriptions. Research trending keywords in your niche. Add relevant hashtags." },
  { step: 4, title: "Pin Consistently", description: "Pin 15-25 times per day using a scheduler. Mix your own content with repins. Create multiple pins for each piece of content." },
  { step: 5, title: "Drive Traffic", description: "Link pins to your landing page, blog, or affiliate links. Use call-to-action text on pins. Create idea pins for engagement." },
  { step: 6, title: "Monetize", description: "Add affiliate links to pin descriptions. Drive traffic to your digital products. Use Pinterest ads to scale winning pins." },
];

export default function ContentStrategy() {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>("earn-program");
  const [expandedTip, setExpandedTip] = useState<string | null>("Consistency");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-background to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium mb-6">
              <DollarSign className="w-4 h-4" />
              MONETIZATION GUIDE
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6" style={{ fontFamily: "'Oswald', sans-serif" }}>
              TURN YOUR AI INFLUENCER
              <br />
              <span className="text-blue-500">INTO A MONEY MACHINE</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Learn proven strategies to monetize your AI influencer. From the Earn Program to brand deals, 
              discover how creators are making $1,000 - $100,000+ per month with AI-generated content.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/studio">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Sparkles className="w-5 h-5" />
                  CREATE YOUR AI INFLUENCER
                </Button>
              </Link>
              <a href="#earn-program">
                <Button size="lg" variant="outline" className="gap-2">
                  <DollarSign className="w-5 h-5" />
                  EXPLORE EARN PROGRAM
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Earn Program Section */}
      <section id="earn-program" className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                EARN PROGRAM TIERS
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get paid for every view your AI influencer's content receives. 
                The more views you generate, the higher your tier and earnings rate.
              </p>
            </div>

            <div className="grid gap-4">
              {EARN_TIERS.map((tier, i) => (
                <div
                  key={tier.name}
                  className={`relative rounded-xl border ${tier.borderColor} bg-card/50 backdrop-blur-sm p-6 transition-all hover:scale-[1.01]`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-3xl">{tier.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                        <p className="text-sm text-muted-foreground">Min. {tier.minViews} views</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{tier.rate}</p>
                        <p className="text-xs text-muted-foreground">Earnings Rate</p>
                      </div>
                      <div className="hidden md:flex flex-wrap gap-2">
                        {tier.benefits.map((benefit) => (
                          <span key={benefit} className="px-2 py-1 rounded-md bg-secondary text-xs text-secondary-foreground">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Mobile benefits */}
                  <div className="md:hidden flex flex-wrap gap-2 mt-3">
                    {tier.benefits.map((benefit) => (
                      <span key={benefit} className="px-2 py-1 rounded-md bg-secondary text-xs text-secondary-foreground">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Earnings Calculator */}
            <div className="mt-8 p-6 rounded-xl bg-blue-950/30 border border-blue-500/20">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Quick Earnings Estimate
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-card/50">
                  <p className="text-2xl font-bold text-foreground">$30</p>
                  <p className="text-xs text-muted-foreground">10K views/month</p>
                  <p className="text-xs text-blue-400">Starter tier</p>
                </div>
                <div className="p-4 rounded-lg bg-card/50">
                  <p className="text-2xl font-bold text-foreground">$200</p>
                  <p className="text-xs text-muted-foreground">100K views/month</p>
                  <p className="text-xs text-blue-400">Rising Star</p>
                </div>
                <div className="p-4 rounded-lg bg-card/50">
                  <p className="text-2xl font-bold text-foreground">$3,000</p>
                  <p className="text-xs text-muted-foreground">1M views/month</p>
                  <p className="text-xs text-blue-400">Established</p>
                </div>
                <div className="p-4 rounded-lg bg-card/50">
                  <p className="text-2xl font-bold text-foreground">$50,000</p>
                  <p className="text-xs text-muted-foreground">10M views/month</p>
                  <p className="text-xs text-blue-400">Elite Creator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monetization Strategies */}
      <section className="py-16 bg-card/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                6 PROVEN MONETIZATION STRATEGIES
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Diversify your income streams. The most successful AI influencer creators use 
                multiple monetization methods simultaneously.
              </p>
            </div>

            <div className="space-y-4">
              {STRATEGIES.map((strategy) => {
                const Icon = strategy.icon;
                const isExpanded = expandedStrategy === strategy.id;
                return (
                  <div
                    key={strategy.id}
                    className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedStrategy(isExpanded ? null : strategy.id)}
                      className="w-full p-6 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-foreground">{strategy.title}</h3>
                          <span className={`text-xs font-medium ${strategy.difficultyColor}`}>
                            {strategy.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{strategy.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden md:block">
                        <p className="text-sm font-bold text-blue-400">{strategy.revenue}</p>
                        <p className="text-xs text-muted-foreground">Potential Revenue</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-border/50">
                        <div className="md:hidden mb-3 pt-4">
                          <p className="text-sm font-bold text-blue-400">{strategy.revenue}</p>
                        </div>
                        <p className="text-muted-foreground mb-4 pt-4">{strategy.description}</p>
                        <h4 className="text-sm font-bold text-foreground mb-3">Step-by-Step Guide:</h4>
                        <ol className="space-y-2">
                          {strategy.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm text-muted-foreground">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Content Strategy Tips */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                CONTENT STRATEGY PLAYBOOK
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow these proven strategies to grow your AI influencer's audience 
                and maximize your earnings potential.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {STRATEGY_TIPS.map((section) => {
                const Icon = section.icon;
                const isExpanded = expandedTip === section.category;
                return (
                  <div
                    key={section.category}
                    className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedTip(isExpanded ? null : section.category)}
                      className="w-full p-5 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-base font-bold text-foreground flex-1">{section.category}</h3>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-border/50">
                        <ul className="space-y-2 pt-3">
                          {section.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-blue-400 mt-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pinterest Strategy */}
      <section className="py-16 bg-card/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium mb-4">
                <Pin className="w-4 h-4" />
                PINTEREST STRATEGY
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
                PINTEREST: THE PASSIVE TRAFFIC GOLDMINE
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Pinterest is a goldmine for AI influencer content. Images get discovered for months or years, 
                driving passive traffic to your monetization channels.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PINTEREST_STEPS.map((item) => (
                <div key={item.step} className="p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 font-bold flex items-center justify-center mb-3">
                    {item.step}
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Icons */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
              DOMINATE EVERY PLATFORM
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your AI influencer can be everywhere at once. Create content optimized for each platform's algorithm.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-600", tip: "Reels + Stories" },
                { name: "YouTube", icon: Youtube, color: "from-red-500 to-red-700", tip: "Shorts + Long-form" },
                { name: "Twitter/X", icon: Twitter, color: "from-blue-400 to-blue-600", tip: "Threads + Engagement" },
                { name: "Pinterest", icon: Pin, color: "from-red-400 to-red-600", tip: "Pins + Idea Pins" },
              ].map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.name} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm text-center hover:scale-105 transition-transform">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{platform.name}</h3>
                    <p className="text-xs text-muted-foreground">{platform.tip}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-blue-950/30 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6" style={{ fontFamily: "'Oswald', sans-serif" }}>
              READY TO START EARNING?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Create your AI influencer today and start building your passive income empire. 
              No camera needed. No face required. Just results.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/studio">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-lg px-8">
                  <Sparkles className="w-5 h-5" />
                  CREATE YOUR AI INFLUENCER
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                  VIEW PRICING
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          <p>AI Influencer Generator - The #1 AI Influencer Marketing Platform</p>
        </div>
      </footer>
    </div>
  );
}
