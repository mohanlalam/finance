import { RDAccount } from '../types/portfolio';
import { compoundValue } from './mathUtils';

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getDaysInMonth(year: number, month: number): number {
  if (month === 1) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  return DAYS_PER_MONTH[month] ?? 30;
}

/**
 * Shared standardized month elapsed calculator handling month-end dates (e.g. Jan 31 -> Feb 28)
 */
export function getElapsedMonthsStandard(startDate: Date, endDate: Date = new Date()): number {
  if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) return 0;
  const endMs = endDate.getTime();
  const startMs = startDate.getTime();
  if (endMs < startMs) return 0;

  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  const rawMonths = (endYear - startDate.getFullYear()) * 12 + (endMonth - startDate.getMonth());
  const startDay = startDate.getDate();
  const currentDay = endDate.getDate();

  // Check if current day of month is on or after start day, OR if current day is month-end
  const lastDayOfCurrentMonth = getDaysInMonth(endYear, endMonth);
  const isMonthEnd = currentDay === lastDayOfCurrentMonth && startDay >= lastDayOfCurrentMonth;

  const elapsed = rawMonths + (currentDay >= startDay || isMonthEnd ? 1 : 0);
  return Math.max(0, elapsed);
}

/**
 * Returns the total amount actually invested in a Recurring Deposit safely.
 */
export function getRDInvestedAmount(account: RDAccount, now: Date = new Date()): number {
  if (!account) return 0;
  if (account.contributions && account.contributions.length > 0) {
    let sum = 0;
    const len = account.contributions.length;
    for (let i = 0; i < len; i++) {
      sum += Math.max(0, Number(account.contributions[i]?.amount) || 0);
    }
    return sum;
  }
  const startDate = new Date(account.start_date);
  const monthly = Math.max(0, Number(account.monthly_deposit) || 0);
  if (isNaN(startDate.getTime())) return monthly;

  const elapsedMonths = getElapsedMonthsStandard(startDate, now);
  return elapsedMonths * monthly;
}

/**
 * Returns the current accrued valuation of a Recurring Deposit.
 */
export function getRDEffectiveValue(account: RDAccount, upToDate: Date = new Date()): number {
  if (!account) return 0;
  const p = Math.max(0, Number(account.monthly_deposit) || 0);
  const r = Number(account.interest_rate);
  const s = new Date(account.start_date);
  const sMs = s.getTime();

  if (account.status === 'matured') {
    const matAmt = Number(account.maturity_amount);
    return !isNaN(matAmt) && matAmt > 0 ? matAmt : p;
  }

  const matMs = account.maturity_date ? Date.parse(account.maturity_date) : NaN;
  const endMs = !isNaN(matMs) && matMs < upToDate.getTime() ? matMs : upToDate.getTime();
  const end = new Date(endMs);

  const timeDiff = endMs - sMs;
  const years = timeDiff / (1000 * 3600 * 24 * 365.0);

  if (years > 0 && !isNaN(r) && r >= 0 && !isNaN(sMs) && p > 0) {
    const totalMonths = Math.max(1, getElapsedMonthsStandard(s, end));

    if (account.contributions && account.contributions.length > 0) {
      let total = 0;
      const len = account.contributions.length;
      for (let i = 0; i < len; i++) {
        const c = account.contributions[i];
        const cAmt = Math.max(0, Number(c?.amount) || 0);
        const cTime = c?.date ? Date.parse(c.date) : NaN;
        if (isNaN(cTime)) {
          total += cAmt;
          continue;
        }
        const remYears = (endMs - cTime) / (1000 * 3600 * 24 * 365.0);
        if (remYears >= 0) {
          total += compoundValue(cAmt, r, 4, remYears);
        } else {
          total += cAmt;
        }
      }
      return !isNaN(total) && total > 0 ? total : p;
    } else {
      if (r === 0) {
        return p * totalMonths;
      }
      // O(1) Closed-form geometric series summation: p * k * (k^N - 1) / (k - 1)
      const k = Math.pow(1 + r / 400, 1 / 3);
      if (Math.abs(k - 1) < 1e-12) {
        return p * totalMonths;
      }
      const total = p * k * (Math.pow(k, totalMonths) - 1) / (k - 1);
      return !isNaN(total) && total > 0 ? total : p;
    }
  }
  return p;
}

/**
 * Returns the maturity value of the Recurring Deposit safely.
 */
export function getRDMaturityValue(account: RDAccount): number {
  if (!account) return 0;
  const matAmt = Number(account.maturity_amount);
  if (!isNaN(matAmt) && matAmt > 0) return matAmt;
  if (!account.maturity_date) return 0;
  const matMs = Date.parse(account.maturity_date);
  return isNaN(matMs) ? 0 : getRDEffectiveValue(account, new Date(matMs));
}
