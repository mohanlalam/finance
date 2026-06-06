import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isPinConfigured, isSessionVerified } from './utils/auth';
import { ThemeProvider } from './contexts/ThemeContext';
import { PortfolioProvider, usePortfolioState, usePortfolioActions } from './contexts/PortfolioContext';
import PinLockScreen from './components/PinLockScreen';
import DashboardLoading from './components/DashboardLoading';
import DashboardError from './components/DashboardError';

const AppShell = lazy(() => import('./layouts/AppShell'));

export default function App() {
  const [pinVerified, setPinVerified] = useState(() => !isPinConfigured() || isSessionVerified());

  useEffect(() => {
    // Preload AppShell in the background after the lock screen renders
    const preloadTimer = setTimeout(() => {
      import('./layouts/AppShell').catch((err) => {
        console.warn('[App] Failed to preload AppShell:', err);
      });
    }, 800);

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
    window.addEventListener('touchstart', handleTouchStart, { capture: true });
    return () => {
      clearTimeout(preloadTimer);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
    };
  }, []);

  // PIN Lock Gate
  if (!pinVerified) {
    return <PinLockScreen onUnlock={() => setPinVerified(true)} />;
  }

  const isMobile = window.innerWidth < 768;
  const defaultAsset = isMobile ? 'home' : 'stocks';

  let initialFamily = 'all';
  let initialAsset = defaultAsset;
  try {
    initialFamily = localStorage.getItem('finance_last_family_tab') || 'all';
    initialAsset = localStorage.getItem('finance_last_asset_tab') || defaultAsset;
  } catch {
    // ignore
  }

  return (
    <ThemeProvider>
      <PortfolioProvider onAuthExpired={() => setPinVerified(false)}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${initialFamily}/${initialAsset}`} replace />} />
          <Route path="/:family/:asset" element={<LoadGate onUnlock={() => setPinVerified(false)} />} />
          <Route path="*" element={<Navigate to={`/${initialFamily}/${initialAsset}`} replace />} />
        </Routes>
      </PortfolioProvider>
    </ThemeProvider>
  );
}

/** Gate that shows loading/error states before rendering the dashboard */
function LoadGate({ onUnlock }: { onUnlock: () => void }) {
  const { loadStatus, loadError, isAuthRequired } = usePortfolioState();
  const { load } = usePortfolioActions();

  if (loadStatus === 'idle' || loadStatus === 'loading') {
    return <DashboardLoading />;
  }

  if (loadStatus === 'error') {
    return (
      <DashboardError
        message={loadError}
        isAuthError={isAuthRequired}
        onRetry={load}
        onUnlock={onUnlock}
      />
    );
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <AppShell />
    </Suspense>
  );
}
