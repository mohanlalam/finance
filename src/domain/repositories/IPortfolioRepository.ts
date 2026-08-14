/**
 * Domain Layer: Repository Port Contracts
 * 
 * Defines the contract for fetching and persisting portfolio data.
 * Infrastructure layer implements this (e.g. SupabasePortfolioRepository, IndexedDBPortfolioRepository).
 */

import { PortfolioEntity, AssetHoldingEntity, ValuationSummary } from '../types';

export interface IPortfolioRepository {
  /** Fetch all accessible family portfolios */
  getPortfolios(): Promise<PortfolioEntity[]>;
  
  /** Fetch all asset holdings for a given portfolio ID */
  getHoldings(portfolioId: string): Promise<AssetHoldingEntity[]>;
  
  /** Fetch aggregated valuation summary for a portfolio */
  getValuationSummary(portfolioId: string): Promise<ValuationSummary>;
  
  /** Save or update an asset holding */
  saveHolding(holding: Partial<AssetHoldingEntity>): Promise<AssetHoldingEntity>;
  
  /** Delete an asset holding */
  deleteHolding(holdingId: string): Promise<void>;
}
