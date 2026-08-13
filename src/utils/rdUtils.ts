import { RDAccount } from '../types/portfolio';
import { compoundValue } from './mathUtils';

/**
 * Returns the total amount actually invested in a Recurring Deposit.
 */
export function getRDInvestedAmount(account: RDAccount): number {
  if (account.contributions && account.contributions.length > 0) {
    let sum = 0;
    for (let i = 0; i < account.contributions.length; i++) {
      sum += Number(account.contributions[i].amount) || 0;
    }
    return sum;
  }
  const startDate = new Date(account.start_date);
  const now = new Date();
  const elapsedMonths = Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + now.getMonth() - startDate.getMonth());
  return elapsedMonths * Number(account.monthly_deposit || 0);
}

/**
 * Returns the current accrued valuation of a Recurring Deposit.
 * RDs compound quarterly, where each monthly installment compounds for its own remaining duration.
 */
export function getRDEffectiveValue(account: RDAccount, upToDate: Date = new Date()): number {
  const p = Number(account.monthly_deposit);
  const r = Number(account.interest_rate);
  const s = new Date(account.start_date);
  
  if (account.status === 'matured') {
    return Number(account.maturity_amount);
  }
  
  const end = account.maturity_date && new Date(account.maturity_date).getTime() < upToDate.getTime()
    ? new Date(account.maturity_date)
    : upToDate;
     
  const timeDiff = end.getTime() - s.getTime();
  const years = timeDiff / (1000 * 3600 * 24 * 365.25);
  
  if (years > 0 && !isNaN(r) && !isNaN(s.getTime())) {
    const totalMonths = Math.max(1, Math.round(years * 12));
    
    // If contributions exist, compound each contribution from its payment date
    if (account.contributions && account.contributions.length > 0) {
      let total = 0;
      const endTime = end.getTime();
      for (let i = 0; i < account.contributions.length; i++) {
        const c = account.contributions[i];
        const cTime = new Date(c.date).getTime();
        if (isNaN(cTime)) continue;
        const remYears = (endTime - cTime) / (1000 * 3600 * 24 * 365.25);
        if (remYears >= 0) {
          total += compoundValue(Number(c.amount), r, 4, remYears);
        } else {
          total += Number(c.amount);
        }
      }
      return total;
    } else {
      // Precompute compounding step factor (1 + r/400)^(1/3) per month to eliminate Math.pow in loop
      const monthlyRateFactor = Math.pow(1 + r / 400, 1 / 3);
      let total = 0;
      let factor = monthlyRateFactor;
      for (let m = 0; m < totalMonths; m++) {
        total += p * factor;
        factor *= monthlyRateFactor;
      }
      return total > 0 ? total : p;
    }
  }
  return p;
}

/**
 * Returns the maturity value of the Recurring Deposit.
 */
export function getRDMaturityValue(account: RDAccount): number {
  if (!account.maturity_date) return Number(account.maturity_amount) || 0;
  return Number(account.maturity_amount) || getRDEffectiveValue(account, new Date(account.maturity_date));
}
