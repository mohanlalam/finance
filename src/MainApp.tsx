import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { PortfolioProvider, usePortfolioState, usePortfolioActions } from './contexts/PortfolioContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLoading from './components/DashboardLoading';
import DashboardError from './components/DashboardError';

const AppShell = lazy(() => import('./layouts/AppShell'));

interface MainAppProps {
  onAuthExpired: () => void;
}

export default function MainApp({ onAuthExpired }: MainAppProps) {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
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
    <HashRouter>
      <ErrorBoundary>
        <ToastProvider>
          <ThemeProvider>
            <PortfolioProvider onAuthExpired={onAuthExpired}>
              <Routes>
                <Route path="/" element={<Navigate to={`/${initialFamily}/${initialAsset}`} replace />} />
                <Route path="/:family/:asset" element={<LoadGate onUnlock={onAuthExpired} />} />
                <Route path="*" element={<Navigate to={`/${initialFamily}/${initialAsset}`} replace />} />
              </Routes>
              <ToastContainer />
            </PortfolioProvider>
          </ThemeProvider>
        </ToastProvider>
      </ErrorBoundary>
    </HashRouter>
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
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </Suspense>
  );
}

