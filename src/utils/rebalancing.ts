import { Portfolio } from '../types/portfolio';
import { classBreakdown } from './portfolioCalcs';

export interface RebalancingAdvice {
  assetClass: 'Equity' | 'Debt' | 'Gold' | 'Real Estate';
  actualValue: number;
  actualPct: number;
  targetPct: number;
  diffAmount: number; // positive = overweight (sell), negative = underweight (buy)
  recommendation: string; // e.g., "Sell ₹2,10,000" or "Buy ₹70,000" or "Aligned"
}

/**
 * Calculates asset allocation rebalancing orders based on targets
 */
export function calculateRebalancing(
  portfolios: Portfolio[],
  activePortfolio: Portfolio | null,
  targetPcts: { equity: number; debt: number; gold: number; realEstate: number }
): RebalancingAdvice[] {
  const breakdown = classBreakdown(portfolios, activePortfolio);
  
  // Aggregate actuals
  const equityValue = breakdown.stocks + breakdown.sip;
  const debtValue = breakdown.fd + breakdown.rd + breakdown.ssy;
  const goldValue = breakdown.gold;
  const realEstateValue = breakdown.realEstate;

  const totalValue = equityValue + debtValue + goldValue + realEstateValue;

  if (totalValue <= 0) {
    return [
      { assetClass: 'Equity', actualValue: 0, actualPct: 0, targetPct: targetPcts.equity, diffAmount: 0, recommendation: 'No assets registered yet' },
      { assetClass: 'Debt', actualValue: 0, actualPct: 0, targetPct: targetPcts.debt, diffAmount: 0, recommendation: 'No assets registered yet' },
      { assetClass: 'Gold', actualValue: 0, actualPct: 0, targetPct: targetPcts.gold, diffAmount: 0, recommendation: 'No assets registered yet' },
      { assetClass: 'Real Estate', actualValue: 0, actualPct: 0, targetPct: targetPcts.realEstate, diffAmount: 0, recommendation: 'No assets registered yet' },
    ];
  }

  // Calculate actual percentages
  const assets = [
    { assetClass: 'Equity' as const, value: equityValue, targetPct: targetPcts.equity },
    { assetClass: 'Debt' as const, value: debtValue, targetPct: targetPcts.debt },
    { assetClass: 'Gold' as const, value: goldValue, targetPct: targetPcts.gold },
    { assetClass: 'Real Estate' as const, value: realEstateValue, targetPct: targetPcts.realEstate },
  ];

  return assets.map((asset) => {
    const actualPct = (asset.value / totalValue) * 100;
    const targetValue = (asset.targetPct / 100) * totalValue;
    const diffAmount = asset.value - targetValue;

    let recommendation = 'Aligned';
    
    const MIN_ACTION = 5000;
    
    // Suggest rebalancing purely based on absolute difference exceeding the MIN_ACTION threshold
    if (Math.abs(diffAmount) >= MIN_ACTION) {
      if (diffAmount > 0) {
        recommendation = `Sell ${formatINRCompact(diffAmount)}`;
      } else {
        recommendation = `Buy ${formatINRCompact(Math.abs(diffAmount))}`;
      }
    }

    return {
      assetClass: asset.assetClass,
      actualValue: asset.value,
      actualPct,
      targetPct: asset.targetPct,
      diffAmount,
      recommendation,
    };
  });
}

function formatINRCompact(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Calculates asset allocation rebalancing orders asynchronously using a Web Worker
 */
export function calculateRebalancingAsync(
  portfolios: Portfolio[],
  activePortfolio: Portfolio | null,
  targetPcts: { equity: number; debt: number; gold: number; realEstate: number }
): Promise<RebalancingAdvice[]> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        const worker = new Worker(new URL('../workers/rebalancing.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e) => {
          if (e.data.error) {
            resolve(calculateRebalancing(portfolios, activePortfolio, targetPcts));
          } else {
            resolve(e.data.result);
          }
          worker.terminate();
        };
        worker.onerror = () => {
          resolve(calculateRebalancing(portfolios, activePortfolio, targetPcts));
          worker.terminate();
        };
        worker.postMessage({ portfolios, activePortfolio, targetPcts });
        return;
      } catch (err) {
        console.warn('[rebalancing worker] failed, falling back:', err);
      }
    }
    resolve(calculateRebalancing(portfolios, activePortfolio, targetPcts));
  });
}
