import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

export function usePullToRefresh({ onRefresh, disabled = false }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const rafId = useRef<number | null>(null);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || window.scrollY > 0) return;

    // Prevent PTR if user is scrolling inside an internal sub-container with scrollTop > 0
    let target = e.target as HTMLElement | null;
    let depth = 0;
    while (target && target !== document.body && depth < 6) {
      if (target.scrollTop > 0) return;
      target = target.parentElement;
      depth++;
    }

    touchStartY.current = e.targetTouches[0].clientY;
    isPulling.current = true;
    pullDistanceRef.current = 0;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing || window.scrollY > 0) return;
    
    const currentY = e.targetTouches[0].clientY;
    const diffY = currentY - touchStartY.current;
    
    if (diffY > 0) {
      const rawDistance = Math.min(100, Math.pow(diffY, 0.85) * 2.5);
      pullDistanceRef.current = rawDistance;
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          setPullDistance(rawDistance);
          rafId.current = null;
        });
      }
    }
  }, [disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    if (!isPulling.current) return;
    isPulling.current = false;
    
    const currentDistance = pullDistanceRef.current;
    pullDistanceRef.current = 0;

    if (currentDistance > 65 && !isRefreshing && !disabled) {
      triggerHaptic('medium');
      setIsRefreshing(true);
      setPullDistance(0);
      try {
        await onRefreshRef.current();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing, disabled]);

  const handleTouchCancel = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    isPulling.current = false;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  }, []);

  return useMemo(() => ({
    isRefreshing,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  }), [isRefreshing, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);
}

