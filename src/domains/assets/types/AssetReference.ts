import { AssetType } from './AssetType';

export interface AssetReference {
  assetId: string;
  assetType: AssetType;
  portfolioId: string;
  displayName: string;
}
