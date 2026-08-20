import { Holding, Portfolio } from '../types/portfolio';

/** Sum invested amounts across holdings safely */
export function calcTotalInvested(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < holdings.length; i++) {
    sum += Number(holdings[i]?.amountInvested) || 0;
  }
  return sum;
}

/** Sum current values across holdings safely */
export function calcTotalCurrentValue(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < holdings.length; i++) {
    sum += Number(holdings[i]?.currentValue) || 0;
  }
  return sum;
}

/** Sum unrealized P&L across holdings safely */
export function calcTotalPnL(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < holdings.length; i++) {
    sum += Number(holdings[i]?.unrealizedPnL) || 0;
  }
  return sum;
}

/** Calculate P&L percentage from holdings safely in a single pass */
export function calcPnLPercent(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  const totals = holdingsTotals(holdings);
  return totals.totalPnLPercent;
}

/** Compute the portfolio-level stock totals from holdings in a single pass */
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

/** Compute asset class breakdown across portfolios in a SINGLE PASS without array allocations */
export function classBreakdown(portfolios: Portfolio[], scope: Portfolio | null) {
  let stocks = 0;
  let fd = 0;
  let rd = 0;
  let sip = 0;
  let gold = 0;
  let realEstate = 0;
  let insuranceCover = 0;
  let insurancePremium = 0;

  const count = scope ? 1 : (portfolios ? portfolios.length : 0);
  for (let i = 0; i < count; i++) {
    const p = scope ? scope : portfolios[i];
    if (!p) continue;
    stocks += Number(p.stocksValue) || 0;
    fd += Number(p.fdValue) || 0;
    rd += Number(p.rdValue) || 0;
    sip += Number(p.sipValue) || 0;
    gold += Number(p.goldValue) || 0;
    realEstate += Number(p.realEstateValue) || 0;

    if (p.insurances) {
      for (let j = 0; j < p.insurances.length; j++) {
        insuranceCover += Number(p.insurances[j]?.sum_assured) || 0;
        insurancePremium += Number(p.insurances[j]?.premium_amount) || 0;
      }
    }
  }

  return { stocks, fd, rd, sip, gold, realEstate, insuranceCover, insurancePremium };
}

/** Accurate intraday PnL calculation for a single holding based on yesterday close (Method B - Exchange Standard) */
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

/** Legacy alias */
export const getHoldingTodayDelta = calcHoldingTodayPnL;

/** Estimate today's P&L from intraday movement cleanly without NaN or zero-division bugs */
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

/** Get a specific portfolio by name */
export function getPortfolioByName(portfolios: Portfolio[], name: string): Portfolio | null {
  if (!portfolios || name === 'all') return null;
  for (let i = 0; i < portfolios.length; i++) {
    if (portfolios[i]?.name === name) return portfolios[i];
  }
  return null;
}
