import { Portfolio } from '../../../types/portfolio';

export interface AssetAllocationItem {
  key: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AssetClassBreakdown {
  stocks: number;
  fd: number;
  rd: number;
  sip: number;
  gold: number;
  realEstate: number;
  insuranceCover: number;
  insurancePremium: number;
}

/**
 * Compute asset class breakdown across portfolios in a single pass without array allocations.
 */
export function classBreakdown(portfolios: Portfolio[], scope: Portfolio | null): AssetClassBreakdown {
  let stocks = 0;
  let fd = 0;
  let rd = 0;
  let sip = 0;
  let gold = 0;
  let realEstate = 0;
  let insuranceCover = 0;
  let insurancePremium = 0;

  const count = scope ? 1 : (portfolios ? portfolios.length : 0);
  for (let i = 0; i < count; i++) {
    const p = scope ? scope : portfolios[i];
    if (!p) continue;
    stocks += Number(p.stocksValue) || 0;
    fd += Number(p.fdValue) || 0;
    rd += Number(p.rdValue) || 0;
    sip += Number(p.sipValue) || 0;
    gold += Number(p.goldValue) || 0;
    realEstate += Number(p.realEstateValue) || 0;

    if (p.insurances) {
      for (let j = 0; j < p.insurances.length; j++) {
        insuranceCover += Number(p.insurances[j]?.sum_assured) || 0;
        insurancePremium += Number(p.insurances[j]?.premium_amount) || 0;
      }
    }
  }

  return { stocks, fd, rd, sip, gold, realEstate, insuranceCover, insurancePremium };
}

/**
 * Calculates allocation percentages for donut and pie charts.
 */
export function calculateAssetAllocations(breakdown: AssetClassBreakdown): AssetAllocationItem[] {
  const total =
    breakdown.stocks +
    breakdown.fd +
    breakdown.rd +
    breakdown.sip +
    breakdown.gold +
    breakdown.realEstate;

  if (total <= 0) return [];

  const raw = [
    { key: 'stocks', label: 'Stocks', value: breakdown.stocks, color: '#387ed1' },
    { key: 'fd', label: 'Fixed Deposits', value: breakdown.fd, color: '#00b074' },
    { key: 'rd', label: 'Recurring Deposits', value: breakdown.rd, color: '#ff9800' },
    { key: 'sip', label: 'Mutual Funds / SIP', value: breakdown.sip, color: '#8b5cf6' },
    { key: 'gold', label: 'Gold Bullion', value: breakdown.gold, color: '#f59e0b' },
    { key: 'realEstate', label: 'Real Estate', value: breakdown.realEstate, color: '#10b981' },
  ];

  return raw
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      percentage: Math.round((item.value / total) * 1000) / 10,
    }));
}
