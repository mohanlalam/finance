import { useRef, useCallback, useMemo } from 'react';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'tax';

interface UseSwipeNavigationProps {
  activeAsset: AssetTab;
  setActiveAsset: (tab: AssetTab) => void;
}

export function useSwipeNavigation({ activeAsset, setActiveAsset }: UseSwipeNavigationProps) {
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });
  const isMultiTouch = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      isMultiTouch.current = true;
      return;
    }
    isMultiTouch.current = false;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      isMultiTouch.current = true;
      return;
    }
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isMultiTouch.current) return;

    // Ignore swipe if user is actively selecting text on screen
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }

    const globalWin = window as unknown as { __lastShortcutTime?: number };
    const lastShortcut = globalWin.__lastShortcutTime || 0;
    if (Date.now() - lastShortcut < 300) {
      return;
    }

    const target = e.target as HTMLElement | null;
    if (target) {
      const interactiveContainer = target.closest(
        'input, select, textarea, button, table, canvas, svg, [role="dialog"], [role="slider"], .no-swipe, [data-no-swipe], .overflow-x-auto, .scroll-fade-right'
      );
      if (interactiveContainer) return;
    }

    const diffX = touchStart.current.x - touchEnd.current.x;
    const diffY = touchStart.current.y - touchEnd.current.y;
    const durationMs = Date.now() - touchStart.current.time;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    const velocity = durationMs > 0 ? absX / durationMs : 0;

    // Intentional swipe criteria:
    // 1. Min horizontal distance: 130px
    // 2. Max vertical drift: 45px
    // 3. Dominant horizontal ratio: X movement >= 2.5x Y movement
    // 4. Min velocity: 0.4 px/ms
    if (absX > 130 && absY < 45 && absX > absY * 2.5 && velocity > 0.4) {
      const tabOrder: AssetTab[] = ['home', 'stocks', 'fd', 'rd', 'sip', 'gold', 'real_estate', 'insurance', 'documents'];
      const currentIndex = tabOrder.indexOf(activeAsset);

      if (diffX > 0) {
        if (currentIndex < tabOrder.length - 1) {
          setActiveAsset(tabOrder[currentIndex + 1]);
        }
      } else {
        if (currentIndex > 0) {
          setActiveAsset(tabOrder[currentIndex - 1]);
        }
      }
    }
  }, [activeAsset, setActiveAsset]);

  return useMemo(() => ({
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }), [handleTouchStart, handleTouchMove, handleTouchEnd]);
}

export default useSwipeNavigation;
