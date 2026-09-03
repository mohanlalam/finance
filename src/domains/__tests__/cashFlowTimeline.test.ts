import { describe, it, expect } from 'vitest';
import { calculateCashFlowTimeline } from '../cashflow/calculations/cashFlowTimeline';
import { Portfolio } from '../../types/portfolio';

describe('cashFlowTimeline calculation engine', () => {
  const mockPortfolios: Portfolio[] = [
    {
      id: 'p1',
      name: 'Rammohan',
      label: 'Rammohan',
      holdings: [],
      fixedDeposits: [
        {
          id: 'fd1',
          portfolio_id: 'p1',
          bank_name: 'HDFC Bank',
          principal_amount: 500000,
          interest_rate: 7.2,
          start_date: '2025-10-15',
          maturity_date: '2026-10-15',
          maturity_amount: 536000,
          status: 'active',
        },
      ],
      rdAccounts: [
        {
          id: 'rd1',
          portfolio_id: 'p1',
          bank_name: 'SBI',
          monthly_deposit: 10000,
          interest_rate: 6.8,
          start_date: '2025-01-05',
          maturity_date: '2027-01-05',
          maturity_amount: 260000,
          status: 'active',
          contributions: [],
        },
      ],
      sipAccounts: [
        {
          id: 'sip1',
          portfolio_id: 'p1',
          fund_name: 'Mirae Asset Large Cap Fund',
          monthly_sip: 15000,
          expected_cagr: 12,
          units: 100,
          start_date: '2024-01-01',
          next_sip_date: '2026-09-10',
          fallback_valuation: 130000,
        },
      ],
      goldHoldings: [
        {
          id: 'gold1',
          portfolio_id: 'p1',
          purity: 'sgb',
          item_name: 'SGB 2024 Series I',
          weight_grams: 50,
          purchase_price: 250000, // 50g * 5000/g
          current_valuation: 375000,
          purchase_date: '2024-04-10', // Semi-annual coupons in April and October
        },
      ],
      realEstate: [
        {
          id: 're1',
          portfolio_id: 'p1',
          property_name: 'Whitefield 2BHK Apartment',
          property_type: 'apartment',
          purchase_price: 6000000,
          current_valuation: 7500000,
          monthly_rent: 30000,
        },
      ],
      insurances: [
        {
          id: 'ins1',
          portfolio_id: 'p1',
          policy_name: 'HDFC Life Click 2 Protect',
          provider: 'HDFC Life',
          sum_assured: 10000000,
          premium_amount: 24000,
          renewal_date: '2026-11-20',
          insurance_type: 'term',
        },
      ],
      documents: [],
      totalInvested: 0,
      totalCurrentValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      stocksValue: 0,
      fdValue: 0,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    },
    {
      id: 'p2',
      name: 'Padmavathi',
      label: 'Padmavathi',
      holdings: [],
      fixedDeposits: [],
      rdAccounts: [],
      sipAccounts: [
        {
          id: 'sip2',
          portfolio_id: 'p2',
          fund_name: 'Parag Parikh Flexi Cap Fund',
          monthly_sip: 10000,
          expected_cagr: 12,
          units: 50,
          start_date: '2024-01-01',
          next_sip_date: '2026-09-15',
          fallback_valuation: 70000,
        },
      ],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      totalInvested: 0,
      totalCurrentValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      stocksValue: 0,
      fdValue: 0,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    },
  ];

  it('projects 12 forward months correctly starting from reference date', () => {
    const refDate = new Date('2026-09-01T00:00:00Z');
    const result = calculateCashFlowTimeline(mockPortfolios, refDate);

    expect(result.months).toHaveLength(12);
    expect(result.months[0].monthKey).toBe('2026-09');
    expect(result.months[11].monthKey).toBe('2027-08');
  });

  it('accurately captures FD maturity inflow in October 2026', () => {
    const refDate = new Date('2026-09-01T00:00:00Z');
    const result = calculateCashFlowTimeline(mockPortfolios, refDate);

    const octMonth = result.months.find((m) => m.monthKey === '2026-10');
    expect(octMonth).toBeDefined();

    // Oct has: FD maturity (536,000) + SGB coupon (50g * 5000 * 0.025 / 2 = 3,125) + Rent (30,000)
    expect(octMonth?.inflows).toBeGreaterThanOrEqual(536000 + 30000);

    const fdEvent = octMonth?.events.find((e) => e.category === 'fd_maturity');
    expect(fdEvent).toBeDefined();
    expect(fdEvent?.amount).toBe(536000);
    expect(fdEvent?.portfolioName).toBe('Rammohan');
  });

  it('aggregates monthly active SIP and RD outflows across all 12 months', () => {
    const refDate = new Date('2026-09-01T00:00:00Z');
    const result = calculateCashFlowTimeline(mockPortfolios, refDate);

    // Each month has: Rammohan SIP (15,000) + Padmavathi SIP (10,000) + Rammohan RD (10,000) = 35,000 outflow baseline
    const sepMonth = result.months.find((m) => m.monthKey === '2026-09');
    expect(sepMonth?.outflows).toBe(35000);
  });

  it('captures annual insurance renewal outflow in November 2026', () => {
    const refDate = new Date('2026-09-01T00:00:00Z');
    const result = calculateCashFlowTimeline(mockPortfolios, refDate);

    const novMonth = result.months.find((m) => m.monthKey === '2026-11');
    expect(novMonth).toBeDefined();

    // Outflows in Nov: 35,000 (SIPs + RD) + 24,000 (Insurance premium) = 59,000
    expect(novMonth?.outflows).toBe(59000);

    const insEvent = novMonth?.events.find((e) => e.category === 'insurance_premium');
    expect(insEvent).toBeDefined();
    expect(insEvent?.amount).toBe(24000);
  });

  it('computes family member attribution cleanly', () => {
    const refDate = new Date('2026-09-01T00:00:00Z');
    const result = calculateCashFlowTimeline(mockPortfolios, refDate);

    const rammohan = result.memberBreakdown.find((m) => m.name === 'Rammohan');
    const padmavathi = result.memberBreakdown.find((m) => m.name === 'Padmavathi');

    expect(rammohan).toBeDefined();
    expect(rammohan?.totalInflow).toBeGreaterThan(500000); // Has the FD & rent

    expect(padmavathi).toBeDefined();
    expect(padmavathi?.totalInflow).toBe(0);
    expect(padmavathi?.totalOutflow).toBe(10000 * 12); // 12 months of 10,000 SIP
  });
});
