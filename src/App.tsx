import { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { isSessionVerified, clearSessionVerification, ensureHashedPin } from './utils/auth';
import PinLockScreen from './components/PinLockScreen';
import DashboardLoading from './components/DashboardLoading';
import { useAutoLock } from './hooks/useAutoLock';
import { prewarmApiCache } from './utils/apiClient';
const MainApp = lazy(() => import('./MainApp'));

export default function App() {
  const [pinVerified, setPinVerified] = useState(() => isSessionVerified());
  const handleLock = useCallback(() => {
    clearSessionVerification();
    setPinVerified(false);
  }, []);

  useAutoLock(pinVerified ? handleLock : () => {}, 300000);

  useEffect(() => {
    // Eagerly prefetch MainApp chunk + portfolio data while user is viewing PIN screen
    if (!pinVerified) {
      const prefetch = async () => {
        // 1. Pre-warm MainApp JS chunk
        import('./MainApp').catch(() => {});

        // 2. Pre-warm portfolio data fetch using the cached PIN hash from the last session.
        //    ensureHashedPin() reads from sessionStorage/localStorage — zero network cost.
        //    If there is a valid hash, kick off the data fetch so SWR cache is warm
        //    by the time the user finishes PIN entry.
        try {
          const cachedHash = await ensureHashedPin();
          if (cachedHash) {
            prewarmApiCache(cachedHash);
          }
        } catch {
          // No cached hash available — user must verify PIN first
        }
      };

      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
          prefetch();
        });
      } else {
        setTimeout(prefetch, 300);
      }
    }
  }, [pinVerified]);

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
    <Suspense fallback={<DashboardLoading />}>
      <MainApp onAuthExpired={() => setPinVerified(false)} />
    </Suspense>
  );
}
