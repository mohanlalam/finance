import { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { isPinConfigured, isSessionVerified, clearSessionVerification } from './utils/auth';
import PinLockScreen from './components/PinLockScreen';
import { useAutoLock } from './hooks/useAutoLock';
const MainApp = lazy(() => import('./MainApp'));

export default function App() {
  const [pinVerified, setPinVerified] = useState(() => !isPinConfigured() || isSessionVerified());
  const handleLock = useCallback(() => {
    clearSessionVerification();
    setPinVerified(false);
  }, []);

  useAutoLock(pinVerified ? handleLock : () => {}, 300000);

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
