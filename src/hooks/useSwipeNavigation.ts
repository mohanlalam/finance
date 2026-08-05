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
    while (target && levels < 5) {
      const style = window.getComputedStyle(target);
      if (
        style.overflowX === 'scroll' ||
        style.overflowX === 'auto' ||
        target.classList.contains('overflow-x-auto') ||
        target.classList.contains('scroll-fade-right') ||
        target.tagName.toLowerCase() === 'table'
      ) {
        return; // Ignore swipe inside scrollable container
      }
      target = target.parentElement;
      levels++;
    }

    const diffX = touchStart.current.x - touchEnd.current.x;
    const diffY = touchStart.current.y - touchEnd.current.y;
    const durationMs = Date.now() - touchStart.current.time;
    const velocity = durationMs > 0 ? Math.abs(diffX) / durationMs : 0;

    if (Math.abs(diffX) > 90 && Math.abs(diffY) < 30 && velocity > 0.3) {
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
