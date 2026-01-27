/**
 * Stripe Products and Prices Configuration - Hybrid Model
 * 
 * This file centralizes all Stripe product definitions for the AI Influencer Generator.
 * 
 * HYBRID MODEL:
 * - FREE: 5 credits/day (resets at midnight UTC), watermark
 * - Credit Packs: One-time purchases for additional credits
 * - PRO Subscription: $19.99/mo - 500 credits/mo + premium features
 * - CREATOR Subscription: $49.99/mo - 1500 credits/mo + all features
 */

export type TierName = "free" | "pro" | "creator";

export interface SubscriptionTier {
  name: TierName;
  displayName: string;
  description: string;
  priceMonthly: number; // in cents
  monthlyCredits: number; // Credits included per month
  dailyFreeCredits: number; // Free credits per day
  features: string[];
  hasWatermark: boolean;
  hasFanvueIntegration: boolean;
  hasContentScheduler: boolean;
  hasBatchGeneration: boolean;
  hasAutoPublish: boolean;
  hasAIChat: boolean;
  hasMarketplace: boolean;
  hasPriorityQueue: boolean;
  maxBatchSize: number;
}

export interface CreditPack {
  id: string;
  slug: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  price: number; // in cents
  pricePerCredit: number;
  savings: string; // e.g., "Save 33%"
  popular?: boolean;
}

// Subscription tiers - FREE / PRO / CREATOR
export const SUBSCRIPTION_TIERS: Record<TierName, SubscriptionTier> = {
  free: {
    name: "free",
    displayName: "Free",
    description: "Try AI Influencer Generator for free",
    priceMonthly: 0,
    monthlyCredits: 0,
    dailyFreeCredits: 5,
    features: [
      "5 free credits per day",
      "Watermarked images",
      "Basic character builder",
      "Community support",
    ],
    hasWatermark: true,
    hasFanvueIntegration: false,
    hasContentScheduler: false,
    hasBatchGeneration: false,
    hasAutoPublish: false,
    hasAIChat: false,
    hasMarketplace: false,
    hasPriorityQueue: false,
    maxBatchSize: 1,
  },
  pro: {
    name: "pro",
    displayName: "PRO",
    description: "For serious content creators",
    priceMonthly: 1999, // $19.99
    monthlyCredits: 500,
    dailyFreeCredits: 5, // Still get daily free credits
    features: [
      "500 credits/month",
      "5 free credits/day (bonus)",
      "No watermark",
      "HD downloads",
      "Priority queue",
      "Fanvue integration",
      "Priority support",
      "Commercial license",
    ],
    hasWatermark: false,
    hasFanvueIntegration: true,
    hasContentScheduler: false,
    hasBatchGeneration: false,
    hasAutoPublish: false,
    hasAIChat: false,
    hasMarketplace: false,
    hasPriorityQueue: true,
    maxBatchSize: 5,
  },
  creator: {
    name: "creator",
    displayName: "CREATOR",
    description: "For professional creators and agencies",
    priceMonthly: 4999, // $49.99
    monthlyCredits: 1500,
    dailyFreeCredits: 5, // Still get daily free credits
    features: [
      "1500 credits/month",
      "5 free credits/day (bonus)",
      "No watermark",
      "HD downloads",
      "Priority queue",
      "Fanvue integration",
      "Auto-publish to Fanvue",
      "Content scheduler",
      "Batch generation (30 at once)",
      "AI Chat companion",
      "Marketplace listing",
      "Dedicated support",
      "API access",
    ],
    hasWatermark: false,
    hasFanvueIntegration: true,
    hasContentScheduler: true,
    hasBatchGeneration: true,
    hasAutoPublish: true,
    hasAIChat: true,
    hasMarketplace: true,
    hasPriorityQueue: true,
    maxBatchSize: 30,
  },
};

// One-time credit packs with bonus credits
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "credits_small",
    slug: "small",
    name: "Small Pack",
    credits: 100,
    bonusCredits: 0,
    totalCredits: 100,
    price: 999, // $9.99
    pricePerCredit: 0.10,
    savings: "",
  },
  {
    id: "credits_medium",
    slug: "medium",
    name: "Medium Pack",
    credits: 300,
    bonusCredits: 100, // +33% bonus
    totalCredits: 400,
    price: 2999, // $29.99
    pricePerCredit: 0.075,
    savings: "Save 25%",
    popular: true,
  },
  {
    id: "credits_large",
    slug: "large",
    name: "Large Pack",
    credits: 1000,
    bonusCredits: 500, // +50% bonus
    totalCredits: 1500,
    price: 9999, // $99.99
    pricePerCredit: 0.067,
    savings: "Save 33%",
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

// Helper to get credit pack by slug
export function getCreditPackBySlug(slug: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.slug === slug);
}

// Helper to get tier monthly credits
export function getTierMonthlyCredits(tier: TierName): number {
  return SUBSCRIPTION_TIERS[tier]?.monthlyCredits ?? 0;
}

// Helper to get tier daily free credits
export function getTierDailyCredits(tier: TierName): number {
  return SUBSCRIPTION_TIERS[tier]?.dailyFreeCredits ?? 5;
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

// Calculate total available credits for a user
export interface UserCredits {
  freeCreditsToday: number;
  paidCredits: number;
  subscriptionCredits: number;
  totalAvailable: number;
}

export function calculateUserCredits(
  freeCreditsToday: number,
  creditBalance: number,
  monthlyCreditsRemaining: number
): UserCredits {
  return {
    freeCreditsToday,
    paidCredits: creditBalance,
    subscriptionCredits: monthlyCreditsRemaining,
    totalAvailable: freeCreditsToday + creditBalance + monthlyCreditsRemaining,
  };
}

// Determine which credits to use (priority: free > subscription > paid)
export function getCreditsToDeduct(
  freeCreditsToday: number,
  monthlyCreditsRemaining: number,
  creditBalance: number,
  amount: number
): { free: number; subscription: number; paid: number } {
  let remaining = amount;
  const result = { free: 0, subscription: 0, paid: 0 };

  // First use free credits
  if (remaining > 0 && freeCreditsToday > 0) {
    const fromFree = Math.min(remaining, freeCreditsToday);
    result.free = fromFree;
    remaining -= fromFree;
  }

  // Then use subscription credits
  if (remaining > 0 && monthlyCreditsRemaining > 0) {
    const fromSub = Math.min(remaining, monthlyCreditsRemaining);
    result.subscription = fromSub;
    remaining -= fromSub;
  }

  // Finally use paid credits
  if (remaining > 0 && creditBalance > 0) {
    const fromPaid = Math.min(remaining, creditBalance);
    result.paid = fromPaid;
    remaining -= fromPaid;
  }

  return result;
}
