import { Portfolio, AssetPayload } from '../../../types/portfolio';
import { NetWorthSnapshot } from '../calculations/netWorth';

export interface DBPortfolioData {
  portfolios: Portfolio[];
  netWorthHistory: NetWorthSnapshot[];
}

export interface IPortfolioRepository {
  /** Fetch all family portfolios and net worth history */
  fetchAllData(): Promise<DBPortfolioData>;

  /** Create a new family portfolio container */
  addPortfolio(name: string, label: string): Promise<void>;

  /** Rename an existing family portfolio */
  renamePortfolio(id: string, newLabel: string): Promise<void>;

  /** Delete a family portfolio */
  deletePortfolio(id: string): Promise<void>;

  /** Add an asset to a portfolio */
  addAsset(assetType: string, portfolioName: string, payload: AssetPayload): Promise<{ id?: string } | undefined>;

  /** Update an existing asset */
  updateAsset(assetType: string, id: string, payload: Partial<AssetPayload>): Promise<void>;

  /** Delete an existing asset */
  deleteAsset(assetType: string, id: string): Promise<void>;
}
