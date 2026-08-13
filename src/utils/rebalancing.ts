import { Portfolio } from '../types/portfolio';
import { formatINR } from './formatters';

export interface RebalancingAdvice {
  assetClass: 'Equity' | 'Debt' | 'Gold' | 'Real Estate';
  currentPct: number;
  targetPct: number;
  driftPct: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  formattedAmount: string;
}

/**
 * Pure calculation logic for asset allocation rebalancing orders
 */
export function calculateRebalancing(
  portfolios: Portfolio[],
  activePortfolio: Portfolio | null,
  targetPcts: { equity: number; debt: number; gold: number; realEstate: number }
): RebalancingAdvice[] {
  const targetPortfolios = activePortfolio ? [activePortfolio] : portfolios;

  let totalVal = 0;
  let equityVal = 0;
  let debtVal = 0;
  let goldVal = 0;
  let realEstateVal = 0;

  for (let i = 0; i < targetPortfolios.length; i++) {
    const p = targetPortfolios[i];
    totalVal += p.totalCurrentValue;

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

  if (totalVal <= 0) return [];

  const currentPcts = {
    Equity: (equityVal / totalVal) * 100,
    Debt: (debtVal / totalVal) * 100,
    Gold: (goldVal / totalVal) * 100,
    'Real Estate': (realEstateVal / totalVal) * 100,
  };

  const currentVals = {
    Equity: equityVal,
    Debt: debtVal,
    Gold: goldVal,
    'Real Estate': realEstateVal,
  };

  const targets = {
    Equity: targetPcts.equity,
    Debt: targetPcts.debt,
    Gold: targetPcts.gold,
    'Real Estate': targetPcts.realEstate,
  };

  const classes: Array<'Equity' | 'Debt' | 'Gold' | 'Real Estate'> = ['Equity', 'Debt', 'Gold', 'Real Estate'];

  return classes.map((cls) => {
    const curPct = currentPcts[cls];
    const tgtPct = targets[cls];
    const driftPct = curPct - tgtPct;
    const targetVal = (tgtPct / 100) * totalVal;
    const diffVal = targetVal - currentVals[cls];

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (Math.abs(driftPct) >= 2) {
      action = diffVal > 0 ? 'BUY' : 'SELL';
    }

    const amt = Math.abs(diffVal);
    return {
      assetClass: cls,
      currentPct: curPct,
      targetPct: tgtPct,
      driftPct,
      action,
      amount: amt,
      formattedAmount: formatINR(amt),
    };
  });
}

// Persistent singleton worker instance
let _rebalanceWorker: Worker | null = null;
let _pendingRebalanceCallbacks = new Map<string, (advice: RebalancingAdvice[]) => void>();

function getRebalanceWorker(): Worker | null {
  if (typeof window === 'undefined' || !window.Worker) return null;
  if (!_rebalanceWorker) {
    try {
      _rebalanceWorker = new Worker(new URL('../workers/rebalancing.worker.ts', import.meta.url), { type: 'module' });
      _rebalanceWorker.onmessage = (e) => {
        const { taskId, result, error } = e.data || {};
        if (taskId && _pendingRebalanceCallbacks.has(taskId)) {
          const cb = _pendingRebalanceCallbacks.get(taskId)!;
          _pendingRebalanceCallbacks.delete(taskId);
          cb(error ? calculateRebalancing(e.data.portfolios || [], e.data.activePortfolio || null, e.data.targetPcts) : result);
        }
      };
      _rebalanceWorker.onerror = () => {
        _rebalanceWorker = null;
      };
    } catch {
      _rebalanceWorker = null;
    }
  }
  return _rebalanceWorker;
}

/**
 * Calculates asset allocation rebalancing orders asynchronously using persistent Web Worker singleton
 */
export function calculateRebalancingAsync(
  portfolios: Portfolio[],
  activePortfolio: Portfolio | null,
  targetPcts: { equity: number; debt: number; gold: number; realEstate: number }
): Promise<RebalancingAdvice[]> {
  const worker = getRebalanceWorker();
  if (!worker) {
    return Promise.resolve(calculateRebalancing(portfolios, activePortfolio, targetPcts));
  }

  return new Promise((resolve) => {
    const taskId = Math.random().toString(36).substring(7);
    _pendingRebalanceCallbacks.set(taskId, resolve);
    worker.postMessage({ taskId, portfolios, activePortfolio, targetPcts });
  });
}
