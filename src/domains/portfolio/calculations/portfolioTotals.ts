import { Holding, Portfolio } from '../../../types/portfolio';

export interface PortfolioTotals {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  todayPnL: number;
  todayPnLPercent: number;
  stocksValue: number;
  fdValue: number;
  rdValue: number;
  sipValue: number;
  goldValue: number;
  realEstateValue: number;
}


/**
 * Sum invested amounts across holdings safely.
 */
export function calcTotalInvested(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < holdings.length; i++) {
    sum += Number(holdings[i]?.amountInvested) || 0;
  }
  return sum;
}

/**
 * Sum current values across holdings safely.
 */
export function calcTotalCurrentValue(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < holdings.length; i++) {
    sum += Number(holdings[i]?.currentValue) || 0;
  }
  return sum;
}

/**
 * Sum unrealized P&L across holdings safely.
 */
export function calcTotalPnL(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < holdings.length; i++) {
    sum += Number(holdings[i]?.unrealizedPnL) || 0;
  }
  return sum;
}

/**
 * Calculate P&L percentage from holdings safely in a single pass.
 */
export function calcPnLPercent(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  const totals = holdingsTotals(holdings);
  return totals.totalPnLPercent;
}

/**
 * Compute the portfolio-level stock totals from holdings in a single pass.
 */
export function holdingsTotals(holdings: Holding[]) {
  if (!holdings || holdings.length === 0) {
    return { totalInvested: 0, totalCurrentValue: 0, totalPnL: 0, totalPnLPercent: 0 };
  }
  let totalInvested = 0;
  let totalCurrentValue = 0;
  for (let i = 0; i < holdings.length; i++) {
    totalInvested += Number(holdings[i]?.amountInvested) || 0;
    totalCurrentValue += Number(holdings[i]?.currentValue) || 0;
  }
  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  return { totalInvested, totalCurrentValue, totalPnL, totalPnLPercent };
}

/**
 * Accurate intraday PnL calculation for a single holding based on yesterday close (Method B - Exchange Standard).
 */
export function calcHoldingTodayPnL(h: { currentValue?: number; todayPnLPercent?: number } | null | undefined): number {
  if (!h) return 0;
  const curr = Number(h.currentValue) || 0;
  const pnlPct = Number(h.todayPnLPercent) || 0;
  if (isNaN(curr) || isNaN(pnlPct) || curr <= 0 || pnlPct === 0) return 0;
  const factor = 1 + pnlPct / 100;
  if (factor <= 0.0001) {
    return -curr; // 100% drop
  }
  const yesterdayValue = curr / factor;
  return isNaN(yesterdayValue) ? 0 : curr - yesterdayValue;
}

export const getHoldingTodayDelta = calcHoldingTodayPnL;

/**
 * Estimate today's P&L from intraday movement cleanly without NaN or zero-division bugs.
 */
export function estimateTodayPnL(portfolio: Portfolio | null, all: Portfolio[]): number {
  let sum = 0;

  if (portfolio && portfolio.holdings) {
    const holdings = portfolio.holdings;
    for (let i = 0; i < holdings.length; i++) {
      sum += calcHoldingTodayPnL(holdings[i]);
    }
  } else if (all && all.length > 0) {
    for (let i = 0; i < all.length; i++) {
      const holdings = all[i]?.holdings;
      if (holdings) {
        for (let j = 0; j < holdings.length; j++) {
          sum += calcHoldingTodayPnL(holdings[j]);
        }
      }
    }
  }

  return isNaN(sum) ? 0 : sum;
}

/**
 * Pure aggregation of full portfolio metrics.
 */
export function calculateAggregatedPortfolioTotals(portfolios: Portfolio[]): PortfolioTotals {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let stocksValue = 0;
  let fdValue = 0;
  let rdValue = 0;
  let sipValue = 0;
  let goldValue = 0;
  let realEstateValue = 0;
  let todayPnL = 0;

  for (let i = 0; i < portfolios.length; i++) {
    const p = portfolios[i];
    if (!p) continue;
    totalInvested += p.totalInvested || 0;
    totalCurrentValue += p.totalCurrentValue || 0;
    stocksValue += p.stocksValue || 0;
    fdValue += p.fdValue || 0;
    rdValue += p.rdValue || 0;
    sipValue += p.sipValue || 0;
    goldValue += p.goldValue || 0;
    realEstateValue += p.realEstateValue || 0;
    todayPnL += p.todayPnL || 0;
  }

  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const previousValue = totalCurrentValue - todayPnL;
  const todayPnLPercent = previousValue > 0 ? (todayPnL / previousValue) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalPnL,
    totalPnLPercent,
    todayPnL,
    todayPnLPercent,
    stocksValue,
    fdValue,
    rdValue,
    sipValue,
    goldValue,
    realEstateValue,
  };
}

/**
 * Get a specific portfolio by name.
 */
export function getPortfolioByName(portfolios: Portfolio[], name: string): Portfolio | null {
  if (!portfolios || name === 'all') return null;
  for (let i = 0; i < portfolios.length; i++) {
    if (portfolios[i]?.name === name) return portfolios[i];
  }
  return null;
}

