import { SIPAccount } from '../types/portfolio';

/**
 * Returns the estimated total amount invested in the SIP.
 * Calculated as: monthly_sip * months elapsed since start_date.
 */
export function getSIPInvestedAmount(account: SIPAccount): number {
  const start = new Date(account.start_date);
  if (isNaN(start.getTime())) return Number(account.monthly_sip);
  
  const end = new Date();
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  const elapsed = Math.max(1, months);
  return Number(account.monthly_sip) * elapsed;
}

/**
 * Returns the current valuation of a SIP Mutual Fund.
 */
export function getSIPEffectiveValue(account: SIPAccount): number {
  return Number(account.fallback_valuation);
}
