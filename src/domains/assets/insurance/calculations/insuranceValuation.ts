import { Insurance } from '../../../../types/portfolio';
import { parseLocalDate } from '../../../../utils/dateUtils';

export interface InsuranceTotals {
  totalSumAssured: number;
  totalAnnualPremium: number;
  activeCount: number;
  expiringSoonCount: number;
}

export interface PolicyRenewalStatus {
  daysRemaining: number;
  isOverdue: boolean;
  isDueSoon: boolean; // within 30 days
  statusText: string;
}

/**
 * Calculates annual premium for an insurance policy.
 */
export function calculateAnnualizedPremium(policy: Insurance): number {
  if (!policy) return 0;
  const amount = Number(policy.premium_amount);
  return !isNaN(amount) && amount > 0 ? amount : 0;
}

/**
 * Calculates total sum assured (coverage) across all insurance policies.
 */
export function calculateTotalSumAssured(policies: Insurance[]): number {
  if (!Array.isArray(policies)) return 0;
  return policies.reduce((sum, p) => {
    const val = Number(p.sum_assured);
    return sum + (!isNaN(val) && val > 0 ? val : 0);
  }, 0);
}

/**
 * Calculates total annual recurring premium outflow across all policies.
 */
export function calculateTotalAnnualPremium(policies: Insurance[]): number {
  if (!Array.isArray(policies)) return 0;
  return policies.reduce((sum, p) => sum + calculateAnnualizedPremium(p), 0);
}

/**
 * Computes renewal/due status for an insurance policy relative to a reference date.
 */
export function getPolicyRenewalStatus(
  policy: Insurance,
  asOfDate: Date = new Date()
): PolicyRenewalStatus {
  const targetDateStr = policy.renewal_date;
  if (!targetDateStr) {
    return {
      daysRemaining: Infinity,
      isOverdue: false,
      isDueSoon: false,
      statusText: 'No renewal date',
    };
  }

  const targetTs = parseLocalDate(targetDateStr);
  if (isNaN(targetTs)) {
    return {
      daysRemaining: Infinity,
      isOverdue: false,
      isDueSoon: false,
      statusText: 'Invalid date',
    };
  }

  const asOfTs = asOfDate.getTime();
  const diffDays = Math.ceil((targetTs - asOfTs) / (24 * 3600 * 1000));

  const isOverdue = diffDays < 0;
  const isDueSoon = diffDays >= 0 && diffDays <= 30;

  let statusText = `${diffDays} days left`;
  if (isOverdue) {
    statusText = `Overdue by ${Math.abs(diffDays)} days`;
  } else if (diffDays === 0) {
    statusText = 'Due today';
  }

  return {
    daysRemaining: diffDays,
    isOverdue,
    isDueSoon,
    statusText,
  };
}

/**
 * Computes aggregated insurance portfolio overview.
 */
export function calculateInsuranceTotals(
  policies: Insurance[],
  asOfDate: Date = new Date()
): InsuranceTotals {
  if (!Array.isArray(policies) || policies.length === 0) {
    return {
      totalSumAssured: 0,
      totalAnnualPremium: 0,
      activeCount: 0,
      expiringSoonCount: 0,
    };
  }

  let totalSumAssured = 0;
  let totalAnnualPremium = 0;
  let activeCount = 0;
  let expiringSoonCount = 0;

  for (const p of policies) {
    const sumAssured = Number(p.sum_assured);
    if (!isNaN(sumAssured) && sumAssured > 0) {
      totalSumAssured += sumAssured;
    }
    totalAnnualPremium += calculateAnnualizedPremium(p);
    activeCount++;

    const renewal = getPolicyRenewalStatus(p, asOfDate);
    if (renewal.isDueSoon || renewal.isOverdue) {
      expiringSoonCount++;
    }
  }

  return {
    totalSumAssured,
    totalAnnualPremium,
    activeCount,
    expiringSoonCount,
  };
}
