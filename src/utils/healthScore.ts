import { Portfolio } from '../types/portfolio';
import { getFDEffectiveValue } from './formatters';
import { getRDEffectiveValue } from './rdUtils';
import { getSIPEffectiveValue } from './sipUtils';

export interface HealthReport {
  score: number;
  strengths: string[];
  risks: string[];
}

/**
 * Pure calculation logic for Portfolio Health Score
 */
export function calculateHealthScore(portfolios: Portfolio[], activePortfolio: Portfolio | null): HealthReport {
  let score = 100;
  const strengths: string[] = [];
  const risks: string[] = [];

  // Calculate total portfolio value across all asset types
  let totalInvested = 0;
  let equityVal = 0;
  let debtVal = 0;
  let goldVal = 0;
  let realEstateVal = 0;

  const count = activePortfolio ? 1 : (portfolios ? portfolios.length : 0);

  for (let i = 0; i < count; i++) {
    const p = activePortfolio ? activePortfolio : portfolios[i];
    if (!p) continue;
    totalInvested += Number(p.totalInvested) || 0;

    if (p.holdings) {
      for (let j = 0; j < p.holdings.length; j++) {
        equityVal += Number(p.holdings[j]?.currentValue) || 0;
      }
    }
    if (p.sipAccounts) {
      for (let j = 0; j < p.sipAccounts.length; j++) {
        equityVal += getSIPEffectiveValue(p.sipAccounts[j]);
      }
    }
    if (p.fixedDeposits) {
      for (let j = 0; j < p.fixedDeposits.length; j++) {
        debtVal += getFDEffectiveValue(p.fixedDeposits[j]);
      }
    }
    if (p.rdAccounts) {
      for (let j = 0; j < p.rdAccounts.length; j++) {
        debtVal += getRDEffectiveValue(p.rdAccounts[j]);
      }
    }
    if (p.goldHoldings) {
      for (let j = 0; j < p.goldHoldings.length; j++) {
        goldVal += Number(p.goldHoldings[j]?.current_valuation) || 0;
      }
    }
    if (p.realEstate) {
      for (let j = 0; j < p.realEstate.length; j++) {
        realEstateVal += Number(p.realEstate[j]?.current_valuation) || 0;
      }
    }
  }

  const totalCurrent = equityVal + debtVal + goldVal + realEstateVal;

  // 1. Diversification Score (O(1) integer arithmetic without array allocation)
  const assetTypesPresent = (equityVal > 0 ? 1 : 0) + (debtVal > 0 ? 1 : 0) + (goldVal > 0 ? 1 : 0) + (realEstateVal > 0 ? 1 : 0);
  if (assetTypesPresent >= 3) {
    strengths.push('Excellent multi-asset diversification (Stocks, FD/RD, Gold/Real Estate).');
  } else if (assetTypesPresent === 1) {
    score -= 20;
    risks.push('Portfolio concentrated in a single asset class. Consider spreading risk.');
  }

  // 2. High Concentration Risk
  if (totalCurrent > 0) {
    const maxAssetShare = Math.max(equityVal, debtVal, goldVal, realEstateVal) / totalCurrent;
    if (maxAssetShare > 0.7) {
      score -= 15;
      risks.push('Over 70% of total wealth is tied to a single asset category.');
    }
  }

  // 3. Positive Net Returns
  if (totalCurrent >= totalInvested && totalInvested > 0) {
    strengths.push('Overall portfolio is currently in profit.');
  } else if (totalInvested > 0 && totalCurrent < totalInvested) {
    score -= 15;
    risks.push('Total portfolio is experiencing net unrealized loss.');
  }

  // 4. Emergency / Fixed Income Liquidity
  if (debtVal > 0) {
    strengths.push('Has fixed income (FD/RD) allocation for downside stability.');
  } else {
    score -= 10;
    risks.push('No fixed income / debt allocation found for downside protection.');
  }

  return { score: Math.max(0, Math.min(100, score)), strengths, risks };
}

// Persistent singleton worker instance to prevent thread creation overhead on every tick
let _healthWorker: Worker | null = null;
let _pendingCallbacks = new Map<string, (report: HealthReport) => void>();

function getHealthWorker(): Worker | null {
  if (typeof window === 'undefined' || !window.Worker) return null;
  if (!_healthWorker) {
    try {
      _healthWorker = new Worker(new URL('../workers/healthScore.worker.ts', import.meta.url), { type: 'module' });
      _healthWorker.onmessage = (e) => {
        const { taskId, result, error, portfolios, activePortfolio } = e.data || {};
        if (taskId && _pendingCallbacks.has(taskId)) {
          const cb = _pendingCallbacks.get(taskId)!;
          _pendingCallbacks.delete(taskId);
          cb(error ? calculateHealthScore(portfolios || [], activePortfolio || null) : result);
        }
      };
      _healthWorker.onerror = () => {
        _healthWorker = null;
        for (const [, cb] of _pendingCallbacks.entries()) {
          cb({ score: 100, strengths: [], risks: [] });
        }
        _pendingCallbacks.clear();
      };
    } catch {
      _healthWorker = null;
    }
  }
  return _healthWorker;
}

/**
 * Calculates a Portfolio Health Score asynchronously using persistent Web Worker singleton
 */
export function calculateHealthScoreAsync(
  portfolios: Portfolio[],
  activePortfolio: Portfolio | null
): Promise<HealthReport> {
  const worker = getHealthWorker();
  if (!worker) {
    return Promise.resolve(calculateHealthScore(portfolios, activePortfolio));
  }

  return new Promise((resolve) => {
    const taskId = Math.random().toString(36).substring(7);
    _pendingCallbacks.set(taskId, resolve);
    worker.postMessage({ taskId, portfolios, activePortfolio });
  });
}
