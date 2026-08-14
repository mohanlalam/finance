import { RDAccount } from '../types/portfolio';
import { compoundValue } from './mathUtils';

/**
 * Shared standardized month elapsed calculator handling month-end dates (e.g. Jan 31 -> Feb 28)
 */
export function getElapsedMonthsStandard(startDate: Date, endDate: Date = new Date()): number {
  if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) return 0;
  if (endDate.getTime() < startDate.getTime()) return 0;

  const rawMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  const startDay = startDate.getDate();
  const currentDay = endDate.getDate();

  // Check if current day of month is on or after start day, OR if current day is month-end
  const lastDayOfCurrentMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
  const isMonthEnd = currentDay === lastDayOfCurrentMonth && startDay >= lastDayOfCurrentMonth;

  const elapsed = rawMonths + (currentDay >= startDay || isMonthEnd ? 1 : 0);
  return Math.max(0, elapsed);
}

/**
 * Returns the total amount actually invested in a Recurring Deposit safely.
 */
export function getRDInvestedAmount(account: RDAccount): number {
  if (!account) return 0;
  if (account.contributions && account.contributions.length > 0) {
    let sum = 0;
    for (let i = 0; i < account.contributions.length; i++) {
      sum += Math.max(0, Number(account.contributions[i]?.amount) || 0);
    }
    return sum;
  }
  const startDate = new Date(account.start_date);
  const monthly = Math.max(0, Number(account.monthly_deposit) || 0);
  if (isNaN(startDate.getTime())) return monthly;

  const elapsedMonths = getElapsedMonthsStandard(startDate, new Date());
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

  if (account.status === 'matured') {
    const matAmt = Number(account.maturity_amount);
    return !isNaN(matAmt) && matAmt > 0 ? matAmt : p;
  }

  const end = account.maturity_date && new Date(account.maturity_date).getTime() < upToDate.getTime()
    ? new Date(account.maturity_date)
    : upToDate;

  const timeDiff = end.getTime() - s.getTime();
  const years = timeDiff / (1000 * 3600 * 24 * 365.0);

  if (years > 0 && !isNaN(r) && r >= 0 && !isNaN(s.getTime()) && p > 0) {
    const totalMonths = Math.max(1, getElapsedMonthsStandard(s, end));

    if (account.contributions && account.contributions.length > 0) {
      let total = 0;
      const endTime = end.getTime();
      for (let i = 0; i < account.contributions.length; i++) {
        const c = account.contributions[i];
        const cAmt = Math.max(0, Number(c?.amount) || 0);
        const cTime = new Date(c?.date).getTime();
        if (isNaN(cTime)) {
          total += cAmt;
          continue;
        }
        const remYears = (endTime - cTime) / (1000 * 3600 * 24 * 365.0);
        if (remYears >= 0) {
          total += compoundValue(cAmt, r, 4, remYears);
        } else {
          total += cAmt;
        }
      }
      return !isNaN(total) && total > 0 ? total : p;
    } else {
      const monthlyRateFactor = Math.pow(1 + r / 400, 1 / 3);
      let total = 0;
      let factor = monthlyRateFactor;
      for (let m = 0; m < totalMonths; m++) {
        total += p * factor;
        factor *= monthlyRateFactor;
      }
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
  const matDate = new Date(account.maturity_date);
  return isNaN(matDate.getTime()) ? 0 : getRDEffectiveValue(account, matDate);
}
