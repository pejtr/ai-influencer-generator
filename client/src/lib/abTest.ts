/**
 * A/B Testing system for PWA install banner.
 * Supports two modes:
 * 1. Equal split (default) - deterministic hash-based assignment
 * 2. Auto-optimize (Thompson Sampling) - weighted allocation from server
 * 
 * When auto-optimize is enabled, variant weights are fetched from the server
 * and cached locally. New users get assigned based on weights; existing users
 * keep their assignment for consistency.
 */

export interface ABVariant {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  delayMs: number; // Delay before showing banner
  benefits: { icon: string; label: string }[];
}

// Define test variants
export const INSTALL_BANNER_VARIANTS: ABVariant[] = [
  {
    id: "control",
    title: "Install AI Influencer",
    subtitle: "Add to your home screen",
    ctaText: "Install App",
    delayMs: 3000,
    benefits: [
      { icon: "zap", label: "Faster" },
      { icon: "wifi", label: "Offline" },
      { icon: "download", label: "No app store" },
    ],
  },
  {
    id: "urgency",
    title: "Get the Full Experience",
    subtitle: "Join 10K+ creators using the app",
    ctaText: "Get It Free",
    delayMs: 5000,
    benefits: [
      { icon: "rocket", label: "2x Faster" },
      { icon: "bell", label: "Instant alerts" },
      { icon: "shield", label: "Works offline" },
    ],
  },
  {
    id: "value",
    title: "Unlock Premium Features",
    subtitle: "Native app experience, zero cost",
    ctaText: "Install Now — Free",
    delayMs: 8000,
    benefits: [
      { icon: "sparkles", label: "HD previews" },
      { icon: "clock", label: "Background gen" },
      { icon: "trending-up", label: "Priority queue" },
    ],
  },
  {
    id: "minimal",
    title: "AI Influencer App",
    subtitle: "One tap to create",
    ctaText: "Add to Home",
    delayMs: 2000,
    benefits: [
      { icon: "smartphone", label: "Native feel" },
    ],
  },
];

const AB_STORAGE_KEY = "ab-install-variant";
const AB_SESSION_KEY = "ab-session-id";
const AB_WEIGHTS_KEY = "ab-variant-weights";
const AB_WEIGHTS_TIMESTAMP_KEY = "ab-weights-ts";
const AB_AUTO_OPTIMIZE_KEY = "ab-auto-optimize";
const WEIGHTS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a persistent session ID for consistent variant assignment
 */
function getSessionId(): string {
  try {
    let sessionId = localStorage.getItem(AB_SESSION_KEY);
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(AB_SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `fallback-${Date.now()}`;
  }
}

/**
 * Simple hash function for deterministic variant assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if auto-optimization is enabled (set from admin panel)
 */
export function isAutoOptimizeEnabled(): boolean {
  try {
    return localStorage.getItem(AB_AUTO_OPTIMIZE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Enable or disable auto-optimization
 */
export function setAutoOptimize(enabled: boolean): void {
  try {
    localStorage.setItem(AB_AUTO_OPTIMIZE_KEY, enabled ? "true" : "false");
    if (!enabled) {
      // Clear cached weights and stored variant so next assignment uses equal split
      localStorage.removeItem(AB_WEIGHTS_KEY);
      localStorage.removeItem(AB_WEIGHTS_TIMESTAMP_KEY);
      localStorage.removeItem(AB_STORAGE_KEY);
    }
  } catch {
    // Storage not available
  }
}

/**
 * Store variant weights from server (called by admin panel)
 */
export function setCachedWeights(weights: Record<string, number>): void {
  try {
    localStorage.setItem(AB_WEIGHTS_KEY, JSON.stringify(weights));
    localStorage.setItem(AB_WEIGHTS_TIMESTAMP_KEY, String(Date.now()));
  } catch {
    // Storage not available
  }
}

/**
 * Get cached variant weights (returns null if expired or not available)
 */
function getCachedWeights(): Record<string, number> | null {
  try {
    const ts = localStorage.getItem(AB_WEIGHTS_TIMESTAMP_KEY);
    if (!ts || Date.now() - Number(ts) > WEIGHTS_CACHE_DURATION) return null;
    const raw = localStorage.getItem(AB_WEIGHTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Select variant based on weighted random selection (Thompson Sampling weights)
 */
function selectByWeight(weights: Record<string, number>): ABVariant {
  const rand = Math.random();
  let cumulative = 0;

  for (const variant of INSTALL_BANNER_VARIANTS) {
    const weight = weights[variant.id] || 0;
    cumulative += weight;
    if (rand < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant
  return INSTALL_BANNER_VARIANTS[INSTALL_BANNER_VARIANTS.length - 1];
}

/**
 * Get the assigned A/B variant for the current user.
 * Assignment is persistent across sessions.
 * 
 * When auto-optimize is enabled and weights are cached:
 * - New users get assigned based on Thompson Sampling weights
 * - Existing users keep their assignment
 * 
 * When auto-optimize is disabled:
 * - Uses deterministic hash-based equal split
 */
export function getAssignedVariant(): ABVariant {
  try {
    // Check if already assigned
    const stored = localStorage.getItem(AB_STORAGE_KEY);
    if (stored) {
      const variant = INSTALL_BANNER_VARIANTS.find(v => v.id === stored);
      if (variant) return variant;
    }
  } catch {
    // Fall through to assignment
  }

  let variant: ABVariant;

  // Check for auto-optimize with cached weights
  if (isAutoOptimizeEnabled()) {
    const weights = getCachedWeights();
    if (weights) {
      variant = selectByWeight(weights);
    } else {
      // Fallback to hash-based when no weights cached
      const sessionId = getSessionId();
      const hash = simpleHash(sessionId);
      const variantIndex = hash % INSTALL_BANNER_VARIANTS.length;
      variant = INSTALL_BANNER_VARIANTS[variantIndex];
    }
  } else {
    // Standard equal split: assign based on session hash
    const sessionId = getSessionId();
    const hash = simpleHash(sessionId);
    const variantIndex = hash % INSTALL_BANNER_VARIANTS.length;
    variant = INSTALL_BANNER_VARIANTS[variantIndex];
  }

  try {
    localStorage.setItem(AB_STORAGE_KEY, variant.id);
  } catch {
    // Storage not available
  }

  return variant;
}

/**
 * Force reassign variant (used when auto-optimize weights change significantly)
 */
export function forceReassignVariant(): ABVariant {
  try {
    localStorage.removeItem(AB_STORAGE_KEY);
  } catch {
    // Storage not available
  }
  return getAssignedVariant();
}

/**
 * Get A/B test results summary from analytics data
 */
export interface ABTestResults {
  variantId: string;
  impressions: number;
  clicks: number;
  dismissals: number;
  conversionRate: number;
}

export function calculateConversionRate(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return Math.round((clicks / impressions) * 10000) / 100; // 2 decimal places
}
