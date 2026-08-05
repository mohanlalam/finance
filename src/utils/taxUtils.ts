import { Holding } from '../types/portfolio';

export interface TaxHarvestingDetails {
  holding: Holding;
  isLTCG: boolean;
  unrealizedPnL: number;
}

export interface TaxSummary {
  realizedSTCG: number;
  realizedLTCG: number;
  unrealizedSTCG: number;
  unrealizedLTCG: number;
  harvestableLosses: number;
  potentialTaxSavings: number;
  opportunities: TaxHarvestingDetails[];
  ltcgExemptionUsed: number;
  totalEstimatedTax: number;
}

export function calculateTaxHarvesting(holdings: Holding[]): TaxSummary {
  let unrealizedSTCG = 0;
  let unrealizedLTCG = 0;
  
  const opportunities: TaxHarvestingDetails[] = [];
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const h of holdings) {
    const pnl = h.unrealizedPnL;
    let isLTCG = false;
    
    if (h.created_at) {
      const ageMs = now - new Date(h.created_at).getTime();
      isLTCG = ageMs >= ONE_YEAR_MS;
    }

    if (isLTCG) {
      unrealizedLTCG += pnl;
    } else {
      unrealizedSTCG += pnl;
    }

    if (pnl < 0) {
      opportunities.push({
        holding: h,
        isLTCG,
        unrealizedPnL: pnl
      });
    }
  }

  const STCG_RATE = 0.20;
  const LTCG_RATE = 0.125;
  const LTCG_EXEMPTION = 125000;

  const harvestableLosses = opportunities.reduce((sum, o) => sum + Math.abs(o.unrealizedPnL), 0);
  
  // Tax savings estimation
  // If we have STCG gains, we can offset them first (higher tax rate)
  const stcgGain = Math.max(0, unrealizedSTCG);
  const ltcgGain = Math.max(0, unrealizedLTCG);
  const taxableLtcg = Math.max(0, ltcgGain - LTCG_EXEMPTION);
  
  const totalEstimatedTax = (stcgGain * STCG_RATE) + (taxableLtcg * LTCG_RATE);
  
  // Potential savings: Assume we offset STCG first, then LTCG
  let remainingLosses = harvestableLosses;
  let savings = 0;
  
  const stcgOffset = Math.min(stcgGain, remainingLosses);
  savings += stcgOffset * STCG_RATE;
  remainingLosses -= stcgOffset;
  
  const ltcgOffset = Math.min(taxableLtcg, remainingLosses);
  savings += ltcgOffset * LTCG_RATE;

  return {
    realizedSTCG: 0,
    realizedLTCG: 0,
    unrealizedSTCG,
    unrealizedLTCG,
    harvestableLosses,
    potentialTaxSavings: savings,
    opportunities: opportunities.sort((a, b) => a.unrealizedPnL - b.unrealizedPnL),
    ltcgExemptionUsed: Math.min(ltcgGain, LTCG_EXEMPTION),
    totalEstimatedTax
  };
}
