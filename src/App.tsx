import { useState, useEffect, Suspense, lazy, useRef, useCallback } from 'react';
import { isPinConfigured, isSessionVerified } from './utils/auth';
import PinLockScreen from './components/PinLockScreen';

const MainApp = lazy(() => import('./MainApp'));

export default function App() {
  const [pinVerified, setPinVerified] = useState(() => !isPinConfigured() || isSessionVerified());
  const timerRef = useRef<number | null>(null);
  const hiddenTimeRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setPinVerified(false);
    }, 300000); // 5 minutes
  }, []);

  useEffect(() => {
    if (!pinVerified) return;
    
    resetTimer();

    const handleInteraction = () => resetTimer();
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimeRef.current = Date.now();
      } else {
        if (hiddenTimeRef.current && Date.now() - hiddenTimeRef.current > 180000) { // 3 minutes
          setPinVerified(false);
        } else {
          resetTimer();
        }
        hiddenTimeRef.current = null;
      }
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('scroll', handleInteraction, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pinVerified, resetTimer]);

  useEffect(() => {
    const globalWin = window as unknown as { __lastInputSource?: string; __lastShortcutTime?: number };
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        globalWin.__lastInputSource = 'keyboard';
        globalWin.__lastShortcutTime = Date.now();
      }
    }
    function handleTouchStart() {
      globalWin.__lastInputSource = 'touch';
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
    };
  }, []);

  // PIN Lock Gate
  if (!pinVerified) {
    return <PinLockScreen onUnlock={() => setPinVerified(true)} />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans">Loading Vault...</div>}>
      <MainApp onAuthExpired={() => setPinVerified(false)} />
    </Suspense>
  );
}
