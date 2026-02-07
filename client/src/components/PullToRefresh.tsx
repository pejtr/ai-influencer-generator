import { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export default function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const { containerRef, pullDistance, isRefreshing, progress, shouldRefresh } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 120,
  });

  return (
    <div ref={containerRef} className={`relative overflow-y-auto ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-200"
        style={{
          top: 0,
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-200 ${
          shouldRefresh || isRefreshing ? 'scale-100' : 'scale-90'
        }`}>
          <RefreshCw 
            className={`w-4 h-4 transition-all duration-300 ${
              isRefreshing ? 'animate-spin text-primary' : shouldRefresh ? 'text-primary' : 'text-muted-foreground'
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />
          <span className={`text-xs font-medium ${
            isRefreshing ? 'text-primary' : shouldRefresh ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {isRefreshing ? 'Refreshing...' : shouldRefresh ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 && !isRefreshing ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
