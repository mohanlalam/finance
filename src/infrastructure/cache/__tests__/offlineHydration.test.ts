// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setCachedPortfolioData,
  getCachedPortfolioData,
  invalidatePortfolioCache,
  isValidCachedData,
} from '../portfolioCache';
import { setInIDBCache, getFromIDBCache } from '../indexedDbCache';
import { Portfolio } from '../../../types/portfolio';

describe('PWA Offline Cache & Instant Hydration Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const samplePortfolios: Portfolio[] = [
    {
      id: 'p1',
      name: 'family-main',
      label: 'Main Family Vault',
      holdings: [],
      fixedDeposits: [],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      totalInvested: 500000,
      totalCurrentValue: 620000,
      totalPnL: 120000,
      totalPnLPercent: 24.0,
      stocksValue: 300000,
      fdValue: 120000,
      rdValue: 0,
      sipValue: 100000,
      goldValue: 100000,
      realEstateValue: 0,
    },
  ];

  it('validates cached portfolio payload correctly', () => {
    expect(isValidCachedData(null)).toBe(false);
    expect(isValidCachedData({})).toBe(false);
    expect(isValidCachedData({ portfolios: 'not-an-array' })).toBe(false);
    expect(isValidCachedData({ portfolios: samplePortfolios, version: 999 })).toBe(false);
    expect(isValidCachedData({ portfolios: samplePortfolios })).toBe(true);
  });

  it('stores and retrieves portfolio snapshot with timestamp', async () => {
    const netWorthHistory = [
      {
        snapshot_date: '2024-08-01',
        total_value: 620000,
        stocks_value: 300000,
        fd_value: 120000,
        rd_value: 0,
        sip_value: 100000,
        gold_value: 100000,
        real_estate_value: 0,
      },
    ];

    await setCachedPortfolioData(samplePortfolios, netWorthHistory);
    const cached = await getCachedPortfolioData();

    expect(cached).not.toBeNull();
    expect(cached?.portfolios.length).toBe(1);
    expect(cached?.portfolios[0].name).toBe('family-main');
    expect(cached?.portfolios[0].totalCurrentValue).toBe(620000);
    expect(cached?.netWorthHistory.length).toBe(1);
    expect(new Date(cached!.cachedAt).getTime()).toBeGreaterThan(0);
  });

  it('safely invalidates and purges offline cache on command', async () => {
    await setCachedPortfolioData(samplePortfolios, []);
    let cached = await getCachedPortfolioData();
    expect(cached).not.toBeNull();

    await invalidatePortfolioCache();
    cached = await getCachedPortfolioData();
    expect(cached).toBeNull();
  });

  it('falls back gracefully to memory/mock storage when IndexedDB is unavailable', async () => {
    // Test direct set/get fallback
    await setInIDBCache('test_key', { test: 123 });
    const result = await getFromIDBCache<{ test: number }>('test_key');
    expect(result).toEqual({ test: 123 });
  });
});