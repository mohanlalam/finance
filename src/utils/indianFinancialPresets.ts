/**
 * Standard Presets for Indian Banking & Financial Institutions
 */

export const INDIAN_BANKS_LIST = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Punjab National Bank',
  'Canara Bank',
  'Union Bank of India',
  'IndusInd Bank',
  'Federal Bank',
  'IDFC FIRST Bank',
  'Post Office Time Deposit',
];

export interface MFSchemePreset {
  name: string;
  code: string;
  cagr: string;
}

export const POPULAR_INDIAN_MF_SCHEMES: MFSchemePreset[] = [
  { name: 'Parag Parikh Flexi Cap Fund', code: '122639', cagr: '18.5' },
  { name: 'Mirae Asset Large Cap Fund', code: '107530', cagr: '15.2' },
  { name: 'HDFC Top 100 Fund', code: '101662', cagr: '14.8' },
  { name: 'Quant Small Cap Fund', code: '120847', cagr: '24.0' },
  { name: 'SBI Bluechip Fund', code: '103504', cagr: '13.5' },
  { name: 'Nippon India Small Cap Fund', code: '118778', cagr: '22.4' },
  { name: 'ICICI Prudential Technology Fund', code: '120594', cagr: '19.8' },
  { name: 'Axis Midcap Fund', code: '114674', cagr: '17.2' },
  { name: 'UTI Nifty 50 Index Fund', code: '120716', cagr: '13.0' },
];
