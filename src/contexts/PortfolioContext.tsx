import { createContext, useContext, useEffect, useCallback, useRef, useMemo, ReactNode, MutableRefObject } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Portfolio, PortfolioName, AssetPayload, RDPayload, SIPPayload } from '../types/portfolio';
import { NetWorthSnapshot, usePortfolioData, LoadStatus } from '../hooks/usePortfolioData';
import { invokeFunction } from '../utils/apiClient';


export interface PortfolioEntitiesContextValue {
  portfolios: Portfolio[];
  netWorthHistory: NetWorthSnapshot[];
  activeTab: PortfolioName;
  activePortfolio: Portfolio | null;
  portfolioOptionsForModal: { name: string; label: string }[];
}

export interface PortfolioStatusContextValue {
  loadStatus: LoadStatus;
  loadError: string;
  priceStatus: LoadStatus;
  lastUpdated: Date | null;
  failedSymbols: string[];
  isUsingCachedData: boolean;
  cacheUpdatedAt: Date | null;
  isAuthRequired: boolean;
  isMutating: boolean;
  lastPriceFetch: Date | null;
  isPriceStale: boolean;
}

export interface PortfolioDataContextValue extends PortfolioEntitiesContextValue, PortfolioStatusContextValue {}

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
}

const PortfolioEntitiesContext = createContext<PortfolioEntitiesContextValue | null>(null);
const PortfolioStatusContext = createContext<PortfolioStatusContextValue | null>(null);
const PortfolioActionContext = createContext<PortfolioActionContextValue | null>(null);

export function usePortfolioEntities(): PortfolioEntitiesContextValue {
  const ctx = useContext(PortfolioEntitiesContext);
  if (!ctx) throw new Error('usePortfolioEntities must be used within PortfolioProvider');
  return ctx;
}

export function usePortfolioStatus(): PortfolioStatusContextValue {
  const ctx = useContext(PortfolioStatusContext);
  if (!ctx) throw new Error('usePortfolioStatus must be used within PortfolioProvider');
  return ctx;
}

export function usePortfolioState(): PortfolioDataContextValue {
  const entities = useContext(PortfolioEntitiesContext);
  const status = useContext(PortfolioStatusContext);
  if (!entities || !status) throw new Error('usePortfolioState must be used within PortfolioProvider');
  return { ...entities, ...status };
}

export function usePortfolioActions(): PortfolioActionContextValue {
  const ctx = useContext(PortfolioActionContext);
  if (!ctx) throw new Error('usePortfolioActions must be used within PortfolioProvider');
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

  const portfolioOptions = useMemo(() => ({ onAuthExpired: handleAuthExpired }), [handleAuthExpired]);

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
  } = usePortfolioData(portfolioOptions);

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

  const activeAssetRef = useRef(activeAsset);
  useEffect(() => {
    activeAssetRef.current = activeAsset;
  }, [activeAsset]);

  const setActiveTab = useCallback((tab: PortfolioName) => {
    navigate(`/${tab}/${activeAssetRef.current}`);
  }, [navigate]);

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

  const portfolioKeys = useMemo(
    () => portfolios.map((p: Portfolio) => `${p.id}:${p.name}:${p.label}`).join('|'),
    [portfolios]
  );

  const portfolioOptionsForModal = useMemo(() => {
    return portfolios.map((p: Portfolio) => ({ name: p.name, label: p.label }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioKeys]);

  // Auto-load on mount (SWR handles background polling and visibility refresh)
  useEffect(() => {
    load();
  }, [load]);

  // Daily net worth snapshot trigger
  useEffect(() => {
    let isMounted = true;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastSnapshot = localStorage.getItem('finance_last_snapshot_date');
    if (lastSnapshot !== todayStr) {
      invokeFunction('snapshot-net-worth', { method: 'POST' })
        .then(() => {
          if (!isMounted) return;
          localStorage.setItem('finance_last_snapshot_date', todayStr);
        })
        .catch((err) => {
          console.warn('[portfolio] failed to record daily net worth snapshot:', err);
        });
    }
    return () => {
      isMounted = false;
    };
    // Intentionally omitting portfolios from deps — only trigger on loadStatus transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStatus, load]);

  const addRDAccount = useCallback(async (portfolioName: string, payload: RDPayload) => {
    await addAsset('rd_account', portfolioName, payload);
  }, [addAsset]);

  const updateRDAccount = useCallback(async (id: string, payload: Partial<RDPayload>) => {
    await updateAsset('rd_account', id, payload);
  }, [updateAsset]);

  const deleteRDAccount = useCallback(async (id: string) => {
    await deleteAsset('rd_account', id);
  }, [deleteAsset]);

  const addSIPAccount = useCallback(async (portfolioName: string, payload: SIPPayload) => {
    await addAsset('sip_account', portfolioName, payload);
  }, [addAsset]);

  const updateSIPAccount = useCallback(async (id: string, payload: Partial<SIPPayload>) => {
    await updateAsset('sip_account', id, payload);
  }, [updateAsset]);

  const deleteSIPAccount = useCallback(async (id: string) => {
    await deleteAsset('sip_account', id);
  }, [deleteAsset]);



  const entitiesValue = useMemo<PortfolioEntitiesContextValue>(() => ({
    portfolios,
    netWorthHistory,
    activeTab,
    activePortfolio,
    portfolioOptionsForModal,
  }), [
    portfolios,
    netWorthHistory,
    activeTab,
    activePortfolio,
    portfolioOptionsForModal,
  ]);

  const statusValue = useMemo<PortfolioStatusContextValue>(() => ({
    loadStatus,
    loadError,
    priceStatus,
    lastUpdated,
    failedSymbols,
    isUsingCachedData,
    cacheUpdatedAt,
    isAuthRequired,
    isMutating,
    lastPriceFetch,
    isPriceStale,
  }), [
    loadStatus,
    loadError,
    priceStatus,
    lastUpdated,
    failedSymbols,
    isUsingCachedData,
    cacheUpdatedAt,
    isAuthRequired,
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
  ]);

  return (
    <PortfolioEntitiesContext.Provider value={entitiesValue}>
      <PortfolioStatusContext.Provider value={statusValue}>
        <PortfolioActionContext.Provider value={actionValue}>
          {children}
        </PortfolioActionContext.Provider>
      </PortfolioStatusContext.Provider>
    </PortfolioEntitiesContext.Provider>
  );
}
