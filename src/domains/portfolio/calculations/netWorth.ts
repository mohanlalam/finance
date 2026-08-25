import { Portfolio } from '../../../types/portfolio';

export interface NetWorthSnapshot {
  id?: string;
  snapshot_date: string;
  total_value: number;
  stocks_value: number;
  fd_value: number;
  rd_value?: number;
  sip_value?: number;
  gold_value: number;
  real_estate_value: number;
  created_at?: string;
}

/**
 * Calculates net worth from a portfolio list at current time.
 */
export function calculateCurrentNetWorth(portfolios: Portfolio[]): number {
  if (!portfolios || portfolios.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < portfolios.length; i++) {
    sum += Number(portfolios[i]?.totalCurrentValue) || 0;
  }
  return sum;
}

/**
 * Formats a net worth snapshot for persistence into `net_worth_history`.
 */
export function createNetWorthSnapshot(portfolios: Portfolio[], dateStr?: string): NetWorthSnapshot {
  const snapshot_date = dateStr || new Date().toISOString().split('T')[0];
  let stocks_value = 0;
  let fd_value = 0;
  let rd_value = 0;
  let sip_value = 0;
  let gold_value = 0;
  let real_estate_value = 0;

  for (let i = 0; i < portfolios.length; i++) {
    const p = portfolios[i];
    if (!p) continue;
    stocks_value += Number(p.stocksValue) || 0;
    fd_value += Number(p.fdValue) || 0;
    rd_value += Number(p.rdValue) || 0;
    sip_value += Number(p.sipValue) || 0;
    gold_value += Number(p.goldValue) || 0;
    real_estate_value += Number(p.realEstateValue) || 0;
  }

  const total_value = stocks_value + fd_value + rd_value + sip_value + gold_value + real_estate_value;

  return {
    snapshot_date,
    total_value,
    stocks_value,
    fd_value,
    rd_value,
    sip_value,
    gold_value,
    real_estate_value,
  };
}
