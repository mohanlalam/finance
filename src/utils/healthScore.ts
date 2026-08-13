import { Portfolio } from '../types/portfolio';

export interface HealthReport {
  score: number;
  strengths: string[];
  risks: string[];
}

/**
 * Pure calculation logic for Portfolio Health Score
 */
export function calculateHealthScore(portfolios: Portfolio[], activePortfolio: Portfolio | null): HealthReport {
  const targetPortfolios = activePortfolio ? [activePortfolio] : portfolios;
  let score = 100;
  const strengths: string[] = [];
  const risks: string[] = [];

  // Calculate total portfolio value across all asset types
  let totalInvested = 0;
  let totalCurrent = 0;
  let equityVal = 0;
  let debtVal = 0;
  let goldVal = 0;
  let realEstateVal = 0;

  for (let i = 0; i < targetPortfolios.length; i++) {
    const p = targetPortfolios[i];
    totalInvested += p.totalInvested;
    totalCurrent += p.totalCurrentValue;

    for (let j = 0; j < p.holdings.length; j++) {
      equityVal += p.holdings[j].currentValue;
    }
    for (let j = 0; j < p.fixedDeposits.length; j++) {
      debtVal += p.fixedDeposits[j].principal_amount || 0;
    }
    if (p.rdAccounts) {
      for (let j = 0; j < p.rdAccounts.length; j++) {
        debtVal += (p.rdAccounts[j].monthly_deposit || 0) * 12;
      }
    }
    if (p.sipAccounts) {
      for (let j = 0; j < p.sipAccounts.length; j++) {
        const sip = p.sipAccounts[j];
        const nav = sip.liveNav || 10;
        debtVal += (sip.units || 0) * nav;
      }
    }
    for (let j = 0; j < p.goldHoldings.length; j++) {
      goldVal += p.goldHoldings[j].current_valuation || 0;
    }
    for (let j = 0; j < p.realEstate.length; j++) {
      realEstateVal += p.realEstate[j].current_valuation || 0;
    }
  }

  // 1. Diversification Score
  const assetTypesPresent = [equityVal, debtVal, goldVal, realEstateVal].filter(v => v > 0).length;
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
      risks.push(`Over 70% of total wealth is tied to a single asset category.`);
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
    strengths.push('Has fixed income (FD/RD/SIP) allocation for stability.');
  } else {
    score -= 10;
    risks.push('No fixed income / debt allocation found for downside protection.');
  }

  return { score: Math.max(0, Math.min(100, score)), strengths, risks };
}

// Persistent singleton worker instance to prevent 15-40ms thread creation overhead on every tick
let _healthWorker: Worker | null = null;
let _pendingCallbacks = new Map<string, (report: HealthReport) => void>();

function getHealthWorker(): Worker | null {
  if (typeof window === 'undefined' || !window.Worker) return null;
  if (!_healthWorker) {
    try {
      _healthWorker = new Worker(new URL('../workers/healthScore.worker.ts', import.meta.url), { type: 'module' });
      _healthWorker.onmessage = (e) => {
        const { taskId, result, error } = e.data || {};
        if (taskId && _pendingCallbacks.has(taskId)) {
          const cb = _pendingCallbacks.get(taskId)!;
          _pendingCallbacks.delete(taskId);
          cb(error ? calculateHealthScore(e.data.portfolios || [], e.data.activePortfolio || null) : result);
        }
      };
      _healthWorker.onerror = () => {
        _healthWorker = null;
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
export function calculateHealthScoreAsync(portfolios: Portfolio[], activePortfolio: Portfolio | null): Promise<HealthReport> {
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
