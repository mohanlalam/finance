import { describe, it, expect } from 'vitest';
import { disambiguateEntity } from '../smart-import/services/entityDisambiguationService';

describe('entityDisambiguationService', () => {
  const mockPortfolios = [
    { name: 'rammohan', label: 'Rammohan' },
    { name: 'padmavathi', label: 'Padmavathi' },
    { name: 'sailaxmi', label: 'Sai Laxmi' },
  ];

  it('correctly attributes document mentioning Padmavathi', () => {
    const res = disambiguateEntity(
      {
        fileName: 'HDFC_FD_Advice_Padmavathi_Lalam.pdf',
        rawText: 'Fixed Deposit Receipt for Smt. Padmavathi Lalam. Deposit: Rs 5,00,000 at 7.1%',
      },
      mockPortfolios,
      'rammohan'
    );

    expect(res.portfolioName).toBe('padmavathi');
    expect(res.memberLabel).toBe('Padmavathi');
    expect(res.matchType).toBe('name');
    expect(res.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('correctly attributes document with Sai Laxmi PAN or name', () => {
    const res = disambiguateEntity(
      {
        fileName: 'Zerodha_Contract_Note_Sai_Laxmi.pdf',
        rawText: 'Trade Confirmation for Ms. Sai Laxmi. Account Folio: 987654321',
      },
      mockPortfolios,
      'rammohan'
    );

    expect(res.portfolioName).toBe('sailaxmi');
    expect(res.memberLabel).toBe('Sai Laxmi');
    expect(res.matchType).toBe('name');
  });

  it('correctly attributes document for Rammohan', () => {
    const res = disambiguateEntity(
      {
        fileName: 'Tanishq_Invoice.pdf',
        rawText: 'Customer: Sri Lalam Rammohan. 22K Gold Chain 15.5g',
      },
      mockPortfolios,
      'padmavathi'
    );

    expect(res.portfolioName).toBe('rammohan');
    expect(res.memberLabel).toBe('Rammohan');
  });

  it('falls back to active portfolio when no member hints are found', () => {
    const res = disambiguateEntity(
      {
        fileName: 'Unknown_Receipt_123.pdf',
        rawText: 'Payment Voucher of Rs 20,000 to XYZ store',
      },
      mockPortfolios,
      'padmavathi'
    );

    expect(res.portfolioName).toBe('padmavathi');
    expect(res.memberLabel).toBe('Padmavathi');
    expect(res.matchType).toBe('default');
    expect(res.confidence).toBe(0.5);
  });
});
