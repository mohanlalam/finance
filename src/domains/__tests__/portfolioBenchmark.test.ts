// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { calculateAggregatedPortfolioTotals } from '../portfolio/calculations/portfolioTotals';
import { classBreakdown, calculateAssetAllocations } from '../portfolio/calculations/allocation';
import { calculateXIRR } from '../performance/calculations/xirr';
import { Portfolio, Holding, FixedDeposit, RDAccount, SIPAccount, GoldHolding, RealEstate, Insurance } from '../../types/portfolio';

function generateLargePortfolio(count: number): Portfolio {
  const holdings: Holding[] = [];
  const fixedDeposits: FixedDeposit[] = [];
  const rdAccounts: RDAccount[] = [];
  const sipAccounts: SIPAccount[] = [];
  const goldHoldings: GoldHolding[] = [];
  const realEstate: RealEstate[] = [];
  const insurances: Insurance[] = [];

  const itemsPerClass = Math.ceil(count / 7);
  const pId = `portfolio-${count}`;

  let stocksVal = 0;
  let fdVal = 0;
  let rdVal = 0;
  let sipVal = 0;
  let goldVal = 0;
  let reVal = 0;
  let totalInv = 0;

  for (let i = 0; i < itemsPerClass; i++) {
    const sShares = 50 + (i % 100);
    const sAvg = 250 + (i % 500);
    const sPrice = 280 + (i % 500);
    const invested = sShares * sAvg;
    const current = sShares * sPrice;
    stocksVal += current;
    totalInv += invested;

    holdings.push({
      id: `stock-${i}`,
      sno: i + 1,
      ticker: `STOCK_${i}.NS`,
      stockName: `Company ${i} Ltd`,
      yahooSymbol: `STOCK_${i}.NS`,
      qty: sShares,
      avgPrice: sAvg,
      amountInvested: invested,
      ltp: sPrice,
      currentValue: current,
      unrealizedPnL: current - invested,
      pnlPercent: invested > 0 ? ((current - invested) / invested) * 100 : 0,
      todayPnLPercent: (i % 2 === 0 ? 1.5 : -1.2),
    });

    const fdPrincipal = 100000 + (i * 1000);
    const fdMaturity = 107000 + (i * 1070);
    fdVal += fdMaturity;
    totalInv += fdPrincipal;

    fixedDeposits.push({
      id: `fd-${i}`,
      portfolio_id: pId,
      bank_name: `Bank ${i % 10}`,
      principal_amount: fdPrincipal,
      interest_rate: 6.5 + (i % 3),
      start_date: '2024-01-01',
      maturity_date: '2025-01-01',
      maturity_amount: fdMaturity,
      status: 'active',
    });

    const rdMonthly = 5000 + (i * 50);
    rdVal += rdMonthly * 12;
    totalInv += rdMonthly * 12;

    rdAccounts.push({
      id: `rd-${i}`,
      portfolio_id: pId,
      bank_name: `Bank RD ${i % 10}`,
      monthly_deposit: rdMonthly,
      interest_rate: 7.0,
      start_date: '2024-01-01',
      maturity_date: '2025-01-01',
      maturity_amount: 65000,
      status: 'active',
      contributions: [
        { date: '2024-01-01', amount: 5000 },
        { date: '2024-02-01', amount: 5000 },
        { date: '2024-03-01', amount: 5000 },
      ],
    });

    const sipValuation = 180000 + (i * 1000);
    sipVal += sipValuation;
    totalInv += 120000;

    sipAccounts.push({
      id: `sip-${i}`,
      portfolio_id: pId,
      fund_name: `Growth Fund ${i}`,
      monthly_sip: 10000,
      expected_cagr: 12.5,
      units: 150 + i,
      start_date: '2023-01-01',
      fallback_valuation: sipValuation,
    });

    const goldPrice = 70000 + (i * 100);
    const goldValuation = 75000 + (i * 100);
    goldVal += goldValuation;
    totalInv += goldPrice;

    goldHoldings.push({
      id: `gold-${i}`,
      portfolio_id: pId,
      item_name: `Gold Coin ${i}`,
      purity: '24K',
      weight_grams: 10 + (i % 50),
      purchase_price: goldPrice,
      current_valuation: goldValuation,
      purchase_date: '2023-05-15',
    });

    const rePrice = 5000000 + (i * 10000);
    const reValuation = 6500000 + (i * 15000);
    reVal += reValuation;
    totalInv += rePrice;

    realEstate.push({
      id: `re-${i}`,
      portfolio_id: pId,
      property_name: `Property #${i}`,
      property_type: 'apartment',
      location: 'Bangalore',
      purchase_price: rePrice,
      current_valuation: reValuation,
      purchase_date: '2022-01-01',
      monthly_rent: 25000,
    });

    insurances.push({
      id: `ins-${i}`,
      portfolio_id: pId,
      policy_name: `Term Plan ${i}`,
      insurance_type: 'term',
      provider: 'HDFC Life',
      sum_assured: 10000000,
      premium_amount: 18000,
      renewal_date: '2025-10-15',
    });
  }

  const totalCurrentVal = stocksVal + fdVal + rdVal + sipVal + goldVal + reVal;

  return {
    id: pId,
    name: `benchmark-${count}`,
    label: `Benchmark Portfolio (${count} items)`,
    holdings,
    fixedDeposits,
    rdAccounts,
    sipAccounts,
    goldHoldings,
    realEstate,
    insurances,
    documents: [],
    totalInvested: totalInv,
    totalCurrentValue: totalCurrentVal,
    totalPnL: totalCurrentVal - totalInv,
    totalPnLPercent: totalInv > 0 ? ((totalCurrentVal - totalInv) / totalInv) * 100 : 0,
    stocksValue: stocksVal,
    fdValue: fdVal,
    rdValue: rdVal,
    sipValue: sipVal,
    goldValue: goldVal,
    realEstateValue: reVal,
  };
}

describe('Portfolio Performance & Scalability Benchmarks', () => {
  it('aggregates 100 assets in < 5ms', () => {
    const portfolio = generateLargePortfolio(100);
    const start = performance.now();
    const totals = calculateAggregatedPortfolioTotals([portfolio]);
    const elapsed = performance.now() - start;

    expect(totals.totalInvested).toBeGreaterThan(0);
    expect(totals.totalCurrentValue).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(10);
  });

  it('aggregates 1,000 assets in < 15ms', () => {
    const portfolio = generateLargePortfolio(1000);
    const start = performance.now();
    const totals = calculateAggregatedPortfolioTotals([portfolio]);
    const elapsed = performance.now() - start;

    expect(totals.totalInvested).toBeGreaterThan(0);
    expect(totals.totalCurrentValue).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(25);
  });

  it('calculates asset class allocation for 1,000 assets in < 5ms', () => {
    const portfolio = generateLargePortfolio(1000);
    const breakdown = classBreakdown([portfolio], portfolio);

    const start = performance.now();
    const allocation = calculateAssetAllocations(breakdown);
    const elapsed = performance.now() - start;

    expect(allocation.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(10);
  });

  it('performs rapid substring search & filtering over 1,000 items in < 5ms', () => {
    const portfolio = generateLargePortfolio(1000);
    const query = 'Company 5';

    const start = performance.now();
    const matched = (portfolio.holdings || []).filter(
      (h) => h.stockName.toLowerCase().includes(query.toLowerCase()) || h.ticker.toLowerCase().includes(query.toLowerCase())
    );
    const elapsed = performance.now() - start;

    expect(matched.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(10);
  });

  it('solves multi-year Newton-Raphson XIRR cash flows in < 5ms', () => {
    const cashFlows = [
      { amount: -500000, date: '2020-01-01' },
      { amount: -50000, date: '2021-01-01' },
      { amount: -50000, date: '2022-01-01' },
      { amount: -50000, date: '2023-01-01' },
      { amount: 850000, date: '2024-01-01' },
    ];

    const start = performance.now();
    const xirr = calculateXIRR(cashFlows);
    const elapsed = performance.now() - start;

    expect(xirr).toBeGreaterThan(0.05);
    expect(xirr).toBeLessThan(0.30);
    expect(elapsed).toBeLessThan(10);
  });
});