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
  const stocks = target.reduce((s, p) => s + p.holdings.reduce((a, h) => a + h.currentValue, 0), 0);
  const fd = target.reduce((s, p) => s + p.fixedDeposits.reduce((a, f) => a + (f.status === 'matured' ? Number(f.maturity_amount) : Number(f.principal_amount)), 0), 0);
  const gold = target.reduce((s, p) => s + p.goldHoldings.reduce((a, g) => a + Number(g.current_valuation), 0), 0);
  const realEstate = target.reduce((s, p) => s + p.realEstate.reduce((a, r) => a + Number(r.current_valuation), 0), 0);
  const insuranceCover = target.reduce((s, p) => s + p.insurances.reduce((a, i) => a + Number(i.sum_assured), 0), 0);
  const insurancePremium = target.reduce((s, p) => s + p.insurances.reduce((a, i) => a + Number(i.premium_amount), 0), 0);
  return { stocks, fd, gold, realEstate, insuranceCover, insurancePremium };
}

/** Estimate today's P&L from intraday movement */
export function estimateTodayPnL(portfolio: Portfolio | null, all: Portfolio[]): number {
  const holdings = portfolio ? portfolio.holdings : all.flatMap((p) => p.holdings);
  return holdings.reduce((sum, h) => sum + (h.todayPnLPercent / 100) * h.currentValue, 0);
}

/** Get a specific portfolio by name */
export function getPortfolioByName(portfolios: Portfolio[], name: string): Portfolio | null {
  if (name === 'all') return null;
  return portfolios.find((p) => p.name === name) ?? null;
}
