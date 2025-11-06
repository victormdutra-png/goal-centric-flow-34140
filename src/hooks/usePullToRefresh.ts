import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if scrolled to top
      if (container.scrollTop === 0 && !isRefreshing) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0 || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Only pull down, not up
      if (diff > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setIsPulling(true);
        // Apply resistance to make it feel natural
        setPullDistance(Math.min(diff / resistance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      setIsPulling(false);

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }

      startY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, resistance, isRefreshing, onRefresh]);

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    threshold,
  };
};
