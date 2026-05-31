import { useState, useCallback } from 'react';
import { Portfolio } from '../types/portfolio';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

interface QuoteResult {
  ticker: string;
  ltp: number | null;
  todayPct: number | null;
  error?: string;
}

export interface LivePrices {
  [yahooSymbol: string]: { ltp: number; todayPct: number };
}

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

function applyLivePrices(portfolios: Portfolio[], livePrices: LivePrices): Portfolio[] {
  return portfolios.map((portfolio) => {
    const updatedHoldings = portfolio.holdings.map((h) => {
      const live = livePrices[h.yahooSymbol];
      if (!live) return h;
      const ltp = live.ltp;
      const currentValue = h.qty * ltp;
      const unrealizedPnL = currentValue - h.amountInvested;
      const pnlPercent = h.amountInvested > 0 ? (unrealizedPnL / h.amountInvested) * 100 : 0;
      return { ...h, ltp, currentValue, unrealizedPnL, pnlPercent, todayPnLPercent: live.todayPct };
    });
    const totalInvested = updatedHoldings.reduce((s, h) => s + h.amountInvested, 0);
    const totalCurrentValue = updatedHoldings.reduce((s, h) => s + h.currentValue, 0);
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    return { ...portfolio, holdings: updatedHoldings, totalInvested, totalCurrentValue, totalPnL, totalPnLPercent };
  });
}

function crudHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };

  if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  return headers;
}

async function fetchLivePricesFromSupabase(symbols: { ticker: string; yahooSymbol: string }[]): Promise<QuoteResult[]> {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL is not configured');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/market-data`, {
    method: 'POST',
    headers: crudHeaders(),
    body: JSON.stringify({ symbols }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: { data: QuoteResult[] } = await res.json();
  return json.data;
}

export function useMarketData(basePortfolios: Portfolio[]) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(basePortfolios);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);

  const fetchPrices = useCallback(async () => {
    if (basePortfolios.flatMap((p) => p.holdings).length === 0) {
      setStatus('success');
      return;
    }
    setStatus('loading');

    const allHoldings = basePortfolios.flatMap((p) => p.holdings);
    const uniqueSymbols = Array.from(
      new Map(allHoldings.map((h) => [h.yahooSymbol, { ticker: h.ticker, yahooSymbol: h.yahooSymbol }])).values()
    );

    try {
      const results = await fetchLivePricesFromSupabase(uniqueSymbols);

      const livePrices: LivePrices = {};
      const failed: string[] = [];

      results.forEach((result) => {
        const holding = uniqueSymbols.find((s) => s.ticker === result.ticker);
        if (!holding) return;
        if (result.ltp !== null && result.todayPct !== null) {
          livePrices[holding.yahooSymbol] = { ltp: result.ltp, todayPct: result.todayPct };
        } else {
          failed.push(result.ticker);
        }
      });

      setPortfolios(applyLivePrices(basePortfolios, livePrices));
      setFailedSymbols(failed);
      setLastUpdated(new Date());
      setStatus('success');
    } catch (err) {
      console.error('Failed to fetch prices from Supabase:', err);
      setStatus('error');
    }
  }, [basePortfolios]);

  return { portfolios, status, lastUpdated, failedSymbols, fetchPrices };
}
