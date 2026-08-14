import { calculateHealthScore } from '../utils/healthScore';
import { Portfolio } from '../types/portfolio';

self.onmessage = (e: MessageEvent<{ taskId?: string; portfolios: Portfolio[]; activePortfolio: Portfolio | null }>) => {
  const { taskId, portfolios, activePortfolio } = e.data || {};
  try {
    const result = calculateHealthScore(portfolios || [], activePortfolio || null);
    self.postMessage({ taskId, result, portfolios, activePortfolio });
  } catch (err) {
    self.postMessage({ taskId, error: err instanceof Error ? err.message : String(err), portfolios, activePortfolio });
  }
};
