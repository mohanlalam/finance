import { useRef, useCallback } from 'react';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'what_if' | 'tax';

interface UseSwipeNavigationProps {
  activeAsset: AssetTab;
  setActiveAsset: (tab: AssetTab) => void;
}

export function useSwipeNavigation({ activeAsset, setActiveAsset }: UseSwipeNavigationProps) {
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const globalWin = window as unknown as { __lastShortcutTime?: number };
    const lastShortcut = globalWin.__lastShortcutTime || 0;
    if (Date.now() - lastShortcut < 300) {
      return;
    }

    let target = e.target as HTMLElement | null;
    let levels = 0;
    while (target && levels < 6) {
      const style = window.getComputedStyle(target);
      const tagName = target.tagName.toLowerCase();
      if (
        style.overflowX === 'scroll' ||
        style.overflowX === 'auto' ||
        target.classList.contains('overflow-x-auto') ||
        target.classList.contains('scroll-fade-right') ||
        target.classList.contains('no-swipe') ||
        tagName === 'table' ||
        tagName === 'input' ||
        tagName === 'button' ||
        tagName === 'svg' ||
        tagName === 'canvas' ||
        target.closest('[role="dialog"]') ||
        target.closest('[role="slider"]')
      ) {
        return; // Ignore swipe inside scrollable, interactive, slider, or dialog containers
      }
      target = target.parentElement;
      levels++;
    }

    const diffX = touchStart.current.x - touchEnd.current.x;
    const diffY = touchStart.current.y - touchEnd.current.y;
    const durationMs = Date.now() - touchStart.current.time;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    const velocity = durationMs > 0 ? absX / durationMs : 0;

    // Strict intentional swipe criteria to prevent accidental tab switches:
    // 1. Min horizontal distance: 130px (calibrated up from 90px)
    // 2. Max vertical drift: 45px
    // 3. Dominant horizontal ratio: X movement must be at least 2.5x Y movement
    // 4. Min swipe velocity: 0.4 px/ms
    if (absX > 130 && absY < 45 && absX > absY * 2.5 && velocity > 0.4) {
      const tabOrder: AssetTab[] = ['home', 'stocks', 'fd', 'rd', 'sip', 'gold', 'real_estate', 'insurance', 'documents', 'what_if'];
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

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
export default useSwipeNavigation;
