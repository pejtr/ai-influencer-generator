import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Heatmap tracking hook.
 * Collects normalized touch/click coordinates for heatmap visualization.
 * Throttled to avoid excessive API calls - batches touches and sends periodically.
 */
export function useHeatmapTracking(enabled: boolean = true) {
  const trackTouch = trpc.pwaAnalytics.trackTouch.useMutation();
  const batchRef = useRef<Array<{
    x: number;
    y: number;
    page: string;
    viewportWidth: number;
    viewportHeight: number;
    elementTag?: string;
    elementId?: string;
  }>>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackRef = useRef(0);

  const flush = useCallback(() => {
    const batch = batchRef.current;
    if (batch.length === 0) return;

    // Send each point (could be batched in future)
    for (const point of batch) {
      try {
        trackTouch.mutate(point);
      } catch {
        // Silent fail
      }
    }
    batchRef.current = [];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) return;

    // Only track on touch devices or when explicitly enabled
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice && window.innerWidth > 768) return;

    const handleTouch = (e: TouchEvent | MouseEvent) => {
      const now = Date.now();
      // Throttle: max 1 point per 500ms
      if (now - lastTrackRef.current < 500) return;
      lastTrackRef.current = now;

      let clientX: number, clientY: number;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }

      const target = e.target as HTMLElement;

      batchRef.current.push({
        x: Math.round((clientX / window.innerWidth) * 10000) / 10000,
        y: Math.round((clientY / window.innerHeight) * 10000) / 10000,
        page: window.location.pathname,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        elementTag: target?.tagName?.toLowerCase(),
        elementId: target?.id || undefined,
      });

      // Auto-flush when batch reaches 5 points
      if (batchRef.current.length >= 5) {
        flush();
      }
    };

    // Flush periodically
    flushTimerRef.current = setInterval(flush, 10000);

    window.addEventListener("touchstart", handleTouch, { passive: true });
    window.addEventListener("click", handleTouch, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("click", handleTouch);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      flush(); // Final flush on unmount
    };
  }, [enabled, flush]);
}
