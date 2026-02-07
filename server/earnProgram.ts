/**
 * Earn Program - Higgsfield-style creator monetization
 * Pays creators based on content views and engagement
 */

export interface EarnProgramStats {
  totalViews: number;
  totalEarnings: number;
  pendingPayout: number;
  lifetimeEarnings: number;
  contentCount: number;
  avgViewsPerContent: number;
  tier: EarnTier;
  nextTierViews: number;
}

export type EarnTier = "starter" | "rising" | "established" | "elite" | "legend";

export const EARN_TIERS = {
  starter: {
    name: "Starter",
    minViews: 0,
    ratePerView: 0.001, // $0.001 per view
    color: "#6B7280",
    icon: "🌱",
    benefits: ["Basic analytics", "Monthly payouts", "Community access"],
  },
  rising: {
    name: "Rising Star",
    minViews: 10000,
    ratePerView: 0.002, // $0.002 per view
    color: "#3B82F6",
    icon: "⭐",
    benefits: ["Enhanced analytics", "Bi-weekly payouts", "Priority support", "Featured placement"],
  },
  established: {
    name: "Established",
    minViews: 100000,
    ratePerView: 0.003, // $0.003 per view
    color: "#8B5CF6",
    icon: "💎",
    benefits: ["Advanced analytics", "Weekly payouts", "Brand deal matching", "Custom branding"],
  },
  elite: {
    name: "Elite Creator",
    minViews: 1000000,
    ratePerView: 0.005, // $0.005 per view
    color: "#F59E0B",
    icon: "👑",
    benefits: ["Real-time analytics", "Daily payouts", "Exclusive brand deals", "Dedicated manager"],
  },
  legend: {
    name: "Legend",
    minViews: 10000000,
    ratePerView: 0.008, // $0.008 per view
    color: "#EF4444",
    icon: "🔥",
    benefits: ["All Elite benefits", "Revenue share boost", "Platform spotlight", "Custom features"],
  },
};

export function getEarnTier(totalViews: number): EarnTier {
  if (totalViews >= 10000000) return "legend";
  if (totalViews >= 1000000) return "elite";
  if (totalViews >= 100000) return "established";
  if (totalViews >= 10000) return "rising";
  return "starter";
}

export function getNextTierViews(currentTier: EarnTier): number {
  switch (currentTier) {
    case "starter": return 10000;
    case "rising": return 100000;
    case "established": return 1000000;
    case "elite": return 10000000;
    case "legend": return Infinity;
  }
}

export function calculateEarnings(views: number, tier: EarnTier): number {
  const rate = EARN_TIERS[tier].ratePerView;
  return views * rate;
}

// Monetization strategies from Higgsfield video
export const MONETIZATION_STRATEGIES = [
  {
    id: "earn-program",
    title: "Earn Program",
    description: "Get paid directly for your content views. The more your AI influencer's content is seen, the more you earn.",
    icon: "💰",
    difficulty: "Easy",
    potentialRevenue: "$100 - $10,000+/month",
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
    icon: "🤝",
    difficulty: "Medium",
    potentialRevenue: "$500 - $50,000+/campaign",
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
    icon: "🔗",
    difficulty: "Medium",
    potentialRevenue: "$200 - $20,000+/month",
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
    icon: "📦",
    difficulty: "Hard",
    potentialRevenue: "$1,000 - $100,000+/month",
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
    icon: "💎",
    difficulty: "Medium",
    potentialRevenue: "$500 - $50,000+/month",
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
    icon: "📄",
    difficulty: "Hard",
    potentialRevenue: "$2,000 - $30,000+/month",
    steps: [
      "Build a recognizable AI influencer brand",
      "Create a diverse content library",
      "Register your AI character as intellectual property",
      "Approach agencies and content platforms",
      "Set licensing terms and pricing",
    ],
  },
];

// Content strategy tips from the video
export const CONTENT_STRATEGY_TIPS = [
  {
    category: "Consistency",
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
    tips: [
      "Start with one platform, master it, then expand",
      "Instagram: Focus on Reels and Stories for maximum reach",
      "TikTok: Trend-jack with your AI influencer for viral potential",
      "YouTube: Create longer-form content for ad revenue",
      "Pinterest: Pin AI influencer images for passive traffic",
      "Twitter/X: Engage in conversations and build community",
    ],
  },
  {
    category: "Content Types",
    tips: [
      "Day-in-the-life content performs well across all platforms",
      "Product reviews and unboxings drive affiliate sales",
      "Talking head videos build trust and engagement",
      "Before/after transformations get high engagement",
      "Behind-the-scenes content creates authentic connection",
      "Educational content positions your AI as an authority",
    ],
  },
  {
    category: "Growth Hacks",
    tips: [
      "Collaborate with other AI influencer creators",
      "Cross-promote across multiple platforms",
      "Use trending audio and hashtags on short-form video",
      "Engage with your audience through AI chat companions",
      "Run giveaways to boost follower growth",
      "Repurpose one piece of content across 5+ platforms",
    ],
  },
  {
    category: "Monetization Timeline",
    tips: [
      "Month 1-2: Focus on content creation and consistency",
      "Month 3-4: Start affiliate marketing and earn program",
      "Month 5-6: Approach brands for collaborations",
      "Month 7-9: Launch digital products or fan subscriptions",
      "Month 10-12: Scale with multiple revenue streams",
      "Year 2+: License content and build a creator agency",
    ],
  },
];

// Pinterest-specific strategy from the video
export const PINTEREST_STRATEGY = {
  title: "Pinterest Strategy for AI Influencers",
  description: "Pinterest is a goldmine for AI influencer content. Images get discovered for months or years, driving passive traffic to your monetization channels.",
  steps: [
    {
      step: 1,
      title: "Create a Business Account",
      description: "Set up a Pinterest Business account with your AI influencer's brand name. Enable Rich Pins for better visibility.",
    },
    {
      step: 2,
      title: "Design Pin-Worthy Images",
      description: "Use 2:3 aspect ratio (1000x1500px). Add text overlays with tips or quotes. Use your AI influencer as the visual anchor.",
    },
    {
      step: 3,
      title: "Optimize for SEO",
      description: "Use keyword-rich titles and descriptions. Research trending keywords in your niche. Add relevant hashtags.",
    },
    {
      step: 4,
      title: "Pin Consistently",
      description: "Pin 15-25 times per day using a scheduler. Mix your own content with repins. Create multiple pins for each piece of content.",
    },
    {
      step: 5,
      title: "Drive Traffic",
      description: "Link pins to your landing page, blog, or affiliate links. Use call-to-action text on pins. Create idea pins for engagement.",
    },
    {
      step: 6,
      title: "Monetize",
      description: "Add affiliate links to pin descriptions. Drive traffic to your digital products. Use Pinterest ads to scale winning pins.",
    },
  ],
};
