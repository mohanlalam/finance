import { describe, it, expect } from 'vitest';
import {
  calculateAnnualizedPremium,
  calculateTotalSumAssured,
  calculateTotalAnnualPremium,
  getPolicyRenewalStatus,
  calculateInsuranceTotals,
} from '../assets/insurance/calculations/insuranceValuation';
import { Insurance } from '../../types/portfolio';

const mockPolicies: Insurance[] = [
  {
    id: 'ins-1',
    portfolio_id: 'p-1',
    policy_name: 'HDFC Term Life',
    insurance_type: 'term',
    provider: 'HDFC Life',
    sum_assured: 10000000,
    premium_amount: 12000,
    renewal_date: '2026-09-15',
  },
  {
    id: 'ins-2',
    portfolio_id: 'p-1',
    policy_name: 'Star Health Family Optima',
    insurance_type: 'health',
    provider: 'Star Health',
    sum_assured: 1500000,
    premium_amount: 24000,
    renewal_date: '2026-08-10', // overdue as of 2026-08-31
  },
  {
    id: 'ins-3',
    portfolio_id: 'p-1',
    policy_name: 'Vehicle Insurance',
    insurance_type: 'motor',
    provider: 'ICICI Lombard',
    sum_assured: 500000,
    premium_amount: 8000,
    renewal_date: '2027-04-01',
  },
];

describe('insuranceValuation', () => {
  it('normalizes annual premiums according to payment frequency', () => {
    expect(calculateAnnualizedPremium(mockPolicies[0])).toBe(12000);
    expect(calculateAnnualizedPremium(mockPolicies[1])).toBe(24000);
  });

  it('aggregates total sum assured and total annual premium correctly', () => {
    expect(calculateTotalSumAssured(mockPolicies)).toBe(12000000);
    expect(calculateTotalAnnualPremium(mockPolicies)).toBe(44000); // 12k + 24k + 8k
  });

  it('computes renewal status, overdue and due soon correctly', () => {
    const referenceDate = new Date('2026-08-31T00:00:00Z');

    const statusDueSoon = getPolicyRenewalStatus(mockPolicies[0], referenceDate);
    expect(statusDueSoon.isDueSoon).toBe(true);
    expect(statusDueSoon.isOverdue).toBe(false);

    const statusOverdue = getPolicyRenewalStatus(mockPolicies[1], referenceDate);
    expect(statusOverdue.isOverdue).toBe(true);
    expect(statusOverdue.isDueSoon).toBe(false);

    const statusFar = getPolicyRenewalStatus(mockPolicies[2], referenceDate);
    expect(statusFar.isDueSoon).toBe(false);
    expect(statusFar.isOverdue).toBe(false);
  });

  it('aggregates total insurance metrics correctly', () => {
    const referenceDate = new Date('2026-08-31T00:00:00Z');
    const totals = calculateInsuranceTotals(mockPolicies, referenceDate);
    expect(totals.totalSumAssured).toBe(12000000);
    expect(totals.totalAnnualPremium).toBe(44000);
    expect(totals.activeCount).toBe(3);
    expect(totals.expiringSoonCount).toBe(2); // 1 due soon + 1 overdue
  });
});
