import { calculateRebalancing } from '../utils/rebalancing';
import { Portfolio } from '../types/portfolio';

self.onmessage = (e: MessageEvent<{
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  targetPcts: { equity: number; debt: number; gold: number; realEstate: number };
}>) => {
  const { portfolios, activePortfolio, targetPcts } = e.data;
  try {
    const result = calculateRebalancing(portfolios, activePortfolio, targetPcts);
    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: err instanceof Error ? err.message : String(err) });
  }
};
