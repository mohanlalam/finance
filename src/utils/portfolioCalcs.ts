import { Holding, Portfolio } from '../types/portfolio';

/** Sum invested amounts across holdings */
export function calcTotalInvested(holdings: Holding[]): number {
  return holdings.reduce((s, h) => s + h.amountInvested, 0);
}

/** Sum current values across holdings */
export function calcTotalCurrentValue(holdings: Holding[]): number {
  return holdings.reduce((s, h) => s + h.currentValue, 0);
}

/** Sum unrealized P&L across holdings */
export function calcTotalPnL(holdings: Holding[]): number {
  return holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
}

/** Calculate P&L percentage from holdings */
export function calcPnLPercent(holdings: Holding[]): number {
  const inv = calcTotalInvested(holdings);
  const pnl = calcTotalPnL(holdings);
  return inv > 0 ? (pnl / inv) * 100 : 0;
}

/** Compute the portfolio-level stock totals from holdings */
export function holdingsTotals(holdings: Holding[]) {
  const totalInvested = calcTotalInvested(holdings);
  const totalCurrentValue = calcTotalCurrentValue(holdings);
  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  return { totalInvested, totalCurrentValue, totalPnL, totalPnLPercent };
}

/** Compute asset class breakdown across portfolios */
export function classBreakdown(portfolios: Portfolio[], scope: Portfolio | null) {
  const target = scope ? [scope] : portfolios;
  const stocks = target.reduce((s, p) => s + p.stocksValue, 0);
  const fd = target.reduce((s, p) => s + p.fdValue, 0);
  const rd = target.reduce((s, p) => s + p.rdValue, 0);
  const ssy = target.reduce((s, p) => s + p.ssyValue, 0);
  const sip = target.reduce((s, p) => s + p.sipValue, 0);
  const gold = target.reduce((s, p) => s + p.goldValue, 0);
  const realEstate = target.reduce((s, p) => s + p.realEstateValue, 0);
  const insuranceCover = target.reduce((s, p) => s + p.insurances.reduce((a, i) => a + Number(i.sum_assured), 0), 0);
  const insurancePremium = target.reduce((s, p) => s + p.insurances.reduce((a, i) => a + Number(i.premium_amount), 0), 0);
  
  return { stocks, fd, rd, ssy, sip, gold, realEstate, insuranceCover, insurancePremium };
}

/** Estimate today's P&L from intraday movement */
export function estimateTodayPnL(portfolio: Portfolio | null, all: Portfolio[]): number {
  const holdings = portfolio ? portfolio.holdings : all.flatMap((p) => p.holdings);
  return holdings.reduce((sum, h) => {
    // Derive yesterday's closing value, then compute today's absolute change
    const factor = 1 + h.todayPnLPercent / 100;
    const yesterdayValue = factor !== 0 ? h.currentValue / factor : h.currentValue;
    return sum + (h.currentValue - yesterdayValue);
  }, 0);
}

/** Get a specific portfolio by name */
export function getPortfolioByName(portfolios: Portfolio[], name: string): Portfolio | null {
  if (name === 'all') return null;
  return portfolios.find((p) => p.name === name) ?? null;
}


