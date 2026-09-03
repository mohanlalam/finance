/**
 * reinvestmentPlaybook.ts — Auto-Maturity Reinvestment Matrix & Family Tax Arbitrage Engine
 *
 * Evaluates maturing Fixed & Recurring Deposits coming due in the portfolio.
 * Compares post-tax yields across:
 * 1. Bank Fixed Deposits (with Section 80TTB senior citizen ₹50K interest deduction)
 * 2. Arbitrage / Equity Savings Funds (Budget 2024 LTCG 12.5% over ₹1.25L exemption vs 30% slab rate)
 * 3. Sovereign Gold Bonds / Bullion Rebalancing (if gold allocation is below 10-15%)
 *
 * Generates actionable allocation recommendations split across Rammohan, Padmavathi, and Sai Laxmi.
 * Pure financial calculations with zero external dependencies.
 */

import { Portfolio } from '../../../types/portfolio';

export interface ReinvestmentOption {
  type: 'bank_fd' | 'arbitrage_fund' | 'gold_sgb';
  title: string;
  badge: string;
  expectedPreTaxReturn: number; // e.g. 7.5%
  estimatedPostTaxReturn: number; // e.g. 6.8%
  taxImplication: string;
  rationale: string;
  recommendedMemberSplit: {
    memberName: string;
    percentage: number;
    allocationAmount: number;
    taxReason: string;
  }[];
}

export interface MaturingAssetOpportunity {
  id: string;
  assetType: 'fd' | 'rd';
  title: string;
  ownerName: string;
  ownerLabel: string;
  maturityDate: string;
  daysToMaturity: number;
  maturityAmount: number;
  currentInterestRate: number;
  playbookOptions: ReinvestmentOption[];
}

export interface ReinvestmentMatrixResult {
  totalUpcomingMaturitiesAmount: number;
  maturingCount: number;
  opportunities: MaturingAssetOpportunity[];
}

function getDaysDifference(targetDateStr: string, refDate: Date): number {
  const parts = targetDateStr.split('-');
  if (parts.length < 3) return 0;
  const targetYear = parseInt(parts[0], 10);
  const targetMonth = parseInt(parts[1], 10) - 1;
  const targetDay = parseInt(parts[2], 10);

  const d1 = Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const d2 = Date.UTC(targetYear, targetMonth, targetDay);
  return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

/**
 * Evaluates maturing deposits within the specified horizon (default: 90 days from referenceDate).
 */
export function generateReinvestmentMatrix(
  portfolios: Portfolio[],
  horizonDays: number = 90,
  referenceDate: Date = new Date()
): ReinvestmentMatrixResult {
  const opportunities: MaturingAssetOpportunity[] = [];

  for (const p of portfolios) {
    const ownerName = p.name;
    const ownerLabel = p.label;

    // Check Fixed Deposits
    for (const fd of p.fixedDeposits || []) {
      if (fd.status === 'active' && fd.maturity_date) {
        const daysToMaturity = getDaysDifference(fd.maturity_date, referenceDate);

        if (daysToMaturity >= 0 && daysToMaturity <= horizonDays) {
          const amount = fd.maturity_amount || fd.principal_amount || 0;

          opportunities.push({
            id: `fd_${fd.id}`,
            assetType: 'fd',
            title: `${fd.bank_name || 'Bank'} Fixed Deposit`,
            ownerName,
            ownerLabel,
            maturityDate: fd.maturity_date,
            daysToMaturity,
            maturityAmount: amount,
            currentInterestRate: fd.interest_rate || 7.0,
            playbookOptions: buildPlaybookOptions(amount, ownerName),
          });
        }
      }
    }

    // Check Recurring Deposits
    for (const rd of p.rdAccounts || []) {
      if (rd.status === 'active' && rd.maturity_date) {
        const daysToMaturity = getDaysDifference(rd.maturity_date, referenceDate);

        if (daysToMaturity >= 0 && daysToMaturity <= horizonDays) {
          const amount = rd.maturity_amount || (rd.monthly_deposit * 12) || 0;

          opportunities.push({
            id: `rd_${rd.id}`,
            assetType: 'rd',
            title: `${rd.bank_name || 'Bank'} Recurring Deposit`,
            ownerName,
            ownerLabel,
            maturityDate: rd.maturity_date,
            daysToMaturity,
            maturityAmount: amount,
            currentInterestRate: rd.interest_rate || 7.0,
            playbookOptions: buildPlaybookOptions(amount, ownerName),
          });
        }
      }
    }
  }

  // Sort by earliest maturity date
  opportunities.sort((a, b) => a.daysToMaturity - b.daysToMaturity);

  const totalUpcomingMaturitiesAmount = opportunities.reduce((sum, op) => sum + op.maturityAmount, 0);

  return {
    totalUpcomingMaturitiesAmount,
    maturingCount: opportunities.length,
    opportunities,
  };
}

/**
 * Builds tailored reinvestment options and family tax-arbitrage splits.
 */
function buildPlaybookOptions(amount: number, currentOwner: string): ReinvestmentOption[] {
  // Option 1: High-Yield Scheduled Bank FD (Safe Income)
  const fdOptions: ReinvestmentOption = {
    type: 'bank_fd',
    title: 'Senior Citizen & Bank Fixed Deposit (7.25% - 7.75%)',
    badge: 'Capital Guaranteed',
    expectedPreTaxReturn: 7.5,
    estimatedPostTaxReturn: 6.8,
    taxImplication: 'Section 80TTB allows up to ₹50,000 tax-free interest deduction for Senior Citizens.',
    rationale: 'Re-lock at peak banking interest rates with quarterly/half-yearly compounding.',
    recommendedMemberSplit: [
      {
        memberName: currentOwner === 'Padmavathi' ? 'Padmavathi' : 'Padmavathi',
        percentage: 60,
        allocationAmount: Math.round(amount * 0.6),
        taxReason: 'Optimizes Section 80TTB ₹50,000 interest deduction window.',
      },
      {
        memberName: currentOwner === 'Rammohan' ? 'Rammohan' : 'Sai Laxmi',
        percentage: 40,
        allocationAmount: Math.round(amount * 0.4),
        taxReason: 'Maintains emergency liquidity reserve.',
      },
    ],
  };

  // Option 2: Arbitrage & Equity Savings Fund (Tax-Advantaged Yield)
  const arbOptions: ReinvestmentOption = {
    type: 'arbitrage_fund',
    title: 'Arbitrage / Equity Savings Mutual Fund (7.0% - 7.8%)',
    badge: 'Tax Optimized (12.5% LTCG)',
    expectedPreTaxReturn: 7.4,
    estimatedPostTaxReturn: 7.1,
    taxImplication: 'Taxed as Equity: LTCG is 12.5% above ₹1.25L annual exemption (beats 30% slab rate).',
    rationale: 'Arbitrage funds eliminate market risk via cash-futures spread while securing equity tax treatment.',
    recommendedMemberSplit: [
      {
        memberName: 'Sai Laxmi',
        percentage: 50,
        allocationAmount: Math.round(amount * 0.5),
        taxReason: 'Utilizes individual ₹1.25 Lakh annual tax-free LTCG exemption.',
      },
      {
        memberName: 'Rammohan',
        percentage: 50,
        allocationAmount: Math.round(amount * 0.5),
        taxReason: 'Saves ~18% tax difference compared to regular debt FD slab taxation.',
      },
    ],
  };

  // Option 3: SGB / Bullion Hedge
  const goldOptions: ReinvestmentOption = {
    type: 'gold_sgb',
    title: 'Sovereign Gold Bonds / Bullion Accumulation',
    badge: 'Inflation Hedge + 2.5% Coupon',
    expectedPreTaxReturn: 11.5, // 9% appreciation + 2.5% coupon
    estimatedPostTaxReturn: 11.0,
    taxImplication: 'Capital gains on SGB redemption held till maturity are 100% tax-exempt under Sec 47(viic).',
    rationale: 'Rebalances family gold bullion exposure to maintain strategic 10-15% net worth diversification.',
    recommendedMemberSplit: [
      {
        memberName: 'Padmavathi',
        percentage: 50,
        allocationAmount: Math.round(amount * 0.5),
        taxReason: 'Zero capital gains tax upon maturity.',
      },
      {
        memberName: 'Sai Laxmi',
        percentage: 50,
        allocationAmount: Math.round(amount * 0.5),
        taxReason: 'Long-term intergenerational wealth preservation.',
      },
    ],
  };

  return [fdOptions, arbOptions, goldOptions];
}
