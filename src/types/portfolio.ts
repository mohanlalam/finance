export type PortfolioName = string;

export interface Holding {
  id: string;
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
  /** FD sub-type: 'regular' | 'recurring' | 'ssy' | 'nsc' | 'ppf' | 'sip' (default: 'regular') */
  fd_type?: string;
  /** JSONB array of contribution records for recurring deposits */
  contributions?: { date: string; amount: number }[];
  notes?: string;
  mf_scheme_code?: string;
  units?: number;
  girl_dob?: string;
  /** Per-FY rate overrides for SSY: [{ fyStartYear: 2026, rate: 8.5 }, ...] */
  rate_schedule?: { fyStartYear: number; rate: number }[];
  created_at?: string;
}

export interface SSYAccount {
  id: string;
  portfolio_id: string;
  bank_name: string;
  girl_dob: string;
  annual_deposit: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  maturity_amount: number;
  status: 'active' | 'matured';
  contributions: { date: string; amount: number }[];
  rate_schedule: { fyStartYear: number; rate: number }[];
  notes?: string;
  created_at?: string;
}

export interface RDAccount {
  id: string;
  portfolio_id: string;
  bank_name: string;
  monthly_deposit: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  maturity_amount: number;
  status: 'active' | 'matured';
  contributions: { date: string; amount: number }[];
  notes?: string;
  created_at?: string;
}

export interface SIPAccount {
  id: string;
  portfolio_id: string;
  fund_name: string;
  monthly_sip: number;
  expected_cagr: number;
  units: number;
  start_date: string;
  next_sip_date?: string | null;
  fallback_valuation: number;
  mf_scheme_code?: string;
  notes?: string;
  created_at?: string;
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
  notes?: string;
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
  notes?: string;
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
  notes?: string;
  created_at?: string;
}

export interface DocumentMetadata {
  id: string;
  portfolio_id: string;
  name: string;
  file_path: string;
  file_type?: string;
  asset_type: 'stock' | 'fd' | 'ssy' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'general';
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
  rdAccounts?: RDAccount[];
  sipAccounts?: SIPAccount[];
  ssyAccounts?: SSYAccount[];
  goldHoldings: GoldHolding[];
  realEstate: RealEstate[];
  insurances: Insurance[];
  documents: DocumentMetadata[];
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
}

export interface StockPayload {
  stockName: string;
  ticker: string;
  yahooSymbol: string;
  qty: number;
  avgPrice: number;
  amountInvested: number;
  weekLow52: number;
  weekHigh52: number;
}

export interface FDPayload {
  bank_name: string;
  principal_amount: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string | null;
  maturity_amount: number;
  status: 'active' | 'matured';
  fd_type?: string;
  contributions?: { date: string; amount: number }[];
  notes?: string;
  mf_scheme_code?: string;
  units?: number;
  girl_dob?: string;
  rate_schedule?: { fyStartYear: number; rate: number }[];
}

export interface SSYPayload {
  bank_name: string;
  girl_dob: string;
  annual_deposit: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  maturity_amount: number;
  status: 'active' | 'matured';
  contributions?: { date: string; amount: number }[];
  rate_schedule?: { fyStartYear: number; rate: number }[];
  notes?: string;
}

export interface RDPayload {
  bank_name: string;
  monthly_deposit: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  maturity_amount: number;
  status: 'active' | 'matured';
  contributions?: { date: string; amount: number }[];
  notes?: string;
}

export interface SIPPayload {
  fund_name: string;
  monthly_sip: number;
  expected_cagr: number;
  units: number;
  start_date: string;
  next_sip_date?: string | null;
  fallback_valuation: number;
  mf_scheme_code?: string;
  notes?: string;
}

export interface GoldPayload {
  item_name: string;
  purity: string;
  weight_grams: number;
  purchase_price: number;
  current_valuation: number;
  purchase_date?: string;
  notes?: string;
}

export interface RealEstatePayload {
  property_name: string;
  property_type: 'apartment' | 'plot' | 'house' | 'commercial';
  location?: string;
  purchase_price: number;
  current_valuation: number;
  purchase_date?: string;
  monthly_rent: number;
  notes?: string;
}

export interface InsurancePayload {
  insurance_type: 'health' | 'term' | 'life' | 'motor' | 'other';
  provider: string;
  policy_name: string;
  policy_number?: string;
  sum_assured: number;
  premium_amount: number;
  renewal_date?: string;
  notes?: string;
}

export interface DocumentPayload {
  name: string;
  filePath: string;
  fileType: string;
  linkedAssetType: string;
  linkedAssetId: string | null;
  expiryDate: string | null;
}

export type AssetPayload = StockPayload | FDPayload | SSYPayload | RDPayload | SIPPayload | GoldPayload | RealEstatePayload | InsurancePayload | DocumentPayload;

