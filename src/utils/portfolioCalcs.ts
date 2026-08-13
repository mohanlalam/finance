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

/** Compute the portfolio-level stock totals from holdings in a single pass */
export function holdingsTotals(holdings: Holding[]) {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  for (let i = 0; i < holdings.length; i++) {
    totalInvested += holdings[i].amountInvested || 0;
    totalCurrentValue += holdings[i].currentValue || 0;
  }
  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  return { totalInvested, totalCurrentValue, totalPnL, totalPnLPercent };
}

/** Compute asset class breakdown across portfolios in a SINGLE PASS */
export function classBreakdown(portfolios: Portfolio[], scope: Portfolio | null) {
  let stocks = 0;
  let fd = 0;
  let rd = 0;
  let sip = 0;
  let gold = 0;
  let realEstate = 0;
  let insuranceCover = 0;
  let insurancePremium = 0;

  const target = scope ? [scope] : portfolios;
  for (let i = 0; i < target.length; i++) {
    const p = target[i];
    stocks += p.stocksValue || 0;
    fd += p.fdValue || 0;
    rd += p.rdValue || 0;
    sip += p.sipValue || 0;
    gold += p.goldValue || 0;
    realEstate += p.realEstateValue || 0;

    const ins = p.insurances;
    if (ins) {
      for (let j = 0; j < ins.length; j++) {
        insuranceCover += Number(ins[j].sum_assured || 0);
        insurancePremium += Number(ins[j].premium_amount || 0);
      }
    }
  }

  return { stocks, fd, rd, sip, gold, realEstate, insuranceCover, insurancePremium };
}

/** Estimate today's P&L from intraday movement without array allocations */
export function estimateTodayPnL(portfolio: Portfolio | null, all: Portfolio[]): number {
  let sum = 0;
  if (portfolio) {
    const holdings = portfolio.holdings || [];
    for (let i = 0; i < holdings.length; i++) {
      const h = holdings[i];
      const factor = 1 + h.todayPnLPercent / 100;
      const yesterdayValue = factor !== 0 ? h.currentValue / factor : h.currentValue;
      sum += h.currentValue - yesterdayValue;
    }
  } else {
    for (let i = 0; i < all.length; i++) {
      const holdings = all[i].holdings || [];
      for (let j = 0; j < holdings.length; j++) {
        const h = holdings[j];
        const factor = 1 + h.todayPnLPercent / 100;
        const yesterdayValue = factor !== 0 ? h.currentValue / factor : h.currentValue;
        sum += h.currentValue - yesterdayValue;
      }
    }
  }
  return sum;
}

/** Get a specific portfolio by name */
export function getPortfolioByName(portfolios: Portfolio[], name: string): Portfolio | null {
  if (name === 'all') return null;
  for (let i = 0; i < portfolios.length; i++) {
    if (portfolios[i].name === name) return portfolios[i];
  }
  return null;
}


