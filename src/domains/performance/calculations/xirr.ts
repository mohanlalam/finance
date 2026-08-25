import { parseLocalDate } from '../../../utils/dateUtils';

export interface CashFlow {
  date: string; // ISO format: YYYY-MM-DD
  amount: number; // Outflow is negative, inflow/current value is positive
}

/**
 * Pure Newton-Raphson XIRR solver with Bisection fallback.
 * Operates purely on TypedArrays without DOM or state dependencies.
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
      if (rNext > -0.99 && rNext < 3.0 && !isNaN(rNext)) return rNext;
      break;
    }
    r = rNext;
  }

  let low = -0.98;
  let high = 3.0;
  const yLow = f(low);
  const yHigh = f(high);

  if (!isNaN(yLow) && !isNaN(yHigh) && yLow * yHigh < 0) {
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const yMid = f(mid);
      if (isNaN(yMid) || Math.abs(yMid) < epsilon) return mid;
      if (yMid * yLow < 0) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }

  return 0;
}
