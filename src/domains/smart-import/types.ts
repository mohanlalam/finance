import { PortfolioName } from '../../types/portfolio';

export type SmartImportDocumentType =
  | 'fd_certificate'
  | 'rd_passbook'
  | 'sip_statement'
  | 'stock_contract_note'
  | 'gold_invoice'
  | 'real_estate_deed'
  | 'insurance_policy'
  | 'general_document'
  | 'unknown';

export type PurchasePriceType = 'total' | 'per_gram' | 'unknown';

export type FieldStatus = 'verified' | 'needs_review' | 'missing';

export interface ExtractedField<T = string | number> {
  value: T;
  confidence: number; // 0.0 - 1.0
  source?: string;
  snippet?: string; // verbatim source snippet from document
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] coordinates
  pageIndex?: number; // 1-indexed document page
  status: FieldStatus;
  warning?: string;
}

export interface DisambiguationResult {
  portfolioName: string; // 'rammohan' | 'padmavathi' | 'sailaxmi'
  memberLabel: string;   // 'Rammohan' | 'Padmavathi' | 'Sai Laxmi'
  matchType: 'pan' | 'name' | 'folio' | 'default';
  confidence: number;    // 0.0 - 1.0
  details: string;       // e.g. "Matched PAN: ABCDE1234F"
}

export interface SmartImportExtractionResult {
  assetType: 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents';
  documentType: SmartImportDocumentType;
  overallConfidence: number; // 0.0 - 1.0
  purchasePriceType?: PurchasePriceType;
  fields: Record<string, ExtractedField<unknown>>;
  warnings: string[];
  missingFields: string[];
  rawText?: string;
  sourcePages?: number;
  disambiguation?: DisambiguationResult;
}

export interface BatchImportItem {
  id: string;
  file: File;
  filePreview: string | null;
  status: 'pending' | 'processing' | 'ready' | 'error' | 'saved';
  error?: string;
  extractedResult: SmartImportExtractionResult | null;
  formData: SmartImportFormData;
  targetPortfolio: string;
  disambiguation: DisambiguationResult;
  duplicateMatch?: DuplicateMatch | null;
  wasEnhanced?: boolean;
  contrastGainPct?: number;
}

export type ImportSaveStep =
  | 'IDLE'
  | 'VALIDATING'
  | 'SAVING_ASSET'
  | 'UPLOADING_DOCUMENT'
  | 'LINKING_DOCUMENT'
  | 'SYNCING_PORTFOLIO'
  | 'SUCCESS'
  | 'ERROR';

export interface DuplicateMatch {
  existingAssetId: string;
  existingAssetName: string;
  portfolioName: PortfolioName;
  assetType: string;
  matchedFields: string[];
  matchScore: number; // 0.0 - 1.0
  details: string;
}

export interface SmartImportFormData {
  // Common / FD
  institutionName: string;
  principalAmount: string;
  interestRate: string;
  startDate: string;
  maturityDate: string;
  maturityAmount: string;
  
  // RD
  monthlyDeposit: string;
  totalInstallments: string;
  paidInstallments: string;
  
  // SIP / Mutual Fund
  fundName: string;
  folioNumber: string;
  monthlySip: string;
  sipDate: string;
  nav: string;
  units: string;
  currentValuation: string;
  expectedCagr: string;
  
  // Gold
  itemName: string;
  purity: '24K' | '22K' | '18K' | '14K' | 'other';
  weightGrams: string;
  purchasePrice: string;
  purchasePriceType: PurchasePriceType;
  ratePerGram: string;
  
  // Stocks
  stockName: string;
  symbol: string;
  quantity: string;
  avgBuyPrice: string;
  
  // Real Estate
  propertyName: string;
  propertyType: string;
  location: string;
  purchasePriceRealty: string;
  currentValuationRealty: string;
  monthlyRent: string;
  
  // Insurance
  policyName: string;
  policyNumber: string;
  insuranceType: string;
  sumAssured: string;
  premiumAmount: string;
  renewalDate: string;
  policyTermYears: string;
  
  // General
  notes: string;
}
