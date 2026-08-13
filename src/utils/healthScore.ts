import { Portfolio } from '../types/portfolio';

export interface HealthReport {
  score: number;
  strengths: string[];
  risks: string[];
}

/**
 * Single-pass consolidated health score evaluation
 */
export function calculateHealthScore(portfolios: Portfolio[], activePortfolio: Portfolio | null): HealthReport {
  const targetPortfolios = activePortfolio ? [activePortfolio] : portfolios;

  let stocks = 0, fd = 0, rd = 0, sip = 0, gold = 0, realEstate = 0;
  let totalEquity = 0;
  let highestStockTicker = '';
  let highestStockPct = 0;
  let sipActive = false;
  let healthIns = false;
  let termIns = false;

  for (let i = 0; i < targetPortfolios.length; i++) {
    const p = targetPortfolios[i];
    stocks += p.stocksValue || 0;
    fd += p.fdValue || 0;
    rd += p.rdValue || 0;
    sip += p.sipValue || 0;
    gold += p.goldValue || 0;
    realEstate += p.realEstateValue || 0;

    if (p.sipAccounts && p.sipAccounts.length > 0) sipActive = true;

    const holdings = p.holdings || [];
    for (let j = 0; j < holdings.length; j++) {
      totalEquity += holdings[j].currentValue || 0;
    }

    const insurances = p.insurances || [];
    for (let j = 0; j < insurances.length; j++) {
      const type = insurances[j].insurance_type;
      if (type === 'health') healthIns = true;
      if (type === 'term' || type === 'life') termIns = true;
    }
  }

  // Stock concentration check
  let hasEquityConcentration = false;
  if (totalEquity > 0) {
    for (let i = 0; i < targetPortfolios.length; i++) {
      const holdings = targetPortfolios[i].holdings || [];
      for (let j = 0; j < holdings.length; j++) {
        const h = holdings[j];
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
  }

  const totalValue = stocks + fd + rd + sip + gold + realEstate;
  const strengths: string[] = [];
  const risks: string[] = [];
  let score = 0;

  // 1. Diversification
  let activeAssetClasses = 0;
  if (stocks > 0 || sip > 0) activeAssetClasses++;
  if (fd > 0 || rd > 0) activeAssetClasses++;
  if (gold > 0) activeAssetClasses++;
  if (realEstate > 0) activeAssetClasses++;

  if (activeAssetClasses >= 3) {
    score += 30;
    strengths.push('✓ Well diversified across multiple asset classes');
  } else if (activeAssetClasses === 2) {
    score += 20;
    risks.push('⚠ Low diversification: portfolio concentrated in 2 asset classes');
  } else if (activeAssetClasses === 1) {
    score += 10;
    risks.push('⚠ High risk: portfolio concentrated in a single asset class');
  } else {
    risks.push('⚠ Empty portfolio: no assets registered yet');
  }

  if (totalValue > 0) {
    const equityPct = ((stocks + sip) / totalValue) * 100;
    const debtPct = ((fd + rd) / totalValue) * 100;
    const rePct = (realEstate / totalValue) * 100;

    if (equityPct > 60) {
      score -= 5;
      risks.push(`⚠ High equity exposure (${equityPct.toFixed(0)}%): vulnerable to market volatility`);
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

  // 2. SIP Discipline
  if (sipActive) {
    score += 20;
    strengths.push('✓ Active Mutual Fund SIP discipline');
  } else {
    risks.push('⚠ No active Mutual Fund SIPs running');
  }

  // 3. Emergency Fund Buffer
  const emergencyFund = fd + rd;
  const monthsCovered = emergencyFund / 50000;
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

  // 4. Equity Concentration
  if (totalEquity === 0) {
    score += 15;
  } else if (!hasEquityConcentration) {
    score += 15;
    strengths.push('✓ Healthy stock diversification (no single stock > 15% of equity)');
  } else {
    score += 5;
    risks.push(`⚠ Concentration risk: ${highestStockTicker} exceeds ${highestStockPct.toFixed(0)}% of stock holdings`);
  }

  // 5. Insurance Cover
  if (healthIns && termIns) {
    score += 15;
    strengths.push('✓ Fully insured: health and term/life cover active');
  } else if (healthIns || termIns) {
    score += 7;
    strengths.push(`✓ Partial insurance: ${healthIns ? 'Health' : 'Term/Life'} cover active`);
    risks.push(`⚠ Missing ${healthIns ? 'Term/Life' : 'Health'} insurance policy`);
  } else {
    risks.push('⚠ Critical risk: no health or term insurance policy registered');
  }

  return { score: Math.max(0, Math.min(100, score)), strengths, risks };
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
