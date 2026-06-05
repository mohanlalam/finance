import { calculateHealthScore } from '../utils/healthScore';
import { Portfolio } from '../types/portfolio';

self.onmessage = (e: MessageEvent<{ portfolios: Portfolio[]; activePortfolio: Portfolio | null }>) => {
  const { portfolios, activePortfolio } = e.data;
  try {
    const result = calculateHealthScore(portfolios, activePortfolio);
    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: err instanceof Error ? err.message : String(err) });
  }
};
