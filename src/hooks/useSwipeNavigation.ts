import { useRef, useCallback } from 'react';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'ssy' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents';

interface UseSwipeNavigationProps {
  activeAsset: AssetTab;
  setActiveAsset: (tab: AssetTab) => void;
}

export function useSwipeNavigation({ activeAsset, setActiveAsset }: UseSwipeNavigationProps) {
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
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

  const handleTouchEnd = useCallback(() => {
    const globalWin = window as unknown as { __lastShortcutTime?: number };
    const lastShortcut = globalWin.__lastShortcutTime || 0;
    if (Date.now() - lastShortcut < 300) {
      return;
    }

    const diffX = touchStart.current.x - touchEnd.current.x;
    const diffY = touchStart.current.y - touchEnd.current.y;

    if (Math.abs(diffX) > 70 && Math.abs(diffY) < 40) {
      const tabOrder: AssetTab[] = ['home', 'stocks', 'fd', 'rd', 'ssy', 'sip', 'gold', 'real_estate', 'insurance', 'documents'];
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
