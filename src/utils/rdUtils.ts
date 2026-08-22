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
 * Safely parse date strings into local date objects avoiding UTC midnight timezone shifts
 */
export function parseLocalDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (match) {
    return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns the total amount actually invested in a Recurring Deposit safely.
 */
export function getRDInvestedAmount(account: RDAccount, now: Date = new Date()): number {
  if (!account) return 0;
  if (Array.isArray(account.contributions)) {
    let sum = 0;
    const len = account.contributions.length;
    const nowMs = now.getTime();
    for (let i = 0; i < len; i++) {
      const c = account.contributions[i];
      const cDate = parseLocalDate(c?.date);
      // Only include contributions that have occurred on or before now
      if (!cDate || cDate.getTime() <= nowMs) {
        sum += Math.max(0, Number(c?.amount) || 0);
      }
    }
    return sum;
  }
  const startDate = parseLocalDate(account.start_date);
  const monthly = Math.max(0, Number(account.monthly_deposit) || 0);
  if (!startDate || isNaN(startDate.getTime())) return 0;

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
  const s = parseLocalDate(account.start_date);
  if (!s || isNaN(s.getTime())) return 0;
  const sMs = s.getTime();

  if (account.status === 'matured') {
    const matAmt = Number(account.maturity_amount);
    return !isNaN(matAmt) && matAmt > 0 ? matAmt : p;
  }

  const matDate = parseLocalDate(account.maturity_date);
  const matMs = matDate ? matDate.getTime() : NaN;
  const endMs = !isNaN(matMs) && matMs < upToDate.getTime() ? matMs : upToDate.getTime();
  const end = new Date(endMs);

  if (sMs > endMs) return 0; // Future RD not yet started

  const totalMonths = getElapsedMonthsStandard(s, end);
  if (totalMonths <= 0) return 0;

  if (!isNaN(r) && r >= 0 && p > 0) {
    if (account.contributions && account.contributions.length > 0) {
      let total = 0;
      const len = account.contributions.length;
      for (let i = 0; i < len; i++) {
        const c = account.contributions[i];
        const cAmt = Math.max(0, Number(c?.amount) || 0);
        const cDate = parseLocalDate(c?.date);
        const cTime = cDate ? cDate.getTime() : NaN;
        if (isNaN(cTime)) {
          total += cAmt;
          continue;
        }
        const remYears = (endMs - cTime) / (1000 * 3600 * 24 * 365.0);
        // Only accumulate compounding value for contributions that occurred on/before endMs
        if (remYears >= 0) {
          total += compoundValue(cAmt, r, 4, remYears);
        }
      }
      return !isNaN(total) && total > 0 ? total : 0;
    } else {
      if (r === 0 || totalMonths <= 0) {
        return p * Math.max(0, totalMonths);
      }
      // Standard Indian Banking quarterly compounding RD formula:
      // Maturity = P * ((1 + r/400)^(N/3) - 1) / (1 - (1 + r/400)^(-1/3))
      const qRate = r / 400;
      const numQuarters = totalMonths / 3;
      const numerator = Math.pow(1 + qRate, numQuarters) - 1;
      const denominator = 1 - Math.pow(1 + qRate, -1 / 3);
      if (Math.abs(denominator) < 1e-12) {
        return p * totalMonths;
      }
      const total = p * (numerator / denominator);
      return !isNaN(total) && total > 0 ? total : p * totalMonths;
    }
  }
  return 0;
}

/**
 * Returns the maturity value of the Recurring Deposit safely.
 */
export function getRDMaturityValue(account: RDAccount): number {
  if (!account) return 0;
  const matAmt = Number(account.maturity_amount);
  if (!isNaN(matAmt) && matAmt > 0) return matAmt;
  if (!account.maturity_date) return 0;
  const matDate = parseLocalDate(account.maturity_date);
  return !matDate || isNaN(matDate.getTime()) ? 0 : getRDEffectiveValue(account, matDate);
}
