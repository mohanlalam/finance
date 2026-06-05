import { Portfolio } from '../types/portfolio';

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
    }
    r = rNext;
  }

  // Fallback to Bisection method if Newton-Raphson didn't converge
  let low = -0.99;
  let high = 10.0;
  
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const yMid = f(mid);
    
    if (Math.abs(yMid) < epsilon) {
      return mid;
    }
    
    // Check signs to narrow interval
    if (yMid * f(low) < 0) {
      high = mid;
    } else {
      low = mid;
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
      weightedTimeSum += rd.monthly_deposit * age; // proxy approximation
      totalInvested += rd.monthly_deposit;
    }
  }

  // Process SSYs
  if (portfolio.ssyAccounts) {
    for (const ssy of portfolio.ssyAccounts) {
      const age = processDate(ssy.start_date);
      weightedTimeSum += ssy.annual_deposit * age;
      totalInvested += ssy.annual_deposit;
    }
  }

  // Process SIPs
  if (portfolio.sipAccounts) {
    for (const sip of portfolio.sipAccounts) {
      const age = processDate(sip.start_date);
      weightedTimeSum += sip.monthly_sip * age;
      totalInvested += sip.monthly_sip;
    }
  }

  // Process Stocks
  for (const stock of portfolio.holdings) {
    // Treat stocks as purchased 1 year ago on average if start date is missing
    const age = 1.0;
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
 * Returns static benchmark annualized returns (CAGR %) for comparison
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
