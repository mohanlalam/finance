export type FinancialIntent =
  | 'NET_WORTH'
  | 'ALLOCATION'
  | 'STOCK_HOLDINGS'
  | 'TOP_GAINERS'
  | 'TOP_LOSERS'
  | 'MATURITY_SCHEDULE'
  | 'INSURANCE_RENEWAL'
  | 'TAX_HARVESTING'
  | 'GOLD_VALUATION'
  | 'REAL_ESTATE'
  | 'PERFORMANCE_XIRR'
  | 'DATA_QUALITY'
  | 'HELP'
  | 'UNKNOWN';

export interface AssistantResponse {
  intent: FinancialIntent;
  reply: string;
  data?: unknown;
  actionableUrl?: string;
  confidence: number;
}
