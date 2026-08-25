import { SIPAccount } from '../../../../types/portfolio';
import { getElapsedMonthsStandard, parseLocalDate } from '../../rd/calculations/rdCompounding';

/**
 * Returns the estimated total amount invested in the SIP.
 * Calculated as: monthly_sip * months elapsed since start_date.
 */
export function getSIPInvestedAmount(account: SIPAccount, now: Date = new Date()): number {
  if (!account) return 0;
  const monthly = Number(account.monthly_sip);
  if (isNaN(monthly) || monthly <= 0) return 0;

  const start = parseLocalDate(account.start_date);
  if (!start || isNaN(start.getTime())) return 0;

  const elapsed = getElapsedMonthsStandard(start, now);
  return monthly * Math.max(0, elapsed);
}

/**
 * Returns the current valuation of a SIP Mutual Fund safely.
 */
export function getSIPEffectiveValue(
  account: SIPAccount,
  liveNav?: number,
  cachedNav?: number
): number {
  if (!account) return 0;
  const units = Number(account.units || (account as { units_held?: number }).units_held || 0);
  const fallback = Number(account.fallback_valuation);
  const validFallback = !isNaN(fallback) && fallback > 0 ? fallback : 0;

  if (isNaN(units) || units <= 0) {
    return validFallback;
  }

  const nav = liveNav !== undefined ? Number(liveNav) : Number(account.liveNav);
  if (!isNaN(nav) && nav > 0) {
    return nav * units;
  }

  if (cachedNav !== undefined && !isNaN(cachedNav) && cachedNav > 0) {
    return cachedNav * units;
  }

  return validFallback;
}
