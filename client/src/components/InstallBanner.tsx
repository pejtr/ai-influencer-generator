import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { haptic } from "@/lib/haptics";
import { getAssignedVariant, type ABVariant } from "@/lib/abTest";
import { X, Download, Smartphone, Zap, Wifi, Rocket, Bell, Shield, Sparkles, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  wifi: Wifi,
  download: Download,
  smartphone: Smartphone,
  rocket: Rocket,
  bell: Bell,
  shield: Shield,
  sparkles: Sparkles,
  clock: Clock,
  "trending-up": TrendingUp,
};

function BenefitIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] || Zap;
  return <Icon className={className} />;
}

export default function InstallBanner() {
  const { showBanner, install, dismiss, canInstall } = useInstallPrompt();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [variant, setVariant] = useState<ABVariant | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const trackedRef = useRef(false);
  const trackEvent = trpc.pwaAnalytics.trackEvent.useMutation();

  // Assign variant on mount
  useEffect(() => {
    const assigned = getAssignedVariant();
    setVariant(assigned);
  }, []);

  // Track variant assignment and apply delay
  useEffect(() => {
    if (!variant || !canInstall) return;

    // Track variant assignment (once per session)
    if (!trackedRef.current) {
      trackedRef.current = true;
      try {
        trackEvent.mutate({
          eventType: "ab_variant_assigned" as any,
          platform: detectPlatform(),
          metadata: { variantId: variant.id, delayMs: variant.delayMs },
        });
      } catch { /* silent */ }
    }

    // Apply variant-specific delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, variant.delayMs);

    return () => clearTimeout(timer);
  }, [variant, canInstall]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showBanner || !variant || !isVisible) return null;

  const handleInstall = async () => {
    haptic("medium");
    setIsInstalling(true);

    // Track A/B click
    try {
      trackEvent.mutate({
        eventType: "ab_install_clicked" as any,
        platform: detectPlatform(),
        metadata: { variantId: variant.id },
      });
    } catch { /* silent */ }

    const success = await install();
    setIsInstalling(false);
    if (success) {
      haptic("success");
    }
  };

  const handleDismiss = () => {
    haptic("light");
    setIsExiting(true);

    // Track A/B dismiss
    try {
      trackEvent.mutate({
        eventType: "ab_dismiss_clicked" as any,
        platform: detectPlatform(),
        metadata: { variantId: variant.id },
      });
    } catch { /* silent */ }

    setTimeout(() => {
      dismiss();
    }, 300);
  };

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[90] transition-all duration-300 ${
        isExiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0 animate-in slide-in-from-bottom-4"
      }`}
    >
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/20 p-4 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content - driven by A/B variant */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{variant.title}</h3>
              <p className="text-[11px] text-white/70">{variant.subtitle}</p>
            </div>
          </div>

          {/* Benefits - variant-specific */}
          {variant.benefits.length > 0 && (
            <div className="flex gap-4 mb-4 text-[11px] text-white/80 flex-wrap">
              {variant.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <BenefitIcon icon={benefit.icon} className="w-3.5 h-3.5 text-yellow-300" />
                  <span>{benefit.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-white text-blue-600 font-bold text-sm py-2.5 px-4 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {variant.ctaText}
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>

          {/* A/B variant indicator (only visible in dev) */}
          {import.meta.env.DEV && (
            <div className="mt-2 text-[9px] text-white/30 text-center">
              Variant: {variant.id}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows/.test(ua)) return "windows";
  if (/macintosh|mac os/.test(ua)) return "macos";
  if (/linux/.test(ua)) return "linux";
  return "unknown";
}
