import { describe, it, expect, vi } from 'vitest';
import { PortfolioService } from '../portfolioService';
import { IPortfolioRepository } from '../../repositories/IPortfolioRepository';

describe('PortfolioService (Clean Architecture)', () => {
  it('instantiates and calls repository via interface without infrastructure coupling', async () => {
    const mockRepo: IPortfolioRepository = {
      fetchAllData: vi.fn().mockResolvedValue({
        portfolios: [
          {
            id: '1',
            name: 'ram',
            label: 'Ram',
            holdings: [],
            fixedDeposits: [],
            rdAccounts: [],
            sipAccounts: [],
            goldHoldings: [],
            realEstate: [],
            insurances: [],
            documents: [],
            totalInvested: 100000,
            totalCurrentValue: 120000,
            totalPnL: 20000,
            totalPnLPercent: 20,
            stocksValue: 120000,
            fdValue: 0,
            rdValue: 0,
            sipValue: 0,
            goldValue: 0,
            realEstateValue: 0,
          },
        ],
        netWorthHistory: [],
      }),
      addPortfolio: vi.fn().mockResolvedValue(undefined),
      renamePortfolio: vi.fn().mockResolvedValue(undefined),
      deletePortfolio: vi.fn().mockResolvedValue(undefined),
      addAsset: vi.fn().mockResolvedValue({ id: 'new-id' }),
      updateAsset: vi.fn().mockResolvedValue(undefined),
      deleteAsset: vi.fn().mockResolvedValue(undefined),
      triggerNetWorthSnapshot: vi.fn().mockResolvedValue(undefined),
    };

    const service = new PortfolioService(mockRepo);
    const data = await service.loadPortfolios();
    expect(mockRepo.fetchAllData).toHaveBeenCalledTimes(1);
    expect(data.portfolios.length).toBe(1);
    expect(data.portfolios[0].name).toBe('ram');

    await service.addPortfolio('padma', 'Padma');
    expect(mockRepo.addPortfolio).toHaveBeenCalledWith('padma', 'Padma');
  });
});
