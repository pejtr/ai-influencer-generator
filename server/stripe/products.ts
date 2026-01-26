/**
 * Stripe Products and Prices Configuration
 * 
 * This file centralizes all Stripe product definitions for the AI Influencer Generator.
 * Products are created dynamically on first use if they don't exist.
 */

export type TierName = "starter" | "pro" | "business";

export interface SubscriptionTier {
  name: TierName;
  displayName: string;
  description: string;
  priceMonthly: number; // in cents
  credits: number;
  features: string[];
}

export interface CreditPack {
  id: string;
  credits: number;
  price: number; // in cents
  pricePerCredit: number;
}

// Subscription tiers
export const SUBSCRIPTION_TIERS: Record<TierName, SubscriptionTier> = {
  starter: {
    name: "starter",
    displayName: "Starter",
    description: "Perfect for getting started with AI influencers",
    priceMonthly: 900, // $9.00
    credits: 50,
    features: [
      "50 credits/month",
      "No watermark",
      "HD downloads",
      "Email support",
    ],
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    description: "For serious content creators and marketers",
    priceMonthly: 2900, // $29.00
    credits: 300,
    features: [
      "300 credits/month",
      "No watermark",
      "HD downloads",
      "Priority support",
      "Commercial license",
    ],
  },
  business: {
    name: "business",
    displayName: "Business",
    description: "For agencies and enterprises",
    priceMonthly: 9900, // $99.00
    credits: 1000,
    features: [
      "1000 credits/month",
      "No watermark",
      "HD downloads",
      "Dedicated support",
      "API access",
      "White-label option",
    ],
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
