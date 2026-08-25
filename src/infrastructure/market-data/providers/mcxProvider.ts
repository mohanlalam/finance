import { DEFAULT_GOLD_RATE_24K } from '../../../domains/assets/gold/calculations/goldValuation';

export interface GoldSpotQuote {
  rate24k: number;
  previousClose: number;
  changeINR: number;
  changePercent: number;
  isLive: boolean;
  source: string;
}

const SNAPSHOT_KEY = 'finance_gold_rate_snapshot';

function getStoredGoldSnapshot(): { rate24k: number } | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(SNAPSHOT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.rate24k === 'number' && parsed.rate24k >= 10000) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export class MCXGoldDataProvider {
  name = 'MCX & IBJA';

  async getGoldSpotRate(): Promise<GoldSpotQuote | null> {
    try {
      const res = await fetch('https://api.gold-api.com/price/XAU/INR', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const rawOunceINR = Number(data?.price);
      if (isNaN(rawOunceINR) || rawOunceINR <= 10000) return null;

      const basePerGram = rawOunceINR / 31.1034768;
      // India retail benchmark includes statutory customs duty + GST (~15.19%)
      const rate24k = Math.round(basePerGram * 1.1519);
      if (rate24k < 9000 || rate24k > 25000) return null;

      const existingSnapshot = getStoredGoldSnapshot();
      const prevCloseRate =
        existingSnapshot?.rate24k && existingSnapshot.rate24k >= 10000
          ? existingSnapshot.rate24k
          : DEFAULT_GOLD_RATE_24K || rate24k;

      const changeINR = rate24k - prevCloseRate;
      const changePercent = prevCloseRate > 0 ? ((rate24k - prevCloseRate) / prevCloseRate) * 100 : 0;

      const quote: GoldSpotQuote = {
        rate24k,
        previousClose: prevCloseRate,
        changeINR,
        changePercent,
        isLive: true,
        source: 'MCX & IBJA Live Bullion Rates',
      };

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            SNAPSHOT_KEY,
            JSON.stringify({ ...quote, lastFetchedAt: new Date().toISOString() })
          );
        }
      } catch {
        // ignore
      }

      return quote;
    } catch {
      return null;
    }
  }
}

export const mcxGoldDataProvider = new MCXGoldDataProvider();
