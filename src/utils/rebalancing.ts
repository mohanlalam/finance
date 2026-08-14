import { Portfolio } from '../types/portfolio';
import { formatINR } from './formatters';
import { getFDEffectiveValue } from './formatters';
import { getRDEffectiveValue } from './rdUtils';
import { getSIPEffectiveValue } from './sipUtils';

export interface RebalancingAdvice {
  assetClass: 'Equity' | 'Debt' | 'Gold' | 'Real Estate';
  currentPct: number;
  targetPct: number;
  driftPct: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  formattedAmount: string;
}

export function calculateRebalancing(
  portfolios: Portfolio[],
  activePortfolio: Portfolio | null,
  targetPcts: { equity: number; debt: number; gold: number; realEstate: number }
): RebalancingAdvice[] {
  const targetPortfolios = activePortfolio ? [activePortfolio] : portfolios;
  let equityVal = 0;
  let debtVal = 0;
  let goldVal = 0;
  let realEstateVal = 0;

  for (let i = 0; i < targetPortfolios.length; i++) {
    const p = targetPortfolios[i];
    if (!p) continue;

    for (const h of p.holdings || []) {
      equityVal += Number(h?.currentValue) || 0;
    }
    for (const sip of p.sipAccounts || []) {
      equityVal += getSIPEffectiveValue(sip);
    }
    for (const fd of p.fixedDeposits || []) {
      debtVal += getFDEffectiveValue(fd);
    }
    for (const rd of p.rdAccounts || []) {
      debtVal += getRDEffectiveValue(rd);
    }
    for (const g of p.goldHoldings || []) {
      goldVal += Number(g?.current_valuation) || 0;
    }
    for (const re of p.realEstate || []) {
      realEstateVal += Number(re?.current_valuation) || 0;
    }
  }

  const totalVal = equityVal + debtVal + goldVal + realEstateVal;
  if (totalVal <= 0) return [];

  const currentPcts = {
    Equity: (equityVal / totalVal) * 100,
    Debt: (debtVal / totalVal) * 100,
    Gold: (goldVal / totalVal) * 100,
    'Real Estate': (realEstateVal / totalVal) * 100,
  };

  const assetClasses: ('Equity' | 'Debt' | 'Gold' | 'Real Estate')[] = [
    'Equity',
    'Debt',
    'Gold',
    'Real Estate',
  ];

  const targets: Record<'Equity' | 'Debt' | 'Gold' | 'Real Estate', number> = {
    Equity: targetPcts.equity,
    Debt: targetPcts.debt,
    Gold: targetPcts.gold,
    'Real Estate': targetPcts.realEstate,
  };

  return assetClasses.map((ac) => {
    const cur = currentPcts[ac];
    const tgt = targets[ac];
    const drift = cur - tgt;
    const diffVal = (Math.abs(drift) / 100) * totalVal;

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let amt = 0;

    // Trigger rebalance action only if drift > 2%
    if (Math.abs(drift) >= 2) {
      action = drift > 0 ? 'SELL' : 'BUY';
      amt = Math.round(diffVal);
    }

    return {
      assetClass: ac,
      currentPct: cur,
      targetPct: tgt,
      driftPct: drift,
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
        const { taskId, result, error, portfolios, activePortfolio, targetPcts } = e.data || {};
        if (taskId && _pendingRebalanceCallbacks.has(taskId)) {
          const cb = _pendingRebalanceCallbacks.get(taskId)!;
          _pendingRebalanceCallbacks.delete(taskId);
          cb(
            error
              ? calculateRebalancing(portfolios || [], activePortfolio || null, targetPcts)
              : result
          );
        }
      };
      _rebalanceWorker.onerror = () => {
        _rebalanceWorker = null;
        for (const [, cb] of _pendingRebalanceCallbacks.entries()) {
          cb([]);
        }
        _pendingRebalanceCallbacks.clear();
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
