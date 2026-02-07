/**
 * A/B Testing system for PWA install banner.
 * Assigns users to variants deterministically based on a hash of their session ID.
 * Tracks variant assignment and conversion events.
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
 * Get the assigned A/B variant for the current user.
 * Assignment is persistent across sessions.
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

  // Assign based on session hash
  const sessionId = getSessionId();
  const hash = simpleHash(sessionId);
  const variantIndex = hash % INSTALL_BANNER_VARIANTS.length;
  const variant = INSTALL_BANNER_VARIANTS[variantIndex];

  try {
    localStorage.setItem(AB_STORAGE_KEY, variant.id);
  } catch {
    // Storage not available
  }

  return variant;
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
