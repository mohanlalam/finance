/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Portfolio, PortfolioName, AssetPayload } from '../types/portfolio';
import { NetWorthSnapshot, usePortfolioData, LoadStatus } from '../hooks/usePortfolioData';

interface PortfolioContextValue {
  /* State */
  portfolios: Portfolio[];
  netWorthHistory: NetWorthSnapshot[];
  loadStatus: LoadStatus;
  loadError: string;
  priceStatus: LoadStatus;
  lastUpdated: Date | null;
  failedSymbols: string[];
  isUsingCachedData: boolean;
  cacheUpdatedAt: Date | null;
  isAuthRequired: boolean;

  /* Active view state */
  activeTab: PortfolioName;
  setActiveTab: (tab: PortfolioName) => void;
  activePortfolio: Portfolio | null;

  /* Actions */
  load: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  addPortfolio: (name: string, label: string) => Promise<void>;
  renamePortfolio: (id: string, label: string) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  addAsset: (assetType: string, portfolioName: string, payload: AssetPayload, options?: { reload?: boolean }) => Promise<void>;
  updateAsset: (assetType: string, id: string, payload: Partial<AssetPayload>) => Promise<void>;
  deleteAsset: (assetType: string, id: string) => Promise<void>;

  /* Derived */
  portfolioOptionsForModal: { name: string; label: string }[];
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}

interface PortfolioProviderProps {
  children: ReactNode;
  onAuthExpired: () => void;
}

export function PortfolioProvider({ children, onAuthExpired }: PortfolioProviderProps) {
  const handleAuthExpired = useCallback(() => {
    onAuthExpired();
  }, [onAuthExpired]);

  const {
    portfolios,
    netWorthHistory,
    loadStatus,
    loadError,
    priceStatus,
    lastUpdated,
    failedSymbols,
    isUsingCachedData,
    cacheUpdatedAt,
    isAuthRequired,
    load,
    refreshPrices,
    addPortfolio,
    renamePortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
  } = usePortfolioData({ onAuthExpired: handleAuthExpired });

  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = useMemo(() => {
    return location.pathname.split('/').filter(Boolean);
  }, [location.pathname]);

  const activeTab = useMemo<PortfolioName>(() => {
    return (pathParts[0] as PortfolioName) || 'all';
  }, [pathParts]);

  const activeAsset = useMemo(() => {
    return pathParts[1] || 'stocks';
  }, [pathParts]);

  const setActiveTab = useCallback((tab: PortfolioName) => {
    navigate(`/${tab}/${activeAsset}`);
  }, [navigate, activeAsset]);

  // Persist active family tab when it changes from the URL
  useEffect(() => {
    try {
      localStorage.setItem('finance_last_family_tab', activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  const activePortfolio = useMemo(() => {
    if (activeTab === 'all') return null;
    return portfolios.find((p: Portfolio) => p.name === activeTab) ?? null;
  }, [portfolios, activeTab]);

  const portfolioOptionsForModal = useMemo(() => {
    return portfolios.map((p: Portfolio) => ({ name: p.name, label: p.label }));
  }, [portfolios]);

  // Keep a stable ref for polling
  const refreshPricesRef = useRef(refreshPrices);
  useEffect(() => {
    refreshPricesRef.current = refreshPrices;
  }, [refreshPrices]);

  // Auto-load + smart polling with Page Visibility API
  useEffect(() => {
    load();

    let interval: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      if (interval) return;
      interval = setInterval(() => refreshPricesRef.current(), 30000);
    }

    function stopPolling() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        refreshPricesRef.current();
        startPolling();
      } else {
        stopPolling();
      }
    }

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [load]);

  // Daily net worth snapshot trigger
  useEffect(() => {
    if (loadStatus !== 'success' || portfolios.length === 0) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastSnapshot = localStorage.getItem('finance_last_snapshot_date');
    if (lastSnapshot !== todayStr) {
      import('../utils/apiClient').then(({ invokeFunction }) => {
        invokeFunction('snapshot-net-worth', { method: 'POST' })
          .then(() => {
            localStorage.setItem('finance_last_snapshot_date', todayStr);
            load();
          })
          .catch((err) => {
            console.warn('[portfolio] failed to record daily net worth snapshot:', err);
          });
      });
    }
    // Intentionally omitting portfolios from deps — only trigger on loadStatus transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStatus, load]);

  const value = useMemo<PortfolioContextValue>(() => ({
    portfolios,
    netWorthHistory,
    loadStatus,
    loadError,
    priceStatus,
    lastUpdated,
    failedSymbols,
    isUsingCachedData,
    cacheUpdatedAt,
    isAuthRequired,
    activeTab,
    setActiveTab,
    activePortfolio,
    load,
    refreshPrices,
    addPortfolio,
    renamePortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
    portfolioOptionsForModal,
  }), [
    portfolios, netWorthHistory, loadStatus, loadError, priceStatus,
    lastUpdated, failedSymbols, isUsingCachedData, cacheUpdatedAt,
    isAuthRequired, activeTab, setActiveTab, activePortfolio, load, refreshPrices,
    addPortfolio, renamePortfolio, deletePortfolio, addAsset, updateAsset,
    deleteAsset, portfolioOptionsForModal,
  ]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
