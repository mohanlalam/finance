import { FixedDeposit } from '../../../../types/portfolio';
import { compoundValue } from '../../../../utils/mathUtils';
import { parseLocalDate } from '../../../../utils/dateUtils';

/**
 * Calculates accrued valuation and maturity amount for Fixed Deposits.
 * Standard Indian Banking FD interest compounds half-yearly (n = 2) or quarterly (n = 4).
 */
export function calculateFDEffectiveValue(
  fd: FixedDeposit,
  asOfDate: Date = new Date()
): number {
  if (!fd) return 0;
  const principal = Number(fd.principal_amount);
  const rate = Number(fd.interest_rate);

  if (isNaN(principal) || principal <= 0) return 0;
  if (isNaN(rate) || rate <= 0) return principal;

  if (fd.status === 'matured') {
    const matAmt = Number(fd.maturity_amount);
    return !isNaN(matAmt) && matAmt > 0 ? matAmt : principal;
  }

  const startTs = parseLocalDate(fd.start_date);
  if (isNaN(startTs)) return principal;

  const asOfTs = asOfDate.getTime();
  if (startTs >= asOfTs) return principal; // Not yet started

  const matTs = fd.maturity_date ? parseLocalDate(fd.maturity_date) : NaN;
  const effectiveEndTs = !isNaN(matTs) && matTs < asOfTs ? matTs : asOfTs;

  const years = (effectiveEndTs - startTs) / (365.25 * 24 * 3600 * 1000);
  if (years <= 0) return principal;

  // Compounding frequency: 2 for half-yearly (standard FD)
  return compoundValue(principal, rate, 2, years);
}

/**
 * Computes maturity amount from principal, rate, and tenure dates.
 */
export function calculateFDMaturityValue(
  principal: number,
  annualRatePct: number,
  startDateStr: string,
  maturityDateStr: string
): number {
  const p = Number(principal);
  const r = Number(annualRatePct);
  if (isNaN(p) || p <= 0) return 0;
  if (isNaN(r) || r <= 0) return p;

  const startTs = parseLocalDate(startDateStr);
  const matTs = parseLocalDate(maturityDateStr);
  if (isNaN(startTs) || isNaN(matTs) || matTs <= startTs) return p;

  const years = (matTs - startTs) / (365.25 * 24 * 3600 * 1000);
  return compoundValue(p, r, 2, years);
}

export function getFDInvestedAmount(f: FixedDeposit): number {
  return Number(f?.principal_amount) || 0;
}

export const getFDEffectiveValue = calculateFDEffectiveValue;

