import { Holding } from '../../../types/portfolio';
import { INDIAN_TAX_RATES_2024 } from './capitalGains';

export interface TaxHarvestingDetails {
  holding: Holding;
  isLTCG: boolean;
  unrealizedPnL: number;
  washSaleWarning: boolean;
  isDebtOrGold: boolean;
}

export const TAX_DISCLAIMER = 'Estimates are for educational purposes. Consult a chartered accountant for tax filing.';

export interface TaxSummary {
  realizedSTCG: number;
  realizedLTCG: number;
  unrealizedSTCG: number;
  unrealizedLTCG: number;
  unrealizedDebtOrGold: number;
  harvestableLosses: number;
  potentialTaxSavings: number;
  opportunities: TaxHarvestingDetails[];
  ltcgExemptionUsed: number;
  totalEstimatedTax: number;
}

/**
 * Pure tax harvesting calculator distinguishing equity STCG (20%) / LTCG (12.5% over ₹1.25L)
 * from slab-rate debt and gold bullion assets.
 */
export function calculateTaxHarvesting(holdings: Holding[]): TaxSummary {
  let unrealizedSTCG = 0;
  let unrealizedLTCG = 0;
  let unrealizedDebtOrGold = 0;
  let stcgGrossGains = 0;
  let ltcgGrossGains = 0;

  const opportunities: TaxHarvestingDetails[] = [];
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const h of holdings) {
    const pnl = Number(h.unrealizedPnL) || 0;
    let isLTCG = false;

    if (h.created_at) {
      const ageMs = now - new Date(h.created_at).getTime();
      isLTCG = ageMs >= ONE_YEAR_MS;
    }

    const isDebtOrGold =
      h.ticker?.toUpperCase().includes('GOLD') ||
      h.ticker?.toUpperCase().includes('LIQUID') ||
      false;

    if (isDebtOrGold) {
      unrealizedDebtOrGold += pnl;
    } else if (isLTCG) {
      unrealizedLTCG += pnl;
      if (pnl > 0) ltcgGrossGains += pnl;
    } else {
      unrealizedSTCG += pnl;
      if (pnl > 0) stcgGrossGains += pnl;
    }

    if (pnl < 0) {
      opportunities.push({
        holding: h,
        isLTCG,
        unrealizedPnL: pnl,
        washSaleWarning: true,
        isDebtOrGold,
      });
    }
  }

  const STCG_RATE = INDIAN_TAX_RATES_2024.equitySTCG;
  const LTCG_RATE = INDIAN_TAX_RATES_2024.equityLTCG;
  const LTCG_EXEMPTION = INDIAN_TAX_RATES_2024.ltcgExemption;

  const harvestableLosses = opportunities.reduce((sum, o) => sum + Math.abs(o.unrealizedPnL), 0);

  // Separate equity STCL and LTCL according to Indian Income Tax Section 70 set-off rules:
  // - STCL can offset both STCG (at 20%) and LTCG (at 12.5%)
  // - LTCL can ONLY offset LTCG (at 12.5%), never STCG
  const equityStclLosses = opportunities
    .filter((o) => !o.isDebtOrGold && !o.isLTCG)
    .reduce((sum, o) => sum + Math.abs(o.unrealizedPnL), 0);

  const equityLtclLosses = opportunities
    .filter((o) => !o.isDebtOrGold && o.isLTCG)
    .reduce((sum, o) => sum + Math.abs(o.unrealizedPnL), 0);

  // Tax savings estimation for equity based on gross positive gains
  const stcgGain = stcgGrossGains;
  const ltcgGain = ltcgGrossGains;
  const taxableLtcg = Math.max(0, ltcgGain - LTCG_EXEMPTION);

  const totalEstimatedTax = (stcgGain * STCG_RATE) + (taxableLtcg * LTCG_RATE);

  // 1. Offset STCG with STCL (STCL offsets 20% tax)
  const stcgOffset = Math.min(stcgGain, equityStclLosses);
  const remainingStcl = equityStclLosses - stcgOffset;

  // 2. Offset LTCG with LTCL first, then any remaining STCL
  const totalLossesAvailableForLtcg = equityLtclLosses + remainingStcl;
  const ltcgOffset = Math.min(taxableLtcg, totalLossesAvailableForLtcg);

  const savings = (stcgOffset * STCG_RATE) + (ltcgOffset * LTCG_RATE);

  return {
    realizedSTCG: 0,
    realizedLTCG: 0,
    unrealizedSTCG,
    unrealizedLTCG,
    unrealizedDebtOrGold,
    harvestableLosses,
    potentialTaxSavings: savings,
    opportunities: opportunities.sort((a, b) => a.unrealizedPnL - b.unrealizedPnL),
    ltcgExemptionUsed: Math.min(ltcgGain, LTCG_EXEMPTION),
    totalEstimatedTax,
  };
}
