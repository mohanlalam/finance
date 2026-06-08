import { useState, useCallback, useRef, useEffect } from 'react';
import { Holding, Portfolio, FixedDeposit, RDAccount, SIPAccount, SSYAccount, GoldHolding, RealEstate, Insurance, DocumentMetadata, AssetPayload } from '../types/portfolio';
import { getFDInvestedAmount, getFDEffectiveValue } from '../utils/formatters';
import { getRDInvestedAmount, getRDEffectiveValue } from '../utils/rdUtils';
import { getSIPInvestedAmount, getSIPEffectiveValue, fetchNAV, initNAVCache } from '../utils/sipUtils';
import { getSSYInvestedAmount, getSSYEffectiveValue } from '../utils/ssyUtils';
import { AppApiError, getEnvironmentIssue, invokeFunction } from '../utils/apiClient';
import useSWR from 'swr';
import * as idb from 'idb-keyval';

interface DBHolding {
  id: string;
  portfolio_id: string;
  sno: number;
  stock_name: string;
  ticker: string;
  yahoo_symbol: string;
  qty: number;
  avg_price: number;
  week_low_52: number;
  week_high_52: number;
  amount_invested: number;
  cached_ltp?: number | null;
  cached_today_pct?: number | null;
  created_at?: string;
}

interface DBPortfolio {
  id: string;
  name: string;
  label: string;
  created_at?: string;
}

interface QuoteResult {
  ticker: string;
  ltp: number | null;
  todayPct: number | null;
}

export interface NetWorthSnapshot {
  id: string;
  snapshot_date: string;
  total_value: number;
  stocks_value: number;
  fd_value: number;
  gold_value: number;
  real_estate_value: number;
}

interface DBData {
  portfolios?: DBPortfolio[];
  holdings?: DBHolding[];
  fixed_deposits?: FixedDeposit[];
  rd_accounts?: RDAccount[];
  sip_accounts?: SIPAccount[];
  ssy_accounts?: SSYAccount[];
  gold_holdings?: GoldHolding[];
  real_estate?: RealEstate[];
  insurances?: Insurance[];
  documents?: DocumentMetadata[];
  net_worth_history?: NetWorthSnapshot[];
}

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

function dbToHolding(h: DBHolding): Holding {
  const ltp = h.cached_ltp !== undefined && h.cached_ltp !== null ? Number(h.cached_ltp) : h.avg_price;
  const todayPnLPercent = h.cached_today_pct !== undefined && h.cached_today_pct !== null ? Number(h.cached_today_pct) : 0;
  const currentValue = h.qty * ltp;
  const unrealizedPnL = currentValue - h.amount_invested;
  const pnlPercent = h.amount_invested > 0 ? (unrealizedPnL / h.amount_invested) * 100 : 0;
  return {
    id: h.id,
    sno: h.sno,
    stockName: h.stock_name,
    ticker: h.ticker,
    yahooSymbol: h.yahoo_symbol,
    qty: h.qty,
    avgPrice: h.avg_price,
    weekLow52: h.week_low_52,
    weekHigh52: h.week_high_52,
    ltp,
    amountInvested: h.amount_invested,
    unrealizedPnL,
    pnlPercent,
    todayPnLPercent,
    currentValue,
    created_at: h.created_at,
  };
}

function recalcPortfolioTotals(
  holdings: Holding[],
  fds: FixedDeposit[],
  rdAccounts: RDAccount[],
  sipAccounts: SIPAccount[],
  ssyAccounts: SSYAccount[],
  gold: GoldHolding[],
  realEstate: RealEstate[]
) {
  const stockInvested = holdings.reduce((sum, h) => sum + h.amountInvested, 0);
  const stockCurrent = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  const fdInvested = fds.reduce((sum, f) => sum + getFDInvestedAmount(f), 0);
  const fdCurrent = fds.reduce((sum, f) => sum + getFDEffectiveValue(f), 0);

  const rdInvested = rdAccounts.reduce((sum, r) => sum + getRDInvestedAmount(r), 0);
  const rdCurrent = rdAccounts.reduce((sum, r) => sum + getRDEffectiveValue(r), 0);

  const sipInvested = sipAccounts.reduce((sum, s) => sum + getSIPInvestedAmount(s), 0);
  const sipCurrent = sipAccounts.reduce((sum, s) => sum + getSIPEffectiveValue(s), 0);

  const ssyInvested = ssyAccounts.reduce((sum, s) => sum + getSSYInvestedAmount(s), 0);
  const ssyCurrent = ssyAccounts.reduce((sum, s) => sum + getSSYEffectiveValue(s), 0);

  const goldInvested = gold.reduce((sum, g) => sum + Number(g.purchase_price), 0);
  const goldCurrent = gold.reduce((sum, g) => sum + Number(g.current_valuation), 0);

  const reInvested = realEstate.reduce((sum, r) => sum + Number(r.purchase_price), 0);
  const reCurrent = realEstate.reduce((sum, r) => sum + Number(r.current_valuation), 0);

  const totalInvested = stockInvested + fdInvested + rdInvested + sipInvested + ssyInvested + goldInvested + reInvested;
  const totalCurrentValue = stockCurrent + fdCurrent + rdCurrent + sipCurrent + ssyCurrent + goldCurrent + reCurrent;
  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalPnL,
    totalPnLPercent,
    stocksValue: stockCurrent,
    fdValue: fdCurrent,
    rdValue: rdCurrent,
    ssyValue: ssyCurrent,
    sipValue: sipCurrent,
    goldValue: goldCurrent,
    realEstateValue: reCurrent,
  };
}

function buildPortfolio(
  dbP: DBPortfolio,
  holdings: Holding[],
  fds: FixedDeposit[],
  rdAccounts: RDAccount[],
  sipAccounts: SIPAccount[],
  ssyAccounts: SSYAccount[],
  gold: GoldHolding[],
  realEstate: RealEstate[],
  insurances: Insurance[],
  docs: DocumentMetadata[]
): Portfolio {
  const totals = recalcPortfolioTotals(holdings, fds, rdAccounts, sipAccounts, ssyAccounts, gold, realEstate);

  return {
    id: dbP.id,
    name: dbP.name,
    label: dbP.label,
    created_at: dbP.created_at,
    holdings,
    fixedDeposits: fds,
    rdAccounts,
    sipAccounts,
    ssyAccounts,
    goldHoldings: gold,
    realEstate,
    insurances,
    documents: docs,
    ...totals,
  };
}

function applyLivePrices(portfolios: Portfolio[], priceMap: Record<string, { ltp: number; todayPct: number }>): Portfolio[] {
  return portfolios.map((portfolio) => {
    const updatedHoldings = portfolio.holdings.map((h) => {
      const live = priceMap[h.yahooSymbol];
      if (!live) return h;
      const currentValue = h.qty * live.ltp;
      const unrealizedPnL = currentValue - h.amountInvested;
      const pnlPercent = h.amountInvested > 0 ? (unrealizedPnL / h.amountInvested) * 100 : 0;
      return { ...h, ltp: live.ltp, currentValue, unrealizedPnL, pnlPercent, todayPnLPercent: live.todayPct };
    });

    const totals = recalcPortfolioTotals(
      updatedHoldings,
      portfolio.fixedDeposits,
      portfolio.rdAccounts || [],
      portfolio.sipAccounts || [],
      portfolio.ssyAccounts || [],
      portfolio.goldHoldings,
      portfolio.realEstate
    );

    return {
      ...portfolio,
      holdings: updatedHoldings,
      ...totals,
    };
  });
}

function applyLiveMFNavs(portfolios: Portfolio[], navMap: Record<string, number>, staleSchemes: Set<string>): Portfolio[] {
  return portfolios.map((portfolio) => {
    const updatedSips = (portfolio.sipAccounts || []).map((s) => {
      if (s.mf_scheme_code && navMap[s.mf_scheme_code] !== undefined) {
        const nav = navMap[s.mf_scheme_code];
        const units = Number(s.units || 0);
        const currentValue = units * nav;
        const navIsStale = staleSchemes.has(s.mf_scheme_code);
        return { ...s, fallback_valuation: currentValue, navIsStale, liveNav: nav };
      } else if (s.mf_scheme_code) {
        return { ...s, navIsStale: true };
      }
      return s;
    });

    const totals = recalcPortfolioTotals(
      portfolio.holdings,
      portfolio.fixedDeposits,
      portfolio.rdAccounts || [],
      updatedSips,
      portfolio.ssyAccounts || [],
      portfolio.goldHoldings,
      portfolio.realEstate
    );

    return {
      ...portfolio,
      sipAccounts: updatedSips,
      ...totals,
    };
  });
}

function getFriendlyMessage(err: unknown): string {
  if (err instanceof AppApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

interface UsePortfolioDataOptions {
  onAuthExpired?: () => void;
}

interface AssetMutationOptions {
  reload?: boolean;
}

export function usePortfolioData({ onAuthExpired }: UsePortfolioDataOptions = {}) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthSnapshot[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');
  const [loadError, setLoadError] = useState<string>('');
  const [priceStatus, setPriceStatus] = useState<LoadStatus>('idle');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<Date | null>(null);
  const [isAuthRequired, setIsAuthRequired] = useState(false);

  const [lastPriceFetch, setLastPriceFetchState] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem('finance_last_price_fetch');
      return saved ? new Date(saved) : null;
    } catch {
      return null;
    }
  });

  const setLastPriceFetch = useCallback((date: Date) => {
    setLastPriceFetchState(date);
    try {
      localStorage.setItem('finance_last_price_fetch', date.toISOString());
    } catch { /* ignore */ }
  }, []);

  const PRICE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
  const isPriceStale = lastPriceFetch
    ? Date.now() - lastPriceFetch.getTime() > PRICE_CACHE_TTL_MS
    : true;

  const isMutatingRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);
  const mutationQueue = useRef<Promise<unknown>>(Promise.resolve());
  const lastRefreshRef = useRef<number>(0);

  const runMutation = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const nextPromise = new Promise<T>((resolve, reject) => {
      mutationQueue.current.then(async () => {
        isMutatingRef.current = true;
        setIsMutating(true);
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          isMutatingRef.current = false;
          setIsMutating(false);
        }
      }).catch(async () => {
        isMutatingRef.current = true;
        setIsMutating(true);
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          isMutatingRef.current = false;
          setIsMutating(false);
        }
      });
    });
    mutationQueue.current = nextPromise.catch(() => {});
    return nextPromise;
  }, []);

  const handleAuthExpired = useCallback(() => {
    setIsAuthRequired(true);
    onAuthExpired?.();
  }, [onAuthExpired]);

  const loadFromDB = useCallback(async (): Promise<DBData | null> => {
    return invokeFunction<DBData>('holdings-crud?action=list');
  }, []);

  const fetchLivePrices = useCallback(async (holdings: Holding[]): Promise<Record<string, { ltp: number; todayPct: number }>> => {
    if (holdings.length === 0) return {};
    const uniqueSymbols = Array.from(
      new Map(holdings.map((h) => [h.yahooSymbol, { ticker: h.ticker, yahooSymbol: h.yahooSymbol }])).values()
    );
    const json = await invokeFunction<{ data: QuoteResult[] }>('market-data', {
      method: 'POST',
      body: { symbols: uniqueSymbols },
    });
    const map: Record<string, { ltp: number; todayPct: number }> = {};
    const failed: string[] = [];
    json.data.forEach((r) => {
      const sym = uniqueSymbols.find((s) => s.ticker === r.ticker);
      if (!sym) return;
      if (r.ltp !== null && r.todayPct !== null) {
        map[sym.yahooSymbol] = { ltp: r.ltp, todayPct: r.todayPct };
      } else {
        failed.push(r.ticker);
      }
    });
    setFailedSymbols(failed);
    return map;
  }, []);

  const fetchLiveMFNavs = useCallback(async (sips: SIPAccount[]): Promise<{ navMap: Record<string, number>, staleSchemes: Set<string> }> => {
    const sipAccounts = sips.filter((s) => s.mf_scheme_code);
    const staleSchemes = new Set<string>();
    const navMap: Record<string, number> = {};
    if (sipAccounts.length === 0) return { navMap, staleSchemes };

    const uniqueSchemeCodes = Array.from(new Set(sipAccounts.map((s) => s.mf_scheme_code!)));

    const BATCH_SIZE = 4;
    for (let i = 0; i < uniqueSchemeCodes.length; i += BATCH_SIZE) {
      const batch = uniqueSchemeCodes.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (code) => {
          try {
            const details = await fetchNAV(code);
            if (details.isStale) {
              staleSchemes.add(code);
            }
            if (details.value > 0) {
              navMap[code] = details.value;
            }
          } catch (err) {
            console.warn(`[portfolio] Failed to fetch NAV for mutual fund scheme ${code}:`, err);
            staleSchemes.add(code);
          }
        })
      );
    }

    return { navMap, staleSchemes };
  }, []);

  // 1. IndexedDB cache read (Phase 5)
  useEffect(() => {
    let isMounted = true;
    async function init() {
      initNAVCache().catch(err => console.warn('[sipUtils] NAV cache init error:', err));
      if (!isMounted) return;
      try {
        const cached = await idb.get('portfolio_data_cache');
        if (!isMounted) return;
        if (cached && portfolios.length === 0) {
          const parsed = cached as { portfolios: Portfolio[]; netWorthHistory: NetWorthSnapshot[]; cachedAt: string };
          setPortfolios(parsed.portfolios);
          setNetWorthHistory(parsed.netWorthHistory || []);
          setCacheUpdatedAt(new Date(parsed.cachedAt));
          setIsUsingCachedData(true);
          setLoadStatus('success');
        }
      } catch (err) {
        console.warn('[portfolio] IndexedDB read error:', err);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. SWR fetch for Database assets (Phase 2)
  const { data: dbData, error: swrError, mutate: mutateAssets } = useSWR(
    'portfolio-assets',
    async () => {
      const envIssue = getEnvironmentIssue();
      if (envIssue) throw new AppApiError(envIssue, 'config');
      const data = await loadFromDB();
      if (!data || typeof data !== 'object') throw new Error('No data returned from database');
      return data;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // 6. Polling prices via SWR (Phase 2.1)
  const { data: livePrices, error: livePricesError, mutate: refreshPricesSWR } = useSWR(
    portfolios.length > 0 ? 'live-prices' : null,
    async () => {
      const allHoldings = portfolios.flatMap((p) => p.holdings);
      const allSips = portfolios.flatMap((p) => p.sipAccounts || []);
      if (allHoldings.length === 0 && allSips.length === 0) return null;
      const [priceMap, navData] = await Promise.all([
        allHoldings.length > 0 ? fetchLivePrices(allHoldings) : Promise.resolve({}),
        fetchLiveMFNavs(allSips),
      ]);
      return { priceMap, navData };
    },
    {
      refreshInterval: 15 * 60 * 1000, // auto-refresh every 15 min
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (!livePrices) return;
    setPortfolios((prev) => {
      const withPrices = applyLivePrices(prev, livePrices.priceMap);
      return applyLiveMFNavs(withPrices, livePrices.navData.navMap, livePrices.navData.staleSchemes);
    });
    setLastUpdated(new Date());
    setLastPriceFetch(new Date());
    setPriceStatus('success');
  }, [livePrices, setLastPriceFetch]);

  useEffect(() => {
    if (livePricesError) {
      console.error('[portfolio] SWR live prices fetch error:', livePricesError);
      if (livePricesError instanceof AppApiError && livePricesError.code === 'auth') {
        handleAuthExpired();
      }
      setPriceStatus('error');
    }
  }, [livePricesError, handleAuthExpired]);

  const refreshPrices = useCallback(async () => {
    if (portfolios.length === 0) return;
    setPriceStatus('loading');
    try {
      await refreshPricesSWR();
      setPriceStatus('success');
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') {
        handleAuthExpired();
      }
      setPriceStatus('error');
    }
  }, [portfolios.length, refreshPricesSWR, handleAuthExpired]);

  // 3. Process dbData when it updates
  useEffect(() => {
    if (!dbData) return;
    try {
      const dbPortfolios: DBPortfolio[] = dbData.portfolios || [];
      const dbHoldings: DBHolding[] = dbData.holdings || [];
      const dbFixedDeposits: FixedDeposit[] = (dbData.fixed_deposits || []).filter((f: FixedDeposit) => !f.fd_type || f.fd_type === 'regular');
      const dbRDAccounts: RDAccount[] = dbData.rd_accounts || [];
      const dbSIPAccounts: SIPAccount[] = dbData.sip_accounts || [];
      const dbSSYAccounts: SSYAccount[] = dbData.ssy_accounts || [];
      const dbGoldHoldings: GoldHolding[] = dbData.gold_holdings || [];
      const dbRealEstate: RealEstate[] = dbData.real_estate || [];
      const dbInsurances: Insurance[] = dbData.insurances || [];
      const dbDocuments: DocumentMetadata[] = dbData.documents || [];
      const dbNetWorthHistory: NetWorthSnapshot[] = dbData.net_worth_history || [];

      const sortedPortfolios = [...dbPortfolios].sort((a, b) => {
        if (a.name === 'personal') return -1;
        if (b.name === 'personal') return 1;

        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;

        return a.label.localeCompare(b.label);
      });

      const built = sortedPortfolios.map((dbP) => {
        const holdings = dbHoldings
          .filter((h) => h.portfolio_id === dbP.id)
          .sort((a, b) => a.sno - b.sno)
          .map(dbToHolding);

        const fds = dbFixedDeposits.filter((f) => f.portfolio_id === dbP.id);
        const rds = dbRDAccounts.filter((r) => r.portfolio_id === dbP.id);
        const sips = dbSIPAccounts.filter((s) => s.portfolio_id === dbP.id);
        const ssy = dbSSYAccounts.filter((s) => s.portfolio_id === dbP.id);
        const gold = dbGoldHoldings.filter((g) => g.portfolio_id === dbP.id);
        const realEstate = dbRealEstate.filter((r) => r.portfolio_id === dbP.id);
        const insurances = dbInsurances.filter((i) => i.portfolio_id === dbP.id);
        const docs = dbDocuments.filter((d) => d.portfolio_id === dbP.id);

        return buildPortfolio(dbP, holdings, fds, rds, sips, ssy, gold, realEstate, insurances, docs);
      });

      setPortfolios(built);
      setNetWorthHistory(dbNetWorthHistory);
      setIsUsingCachedData(false);
      setCacheUpdatedAt(new Date());
      setLoadStatus('success');

      // Write cache to IndexedDB
      idb.set('portfolio_data_cache', {
        portfolios: built,
        netWorthHistory: dbNetWorthHistory,
        cachedAt: new Date().toISOString(),
      }).catch((err) => {
        console.warn('[portfolio] IndexedDB write error:', err);
      });

      // Let SWR key handle live price / NAV fetching.
      // Trigger a prompt SWR update:
      setPriceStatus('loading');
      setTimeout(() => {
        refreshPricesSWR().catch((priceErr) => {
          console.error('[portfolio] initial SWR price fetch failed:', priceErr);
          if (priceErr instanceof AppApiError && priceErr.code === 'auth') {
            handleAuthExpired();
          }
          setPriceStatus('error');
        });
      }, 0);

    } catch (err) {
      console.error('[portfolio] Database parsing error:', err);
      setLoadStatus('error');
      setLoadError(getFriendlyMessage(err));
    }
  }, [dbData, handleAuthExpired, refreshPricesSWR]);

  // 4. Handle SWR Errors
  useEffect(() => {
    if (swrError) {
      console.error('[portfolio] SWR fetch error:', swrError);
      if (swrError instanceof AppApiError && swrError.code === 'auth') {
        handleAuthExpired();
        return;
      }
      // Try local cache fallback if not already loaded
      if (portfolios.length === 0) {
        let isMounted = true;
        idb.get('portfolio_data_cache').then((cached) => {
          if (!isMounted) return;
          if (cached) {
            const parsed = cached as { portfolios: Portfolio[]; netWorthHistory: NetWorthSnapshot[]; cachedAt: string };
            setPortfolios(parsed.portfolios);
            setNetWorthHistory(parsed.netWorthHistory || []);
            setCacheUpdatedAt(new Date(parsed.cachedAt));
            setIsUsingCachedData(true);
            setLoadError(getFriendlyMessage(swrError));
            setLoadStatus('success');
            setPriceStatus('error');
          } else {
            setLoadError(getFriendlyMessage(swrError));
            setLoadStatus('error');
          }
        }).catch((err) => {
          console.warn('[portfolio] IndexedDB read error during error fallback:', err);
          setLoadError(getFriendlyMessage(swrError));
          setLoadStatus('error');
        });
        return () => {
          isMounted = false;
        };
      }
    }
  }, [swrError, handleAuthExpired, portfolios.length]);

  const invalidateIDBCache = useCallback(async () => {
    try {
      await idb.del('portfolio_data_cache');
      setIsUsingCachedData(false);
      setCacheUpdatedAt(null);
    } catch (err) {
      console.warn('[portfolio] IndexedDB delete error:', err);
    }
  }, []);

  const load = useCallback(async () => {
    if (portfolios.length === 0) {
      setLoadStatus('loading');
    }
    setLoadError('');
    await mutateAssets();
  }, [mutateAssets, portfolios.length]);

  // document visibilitychange listener to refresh SWR hook data on focus/resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastRefreshRef.current < 300_000) return;
        lastRefreshRef.current = now;
        void load();
        void refreshPrices();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [load, refreshPrices]);

  // 5. Debounced refreshSnapshot (Phase 2.3)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshResolversRef = useRef<(() => void)[]>([]);

  const refreshSnapshot = useCallback(() => {
    return new Promise<void>((resolve) => {
      refreshResolversRef.current.push(resolve);

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          await load();
        } finally {
          const resolvers = refreshResolversRef.current;
          refreshResolversRef.current = [];
          resolvers.forEach((res) => res());
        }
      }, 500);
    });
  }, [load]);

  const addPortfolio = useCallback(async (name: string, label: string) => {
    return runMutation(async () => {
      try {
        await invokeFunction<unknown>('holdings-crud?action=add_portfolio', {
          method: 'POST',
          body: { name, label },
        });
        await invalidateIDBCache();
        await load();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
        throw err;
      }
    });
  }, [runMutation, load, handleAuthExpired, invalidateIDBCache]);

  const renamePortfolio = useCallback(async (portfolioId: string, newLabel: string) => {
    return runMutation(async () => {
      try {
        await invokeFunction<unknown>('holdings-crud?action=update', {
          method: 'PATCH',
          body: {
            asset_type: 'portfolio',
            id: portfolioId,
            label: newLabel,
          },
        });
        await invalidateIDBCache();
        setPortfolios((prev) =>
          prev.map((p) => (p.id === portfolioId ? { ...p, label: newLabel } : p))
        );
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
        throw err;
      }
    });
  }, [runMutation, handleAuthExpired, invalidateIDBCache]);

  const addAsset = useCallback(async (
    assetType: string,
    portfolioName: string,
    payload: AssetPayload,
    options: AssetMutationOptions = {}
  ) => {
    return runMutation(async () => {
      try {
        const finalPayload = { ...payload } as Record<string, unknown>;
        await invokeFunction<unknown>('holdings-crud?action=add', {
          method: 'POST',
          body: {
            asset_type: assetType,
            portfolioName,
            ...finalPayload,
          },
        });
        await invalidateIDBCache();
        if (options.reload !== false) {
          await load();
        }
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
        throw err;
      }
    });
  }, [runMutation, load, handleAuthExpired, invalidateIDBCache]);

  const updateAsset = useCallback(async (assetType: string, id: string, payload: Partial<AssetPayload>) => {
    return runMutation(async () => {
      try {
        const finalPayload = { ...payload } as Record<string, unknown>;
        await invokeFunction<unknown>('holdings-crud?action=update', {
          method: 'PATCH',
          body: {
            asset_type: assetType,
            id,
            ...finalPayload,
          },
        });
        await invalidateIDBCache();
        await load();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
        throw err;
      }
    });
  }, [runMutation, load, handleAuthExpired, invalidateIDBCache]);

  const deleteAsset = useCallback(async (assetType: string, id: string) => {
    return runMutation(async () => {
      try {
        await invokeFunction<unknown>('holdings-crud?action=delete', {
          method: 'DELETE',
          body: {
            asset_type: assetType,
            id,
          },
        });
        await invalidateIDBCache();
        await load();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
        throw err;
      }
    });
  }, [runMutation, load, handleAuthExpired, invalidateIDBCache]);

  const deletePortfolio = useCallback(async (portfolioId: string) => {
    return runMutation(async () => {
      try {
        await invokeFunction<unknown>('holdings-crud?action=delete', {
          method: 'DELETE',
          body: {
            asset_type: 'portfolio',
            id: portfolioId,
          },
        });
        await invalidateIDBCache();
        await load();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
        throw err;
      }
    });
  }, [runMutation, load, handleAuthExpired, invalidateIDBCache]);

  return {
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
    isMutating,
    isMutatingRef,
    lastPriceFetch,
    isPriceStale,
    load,
    refreshSnapshot,
    refreshPrices,
    addPortfolio,
    renamePortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
  };
}
