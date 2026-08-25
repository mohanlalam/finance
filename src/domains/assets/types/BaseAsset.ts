import { AssetType } from './AssetType';

export interface BaseAsset {
  id: string;
  portfolioId: string;
  assetType: AssetType;
  name: string;
  investedAmount: number;
  currentValue: number;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}
