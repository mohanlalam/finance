import { useState, useCallback } from 'react';
import { Holding, Portfolio, FixedDeposit, GoldHolding, RealEstate, Insurance, DocumentMetadata } from '../types/portfolio';
import { getFDEffectiveValue } from '../utils/formatters';
import { AppApiError, getEnvironmentIssue, invokeFunction } from '../utils/apiClient';

const PORTFOLIO_CACHE_KEY = 'finance_portfolio_cache_v1';

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
}

interface DBPortfolio {
  id: string;
  name: string;
  label: string;
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
  gold_holdings?: GoldHolding[];
  real_estate?: RealEstate[];
  insurances?: Insurance[];
  documents?: DocumentMetadata[];
  net_worth_history?: NetWorthSnapshot[];
}

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface PortfolioCache {
  portfolios: Portfolio[];
  netWorthHistory: NetWorthSnapshot[];
  cachedAt: string;
}

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
  };
}

function buildPortfolio(
  dbP: DBPortfolio,
  holdings: Holding[],
  fds: FixedDeposit[],
  gold: GoldHolding[],
  realEstate: RealEstate[],
  insurances: Insurance[],
  docs: DocumentMetadata[]
): Portfolio {
  const stockInvested = holdings.reduce((sum, h) => sum + h.amountInvested, 0);
  const stockCurrent = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  const fdInvested = fds.reduce((sum, f) => sum + Number(f.principal_amount), 0);
  const fdCurrent = fds.reduce((sum, f) => sum + getFDEffectiveValue(f), 0);

  const goldInvested = gold.reduce((sum, g) => sum + Number(g.purchase_price), 0);
  const goldCurrent = gold.reduce((sum, g) => sum + Number(g.current_valuation), 0);

  const reInvested = realEstate.reduce((sum, r) => sum + Number(r.purchase_price), 0);
  const reCurrent = realEstate.reduce((sum, r) => sum + Number(r.current_valuation), 0);

  const totalInvested = stockInvested + fdInvested + goldInvested + reInvested;
  const totalCurrentValue = stockCurrent + fdCurrent + goldCurrent + reCurrent;
  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    id: dbP.id,
    name: dbP.name,
    label: dbP.label,
    holdings,
    fixedDeposits: fds,
    goldHoldings: gold,
    realEstate,
    insurances,
    documents: docs,
    totalInvested,
    totalCurrentValue,
    totalPnL,
    totalPnLPercent,
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

    const stockInvested = updatedHoldings.reduce((sum, h) => sum + h.amountInvested, 0);
    const stockCurrent = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);

    const fdInvested = portfolio.fixedDeposits.reduce((sum, f) => sum + Number(f.principal_amount), 0);
    const fdCurrent = portfolio.fixedDeposits.reduce((sum, f) => sum + getFDEffectiveValue(f), 0);

    const goldInvested = portfolio.goldHoldings.reduce((sum, g) => sum + Number(g.purchase_price), 0);
    const goldCurrent = portfolio.goldHoldings.reduce((sum, g) => sum + Number(g.current_valuation), 0);

    const reInvested = portfolio.realEstate.reduce((sum, r) => sum + Number(r.purchase_price), 0);
    const reCurrent = portfolio.realEstate.reduce((sum, r) => sum + Number(r.current_valuation), 0);

    const totalInvested = stockInvested + fdInvested + goldInvested + reInvested;
    const totalCurrentValue = stockCurrent + fdCurrent + goldCurrent + reCurrent;
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      ...portfolio,
      holdings: updatedHoldings,
      totalInvested,
      totalCurrentValue,
      totalPnL,
      totalPnLPercent,
    };
  });
}

function applyLiveMFNavs(portfolios: Portfolio[], navMap: Record<string, number>): Portfolio[] {
  return portfolios.map((portfolio) => {
    const updatedFDs = portfolio.fixedDeposits.map((f) => {
      if (f.fd_type === 'sip' && f.mf_scheme_code && navMap[f.mf_scheme_code] !== undefined) {
        const nav = navMap[f.mf_scheme_code];
        const units = Number(f.units || 0);
        const currentValue = units * nav;
        return { ...f, maturity_amount: currentValue };
      }
      return f;
    });

    const stockInvested = portfolio.holdings.reduce((sum, h) => sum + h.amountInvested, 0);
    const stockCurrent = portfolio.holdings.reduce((sum, h) => sum + h.currentValue, 0);

    const fdInvested = updatedFDs.reduce((sum, f) => sum + Number(f.principal_amount), 0);
    const fdCurrent = updatedFDs.reduce((sum, f) => sum + getFDEffectiveValue(f), 0);

    const goldInvested = portfolio.goldHoldings.reduce((sum, g) => sum + Number(g.purchase_price), 0);
    const goldCurrent = portfolio.goldHoldings.reduce((sum, g) => sum + Number(g.current_valuation), 0);

    const reInvested = portfolio.realEstate.reduce((sum, r) => sum + Number(r.purchase_price), 0);
    const reCurrent = portfolio.realEstate.reduce((sum, r) => sum + Number(r.current_valuation), 0);

    const totalInvested = stockInvested + fdInvested + goldInvested + reInvested;
    const totalCurrentValue = stockCurrent + fdCurrent + goldCurrent + reCurrent;
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      ...portfolio,
      fixedDeposits: updatedFDs,
      totalInvested,
      totalCurrentValue,
      totalPnL,
      totalPnLPercent,
    };
  });
}

function getFriendlyMessage(err: unknown): string {
  if (err instanceof AppApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

function readCachedPortfolios(): PortfolioCache | null {
  try {
    const raw = localStorage.getItem(PORTFOLIO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortfolioCache;
    if (!Array.isArray(parsed.portfolios) || !parsed.cachedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedPortfolios(portfolios: Portfolio[], netWorthHistory: NetWorthSnapshot[]): void {
  try {
    localStorage.setItem(PORTFOLIO_CACHE_KEY, JSON.stringify({
      portfolios,
      netWorthHistory,
      cachedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[portfolio] failed to write local cache:', err);
  }
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

  const fetchLiveMFNavs = useCallback(async (fds: FixedDeposit[]): Promise<Record<string, number>> => {
    const sipFds = fds.filter((f) => f.fd_type === 'sip' && f.mf_scheme_code);
    if (sipFds.length === 0) return {};

    const uniqueSchemeCodes = Array.from(new Set(sipFds.map((f) => f.mf_scheme_code!)));
    const navMap: Record<string, number> = {};

    await Promise.all(
      uniqueSchemeCodes.map(async (code) => {
        try {
          const cacheKey = `mf_nav_${code}`;
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
              navMap[code] = parsed.nav;
              return;
            }
          }

          const res = await fetch(`https://api.mfapi.in/mf/${code}`);
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            const nav = parseFloat(json.data[0].nav);
            if (!isNaN(nav)) {
              navMap[code] = nav;
              sessionStorage.setItem(cacheKey, JSON.stringify({ nav, timestamp: Date.now() }));
            }
          }
        } catch (err) {
          console.warn(`[portfolio] Failed to fetch NAV for mutual fund scheme ${code}:`, err);
        }
      })
    );

    return navMap;
  }, []);

  const load = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError('');
    setIsUsingCachedData(false);
    setIsAuthRequired(false);
    try {
      const envIssue = getEnvironmentIssue();
      if (envIssue) throw new AppApiError(envIssue, 'config');

      const data = await loadFromDB();
      if (!data || typeof data !== 'object') throw new Error('No data returned from database');

      const dbPortfolios: DBPortfolio[] = data.portfolios || [];
      const dbHoldings: DBHolding[] = data.holdings || [];
      const dbFixedDeposits: FixedDeposit[] = data.fixed_deposits || [];
      const dbGoldHoldings: GoldHolding[] = data.gold_holdings || [];
      const dbRealEstate: RealEstate[] = data.real_estate || [];
      const dbInsurances: Insurance[] = data.insurances || [];
      const dbDocuments: DocumentMetadata[] = data.documents || [];
      const dbNetWorthHistory: NetWorthSnapshot[] = data.net_worth_history || [];

      // Sort portfolios: put personal/mother/wife in front, others later
      const order: Record<string, number> = { personal: 0, mother: 1, wife: 2 };
      const sortedPortfolios = [...dbPortfolios].sort((a, b) => {
        const oa = order[a.name] !== undefined ? order[a.name] : 99;
        const ob = order[b.name] !== undefined ? order[b.name] : 99;
        return oa - ob;
      });

      const built = sortedPortfolios.map((dbP) => {
        const holdings = dbHoldings
          .filter((h) => h.portfolio_id === dbP.id)
          .sort((a, b) => a.sno - b.sno)
          .map(dbToHolding);

        const fds = dbFixedDeposits.filter((f) => f.portfolio_id === dbP.id);
        const gold = dbGoldHoldings.filter((g) => g.portfolio_id === dbP.id);
        const realEstate = dbRealEstate.filter((r) => r.portfolio_id === dbP.id);
        const insurances = dbInsurances.filter((i) => i.portfolio_id === dbP.id);
        const docs = dbDocuments.filter((d) => d.portfolio_id === dbP.id);

        return buildPortfolio(dbP, holdings, fds, gold, realEstate, insurances, docs);
      });

      setPortfolios(built);
      setNetWorthHistory(dbNetWorthHistory);
      writeCachedPortfolios(built, dbNetWorthHistory);
      setCacheUpdatedAt(new Date());
      setLoadStatus('success');

      setPriceStatus('loading');
      try {
        const allHoldings = built.flatMap((p) => p.holdings);
        const allFDs = built.flatMap((p) => p.fixedDeposits);

        const [priceMap, navMap] = await Promise.all([
          allHoldings.length > 0 ? fetchLivePrices(allHoldings) : Promise.resolve({}),
          fetchLiveMFNavs(allFDs),
        ]);

        setPortfolios((prev) => {
          const withPrices = applyLivePrices(prev, priceMap);
          return applyLiveMFNavs(withPrices, navMap);
        });

        setLastUpdated(new Date());
        setPriceStatus('success');
      } catch (priceErr: unknown) {
        console.error('[portfolio] price fetch failed:', priceErr);
        if (priceErr instanceof AppApiError && priceErr.code === 'auth') {
          handleAuthExpired();
          return;
        }
        setPriceStatus('error');
      }
    } catch (err: unknown) {
      const cached = err instanceof AppApiError && err.code !== 'auth' ? readCachedPortfolios() : null;
      if (cached) {
        setPortfolios(cached.portfolios);
        setNetWorthHistory(cached.netWorthHistory || []);
        setCacheUpdatedAt(new Date(cached.cachedAt));
        setIsUsingCachedData(true);
        setLoadError(getFriendlyMessage(err));
        setLoadStatus('success');
        setPriceStatus('error');
        return;
      }

      const msg = getFriendlyMessage(err);
      console.error('[portfolio] load failed:', err);
      if (err instanceof AppApiError && err.code === 'auth') {
        handleAuthExpired();
      }
      setLoadError(msg);
      setLoadStatus('error');
    }
  }, [loadFromDB, fetchLivePrices, fetchLiveMFNavs, handleAuthExpired]);

  const refreshPrices = useCallback(async () => {
    if (portfolios.length === 0) return;
    setPriceStatus('loading');
    try {
      const allHoldings = portfolios.flatMap((p) => p.holdings);
      const allFDs = portfolios.flatMap((p) => p.fixedDeposits);

      const [priceMap, navMap] = await Promise.all([
        allHoldings.length > 0 ? fetchLivePrices(allHoldings) : Promise.resolve({}),
        fetchLiveMFNavs(allFDs),
      ]);

      setPortfolios((prev) => {
        const withPrices = applyLivePrices(prev, priceMap);
        return applyLiveMFNavs(withPrices, navMap);
      });

      setLastUpdated(new Date());
      setPriceStatus('success');
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') {
        handleAuthExpired();
      }
      setPriceStatus('error');
    }
  }, [portfolios, fetchLivePrices, fetchLiveMFNavs, handleAuthExpired]);

  const addPortfolio = useCallback(async (name: string, label: string) => {
    try {
      await invokeFunction<unknown>('holdings-crud?action=add_portfolio', {
        method: 'POST',
        body: { name, label },
      });
      await load();
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
      throw err;
    }
  }, [load, handleAuthExpired]);

  const renamePortfolio = useCallback(async (portfolioId: string, newLabel: string) => {
    try {
      await invokeFunction<unknown>('holdings-crud?action=update', {
        method: 'PATCH',
        body: {
          asset_type: 'portfolio',
          id: portfolioId,
          label: newLabel,
        },
      });
      setPortfolios((prev) =>
        prev.map((p) => (p.id === portfolioId ? { ...p, label: newLabel } : p))
      );
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
      throw err;
    }
  }, [handleAuthExpired]);

  const addAsset = useCallback(async (
    assetType: string,
    portfolioName: string,
    payload: Record<string, unknown>,
    options: AssetMutationOptions = {}
  ) => {
    try {
      await invokeFunction<unknown>('holdings-crud?action=add', {
        method: 'POST',
        body: {
          asset_type: assetType,
          portfolioName,
          ...payload,
        },
      });
      if (options.reload !== false) {
        await load();
      }
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
      throw err;
    }
  }, [load, handleAuthExpired]);

  const updateAsset = useCallback(async (assetType: string, id: string, payload: Record<string, unknown>) => {
    try {
      await invokeFunction<unknown>('holdings-crud?action=update', {
        method: 'PATCH',
        body: {
          asset_type: assetType,
          id,
          ...payload,
        },
      });
      await load();
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
      throw err;
    }
  }, [load, handleAuthExpired]);

  const deleteAsset = useCallback(async (assetType: string, id: string) => {
    try {
      await invokeFunction<unknown>('holdings-crud?action=delete', {
        method: 'DELETE',
        body: {
          asset_type: assetType,
          id,
        },
      });
      await load();
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
      throw err;
    }
  }, [load, handleAuthExpired]);

  const deletePortfolio = useCallback(async (portfolioId: string) => {
    try {
      await invokeFunction<unknown>('holdings-crud?action=delete', {
        method: 'DELETE',
        body: {
          asset_type: 'portfolio',
          id: portfolioId,
        },
      });
      await load();
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') handleAuthExpired();
      throw err;
    }
  }, [load, handleAuthExpired]);

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
    load,
    refreshPrices,
    addPortfolio,
    renamePortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
  };
}
