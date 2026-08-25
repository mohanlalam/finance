export type AssetType =
  | 'stock'
  | 'mutual_fund'
  | 'fd'
  | 'rd'
  | 'sip'
  | 'gold'
  | 'real_estate'
  | 'insurance'
  | 'cash'
  | 'document';

export const ASSET_TYPES: readonly AssetType[] = [
  'stock',
  'mutual_fund',
  'fd',
  'rd',
  'sip',
  'gold',
  'real_estate',
  'insurance',
  'cash',
  'document',
] as const;
