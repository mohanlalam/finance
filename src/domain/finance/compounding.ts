/**
 * Domain Layer: Pure Financial Compounding & Valuation Algorithms
 * 
 * Pure mathematical functions independent of UI or Framework state.
 */

import { CompoundingFrequency, ValuationSummary } from '../types';

/**
 * Calculates compound interest maturity value.
 * A = P * (1 + r/n)^(n*t)
 */
export function calculateCompoundInterest(
  principal: number,
  annualRatePercentage: number,
  tenureYears: number,
  frequency: CompoundingFrequency = 'QUARTERLY'
): number {
  if (principal <= 0 || annualRatePercentage <= 0 || tenureYears <= 0) {
    return Math.max(0, principal);
  }

  const rateDecimal = annualRatePercentage / 100;
  const frequenciesPerYear: Record<CompoundingFrequency, number> = {
    MONTHLY: 12,
    QUARTERLY: 4,
    HALF_YEARLY: 2,
    ANNUALLY: 1,
  };

  const n = frequenciesPerYear[frequency] || 4;
  const totalCompounds = n * tenureYears;
  const amount = principal * Math.pow(1 + rateDecimal / n, totalCompounds);

  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : principal;
}

/**
 * Calculates Recurring Deposit (RD) Maturity Value using Indian Banking formula:
 * M = R * [ ( (1 + i)^n - 1 ) / ( 1 - (1 + i)^(-1/3) ) ]
 * where i = annual_rate / 4 (quarterly rate), n = quarters
 */
export function calculateRDMaturityValue(
  monthlyInstallment: number,
  annualRatePercentage: number,
  monthsCount: number
): number {
  if (monthlyInstallment <= 0 || annualRatePercentage <= 0 || monthsCount <= 0) {
    return monthlyInstallment * Math.max(0, monthsCount);
  }

  const i = annualRatePercentage / 400; // Quarterly compounding rate
  let totalMaturity = 0;

  // Compound each monthly installment for its remaining tenure quarters
  for (let m = 1; m <= monthsCount; m++) {
    const quartersRemaining = (monthsCount - m + 1) / 3;
    totalMaturity += monthlyInstallment * Math.pow(1 + i, quartersRemaining);
  }

  return Number.isFinite(totalMaturity)
    ? Math.round(totalMaturity * 100) / 100
    : monthlyInstallment * monthsCount;
}

/**
 * Aggregates portfolio holdings into a pure domain ValuationSummary.
 */
export function aggregateHoldingsValuation(
  holdings: Array<{ investedAmount: number; currentValue: number; dayChange?: number }>
): ValuationSummary {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalDayChange = 0;

  for (let i = 0; i < holdings.length; i++) {
    const h = holdings[i];
    totalInvested += h.investedAmount || 0;
    totalCurrentValue += h.currentValue || 0;
    totalDayChange += h.dayChange || 0;
  }

  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainLossPercentage =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const dayChangePercentage =
    totalCurrentValue > 0 ? (totalDayChange / (totalCurrentValue - totalDayChange)) * 100 : 0;

  return {
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
    totalGainLoss: Math.round(totalGainLoss * 100) / 100,
    totalGainLossPercentage: Number.isFinite(totalGainLossPercentage)
      ? Math.round(totalGainLossPercentage * 100) / 100
      : 0,
    dayChange: Math.round(totalDayChange * 100) / 100,
    dayChangePercentage: Number.isFinite(dayChangePercentage)
      ? Math.round(dayChangePercentage * 100) / 100
      : 0,
  };
}
