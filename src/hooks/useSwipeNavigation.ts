import { useRef, useCallback, useMemo } from 'react';
import { triggerHaptic } from '../utils/haptics';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'tax' | 'cashflow';

interface UseSwipeNavigationProps {
  activeAsset: AssetTab;
  setActiveAsset: (tab: AssetTab) => void;
}

const MAIN_TABS: AssetTab[] = [
  'home',
  'stocks',
  'sip',
  'fd',
];

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

    // Fluid iOS-style swipe criteria:
    // 1. Valid gesture window: 50ms - 650ms
    // 2. Max vertical drift allowed: 90px (allows thumb arc)
    // 3. Dominant horizontal movement: absX >= 1.2x absY
    // 4. Threshold: distance >= 45px with velocity >= 0.18 px/ms OR distance >= 75px
    const isIntentionalSwipe =
      durationMs >= 50 &&
      durationMs <= 650 &&
      absY < 90 &&
      absX > absY * 1.2 &&
      ((absX >= 45 && velocity >= 0.18) || absX >= 75);

    if (isIntentionalSwipe) {
      const currentIndex = MAIN_TABS.indexOf(activeAsset);

      if (diffX > 0) {
        // Swiping Left -> Navigate Forward to Next Main Tab
        if (currentIndex !== -1 && currentIndex < MAIN_TABS.length - 1) {
          triggerHaptic('light');
          setActiveAsset(MAIN_TABS[currentIndex + 1]);
        }
      } else {
        // Swiping Right -> Navigate Back to Previous Main Tab
        if (currentIndex > 0) {
          triggerHaptic('light');
          setActiveAsset(MAIN_TABS[currentIndex - 1]);
        } else if (currentIndex === -1) {
          // If on a secondary tab (from More menu), swiping right returns to Deposits
          triggerHaptic('light');
          setActiveAsset('fd');
        }
      }
    }
  }, [activeAsset, setActiveAsset]);

  const handleTouchCancel = useCallback(() => {
    isMultiTouch.current = false;
    touchStart.current = { x: 0, y: 0, time: 0 };
    touchEnd.current = { x: 0, y: 0 };
  }, []);

  return useMemo(() => ({
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  }), [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);
}

export default useSwipeNavigation;
