import { createContext, useContext, useEffect, useCallback, useRef, useMemo, ReactNode, MutableRefObject } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Portfolio, PortfolioName, AssetPayload, RDPayload, SIPPayload, SSYPayload } from '../types/portfolio';
import { NetWorthSnapshot, usePortfolioData, LoadStatus } from '../hooks/usePortfolioData';

export interface PortfolioDataContextValue {
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
  activeTab: PortfolioName;
  activePortfolio: Portfolio | null;
  portfolioOptionsForModal: { name: string; label: string }[];
  isMutating: boolean;
  lastPriceFetch: Date | null;
  isPriceStale: boolean;
}

export interface PortfolioActionContextValue {
  setActiveTab: (tab: PortfolioName) => void;
  load: () => Promise<void>;
  refreshSnapshot: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  addPortfolio: (name: string, label: string) => Promise<void>;
  renamePortfolio: (id: string, label: string) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  addAsset: (assetType: string, portfolioName: string, payload: AssetPayload, options?: { reload?: boolean }) => Promise<void>;
  updateAsset: (assetType: string, id: string, payload: Partial<AssetPayload>) => Promise<void>;
  deleteAsset: (assetType: string, id: string) => Promise<void>;
  isMutatingRef: MutableRefObject<boolean>;
  addRDAccount: (portfolioName: string, payload: RDPayload) => Promise<void>;
  updateRDAccount: (id: string, payload: Partial<RDPayload>) => Promise<void>;
  deleteRDAccount: (id: string) => Promise<void>;
  addSIPAccount: (portfolioName: string, payload: SIPPayload) => Promise<void>;
  updateSIPAccount: (id: string, payload: Partial<SIPPayload>) => Promise<void>;
  deleteSIPAccount: (id: string) => Promise<void>;
  addSSYAccount: (portfolioName: string, payload: SSYPayload) => Promise<void>;
  updateSSYAccount: (id: string, payload: Partial<SSYPayload>) => Promise<void>;
  deleteSSYAccount: (id: string) => Promise<void>;
}

export interface PortfolioContextValue extends PortfolioDataContextValue, PortfolioActionContextValue {}

const PortfolioDataContext = createContext<PortfolioDataContextValue | null>(null);
const PortfolioActionContext = createContext<PortfolioActionContextValue | null>(null);

export function usePortfolioState(): PortfolioDataContextValue {
  const ctx = useContext(PortfolioDataContext);
  if (!ctx) throw new Error('usePortfolioState must be used within PortfolioProvider');
  return ctx;
}

export function usePortfolioActions(): PortfolioActionContextValue {
  const ctx = useContext(PortfolioActionContext);
  if (!ctx) throw new Error('usePortfolioActions must be used within PortfolioProvider');
  return ctx;
}

export function usePortfolio(): PortfolioContextValue {
  const data = useContext(PortfolioDataContext);
  const actions = useContext(PortfolioActionContext);
  if (!data || !actions) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return useMemo(() => ({ ...data, ...actions }), [data, actions]);
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
    lastPriceFetch,
    isPriceStale,
    isMutating,
    isMutatingRef,
    load,
    refreshSnapshot,
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
      interval = setInterval(() => refreshPricesRef.current(), 15 * 60 * 1000);
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

  const addRDAccount = useCallback(async (portfolioName: string, payload: RDPayload) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await addAsset('rd_account', portfolioName, payload);
    await refreshSnapshot();
  }, [addAsset, isMutatingRef, refreshSnapshot]);

  const updateRDAccount = useCallback(async (id: string, payload: Partial<RDPayload>) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await updateAsset('rd_account', id, payload);
    await refreshSnapshot();
  }, [updateAsset, isMutatingRef, refreshSnapshot]);

  const deleteRDAccount = useCallback(async (id: string) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await deleteAsset('rd_account', id);
    await refreshSnapshot();
  }, [deleteAsset, isMutatingRef, refreshSnapshot]);

  const addSIPAccount = useCallback(async (portfolioName: string, payload: SIPPayload) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await addAsset('sip_account', portfolioName, payload);
    await refreshSnapshot();
  }, [addAsset, isMutatingRef, refreshSnapshot]);

  const updateSIPAccount = useCallback(async (id: string, payload: Partial<SIPPayload>) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await updateAsset('sip_account', id, payload);
    await refreshSnapshot();
  }, [updateAsset, isMutatingRef, refreshSnapshot]);

  const deleteSIPAccount = useCallback(async (id: string) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await deleteAsset('sip_account', id);
    await refreshSnapshot();
  }, [deleteAsset, isMutatingRef, refreshSnapshot]);

  const addSSYAccount = useCallback(async (portfolioName: string, payload: SSYPayload) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await addAsset('ssy_account', portfolioName, payload);
    await refreshSnapshot();
  }, [addAsset, isMutatingRef, refreshSnapshot]);

  const updateSSYAccount = useCallback(async (id: string, payload: Partial<SSYPayload>) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await updateAsset('ssy_account', id, payload);
    await refreshSnapshot();
  }, [updateAsset, isMutatingRef, refreshSnapshot]);

  const deleteSSYAccount = useCallback(async (id: string) => {
    if (isMutatingRef.current) {
      throw new Error('An update is already in progress. Please try again in a moment.');
    }
    await deleteAsset('ssy_account', id);
    await refreshSnapshot();
  }, [deleteAsset, isMutatingRef, refreshSnapshot]);

  const dataValue = useMemo<PortfolioDataContextValue>(() => ({
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
    activePortfolio,
    portfolioOptionsForModal,
    isMutating,
    lastPriceFetch,
    isPriceStale,
  }), [
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
    activePortfolio,
    portfolioOptionsForModal,
    isMutating,
    lastPriceFetch,
    isPriceStale,
  ]);

  const actionValue = useMemo<PortfolioActionContextValue>(() => ({
    setActiveTab,
    load,
    refreshSnapshot,
    refreshPrices,
    addPortfolio,
    renamePortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
    isMutatingRef,
    addRDAccount,
    updateRDAccount,
    deleteRDAccount,
    addSIPAccount,
    updateSIPAccount,
    deleteSIPAccount,
    addSSYAccount,
    updateSSYAccount,
    deleteSSYAccount,
  }), [
    setActiveTab,
    load,
    refreshSnapshot,
    refreshPrices,
    addPortfolio,
    renamePortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
    isMutatingRef,
    addRDAccount,
    updateRDAccount,
    deleteRDAccount,
    addSIPAccount,
    updateSIPAccount,
    deleteSIPAccount,
    addSSYAccount,
    updateSSYAccount,
    deleteSSYAccount,
  ]);

  return (
    <PortfolioDataContext.Provider value={dataValue}>
      <PortfolioActionContext.Provider value={actionValue}>
        {children}
      </PortfolioActionContext.Provider>
    </PortfolioDataContext.Provider>
  );
}
