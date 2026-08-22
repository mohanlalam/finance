import { useEffect, useRef, useCallback } from 'react';

export function useAutoLock(onLock: () => void, timeoutMs: number = 300000) {
  const timerRef = useRef<number | null>(null);
  const hiddenTimeRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onLock();
    }, timeoutMs);
  }, [onLock, timeoutMs]);

  useEffect(() => {
    resetTimer();

    let lastScrollTime = 0;
    const handleInteraction = () => resetTimer();
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime > 1000) {
        lastScrollTime = now;
        resetTimer();
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimeRef.current = Date.now();
      } else {
        if (hiddenTimeRef.current && Date.now() - hiddenTimeRef.current > timeoutMs) {
          onLock();
        } else {
          resetTimer();
        }
        hiddenTimeRef.current = null;
      }
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetTimer, onLock, timeoutMs]);
}
