import { useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows/.test(ua)) return "windows";
  if (/macintosh|mac os/.test(ua)) return "macos";
  if (/linux/.test(ua)) return "linux";
  return "unknown";
}

/**
 * Hook that automatically tracks PWA-related events.
 * Place this in App.tsx to start tracking.
 */
export function usePwaTracking() {
  const trackEvent = trpc.pwaAnalytics.trackEvent.useMutation();

  const track = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      try {
        trackEvent.mutate({
          eventType: eventType as any,
          platform: detectPlatform(),
          metadata,
        });
      } catch {
        // Silently fail - analytics should never break the app
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    // Track SW registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {
        track("sw_registered");
      });
    }

    // Track online/offline transitions
    const handleOffline = () => track("offline_session_start");
    const handleOnline = () => track("offline_session_end");

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Track install prompt
    const handleBeforeInstall = (e: Event) => {
      track("install_prompt_shown");
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Track app installed
    const handleAppInstalled = () => {
      track("app_installed");
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [track]);

  return { track };
}
