import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { PortfolioProvider, usePortfolioState, usePortfolioActions } from './contexts/PortfolioContext';
import { ToastProvider } from './contexts/ToastContext';
import { MobileProvider } from './contexts/MobileContext';
import ToastContainer from './components/Toast';
import AppErrorBoundary from './components/AppErrorBoundary';
import DashboardLoading from './components/DashboardLoading';
import DashboardError from './components/DashboardError';
import { PrivacyProvider } from './contexts/PrivacyContext';

const AppShell = lazy(() => import('./layouts/AppShell'));
// Eagerly prefetch AppShell chunk in background
import('./layouts/AppShell').catch(() => {});

interface MainAppProps {
  onAuthExpired: () => void;
}

export default function MainApp({ onAuthExpired }: MainAppProps) {
  const defaultAsset = 'home';

  let initialFamily = 'all';
  let initialAsset = defaultAsset;
  try {
    initialFamily = localStorage.getItem('finance_last_family_tab') || 'all';
    initialAsset = localStorage.getItem('finance_last_asset_tab') || defaultAsset;
  } catch {
    // ignore
  }

  return (
    <HashRouter>
      <AppErrorBoundary>
        <ToastProvider>
          <MobileProvider>
            <ThemeProvider>
              <PrivacyProvider>
                <PortfolioProvider onAuthExpired={onAuthExpired}>
                  <Routes>
                    <Route path="/" element={<Navigate to={`/${initialFamily}/${initialAsset}`} replace />} />
                    <Route path="/:family/:asset" element={<LoadGate onUnlock={onAuthExpired} />} />
                    <Route path="*" element={<Navigate to={`/${initialFamily}/${initialAsset}`} replace />} />
                  </Routes>
                  <ToastContainer />
                </PortfolioProvider>
              </PrivacyProvider>
            </ThemeProvider>
          </MobileProvider>
        </ToastProvider>
      </AppErrorBoundary>
    </HashRouter>
  );
}

/** Gate that shows loading/error states before rendering the dashboard */
function LoadGate({ onUnlock }: { onUnlock: () => void }) {
  const { loadStatus, loadError, isAuthRequired, portfolios } = usePortfolioState();
  const { load } = usePortfolioActions();

  // If we already have cached portfolios in memory/IDB, render AppShell immediately (Stale-While-Revalidate)
  if (portfolios.length === 0 && (loadStatus === 'idle' || loadStatus === 'loading')) {
    return <DashboardLoading />;
  }

  if (portfolios.length === 0 && loadStatus === 'error') {
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
      <AppErrorBoundary>
        <AppShell />
      </AppErrorBoundary>
    </Suspense>
  );
}

