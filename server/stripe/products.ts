/**
 * Stripe Products and Prices Configuration
 * 
 * This file centralizes all Stripe product definitions for the AI Influencer Generator.
 * Products are created dynamically on first use if they don't exist.
 */

export type TierName = "free" | "basic" | "premium" | "vip";

export interface SubscriptionTier {
  name: TierName;
  displayName: string;
  description: string;
  priceMonthly: number; // in cents
  credits: number;
  features: string[];
  hasWatermark: boolean;
  hasFanvueIntegration: boolean;
  hasContentScheduler: boolean;
  hasBatchGeneration: boolean;
  hasAutoPublish: boolean;
  maxBatchSize: number;
}

export interface CreditPack {
  id: string;
  credits: number;
  price: number; // in cents
  pricePerCredit: number;
}

// Subscription tiers - BASIC/PREMIUM/VIP
export const SUBSCRIPTION_TIERS: Record<TierName, SubscriptionTier> = {
  free: {
    name: "free",
    displayName: "Free",
    description: "Try AI Influencer Generator for free",
    priceMonthly: 0,
    credits: 5,
    features: [
      "5 free credits",
      "Watermarked images",
      "Basic character builder",
      "Community support",
    ],
    hasWatermark: true,
    hasFanvueIntegration: false,
    hasContentScheduler: false,
    hasBatchGeneration: false,
    hasAutoPublish: false,
    maxBatchSize: 1,
  },
  basic: {
    name: "basic",
    displayName: "BASIC",
    description: "Perfect for getting started with AI influencers",
    priceMonthly: 900, // $9.00
    credits: 50,
    features: [
      "50 credits/month",
      "No watermark",
      "HD downloads",
      "Email support",
      "Basic analytics",
    ],
    hasWatermark: false,
    hasFanvueIntegration: false,
    hasContentScheduler: false,
    hasBatchGeneration: false,
    hasAutoPublish: false,
    maxBatchSize: 1,
  },
  premium: {
    name: "premium",
    displayName: "PREMIUM",
    description: "For serious content creators and marketers",
    priceMonthly: 2900, // $29.00
    credits: 300,
    features: [
      "300 credits/month",
      "No watermark",
      "HD downloads",
      "Priority support",
      "Commercial license",
      "Fanvue integration",
      "Advanced analytics",
    ],
    hasWatermark: false,
    hasFanvueIntegration: true,
    hasContentScheduler: false,
    hasBatchGeneration: false,
    hasAutoPublish: false,
    maxBatchSize: 5,
  },
  vip: {
    name: "vip",
    displayName: "VIP",
    description: "For agencies and professional creators",
    priceMonthly: 9900, // $99.00
    credits: 1000,
    features: [
      "1000 credits/month",
      "No watermark",
      "HD downloads",
      "Dedicated support",
      "Commercial license",
      "Fanvue integration",
      "Auto-publish to Fanvue",
      "Content scheduler",
      "Batch generation (30 at once)",
      "API access",
      "White-label option",
    ],
    hasWatermark: false,
    hasFanvueIntegration: true,
    hasContentScheduler: true,
    hasBatchGeneration: true,
    hasAutoPublish: true,
    maxBatchSize: 30,
  },
};

// One-time credit packs
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "credits_100",
    credits: 100,
    price: 1500, // $15.00
    pricePerCredit: 0.15,
  },
  {
    id: "credits_500",
    credits: 500,
    price: 6000, // $60.00
    pricePerCredit: 0.12,
  },
  {
    id: "credits_1000",
    credits: 1000,
    price: 10000, // $100.00
    pricePerCredit: 0.10,
  },
];

// Multi-level affiliate commission rates
export const AFFILIATE_COMMISSION_RATES = {
  level1: 0.30, // 30% - Direct referrals
  level2: 0.10, // 10% - Referrals of referrals
  level3: 0.05, // 5% - Third level
};

// Affiliate badges/achievements
export const AFFILIATE_BADGES = {
  bronze: {
    id: "bronze",
    name: "Bronze Partner",
    description: "Refer 10+ users",
    requirement: 10,
    icon: "🥉",
    color: "#CD7F32",
  },
  silver: {
    id: "silver",
    name: "Silver Partner",
    description: "Refer 50+ users",
    requirement: 50,
    icon: "🥈",
    color: "#C0C0C0",
  },
  gold: {
    id: "gold",
    name: "Gold Partner",
    description: "Refer 100+ users",
    requirement: 100,
    icon: "🥇",
    color: "#FFD700",
  },
  diamond: {
    id: "diamond",
    name: "Diamond Partner",
    description: "Refer 500+ users",
    requirement: 500,
    icon: "💎",
    color: "#B9F2FF",
  },
  risingStar: {
    id: "rising_star",
    name: "Rising Star",
    description: "Earn your first $100",
    requirement: 10000, // in cents
    icon: "⭐",
    color: "#FFEB3B",
  },
  topEarner: {
    id: "top_earner",
    name: "Top Earner",
    description: "Earn $1000+ in a month",
    requirement: 100000, // in cents
    icon: "🏆",
    color: "#4CAF50",
  },
};

// Helper to get tier by name
export function getTierByName(name: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS[name as TierName];
}

// Helper to get credit pack by ID
export function getCreditPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}

// Helper to get tier credits
export function getTierCredits(tier: TierName): number {
  return SUBSCRIPTION_TIERS[tier]?.credits ?? 0;
}

// Helper to check feature access
export function canAccessFeature(tier: TierName, feature: keyof SubscriptionTier): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  if (!tierConfig) return false;
  return Boolean(tierConfig[feature]);
}

// Helper to get affiliate badge based on referral count
export function getAffiliateBadge(referralCount: number): typeof AFFILIATE_BADGES[keyof typeof AFFILIATE_BADGES] | null {
  if (referralCount >= 500) return AFFILIATE_BADGES.diamond;
  if (referralCount >= 100) return AFFILIATE_BADGES.gold;
  if (referralCount >= 50) return AFFILIATE_BADGES.silver;
  if (referralCount >= 10) return AFFILIATE_BADGES.bronze;
  return null;
}

// Helper to calculate multi-level commission
export function calculateCommission(amount: number, level: 1 | 2 | 3): number {
  const rates = AFFILIATE_COMMISSION_RATES;
  switch (level) {
    case 1: return Math.floor(amount * rates.level1);
    case 2: return Math.floor(amount * rates.level2);
    case 3: return Math.floor(amount * rates.level3);
    default: return 0;
  }
}
