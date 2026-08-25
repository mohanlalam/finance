export interface AssetValue {
  investedAmount: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange?: number;
  dayChangePercent?: number;
  isLiveValuation?: boolean;
}

export interface PortfolioTotals {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  todayPnL: number;
  todayPnLPercent: number;
  stocksValue: number;
  fdValue: number;
  rdValue: number;
  sipValue: number;
  goldValue: number;
  realEstateValue: number;
}
