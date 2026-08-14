import { calculateRebalancing } from '../utils/rebalancing';
import { Portfolio } from '../types/portfolio';

self.onmessage = (e: MessageEvent<{
  taskId?: string;
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  targetPcts: { equity: number; debt: number; gold: number; realEstate: number };
}>) => {
  const { taskId, portfolios, activePortfolio, targetPcts } = e.data || {};
  try {
    const result = calculateRebalancing(portfolios || [], activePortfolio || null, targetPcts);
    self.postMessage({ taskId, result, portfolios, activePortfolio, targetPcts });
  } catch (err) {
    self.postMessage({ taskId, error: err instanceof Error ? err.message : String(err), portfolios, activePortfolio, targetPcts });
  }
};
