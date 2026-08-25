import { IPortfolioRepository } from '../repositories/IPortfolioRepository';
import { supabasePortfolioRepository } from '../../../infrastructure/supabase/repositories/SupabasePortfolioRepository';
import {
  setCachedPortfolioData,
  invalidatePortfolioCache,
  getCachedPortfolioData,
} from '../../../infrastructure/cache/portfolioCache';
import { portfolioSyncService } from './portfolioSyncService';
import { Portfolio, AssetPayload } from '../../../types/portfolio';
import { NetWorthSnapshot } from '../calculations/netWorth';
import { logger } from '../../../infrastructure/logging/logger';

export class PortfolioService {
  private repository: IPortfolioRepository;

  constructor(repository: IPortfolioRepository = supabasePortfolioRepository) {
    this.repository = repository;
  }

  async loadPortfolios(): Promise<{ portfolios: Portfolio[]; netWorthHistory: NetWorthSnapshot[] }> {
    const data = await this.repository.fetchAllData();
    // Cache fresh data to offline IndexedDB asynchronously
    setCachedPortfolioData(data.portfolios, data.netWorthHistory).catch((err) => {
      logger.warn('Failed to cache portfolio data offline', { error: String(err) });
    });
    return data;
  }

  async getOfflineCachedPortfolios() {
    return getCachedPortfolioData();
  }

  async addPortfolio(name: string, label: string): Promise<void> {
    return portfolioSyncService.runMutation(async () => {
      await this.repository.addPortfolio(name, label);
      await invalidatePortfolioCache();
    });
  }

  async renamePortfolio(id: string, newLabel: string): Promise<void> {
    return portfolioSyncService.runMutation(async () => {
      await this.repository.renamePortfolio(id, newLabel);
      await invalidatePortfolioCache();
    });
  }

  async deletePortfolio(id: string): Promise<void> {
    return portfolioSyncService.runMutation(async () => {
      await this.repository.deletePortfolio(id);
      await invalidatePortfolioCache();
    });
  }

  async addAsset(
    assetType: string,
    portfolioName: string,
    payload: AssetPayload
  ): Promise<{ id?: string } | undefined> {
    return portfolioSyncService.runMutation(async () => {
      const res = await this.repository.addAsset(assetType, portfolioName, payload);
      await invalidatePortfolioCache();
      return res;
    });
  }

  async updateAsset(
    assetType: string,
    id: string,
    payload: Partial<AssetPayload>
  ): Promise<void> {
    return portfolioSyncService.runMutation(async () => {
      await this.repository.updateAsset(assetType, id, payload);
      await invalidatePortfolioCache();
    });
  }

  async deleteAsset(assetType: string, id: string): Promise<void> {
    return portfolioSyncService.runMutation(async () => {
      await this.repository.deleteAsset(assetType, id);
      await invalidatePortfolioCache();
    });
  }
}

export const portfolioService = new PortfolioService();
