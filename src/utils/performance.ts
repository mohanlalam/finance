import { Portfolio } from '../types/portfolio';
import { getRDInvestedAmount } from './rdUtils';
import { getSIPInvestedAmount } from './sipUtils';

export interface CashFlow {
  date: string; // ISO format: YYYY-MM-DD
  amount: number; // Outflow is negative, inflow/current value is positive
}

/**
 * Calculates CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(invested: number, current: number, years: number): number {
  if (invested <= 0 || current <= 0 || years <= 0) return 0;
  return Math.pow(current / invested, 1 / years) - 1;
}

/**
 * Helper to solve XIRR using Newton-Raphson with Bisection fallback
 */
export function calculateXIRR(cashflows: CashFlow[]): number {
  if (cashflows.length < 2) return 0;

  // Guard against same-sign cashflows
  let hasPositive = false;
  let hasNegative = false;
  for (const flow of cashflows) {
    if (flow.amount > 0) hasPositive = true;
    if (flow.amount < 0) hasNegative = true;
  }
  if (!hasPositive || !hasNegative) {
    return 0;
  }

  // Sort cashflows chronologically
  const flows = [...cashflows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const d1 = new Date(flows[0].date).getTime();

  // Helper functions for equation and its derivative
  const f = (r: number): number => {
    let sum = 0;
    for (const flow of flows) {
      const di = new Date(flow.date).getTime();
      const years = (di - d1) / (365 * 24 * 3600 * 1000);
      sum += flow.amount / Math.pow(1 + r, years);
    }
    return sum;
  };

  const df = (r: number): number => {
    let sum = 0;
    for (const flow of flows) {
      const di = new Date(flow.date).getTime();
      const years = (di - d1) / (365 * 24 * 3600 * 1000);
      sum -= years * flow.amount / Math.pow(1 + r, years + 1);
    }
    return sum;
  };

  // Try Newton-Raphson method
  let r = 0.1; // initial guess (10% return)
  const epsilon = 1e-6;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const y = f(r);
    const dy = df(r);
    if (Math.abs(dy) < 1e-12) break; // Division by zero check
    
    const rNext = r - y / dy;
    if (Math.abs(rNext - r) < epsilon) {
      // Validate result is within sane boundaries
      if (rNext > -0.999 && rNext < 10.0) {
        return rNext;
      }
      break; // Exit loop on out-of-bounds convergence to allow bisection solver to run
    }
    r = rNext;
  }

  // Fallback to Bisection method if Newton-Raphson didn't converge
  let low = -0.99;
  let high = 10.0;
  let yLow = f(low);
  let yHigh = f(high);
  
  if (yLow * yHigh < 0) {
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const yMid = f(mid);
      
      if (Math.abs(yMid) < epsilon) {
        return mid;
      }
      
      // Check signs to narrow interval
      if (yMid * yLow < 0) {
        high = mid;
        yHigh = yMid;
      } else {
        low = mid;
        yLow = yMid;
      }
    }
  }

  return r; // returns the last calculated rate
}

/**
 * Calculates weighted average age in years for all investments in a portfolio
 */
export function calculateWeightedAge(portfolio: Portfolio): number {
  let weightedTimeSum = 0;
  let totalInvested = 0;
  const now = new Date().getTime();

  const processDate = (startDateStr?: string) => {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr).getTime();
    return Math.max(0, (now - start) / (365 * 24 * 3600 * 1000));
  };

  // Process FDs
  for (const fd of portfolio.fixedDeposits) {
    const age = processDate(fd.start_date);
    weightedTimeSum += fd.principal_amount * age;
    totalInvested += fd.principal_amount;
  }

  // Process RDs
  if (portfolio.rdAccounts) {
    for (const rd of portfolio.rdAccounts) {
      const age = processDate(rd.start_date);
      const invested = getRDInvestedAmount(rd);
      weightedTimeSum += invested * age;
      totalInvested += invested;
    }
  }



  // Process SIPs
  if (portfolio.sipAccounts) {
    for (const sip of portfolio.sipAccounts) {
      const age = processDate(sip.start_date);
      const invested = getSIPInvestedAmount(sip);
      weightedTimeSum += invested * age;
      totalInvested += invested;
    }
  }

  // Process Stocks
  for (const stock of portfolio.holdings) {
    // Treat stocks as purchased using creation date fallback if start/purchase date is missing, otherwise default to 1.0
    const age = processDate((stock as { created_at?: string }).created_at) ||
                processDate((stock as { createdAt?: string }).createdAt) ||
                processDate((portfolio as { created_at?: string }).created_at) ||
                processDate((portfolio as { createdAt?: string }).createdAt) ||
                1.0;
    weightedTimeSum += stock.amountInvested * age;
    totalInvested += stock.amountInvested;
  }

  // Process Gold
  for (const gold of portfolio.goldHoldings) {
    const age = processDate(gold.purchase_date) || 1.0;
    weightedTimeSum += gold.purchase_price * age;
    totalInvested += gold.purchase_price;
  }

  // Process Real Estate
  for (const re of portfolio.realEstate) {
    const age = processDate(re.purchase_date) || 2.0;
    weightedTimeSum += re.purchase_price * age;
    totalInvested += re.purchase_price;
  }

  if (totalInvested <= 0) return 1.0;
  return weightedTimeSum / totalInvested;
}

/**
 * Returns static benchmark annualized returns (CAGR %) for comparison.
 * NOTE: These are estimated approximate figures for v1. In a production environment,
 * these should be dynamically fetched annually from a configuration endpoint or Supabase Edge function.
 */
export function getBenchmarkReturns(years: number = 1): {
  nifty50: number;
  nifty500: number;
  sp500: number;
} {
  if (years <= 1) {
    return { nifty50: 14.5, nifty500: 15.2, sp500: 12.1 };
  } else if (years <= 3) {
    return { nifty50: 13.8, nifty500: 14.5, sp500: 10.5 };
  } else {
    return { nifty50: 14.2, nifty500: 14.9, sp500: 11.8 };
  }
}

/**
 * Asynchronously calculates XIRR using a Web Worker with synchronous fallback
 */
export function runXIRRAsync(cashflows: CashFlow[]): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        const worker = new Worker(new URL('../workers/xirr.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e) => {
          if (e.data.error) {
            console.warn('[xirr worker] returned computation error, falling back:', e.data.error);
            resolve(calculateXIRR(cashflows));
          } else {
            resolve(e.data.result);
          }
          worker.terminate();
        };
        worker.onerror = (err) => {
          console.warn('[xirr worker] error in worker thread, falling back:', err);
          resolve(calculateXIRR(cashflows));
          worker.terminate();
        };
        worker.postMessage({ cashflows });
        return;
      } catch (err) {
        console.warn('[xirr worker] initialization failed, falling back:', err);
      }
    } else {
      console.warn('[xirr worker] Web Workers are not supported in this environment, falling back.');
    }
    resolve(calculateXIRR(cashflows));
  });
}

/**
 * Generates the cash outflows (as negative amounts) for a portfolio
 */
export function getPortfolioCashFlows(portfolio: Portfolio): CashFlow[] {
  const cashflows: CashFlow[] = [];
  const nowStr = new Date().toISOString().split('T')[0];

  const addFlow = (dateStr: string | undefined, amount: number) => {
    if (amount <= 0) return;
    const date = dateStr || nowStr;
    cashflows.push({ date, amount: -amount });
  };

  // 1. Process FDs
  for (const fd of portfolio.fixedDeposits) {
    addFlow(fd.start_date, fd.principal_amount);
  }

  // 2. Process RDs
  if (portfolio.rdAccounts) {
    for (const rd of portfolio.rdAccounts) {
      if (rd.contributions && rd.contributions.length > 0) {
        for (const c of rd.contributions) {
          addFlow(c.date, Number(c.amount));
        }
      } else {
        const start = new Date(rd.start_date);
        if (isNaN(start.getTime())) {
          addFlow(rd.start_date, getRDInvestedAmount(rd));
          continue;
        }
        const end = new Date();
        const rawMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        const dayOfMonth = start.getDate();
        const currentDayOfMonth = end.getDate();
        const elapsed = rawMonths + (currentDayOfMonth >= dayOfMonth ? 1 : 0);
        const monthlyAmount = Number(rd.monthly_deposit);
        for (let m = 0; m < elapsed; m++) {
          const flowDate = new Date(start.getFullYear(), start.getMonth() + m, start.getDate());
          if (flowDate.getTime() <= end.getTime()) {
            addFlow(flowDate.toISOString().split('T')[0], monthlyAmount);
          }
        }
      }
    }
  }



  // 4. Process SIPs
  if (portfolio.sipAccounts) {
    for (const sip of portfolio.sipAccounts) {
      const start = new Date(sip.start_date);
      if (isNaN(start.getTime())) {
        addFlow(sip.start_date, getSIPInvestedAmount(sip));
        continue;
      }
      const end = new Date();
      const rawMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      const dayOfMonth = start.getDate();
      const currentDayOfMonth = end.getDate();
      const elapsed = rawMonths + (currentDayOfMonth >= dayOfMonth ? 1 : 0);
      const monthlyAmount = Number(sip.monthly_sip);

      for (let m = 0; m < elapsed; m++) {
        const flowDate = new Date(start.getFullYear(), start.getMonth() + m, start.getDate());
        if (flowDate.getTime() <= end.getTime()) {
          addFlow(flowDate.toISOString().split('T')[0], monthlyAmount);
        }
      }
    }
  }

  // 5. Process Stocks
  for (const stock of portfolio.holdings) {
    const date = (stock as { created_at?: string }).created_at ||
                 (stock as { createdAt?: string }).createdAt ||
                 (portfolio as { created_at?: string }).created_at ||
                 (portfolio as { createdAt?: string }).createdAt ||
                 nowStr;
    addFlow(date, stock.amountInvested);
  }

  // 6. Process Gold
  for (const gold of portfolio.goldHoldings) {
    addFlow(gold.purchase_date, gold.purchase_price);
  }

  // 7. Process Real Estate
  for (const re of portfolio.realEstate) {
    addFlow(re.purchase_date, re.purchase_price);
  }

  return cashflows;
}

/**
 * Calculates portfolio XIRR
 */
export function calculatePortfolioXIRR(portfolio: Portfolio): number {
  const cashflows = getPortfolioCashFlows(portfolio);
  if (cashflows.length === 0) return 0;

  const nowStr = new Date().toISOString().split('T')[0];
  cashflows.push({ date: nowStr, amount: portfolio.totalCurrentValue });

  return calculateXIRR(cashflows);
}

/**
 * Calculates XIRR across multiple portfolios combined
 */
export function calculateMultiplePortfoliosXIRR(portfolios: Portfolio[]): number {
  const cashflows: CashFlow[] = [];
  let totalCurrentValue = 0;

  for (const p of portfolios) {
    cashflows.push(...getPortfolioCashFlows(p));
    totalCurrentValue += p.totalCurrentValue;
  }

  if (cashflows.length === 0) return 0;

  const nowStr = new Date().toISOString().split('T')[0];
  cashflows.push({ date: nowStr, amount: totalCurrentValue });

  return calculateXIRR(cashflows);
}

/**
 * Returns the portfolio annualized return using XIRR, falling back to CAGR if XIRR cannot be solved
 */
export function getPortfolioAnnualizedReturn(portfolio: Portfolio): number {
  const xirr = calculatePortfolioXIRR(portfolio);
  if (xirr !== 0) return xirr;

  const age = calculateWeightedAge(portfolio);
  return calculateCAGR(portfolio.totalInvested, portfolio.totalCurrentValue, age);
}

/**
 * Returns the annualized return across multiple portfolios using XIRR, falling back to CAGR if XIRR cannot be solved
 */
export function getMultiplePortfoliosAnnualizedReturn(portfolios: Portfolio[]): number {
  const xirr = calculateMultiplePortfoliosXIRR(portfolios);
  if (xirr !== 0) return xirr;

  let weightedTimeSum = 0;
  let totalInvestedForAge = 0;
  let totalInvested = 0;
  let totalCurrentValue = 0;

  for (const p of portfolios) {
    const age = calculateWeightedAge(p);
    weightedTimeSum += p.totalInvested * age;
    totalInvestedForAge += p.totalInvested;
    totalInvested += p.totalInvested;
    totalCurrentValue += p.totalCurrentValue;
  }

  const combinedAge = totalInvestedForAge > 0 ? weightedTimeSum / totalInvestedForAge : 1.0;
  return calculateCAGR(totalInvested, totalCurrentValue, combinedAge);
}
