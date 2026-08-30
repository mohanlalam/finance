import { describe, it, expect, beforeEach, vi } from 'vitest';
import { marketDataService } from '../market-data/marketDataService';
import { yahooMarketDataProvider } from '../market-data/providers/yahooProvider';
import { setCachedQuote, clearPriceCache, getStaleQuote } from '../market-data/marketDataCache';
import { Holding } from '../../types/portfolio';

describe('MarketDataService 3-Tier Fallback Chain', () => {
  beforeEach(() => {
    clearPriceCache();
    vi.restoreAllMocks();
  });

  it('resolves prices from cache when live provider cannot reach network', async () => {
    vi.spyOn(yahooMarketDataProvider, 'getQuotes').mockResolvedValue(new Map());
    setCachedQuote('TCS.NS', 3850.5, 1.25);
    setCachedQuote('INFY.NS', 1780.0, -0.45);

    const mockHoldings: Holding[] = [
      {
        id: 'h-1',
        sno: 1,
        ticker: 'TCS',
        yahooSymbol: 'TCS.NS',
        stockName: 'Tata Consultancy Services',
        qty: 10,
        avgPrice: 3500,
        ltp: 3850.5,
        currentValue: 38505,
        amountInvested: 35000,
        unrealizedPnL: 3505,
        pnlPercent: 10.01,
        todayPnLPercent: 1.25,
      },
      {
        id: 'h-2',
        sno: 2,
        ticker: 'INFY',
        yahooSymbol: 'INFY.NS',
        stockName: 'Infosys Limited',
        qty: 20,
        avgPrice: 1600,
        ltp: 1780.0,
        currentValue: 35600,
        amountInvested: 32000,
        unrealizedPnL: 3600,
        pnlPercent: 11.25,
        todayPnLPercent: -0.45,
      },
    ];

    const res = await marketDataService.fetchLiveStockPrices(mockHoldings);
    expect(res.priceMap['TCS.NS']).toBeDefined();
    expect(res.priceMap['TCS.NS'].ltp).toBe(3850.5);
    expect(res.priceMap['INFY.NS']).toBeDefined();
    expect(res.priceMap['INFY.NS'].ltp).toBe(1780.0);
    expect(res.failedSymbols).toHaveLength(0);
  });

  it('retains stale quotes when fresh TTL expires during network dropout', () => {
    setCachedQuote('RELIANCE.NS', 2950, 0.8);
    const stale = getStaleQuote('RELIANCE.NS');
    expect(stale).toBeDefined();
    expect(stale?.ltp).toBe(2950);
  });

  it('handles empty holdings gracefully without network calls', async () => {
    const res = await marketDataService.fetchLiveStockPrices([]);
    expect(res.priceMap).toEqual({});
    expect(res.failedSymbols).toEqual([]);
  });
});
