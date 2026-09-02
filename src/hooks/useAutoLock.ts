import { useEffect, useRef, useCallback } from 'react';

export function useAutoLock(onLock: () => void, timeoutMs: number = 900000) {
  const timerRef = useRef<number | null>(null);
  const hiddenTimeRef = useRef<number | null>(null);
  const onLockRef = useRef(onLock);
  const timeoutMsRef = useRef(timeoutMs);

  useEffect(() => {
    onLockRef.current = onLock;
    timeoutMsRef.current = timeoutMs;
  });

  const resetTimer = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onLockRef.current();
    }, timeoutMsRef.current);
  }, []);

  useEffect(() => {
    resetTimer();

    let lastInteractionTime = 0;
    // Throttle rapid event triggers (mouse move, wheel, scroll) to at most once per 500ms
    const handleThrottledInteraction = () => {
      const now = Date.now();
      if (now - lastInteractionTime > 500) {
        lastInteractionTime = now;
        resetTimer();
      }
    };

    const handleImmediateInteraction = () => {
      lastInteractionTime = Date.now();
      resetTimer();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimeRef.current = Date.now();
      } else {
        if (hiddenTimeRef.current && Date.now() - hiddenTimeRef.current > timeoutMsRef.current) {
          onLockRef.current();
        } else {
          resetTimer();
        }
        hiddenTimeRef.current = null;
      }
    };

    // Immediate user interactions
    window.addEventListener('mousedown', handleImmediateInteraction, { passive: true });
    window.addEventListener('pointerdown', handleImmediateInteraction, { passive: true });
    window.addEventListener('keydown', handleImmediateInteraction, { passive: true });
    window.addEventListener('touchstart', handleImmediateInteraction, { passive: true });

    // Continuous user interactions (movement, wheel, inner container scrolling)
    window.addEventListener('mousemove', handleThrottledInteraction, { passive: true });
    window.addEventListener('pointermove', handleThrottledInteraction, { passive: true });
    window.addEventListener('wheel', handleThrottledInteraction, { passive: true });
    window.addEventListener('touchmove', handleThrottledInteraction, { passive: true });
    // Use capture: true so scrolling inside any child container (tables, cards, drawers) resets the idle timer
    window.addEventListener('scroll', handleThrottledInteraction, { passive: true, capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener('mousedown', handleImmediateInteraction);
      window.removeEventListener('pointerdown', handleImmediateInteraction);
      window.removeEventListener('keydown', handleImmediateInteraction);
      window.removeEventListener('touchstart', handleImmediateInteraction);
      window.removeEventListener('mousemove', handleThrottledInteraction);
      window.removeEventListener('pointermove', handleThrottledInteraction);
      window.removeEventListener('wheel', handleThrottledInteraction);
      window.removeEventListener('touchmove', handleThrottledInteraction);
      window.removeEventListener('scroll', handleThrottledInteraction, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetTimer]);
}
