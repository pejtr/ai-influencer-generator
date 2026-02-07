import { useState, useEffect, useRef, useCallback } from "react";
import { hapticPull, hapticThreshold, hapticSuccess } from "@/lib/haptics";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80, maxPull = 120 }: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPassedThreshold = useRef(false);
  const lastHapticProgress = useRef(0);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(threshold);
    try {
      await onRefresh();
      hapticSuccess();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      hasPassedThreshold.current = false;
      lastHapticProgress.current = 0;
    }
  }, [onRefresh, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when scrolled to top
      if (container.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      hasPassedThreshold.current = false;
      lastHapticProgress.current = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      if (container.scrollTop > 0) {
        setPullDistance(0);
        return;
      }

      currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Apply resistance - the further you pull, the harder it gets
        const resistance = Math.min(diff * 0.5, maxPull);
        setPullDistance(resistance);
        
        // Progressive haptic feedback during pull
        const progress = resistance / threshold;
        if (progress - lastHapticProgress.current > 0.15) {
          hapticPull(progress);
          lastHapticProgress.current = progress;
        }

        // Strong haptic when crossing the threshold
        if (resistance >= threshold && !hasPassedThreshold.current) {
          hapticThreshold();
          hasPassedThreshold.current = true;
        } else if (resistance < threshold && hasPassedThreshold.current) {
          // Light haptic when going back below threshold
          hapticPull(0.3);
          hasPassedThreshold.current = false;
        }
        
        if (resistance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;
      setIsPulling(false);

      if (pullDistance >= threshold && !isRefreshing) {
        handleRefresh();
      } else {
        setPullDistance(0);
        hasPassedThreshold.current = false;
        lastHapticProgress.current = 0;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, isRefreshing, pullDistance, threshold, maxPull, handleRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldRefresh = pullDistance >= threshold;

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
  };
}
