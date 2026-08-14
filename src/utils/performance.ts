import { Portfolio } from '../types/portfolio';
import { getRDInvestedAmount, getElapsedMonthsStandard } from './rdUtils';
import { getSIPInvestedAmount } from './sipUtils';

export interface CashFlow {
  date: string; // ISO format: YYYY-MM-DD
  amount: number; // Outflow is negative, inflow/current value is positive
}

/**
 * Robust date parser returning local timestamp or NaN
 */
function parseLocalDate(dateStr: string | undefined): number {
  if (!dateStr) return NaN;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    return new Date(y, m, d).getTime();
  }
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? NaN : t;
}

/**
 * Format local year, month, day to YYYY-MM-DD without UTC timezone shifts
 */
function formatLocalDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(invested: number, current: number, years: number): number {
  const inv = Number(invested);
  const curr = Number(current);
  const y = Number(years);

  if (isNaN(inv) || isNaN(curr) || isNaN(y) || inv <= 0 || y <= 0) return 0;
  if (curr <= 0) return -1.0; // 100% loss

  return Math.pow(curr / inv, 1 / y) - 1;
}

/**
 * Optimized XIRR solver with robust bounds & date validation
 */
export function calculateXIRR(cashflows: CashFlow[]): number {
  if (!cashflows || cashflows.length < 2) return 0;

  const valid: { time: number; amount: number }[] = [];
  let hasPositive = false;
  let hasNegative = false;

  for (let i = 0; i < cashflows.length; i++) {
    const amt = Number(cashflows[i]?.amount);
    const time = parseLocalDate(cashflows[i]?.date);
    if (!isNaN(amt) && amt !== 0 && !isNaN(time)) {
      if (amt > 0) hasPositive = true;
      if (amt < 0) hasNegative = true;
      valid.push({ time, amount: amt });
    }
  }

  if (!hasPositive || !hasNegative || valid.length < 2) return 0;

  valid.sort((a, b) => a.time - b.time);

  const t0 = valid[0].time;
  const count = valid.length;
  const amounts = new Float64Array(count);
  const years = new Float64Array(count);

  const MS_PER_YEAR = 365.0 * 24 * 3600 * 1000;
  for (let i = 0; i < count; i++) {
    amounts[i] = valid[i].amount;
    years[i] = (valid[i].time - t0) / MS_PER_YEAR;
  }

  const f = (r: number): number => {
    let sum = 0;
    const base = 1 + r;
    if (base <= 1e-6) return Number.MAX_VALUE;
    for (let i = 0; i < count; i++) {
      sum += amounts[i] / Math.pow(base, years[i]);
    }
    return sum;
  };

  const df = (r: number): number => {
    let sum = 0;
    const base = 1 + r;
    if (base <= 1e-6) return 1e-6;
    for (let i = 0; i < count; i++) {
      sum -= (years[i] * amounts[i]) / Math.pow(base, years[i] + 1);
    }
    return sum;
  };

  let r = 0.1;
  const epsilon = 1e-6;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const y = f(r);
    const dy = df(r);
    if (Math.abs(dy) < 1e-12) break;

    let rNext = r - y / dy;
    if (rNext <= -0.99) rNext = -0.98;

    if (Math.abs(rNext - r) < epsilon) {
      if (rNext > -0.99 && rNext < 10.0 && !isNaN(rNext)) return rNext;
      break;
    }
    r = rNext;
  }

  let low = -0.98;
  let high = 10.0;
  let yLow = f(low);
  let yHigh = f(high);

  if (!isNaN(yLow) && !isNaN(yHigh) && yLow * yHigh < 0) {
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const yMid = f(mid);
      if (isNaN(yMid) || Math.abs(yMid) < epsilon) return mid;
      if (yMid * yLow < 0) {
        high = mid;
        yHigh = yMid;
      } else {
        low = mid;
        yLow = yMid;
      }
    }
  }

  return 0;
}

/** Optimized weighted age calculation with single Date.now() reference */
export function calculateWeightedAge(portfolio: Portfolio): number {
  if (!portfolio) return 1.0;
  let weightedTimeSum = 0;
  let totalInvested = 0;
  const now = Date.now();
  const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;

  const processDate = (startDateStr?: string): number | null => {
    if (!startDateStr) return null;
    const start = parseLocalDate(startDateStr);
    if (isNaN(start)) return null;
    return Math.max(0, (now - start) / MS_PER_YEAR);
  };

  const fds = portfolio.fixedDeposits || [];
  for (let i = 0; i < fds.length; i++) {
    const fd = fds[i];
    const amt = Math.max(0, Number(fd.principal_amount) || 0);
    const age = processDate(fd.start_date) ?? 0;
    weightedTimeSum += amt * age;
    totalInvested += amt;
  }

  if (portfolio.rdAccounts) {
    for (const rd of portfolio.rdAccounts) {
      const amt = Math.max(0, Number(getRDInvestedAmount(rd)) || 0);
      const age = processDate(rd.start_date) ?? 0;
      weightedTimeSum += amt * (age / 2);
      totalInvested += amt;
    }
  }

  if (portfolio.sipAccounts) {
    for (const sip of portfolio.sipAccounts) {
      const amt = Math.max(0, Number(getSIPInvestedAmount(sip)) || 0);
      const age = processDate(sip.start_date) ?? 0;
      weightedTimeSum += amt * (age / 2);
      totalInvested += amt;
    }
  }

  const holdings = portfolio.holdings || [];
  for (const stock of holdings) {
    const amt = Math.max(0, Number(stock.amountInvested) || 0);
    const age = processDate((stock as { created_at?: string }).created_at) ??
                processDate((stock as { createdAt?: string }).createdAt) ??
                processDate((portfolio as { created_at?: string }).created_at) ??
                processDate((portfolio as { createdAt?: string }).createdAt) ??
                1.0;
    weightedTimeSum += amt * age;
    totalInvested += amt;
  }

  const goldHoldings = portfolio.goldHoldings || [];
  for (const gold of goldHoldings) {
    const amt = Math.max(0, Number(gold.purchase_price) || 0);
    const age = processDate(gold.purchase_date) ?? 1.0;
    weightedTimeSum += amt * age;
    totalInvested += amt;
  }

  const realEstate = portfolio.realEstate || [];
  for (const re of realEstate) {
    const amt = Math.max(0, Number(re.purchase_price) || 0);
    const age = processDate(re.purchase_date) ?? 2.0;
    weightedTimeSum += amt * age;
    totalInvested += amt;
  }

  if (isNaN(totalInvested) || totalInvested <= 0) return 1.0;
  const res = weightedTimeSum / totalInvested;
  return isNaN(res) ? 1.0 : res;
}

export function getBenchmarkReturns(years: number = 1): { nifty50: number; nifty500: number; sp500: number } {
  if (years <= 1) return { nifty50: 14.5, nifty500: 15.2, sp500: 12.1 };
  if (years <= 3) return { nifty50: 13.8, nifty500: 14.5, sp500: 10.5 };
  return { nifty50: 14.2, nifty500: 14.9, sp500: 11.8 };
}

let _xirrWorker: Worker | null = null;
let _pendingXirrCallbacks = new Map<string, (rate: number) => void>();

function getXirrWorker(): Worker | null {
  if (typeof window === 'undefined' || !window.Worker) return null;
  if (!_xirrWorker) {
    try {
      _xirrWorker = new Worker(new URL('../workers/xirr.worker.ts', import.meta.url), { type: 'module' });
      _xirrWorker.onmessage = (e) => {
        const { taskId, rate, error, cashflows } = e.data || {};
        if (taskId && _pendingXirrCallbacks.has(taskId)) {
          const cb = _pendingXirrCallbacks.get(taskId)!;
          _pendingXirrCallbacks.delete(taskId);
          cb(error ? calculateXIRR(cashflows || []) : (rate ?? 0));
        }
      };
      _xirrWorker.onerror = () => {
        _xirrWorker = null;
        // Drain pending callbacks with fallback
        for (const [, cb] of _pendingXirrCallbacks.entries()) {
          cb(0);
        }
        _pendingXirrCallbacks.clear();
      };
    } catch {
      _xirrWorker = null;
    }
  }
  return _xirrWorker;
}

export function runXIRRAsync(cashflows: CashFlow[]): Promise<number> {
  const worker = getXirrWorker();
  if (!worker) {
    return Promise.resolve(calculateXIRR(cashflows));
  }

  return new Promise((resolve) => {
    const taskId = Math.random().toString(36).substring(7);
    _pendingXirrCallbacks.set(taskId, resolve);
    worker.postMessage({ taskId, cashflows });
  });
}

export function getPortfolioCashFlows(portfolio: Portfolio): CashFlow[] {
  if (!portfolio) return [];
  const cashflows: CashFlow[] = [];
  const now = new Date();
  const nowStr = formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());

  const addFlow = (dateStr: string | undefined, amount: number) => {
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return;
    const time = parseLocalDate(dateStr);
    const date = isNaN(time) ? nowStr : dateStr!;
    cashflows.push({ date, amount: -amt });
  };

  const fds = portfolio.fixedDeposits || [];
  for (const fd of fds) {
    addFlow(fd.start_date, fd.principal_amount);
  }

  if (portfolio.rdAccounts) {
    for (const rd of portfolio.rdAccounts) {
      if (rd.contributions && rd.contributions.length > 0) {
        for (const c of rd.contributions) {
          addFlow(c.date, Number(c.amount));
        }
      } else {
        const startTime = parseLocalDate(rd.start_date);
        if (isNaN(startTime)) {
          addFlow(rd.start_date, getRDInvestedAmount(rd));
          continue;
        }
        const start = new Date(startTime);
        const elapsed = getElapsedMonthsStandard(start, now);
        const monthlyAmount = Number(rd.monthly_deposit);

        for (let m = 0; m < elapsed; m++) {
          const targetYear = start.getFullYear() + Math.floor((start.getMonth() + m) / 12);
          const targetMonth = (start.getMonth() + m) % 12;
          const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
          const clampedDay = Math.min(start.getDate(), lastDay);
          const flowDate = new Date(targetYear, targetMonth, clampedDay);
          if (flowDate.getTime() <= now.getTime()) {
            addFlow(formatLocalDate(targetYear, targetMonth, clampedDay), monthlyAmount);
          }
        }
      }
    }
  }

  if (portfolio.sipAccounts) {
    for (const sip of portfolio.sipAccounts) {
      const startTime = parseLocalDate(sip.start_date);
      if (isNaN(startTime)) {
        addFlow(sip.start_date, getSIPInvestedAmount(sip));
        continue;
      }
      const start = new Date(startTime);
      const elapsed = getElapsedMonthsStandard(start, now);
      const monthlyAmount = Number(sip.monthly_sip);

      for (let m = 0; m < elapsed; m++) {
        const targetYear = start.getFullYear() + Math.floor((start.getMonth() + m) / 12);
        const targetMonth = (start.getMonth() + m) % 12;
        const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        const clampedDay = Math.min(start.getDate(), lastDay);
        const flowDate = new Date(targetYear, targetMonth, clampedDay);
        if (flowDate.getTime() <= now.getTime()) {
          addFlow(formatLocalDate(targetYear, targetMonth, clampedDay), monthlyAmount);
        }
      }
    }
  }

  const holdings = portfolio.holdings || [];
  for (const stock of holdings) {
    const date = (stock as { created_at?: string }).created_at ||
                 (stock as { createdAt?: string }).createdAt ||
                 (portfolio as { created_at?: string }).created_at ||
                 (portfolio as { createdAt?: string }).createdAt ||
                 nowStr;
    addFlow(date, stock.amountInvested);
  }

  const goldHoldings = portfolio.goldHoldings || [];
  for (const gold of goldHoldings) {
    addFlow(gold.purchase_date, gold.purchase_price);
  }

  const realEstate = portfolio.realEstate || [];
  for (const re of realEstate) {
    addFlow(re.purchase_date, re.purchase_price);
  }

  return cashflows;
}

export function calculatePortfolioXIRR(portfolio: Portfolio): number | null {
  if (!portfolio) return null;
  const cashflows = getPortfolioCashFlows(portfolio);
  const currentVal = Number(portfolio.totalCurrentValue);
  if (cashflows.length === 0 || isNaN(currentVal) || currentVal <= 0) return null;

  const now = new Date();
  const nowStr = formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
  cashflows.push({ date: nowStr, amount: currentVal });

  const result = calculateXIRR(cashflows);
  return typeof result === 'number' && !isNaN(result) ? result : null;
}

export function calculateMultiplePortfoliosXIRR(portfolios: Portfolio[]): number | null {
  if (!portfolios || portfolios.length === 0) return null;
  const cashflows: CashFlow[] = [];
  let totalCurrentValue = 0;

  for (const p of portfolios) {
    if (!p) continue;
    cashflows.push(...getPortfolioCashFlows(p));
    const val = Number(p.totalCurrentValue);
    if (!isNaN(val) && val > 0) totalCurrentValue += val;
  }

  if (cashflows.length === 0 || totalCurrentValue <= 0) return null;

  const now = new Date();
  const nowStr = formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
  cashflows.push({ date: nowStr, amount: totalCurrentValue });

  const result = calculateXIRR(cashflows);
  return typeof result === 'number' && !isNaN(result) ? result : null;
}

export function getPortfolioAnnualizedReturn(portfolio: Portfolio): number {
  if (!portfolio) return 0;
  const xirr = calculatePortfolioXIRR(portfolio);
  if (xirr !== null && !isNaN(xirr)) return xirr;

  const age = calculateWeightedAge(portfolio);
  return calculateCAGR(portfolio.totalInvested, portfolio.totalCurrentValue, age);
}

export function getMultiplePortfoliosAnnualizedReturn(portfolios: Portfolio[]): number {
  if (!portfolios || portfolios.length === 0) return 0;
  const xirr = calculateMultiplePortfoliosXIRR(portfolios);
  if (xirr !== null && !isNaN(xirr)) return xirr;

  let weightedTimeSum = 0;
  let totalInvestedForAge = 0;
  let totalInvested = 0;
  let totalCurrentValue = 0;

  for (const p of portfolios) {
    if (!p) continue;
    const inv = Math.max(0, Number(p.totalInvested) || 0);
    const curr = Math.max(0, Number(p.totalCurrentValue) || 0);
    const age = calculateWeightedAge(p);

    weightedTimeSum += inv * age;
    totalInvestedForAge += inv;
    totalInvested += inv;
    totalCurrentValue += curr;
  }

  const combinedAge = totalInvestedForAge > 0 ? weightedTimeSum / totalInvestedForAge : 1.0;
  return calculateCAGR(totalInvested, totalCurrentValue, combinedAge);
}
