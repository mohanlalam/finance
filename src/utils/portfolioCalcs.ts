import { Holding, Portfolio } from '../types/portfolio';

/** Sum invested amounts across holdings safely */
export function calcTotalInvested(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  return holdings.reduce((s, h) => s + (Number(h?.amountInvested) || 0), 0);
}

/** Sum current values across holdings safely */
export function calcTotalCurrentValue(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  return holdings.reduce((s, h) => s + (Number(h?.currentValue) || 0), 0);
}

/** Sum unrealized P&L across holdings safely */
export function calcTotalPnL(holdings: Holding[]): number {
  if (!holdings || holdings.length === 0) return 0;
  return holdings.reduce((s, h) => s + (Number(h?.unrealizedPnL) || 0), 0);
}

/** Calculate P&L percentage from holdings safely */
export function calcPnLPercent(holdings: Holding[]): number {
  const inv = calcTotalInvested(holdings);
  const pnl = calcTotalPnL(holdings);
  return inv > 0 && !isNaN(inv) && !isNaN(pnl) ? (pnl / inv) * 100 : 0;
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

  const target = scope ? [scope] : (portfolios || []);
  for (let i = 0; i < target.length; i++) {
    const p = target[i];
    if (!p) continue;
    stocks += Number(p.stocksValue) || 0;
    fd += Number(p.fdValue) || 0;
    rd += Number(p.rdValue) || 0;
    sip += Number(p.sipValue) || 0;
    gold += Number(p.goldValue) || 0;
    realEstate += Number(p.realEstateValue) || 0;

    const ins = p.insurances;
    if (ins) {
      for (let j = 0; j < ins.length; j++) {
        insuranceCover += Number(ins[j]?.sum_assured) || 0;
        insurancePremium += Number(ins[j]?.premium_amount) || 0;
      }
    }
  }

  return { stocks, fd, rd, sip, gold, realEstate, insuranceCover, insurancePremium };
}

/** Estimate today's P&L from intraday movement cleanly without NaN or zero-division bugs */
export function estimateTodayPnL(portfolio: Portfolio | null, all: Portfolio[]): number {
  let sum = 0;

  const processHolding = (h: Holding) => {
    if (!h) return;
    const curr = Number(h.currentValue);
    const pnlPct = Number(h.todayPnLPercent);

    if (isNaN(curr) || isNaN(pnlPct) || curr <= 0) return;

    // Handle edge case of -100% or extreme loss cleanly
    const factor = 1 + pnlPct / 100;
    if (factor <= 0.0001) {
      // Stock dropped 100%, today's loss is the full yesterday value
      sum -= curr;
    } else {
      const yesterdayValue = curr / factor;
      if (!isNaN(yesterdayValue)) {
        sum += curr - yesterdayValue;
      }
    }
  };

  if (portfolio) {
    const holdings = portfolio.holdings || [];
    for (let i = 0; i < holdings.length; i++) {
      processHolding(holdings[i]);
    }
  } else if (all && all.length > 0) {
    for (let i = 0; i < all.length; i++) {
      const holdings = all[i]?.holdings || [];
      for (let j = 0; j < holdings.length; j++) {
        processHolding(holdings[j]);
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


