import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isPinConfigured, isSessionVerified } from './utils/auth';
import { ThemeProvider } from './contexts/ThemeContext';
import { PortfolioProvider, usePortfolio } from './contexts/PortfolioContext';
import PinLockScreen from './components/PinLockScreen';
import DashboardLoading from './components/DashboardLoading';
import DashboardError from './components/DashboardError';
import AppShell from './layouts/AppShell';

export default function App() {
  const [pinVerified, setPinVerified] = useState(() => !isPinConfigured() || isSessionVerified());

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
  const { loadStatus, loadError, isAuthRequired, load } = usePortfolio();

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

  return <AppShell />;
}
