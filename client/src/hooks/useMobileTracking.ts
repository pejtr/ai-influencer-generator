import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface DeviceInfo {
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  orientation: string;
  isTouchDevice: boolean;
  connectionType: string;
  memoryGB: number | null;
  hardwareConcurrency: number;
}

function getDeviceInfo(): DeviceInfo {
  const nav = navigator as any;
  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: screen.orientation?.type || (window.innerWidth > window.innerHeight ? "landscape" : "portrait"),
    isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    connectionType: nav.connection?.effectiveType || "unknown",
    memoryGB: nav.deviceMemory || null,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
  };
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

function isMobile(): boolean {
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent) || window.innerWidth < 768;
}

/**
 * Enhanced mobile behavior tracking hook.
 * Tracks: page views, session duration, scroll depth, touch interactions,
 * viewport changes, and device capabilities.
 */
export function useMobileTracking() {
  const trackEvent = trpc.pwaAnalytics.trackEvent.useMutation();
  const sessionStartRef = useRef(Date.now());
  const maxScrollDepthRef = useRef(0);
  const touchCountRef = useRef(0);
  const lastScrollTrackRef = useRef(0);
  const lastViewportTrackRef = useRef(0);

  const track = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      try {
        trackEvent.mutate({
          eventType: eventType as any,
          platform: detectPlatform(),
          metadata: {
            ...metadata,
            isMobile: isMobile(),
            timestamp: Date.now(),
          },
        });
      } catch {
        // Silent fail - analytics should never break the app
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    // Track session start with device info
    const deviceInfo = getDeviceInfo();
    track("session_start", {
      device: deviceInfo,
      referrer: document.referrer || "direct",
      url: window.location.pathname,
    });

    // Track page views on navigation
    const trackPageView = () => {
      track("page_view", {
        url: window.location.pathname,
        title: document.title,
        device: { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight },
      });
    };

    // Track scroll depth (throttled - max every 5 seconds)
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTrackRef.current < 5000) return;

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const currentDepth = Math.round((window.scrollY / scrollHeight) * 100);
      if (currentDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = currentDepth;

        // Track at 25%, 50%, 75%, 100% milestones
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
          if (currentDepth >= milestone && maxScrollDepthRef.current - (currentDepth - milestone) < milestone) {
            track("scroll_depth", {
              depth: milestone,
              url: window.location.pathname,
            });
            lastScrollTrackRef.current = now;
            break;
          }
        }
      }
    };

    // Track touch interactions (throttled - max every 10 seconds)
    const handleTouch = () => {
      touchCountRef.current++;
      const now = Date.now();
      if (now - lastScrollTrackRef.current < 10000) return;
      if (touchCountRef.current % 10 === 0) {
        track("touch_interaction", {
          touchCount: touchCountRef.current,
          url: window.location.pathname,
          sessionDuration: Math.round((now - sessionStartRef.current) / 1000),
        });
      }
    };

    // Track viewport changes (orientation change, resize)
    const handleViewportChange = () => {
      const now = Date.now();
      if (now - lastViewportTrackRef.current < 2000) return;
      lastViewportTrackRef.current = now;

      track("viewport_change", {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        orientation: screen.orientation?.type || (window.innerWidth > window.innerHeight ? "landscape" : "portrait"),
        url: window.location.pathname,
      });
    };

    // Track session end on page unload
    const handleUnload = () => {
      const sessionDuration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      // Use sendBeacon for reliable delivery on page close
      const payload = JSON.stringify({
        eventType: "session_end",
        platform: detectPlatform(),
        metadata: {
          sessionDuration,
          maxScrollDepth: maxScrollDepthRef.current,
          totalTouches: touchCountRef.current,
          url: window.location.pathname,
          isMobile: isMobile(),
        },
      });

      // Try sendBeacon first (most reliable on mobile)
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/trpc/pwaAnalytics.trackEvent?batch=1", blob);
      }
    };

    // Observe URL changes for SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      maxScrollDepthRef.current = 0; // Reset scroll depth for new page
      trackPageView();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouch, { passive: true });
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("popstate", trackPageView);

    // Initial page view
    trackPageView();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("popstate", trackPageView);
      history.pushState = originalPushState;
    };
  }, [track]);

  return { track };
}
