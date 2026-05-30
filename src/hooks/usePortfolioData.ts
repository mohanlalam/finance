import { useState, useCallback } from 'react';
import { Holding, Portfolio, FixedDeposit, GoldHolding, RealEstate, Insurance, DocumentMetadata } from '../types/portfolio';
import { getFDEffectiveValue } from '../utils/formatters';
import { getHashedPin } from '../utils/auth';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

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

interface DBData {
  portfolios?: DBPortfolio[];
  holdings?: DBHolding[];
  fixed_deposits?: FixedDeposit[];
  gold_holdings?: GoldHolding[];
  real_estate?: RealEstate[];
  insurances?: Insurance[];
  documents?: DocumentMetadata[];
}

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

function crudHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'X-App-Pin': getHashedPin(),
  };
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

export function usePortfolioData() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');
  const [loadError, setLoadError] = useState<string>('');
  const [priceStatus, setPriceStatus] = useState<LoadStatus>('idle');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);

  const loadFromDB = useCallback(async (): Promise<DBData | null> => {
    if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL is not configured');
    const url = `${SUPABASE_URL}/functions/v1/holdings-crud?action=list`;
    const res = await fetch(url, { headers: crudHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} from holdings-crud: ${text.slice(0, 200)}`);
    }
    return res.json();
  }, []);

  const fetchLivePrices = useCallback(async (holdings: Holding[]): Promise<Record<string, { ltp: number; todayPct: number }>> => {
    if (holdings.length === 0) return {};
    const uniqueSymbols = Array.from(
      new Map(holdings.map((h) => [h.yahooSymbol, { ticker: h.ticker, yahooSymbol: h.yahooSymbol }])).values()
    );
    const res = await fetch(`${SUPABASE_URL}/functions/v1/market-data`, {
      method: 'POST',
      headers: crudHeaders(),
      body: JSON.stringify({ symbols: uniqueSymbols }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: { data: QuoteResult[] } = await res.json();
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

  const load = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError('');
    try {
      const data = await loadFromDB();
      if (!data || typeof data !== 'object') throw new Error('No data returned from database');

      const dbPortfolios: DBPortfolio[] = data.portfolios || [];
      const dbHoldings: DBHolding[] = data.holdings || [];
      const dbFixedDeposits: FixedDeposit[] = data.fixed_deposits || [];
      const dbGoldHoldings: GoldHolding[] = data.gold_holdings || [];
      const dbRealEstate: RealEstate[] = data.real_estate || [];
      const dbInsurances: Insurance[] = data.insurances || [];
      const dbDocuments: DocumentMetadata[] = data.documents || [];

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
      setLoadStatus('success');

      setPriceStatus('loading');
      try {
        const allHoldings = built.flatMap((p) => p.holdings);
        if (allHoldings.length > 0) {
          const priceMap = await fetchLivePrices(allHoldings);
          setPortfolios((prev) => applyLivePrices(prev, priceMap));
        }
        setLastUpdated(new Date());
        setPriceStatus('success');
      } catch (priceErr: unknown) {
        console.error('[portfolio] price fetch failed:', priceErr);
        setPriceStatus('error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[portfolio] load failed:', msg);
      setLoadError(msg);
      setLoadStatus('error');
    }
  }, [loadFromDB, fetchLivePrices]);

  const refreshPrices = useCallback(async () => {
    if (portfolios.length === 0) return;
    setPriceStatus('loading');
    try {
      const allHoldings = portfolios.flatMap((p) => p.holdings);
      if (allHoldings.length > 0) {
        const priceMap = await fetchLivePrices(allHoldings);
        setPortfolios((prev) => applyLivePrices(prev, priceMap));
      }
      setLastUpdated(new Date());
      setPriceStatus('success');
    } catch {
      setPriceStatus('error');
    }
  }, [portfolios, fetchLivePrices]);

  const addPortfolio = useCallback(async (name: string, label: string) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/holdings-crud?action=add_portfolio`, {
      method: 'POST',
      headers: crudHeaders(),
      body: JSON.stringify({ name, label }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to add family member');
    await load();
  }, [load]);

  const renamePortfolio = useCallback(async (portfolioId: string, newLabel: string) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/holdings-crud?action=update`, {
      method: 'PATCH',
      headers: crudHeaders(),
      body: JSON.stringify({
        asset_type: 'portfolio',
        id: portfolioId,
        label: newLabel,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to rename portfolio');
    setPortfolios((prev) =>
      prev.map((p) => (p.id === portfolioId ? { ...p, label: newLabel } : p))
    );
  }, []);

  const addAsset = useCallback(async (assetType: string, portfolioName: string, payload: Record<string, unknown>) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/holdings-crud?action=add`, {
      method: 'POST',
      headers: crudHeaders(),
      body: JSON.stringify({
        asset_type: assetType,
        portfolioName,
        ...payload,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `Failed to add ${assetType}`);
    await load();
  }, [load]);

  const updateAsset = useCallback(async (assetType: string, id: string, payload: Record<string, unknown>) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/holdings-crud?action=update`, {
      method: 'PATCH',
      headers: crudHeaders(),
      body: JSON.stringify({
        asset_type: assetType,
        id,
        ...payload,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `Failed to update ${assetType}`);
    await load();
  }, [load]);

  const deleteAsset = useCallback(async (assetType: string, id: string) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/holdings-crud?action=delete`, {
      method: 'DELETE',
      headers: crudHeaders(),
      body: JSON.stringify({
        asset_type: assetType,
        id,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `Failed to delete ${assetType}`);
    await load();
  }, [load]);

  return {
    portfolios,
    loadStatus,
    loadError,
    priceStatus,
    lastUpdated,
    failedSymbols,
    load,
    refreshPrices,
    addPortfolio,
    renamePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
  };
}
