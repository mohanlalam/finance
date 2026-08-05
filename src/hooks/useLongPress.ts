import { useCallback, useRef } from 'react';

export interface UseLongPressOptions {
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  delay?: number;
}

export function useLongPress({ onLongPress, delay = 500 }: UseLongPressOptions) {
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // Record starting position to check for movement
      if ('touches' in e) {
        startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        startPos.current = { x: e.clientX, y: e.clientY };
      }

      timeout.current = setTimeout(() => {
        if ('vibrate' in navigator) { try { navigator.vibrate(10); } catch { /* ignore vibrate error */ } }
        onLongPress(e);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, []);

  const move = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!startPos.current) return;

      let currentX = 0;
      let currentY = 0;

      if ('touches' in e) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      } else {
        currentX = e.clientX;
        currentY = e.clientY;
      }

      const dx = currentX - startPos.current.x;
      const dy = currentY - startPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If user moves more than 10px, cancel the long press
      if (distance > 10) {
        clear();
      }
    },
    [clear]
  );

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
    onTouchMove: move,
  };
}
