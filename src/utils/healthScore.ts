import { Portfolio } from '../types/portfolio';
import { classBreakdown } from './portfolioCalcs';

export interface HealthReport {
  score: number;
  strengths: string[];
  risks: string[];
}

/**
 * Calculates a Portfolio Health Score from 0 to 100
 * and lists key Strengths and Risks.
 */
export function calculateHealthScore(portfolios: Portfolio[], activePortfolio: Portfolio | null): HealthReport {
  const breakdown = classBreakdown(portfolios, activePortfolio);
  const totalValue = activePortfolio 
    ? activePortfolio.totalCurrentValue 
    : portfolios.reduce((s, p) => s + p.totalCurrentValue, 0);

  const strengths: string[] = [];
  const risks: string[] = [];
  let score = 0;

  // 1. DIVERSIFICATION (Max 30 pts)
  let activeAssetClasses = 0;
  if (breakdown.stocks > 0) activeAssetClasses++;
  if (breakdown.fd > 0 || breakdown.rd > 0) activeAssetClasses++;
  if (breakdown.gold > 0) activeAssetClasses++;
  if (breakdown.realEstate > 0) activeAssetClasses++;

  let divScore = 0;
  if (activeAssetClasses >= 3) {
    divScore = 30;
    strengths.push('✓ Well diversified across multiple asset classes');
  } else if (activeAssetClasses === 2) {
    divScore = 20;
    risks.push('⚠ Low diversification: portfolio concentrated in 2 asset classes');
  } else if (activeAssetClasses === 1) {
    divScore = 10;
    risks.push('⚠ High risk: portfolio concentrated in a single asset class');
  } else {
    divScore = 0;
    risks.push('⚠ Empty portfolio: no assets registered yet');
  }
  score += divScore;

  // Check if any single asset class exceeds 60% of total wealth (only if totalValue > 0)
  if (totalValue > 0) {
    const stockPct = (breakdown.stocks / totalValue) * 100;
    const debtPct = ((breakdown.fd + breakdown.rd + breakdown.ssy) / totalValue) * 100;
    const rePct = (breakdown.realEstate / totalValue) * 100;

    if (stockPct > 60) {
      score -= 5;
      risks.push(`⚠ High equity exposure (${stockPct.toFixed(0)}%): vulnerable to market volatility`);
    }
    if (debtPct > 70) {
      score -= 5;
      risks.push(`⚠ High debt exposure (${debtPct.toFixed(0)}%): low returns compared to inflation`);
    }
    if (rePct > 60) {
      score -= 5;
      risks.push(`⚠ High real estate exposure (${rePct.toFixed(0)}%): highly illiquid asset base`);
    }
  }

  // 2. SIP DISCIPLINE (Max 20 pts)
  let sipActive = false;
  const targetPortfolios = activePortfolio ? [activePortfolio] : portfolios;
  for (const p of targetPortfolios) {
    if (p.sipAccounts && p.sipAccounts.length > 0) {
      sipActive = true;
      break;
    }
  }

  if (sipActive) {
    score += 20;
    strengths.push('✓ Active Mutual Fund SIP discipline');
  } else {
    risks.push('⚠ No active Mutual Fund SIPs running');
  }

  // 3. EMERGENCY FUND BUFFER (Max 20 pts)
  // Emergency funds = FDs + RDs. Monthly baseline expense = ₹50,000
  const emergencyFund = breakdown.fd + breakdown.rd;
  const MONTHLY_EXPENSE = 50000;
  const monthsCovered = MONTHLY_EXPENSE > 0 ? emergencyFund / MONTHLY_EXPENSE : 0;

  if (monthsCovered >= 6) {
    score += 20;
    strengths.push('✓ Solid emergency fund buffer (>6 months expenses)');
  } else if (monthsCovered >= 3) {
    score += 12;
    strengths.push('✓ Moderate emergency fund buffer (3-6 months expenses)');
    risks.push('⚠ Emergency fund could be boosted to cover 6 months');
  } else {
    score += 4;
    risks.push('⚠ High risk: emergency fund covers less than 3 months of expenses');
  }

  // 4. EQUITY CONCENTRATION (Max 15 pts)
  // Check if any single stock holding exceeds 15% of total stock portfolio value
  let hasEquityConcentration = false;
  let highestStockTicker = '';
  let highestStockPct = 0;

  const allHoldings = targetPortfolios.flatMap((p) => p.holdings);
  const totalEquity = allHoldings.reduce((sum, h) => sum + h.currentValue, 0);

  if (totalEquity > 0) {
    for (const h of allHoldings) {
      const pct = (h.currentValue / totalEquity) * 100;
      if (pct > 15) {
        hasEquityConcentration = true;
        if (pct > highestStockPct) {
          highestStockPct = pct;
          highestStockTicker = h.ticker;
        }
      }
    }
  }

  if (totalEquity === 0) {
    score += 15; // No equity is technically no concentration risk
  } else if (!hasEquityConcentration) {
    score += 15;
    strengths.push('✓ Healthy stock diversification (no single stock > 15% of equity)');
  } else {
    score += 5;
    risks.push(`⚠ Concentration risk: ${highestStockTicker} exceeds ${highestStockPct.toFixed(0)}% of stock holdings`);
  }

  // 5. INSURANCE COVER (Max 15 pts)
  let healthIns = false;
  let termIns = false;

  for (const p of targetPortfolios) {
    for (const ins of p.insurances) {
      if (ins.insurance_type === 'health') healthIns = true;
      if (ins.insurance_type === 'term' || ins.insurance_type === 'life') termIns = true;
    }
  }

  let insScore = 0;
  if (healthIns && termIns) {
    insScore = 15;
    strengths.push('✓ Fully insured: health and term/life cover active');
  } else if (healthIns || termIns) {
    insScore = 7;
    strengths.push(`✓ Partial insurance: ${healthIns ? 'Health' : 'Term/Life'} cover active`);
    risks.push(`⚠ Missing ${healthIns ? 'Term/Life' : 'Health'} insurance policy`);
  } else {
    risks.push('⚠ Critical risk: no health or term insurance policy registered');
  }
  score += insScore;

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return { score, strengths, risks };
}

/**
 * Calculates a Portfolio Health Score asynchronously using a Web Worker
 */
export function calculateHealthScoreAsync(portfolios: Portfolio[], activePortfolio: Portfolio | null): Promise<HealthReport> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        const worker = new Worker(new URL('../workers/healthScore.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e) => {
          if (e.data.error) {
            console.warn('[healthScore worker] returned computation error, falling back:', e.data.error);
            resolve(calculateHealthScore(portfolios, activePortfolio));
          } else {
            resolve(e.data.result);
          }
          worker.terminate();
        };
        worker.onerror = (err) => {
          console.warn('[healthScore worker] error in worker thread, falling back:', err);
          resolve(calculateHealthScore(portfolios, activePortfolio));
          worker.terminate();
        };
        worker.postMessage({ portfolios, activePortfolio });
        return;
      } catch (err) {
        console.warn('[healthScore worker] failed, falling back:', err);
      }
    } else {
      console.warn('[healthScore worker] Web Workers are not supported in this environment, falling back.');
    }
    resolve(calculateHealthScore(portfolios, activePortfolio));
  });
}
