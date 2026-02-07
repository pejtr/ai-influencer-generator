import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

type Variant = "A" | "B";

interface ABTestConfig {
  id: string;
  variants: {
    A: { text: string; subtext?: string };
    B: { text: string; subtext?: string };
  };
}

const CTA_TEST: ABTestConfig = {
  id: "hero-cta-v1",
  variants: {
    A: { text: "CREATE NOW", subtext: "No credit card required" },
    B: { text: "START FREE", subtext: "5 free generations daily" },
  },
};

function getVariant(testId: string): Variant {
  const key = `ab_test_${testId}`;
  const stored = localStorage.getItem(key);
  if (stored === "A" || stored === "B") return stored;

  // Random 50/50 assignment
  const variant: Variant = Math.random() < 0.5 ? "A" : "B";
  localStorage.setItem(key, variant);
  return variant;
}

function trackEvent(testId: string, variant: Variant, event: "impression" | "click") {
  const key = `ab_events_${testId}`;
  const events = JSON.parse(localStorage.getItem(key) || "[]");
  events.push({
    variant,
    event,
    timestamp: Date.now(),
  });
  localStorage.setItem(key, JSON.stringify(events));

  // Also try to send to server analytics
  try {
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(
        "/api/analytics/ab-event",
        JSON.stringify({ testId, variant, event, timestamp: Date.now() })
      );
    }
  } catch {
    // Silently fail - localStorage tracking is primary
  }
}

export function getABTestStats(testId: string = CTA_TEST.id) {
  const key = `ab_events_${testId}`;
  const events = JSON.parse(localStorage.getItem(key) || "[]");

  const stats = {
    A: { impressions: 0, clicks: 0, ctr: 0 },
    B: { impressions: 0, clicks: 0, ctr: 0 },
  };

  for (const e of events) {
    const v = e.variant as Variant;
    if (v === "A" || v === "B") {
      if (e.event === "impression") stats[v].impressions++;
      if (e.event === "click") stats[v].clicks++;
    }
  }

  stats.A.ctr = stats.A.impressions > 0 ? (stats.A.clicks / stats.A.impressions) * 100 : 0;
  stats.B.ctr = stats.B.impressions > 0 ? (stats.B.clicks / stats.B.impressions) * 100 : 0;

  return { testId, variants: CTA_TEST.variants, stats };
}

export default function ABTestCTA({
  className = "",
  size = "lg",
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const [variant, setVariant] = useState<Variant>("A");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const v = getVariant(CTA_TEST.id);
    setVariant(v);
    setMounted(true);
    trackEvent(CTA_TEST.id, v, "impression");
  }, []);

  const handleClick = useCallback(() => {
    trackEvent(CTA_TEST.id, variant, "click");
  }, [variant]);

  const config = CTA_TEST.variants[variant];

  if (!mounted) {
    return (
      <Button size={size} className={`bg-blue-600 hover:bg-blue-700 text-white font-bold ${className}`}>
        CREATE NOW
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <Link href="/studio" onClick={handleClick}>
        <Button
          size={size}
          className={`bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wider text-base px-8 py-6 rounded-full ${className}`}
        >
          {config.text}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </Link>
      {config.subtext && (
        <span className="text-xs text-white/40 ml-1">{config.subtext}</span>
      )}
    </div>
  );
}
