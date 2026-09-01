import { describe, it, expect } from 'vitest';
import { checkForDuplicateAsset } from '../services/duplicateDetectionService';
import { Portfolio } from '../../../types/portfolio';
import { SmartImportFormData } from '../types';

const MOCK_PORTFOLIOS: Portfolio[] = [
  {
    id: 'p-1',
    name: 'rammohan',
    label: 'rammohan',
    holdings: [
      { id: 'h-1', sno: 1, ticker: 'RELIANCE.NS', yahooSymbol: 'RELIANCE.NS', stockName: 'Reliance Industries', qty: 100, avgPrice: 1400, ltp: 1500, amountInvested: 140000, currentValue: 150000, unrealizedPnL: 10000, pnlPercent: 7.14, todayPnLPercent: 0.67 },
    ],
    fixedDeposits: [
      { id: 'fd-1', portfolio_id: 'p-1', bank_name: 'HDFC Bank', principal_amount: 500000, interest_rate: 7.5, start_date: '2024-01-01', maturity_date: '2029-01-01', maturity_amount: 700000, status: 'active' },
    ],
    rdAccounts: [],
    sipAccounts: [],
    goldHoldings: [
      { id: 'g-1', portfolio_id: 'p-1', item_name: 'Gold Bangle', purity: '22K', weight_grams: 50, purchase_price: 250000, current_valuation: 700000, purchase_date: '2022-01-01' },
    ],
    realEstate: [],
    insurances: [
      { id: 'ins-1', portfolio_id: 'p-1', policy_name: 'LIC Tech Term', provider: 'LIC', policy_number: '123456789', insurance_type: 'term', sum_assured: 10000000, premium_amount: 25000, renewal_date: '2025-01-01' },
    ],
    documents: [],
  } as unknown as Portfolio,
];

const BASE_FORM_DATA: SmartImportFormData = {
  institutionName: '',
  principalAmount: '',
  interestRate: '',
  startDate: '',
  maturityDate: '',
  maturityAmount: '',
  monthlyDeposit: '',
  totalInstallments: '',
  paidInstallments: '',
  fundName: '',
  folioNumber: '',
  monthlySip: '',
  sipDate: '',
  nav: '',
  units: '',
  currentValuation: '',
  expectedCagr: '',
  itemName: '',
  purity: '22K',
  weightGrams: '',
  purchasePrice: '',
  purchasePriceType: 'unknown',
  ratePerGram: '',
  stockName: '',
  symbol: '',
  quantity: '',
  avgBuyPrice: '',
  propertyName: '',
  propertyType: '',
  location: '',
  purchasePriceRealty: '',
  currentValuationRealty: '',
  monthlyRent: '',
  policyName: '',
  policyNumber: '',
  insuranceType: '',
  sumAssured: '',
  premiumAmount: '',
  renewalDate: '',
  policyTermYears: '',
  notes: '',
};

describe('duplicateDetectionService', () => {
  it('detects duplicate Fixed Deposit accurately', () => {
    const duplicate = checkForDuplicateAsset('fd', 'rammohan', {
      ...BASE_FORM_DATA,
      institutionName: 'HDFC Bank',
      principalAmount: '500000',
      startDate: '2024-01-01',
    }, MOCK_PORTFOLIOS);

    expect(duplicate).not.toBeNull();
    expect(duplicate?.assetType).toBe('fd');
    expect(duplicate?.existingAssetId).toBe('fd-1');
  });

  it('detects duplicate Insurance policy by policy number', () => {
    const duplicate = checkForDuplicateAsset('insurance', 'rammohan', {
      ...BASE_FORM_DATA,
      policyNumber: '123456789',
    }, MOCK_PORTFOLIOS);

    expect(duplicate).not.toBeNull();
    expect(duplicate?.assetType).toBe('insurance');
    expect(duplicate?.existingAssetId).toBe('ins-1');
  });

  it('detects duplicate Gold item by name and weight', () => {
    const duplicate = checkForDuplicateAsset('gold', 'rammohan', {
      ...BASE_FORM_DATA,
      itemName: 'Gold Bangle',
      weightGrams: '50',
    }, MOCK_PORTFOLIOS);

    expect(duplicate).not.toBeNull();
    expect(duplicate?.assetType).toBe('gold');
    expect(duplicate?.existingAssetId).toBe('g-1');
  });

  it('returns null when no duplicate exists', () => {
    const duplicate = checkForDuplicateAsset('fd', 'rammohan', {
      ...BASE_FORM_DATA,
      institutionName: 'State Bank of India',
      principalAmount: '100000',
      startDate: '2025-01-01',
    }, MOCK_PORTFOLIOS);

    expect(duplicate).toBeNull();
  });
});
