export type PortfolioName = string;

export interface Holding {
  id?: string;
  sno: number;
  stockName: string;
  ticker: string;
  yahooSymbol: string;
  qty: number;
  avgPrice: number;
  weekLow52: number;
  weekHigh52: number;
  ltp: number;
  amountInvested: number;
  unrealizedPnL: number;
  pnlPercent: number;
  todayPnLPercent: number;
  currentValue: number;
}

export interface FixedDeposit {
  id: string;
  portfolio_id: string;
  bank_name: string;
  principal_amount: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string | null;
  maturity_amount: number;
  status: 'active' | 'matured';
  created_at?: string;
  fd_type?: string;
}

export interface GoldHolding {
  id: string;
  portfolio_id: string;
  item_name: string;
  purity: string;
  weight_grams: number;
  purchase_price: number;
  current_valuation: number;
  purchase_date?: string;
  created_at?: string;
}

export interface RealEstate {
  id: string;
  portfolio_id: string;
  property_name: string;
  property_type: 'apartment' | 'plot' | 'house' | 'commercial';
  location?: string;
  purchase_price: number;
  current_valuation: number;
  purchase_date?: string;
  monthly_rent: number;
  created_at?: string;
}

export interface Insurance {
  id: string;
  portfolio_id: string;
  insurance_type: 'health' | 'term' | 'life' | 'motor' | 'other';
  provider: string;
  policy_name: string;
  policy_number?: string;
  sum_assured: number;
  premium_amount: number;
  renewal_date?: string;
  created_at?: string;
}

export interface DocumentMetadata {
  id: string;
  portfolio_id: string;
  name: string;
  file_path: string;
  file_type?: string;
  asset_type: 'stock' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'general';
  asset_id?: string;
  expiry_date?: string;
  created_at?: string;
}

export interface Portfolio {
  id: string;
  name: PortfolioName;
  label: string;
  holdings: Holding[];
  fixedDeposits: FixedDeposit[];
  goldHoldings: GoldHolding[];
  realEstate: RealEstate[];
  insurances: Insurance[];
  documents: DocumentMetadata[];
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
}
