import { describe, it, expect } from 'vitest';
import { validateAndNormalizeFinancialData } from '../services/financialValidationService';
import { SmartImportFormData } from '../types';

const BASE_FORM_DATA: SmartImportFormData = {
  institutionName: 'HDFC Bank',
  principalAmount: '500000',
  interestRate: '7.5',
  startDate: '2024-01-01',
  maturityDate: '2029-01-01',
  maturityAmount: '',
  monthlyDeposit: '5000',
  totalInstallments: '12',
  paidInstallments: '1',
  fundName: '',
  folioNumber: '',
  monthlySip: '',
  sipDate: '1',
  nav: '',
  units: '',
  currentValuation: '',
  expectedCagr: '12',
  itemName: 'Gold Ring',
  purity: '22K',
  weightGrams: '10',
  purchasePrice: '52000',
  purchasePriceType: 'unknown',
  ratePerGram: '',
  stockName: '',
  symbol: '',
  quantity: '',
  avgBuyPrice: '',
  propertyName: '',
  propertyType: 'Residential',
  location: '',
  purchasePriceRealty: '',
  currentValuationRealty: '',
  monthlyRent: '0',
  policyName: '',
  policyNumber: '',
  insuranceType: 'Term',
  sumAssured: '',
  premiumAmount: '',
  renewalDate: '',
  policyTermYears: '',
  notes: '',
};

describe('financialValidationService', () => {
  it('auto-computes FD compounding maturity value accurately', () => {
    const result = validateAndNormalizeFinancialData('fd', {
      ...BASE_FORM_DATA,
      principalAmount: '100000',
      interestRate: '7.0',
      startDate: '2024-01-01',
      maturityDate: '2025-01-01',
      maturityAmount: '',
    });

    expect(result.isValid).toBe(true);
    expect(Number(result.autoCorrectedFields.maturityAmount)).toBeGreaterThan(107000);
  });

  it('detects ambiguous price per gram for gold holdings', () => {
    const result = validateAndNormalizeFinancialData('gold', {
      ...BASE_FORM_DATA,
      weightGrams: '50',
      purchasePrice: '5200', // Ambiguous: 5200 total vs 5200/gram
    });

    expect(result.ambiguousPriceType).toBeDefined();
    expect(result.ambiguousPriceType?.options).toHaveLength(2);
  });

  it('validates Real Estate purchase and valuation values', () => {
    const result = validateAndNormalizeFinancialData('real_estate', {
      ...BASE_FORM_DATA,
      purchasePriceRealty: '5000000',
      currentValuationRealty: '',
    });

    expect(result.isValid).toBe(true);
    expect(result.autoCorrectedFields.currentValuationRealty).toBe('5000000');
  });
});
