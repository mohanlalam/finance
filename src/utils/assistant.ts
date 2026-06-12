import { Portfolio } from '../types/portfolio';
import { formatINR, formatINRCompact, getFDInvestedAmount, getFDEffectiveValue } from './formatters';
import { getRDInvestedAmount, getRDEffectiveValue } from './rdUtils';
import { getSIPInvestedAmount, getSIPEffectiveValue } from './sipUtils';
import { calculateHealthScore } from './healthScore';
import { calculateRebalancing } from './rebalancing';
import { getAllocationTargets } from '../hooks/usePortfolioInsights';

export interface AssistantResponse {
  answer: string;
  matchedAssets: { name: string; type: string; details: string }[];
}

/**
 * Parses queries and executes rules client-side over portfolio data
 */
export enum Intent {
  MUTUAL_FUND_YEAR_INVESTMENTS = 'MUTUAL_FUND_YEAR_INVESTMENTS',
  PERFORMERS = 'PERFORMERS',
  MATURITY_TIMELINE = 'MATURITY_TIMELINE',
  ALLOCATION_SPLIT = 'ALLOCATION_SPLIT',
  SPECIFIC_GOLD = 'SPECIFIC_GOLD',
  SPECIFIC_MUTUAL_FUNDS = 'SPECIFIC_MUTUAL_FUNDS',
  SPECIFIC_STOCKS = 'SPECIFIC_STOCKS',
  SPECIFIC_FDS = 'SPECIFIC_FDS',
  INSURANCE_REMINDERS = 'INSURANCE_REMINDERS',
  NET_WORTH = 'NET_WORTH',
  FAMILY_BREAKDOWN = 'FAMILY_BREAKDOWN',
  NEXT_SIP_DATE = 'NEXT_SIP_DATE',
  PORTFOLIO_HEALTH = 'PORTFOLIO_HEALTH',
  REBALANCING_ADVICE = 'REBALANCING_ADVICE',
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  RENTAL_YIELD = 'RENTAL_YIELD',
  EXPIRED_DOCUMENTS = 'EXPIRED_DOCUMENTS',
  COMPREHENSIVE_SEARCH = 'COMPREHENSIVE_SEARCH',
  UNKNOWN = 'UNKNOWN'
}

export function normalizeQuery(query: string): string {
  let q = query.toLowerCase().trim();
  // Strip common filler phrases
  q = q.replace(/\b(what is|what's|whats|tell me|show me|list my|how much|how many|show all|give me|get me|display|search for|find|lookup|where is)\b/g, '');
  // Normalize synonyms
  q = q.replace(/\b(worth|wealth|assets|networth)\b/g, 'net worth');
  q = q.replace(/\b(mutualfunds|mutualfund|mfs)\b/g, 'mutual fund');
  q = q.replace(/\b(fixed deposit|fixed deposits|fds|fd)\b/g, 'fixed deposit');
  q = q.replace(/\b(recurring deposit|recurring deposits|rds|rd)\b/g, 'recurring deposit');
  q = q.replace(/\b(rebalance|rebalancing|drift|target percentage|target allocation|target split|drift split)\b/g, 'rebalance');
  q = q.replace(/\b(health|diagnostic|healthy|score|health score|audit|health report)\b/g, 'health');
  q = q.replace(/\b(emergency|expenses|liquidity|buffer|emergency pool|emergency fund|emergency buffer)\b/g, 'emergency');
  q = q.replace(/\b(rental yield|rent yield|rent return|rental income|rent income)\b/g, 'rental yield');
  q = q.replace(/\b(expired|expiration|expiry|expiring|expired document|expired documents|document expiry|expiring docs|expiring documents)\b/g, 'expiry');
  return q.trim();
}

/**
 * Helper to check if a query word matches any asset details in portfolios
 */
function hasSearchMatches(query: string, portfolios: Portfolio[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return false;

  for (const p of portfolios) {
    if (words.some(w => p.label.toLowerCase().includes(w))) return true;
    for (const h of p.holdings) {
      if (words.some(w => h.ticker.toLowerCase().includes(w) || h.stockName.toLowerCase().includes(w))) return true;
    }
    for (const fd of p.fixedDeposits) {
      if (words.some(w => fd.bank_name.toLowerCase().includes(w) || (fd.notes && fd.notes.toLowerCase().includes(w)))) return true;
    }
    if (p.rdAccounts) {
      for (const rd of p.rdAccounts) {
        if (words.some(w => rd.bank_name.toLowerCase().includes(w) || (rd.notes && rd.notes.toLowerCase().includes(w)))) return true;
      }
    }
    if (p.sipAccounts) {
      for (const sip of p.sipAccounts) {
        if (words.some(w => sip.fund_name.toLowerCase().includes(w) || (sip.notes && sip.notes.toLowerCase().includes(w)))) return true;
      }
    }
    for (const g of p.goldHoldings) {
      if (words.some(w => g.item_name.toLowerCase().includes(w) || g.purity.toLowerCase().includes(w) || (g.notes && g.notes.toLowerCase().includes(w)))) return true;
    }
    for (const re of p.realEstate) {
      if (words.some(w => re.property_name.toLowerCase().includes(w) || re.property_type.toLowerCase().includes(w) || (re.location && re.location.toLowerCase().includes(w)))) return true;
    }
    for (const ins of p.insurances) {
      if (words.some(w => ins.provider.toLowerCase().includes(w) || ins.policy_name.toLowerCase().includes(w) || ins.insurance_type.toLowerCase().includes(w))) return true;
    }
    for (const doc of p.documents) {
      if (words.some(w => doc.name.toLowerCase().includes(w) || doc.file_path.toLowerCase().includes(w) || doc.asset_type.toLowerCase().includes(w))) return true;
    }
  }
  return false;
}

export function detectIntent(query: string, portfolios?: Portfolio[]): Intent {
  const q = normalizeQuery(query);
  const currentYear = new Date().getFullYear();

  // Query 8: Next SIP Date (High priority)
  if (
    q.includes('next sip') ||
    q.includes('upcoming sip') ||
    q.includes('sip date') ||
    q.includes('sip due') ||
    q.includes('sip payment') ||
    (q.includes('sip') && q.includes('when'))
  ) {
    return Intent.NEXT_SIP_DATE;
  }

  // Query 9: Family member breakdown (High priority)
  if (
    (q.includes('family') && (q.includes('breakdown') || q.includes('member') || q.includes('split') || q.includes('total') || q.includes('value') || q.includes('pnl') || q.includes('p&l') || q.includes('invest'))) ||
    q.includes('who owns') ||
    q.includes('each person') ||
    q.includes('individual portfolio') ||
    q.includes('owned by')
  ) {
    return Intent.FAMILY_BREAKDOWN;
  }

  // Query 2: Performers (High priority to avoid false positive intent match on other categories)
  if (
    q.includes('highest return') || q.includes('highest returns') ||
    q.includes('best return') || q.includes('best returns') ||
    q.includes('top return') || q.includes('top returns') ||
    q.includes('maximum return') || q.includes('maximum returns') ||
    q.includes('best performing') ||
    q.includes('highest gain') || q.includes('highest gains') ||
    q.includes('top performer') || q.includes('top performers') ||
    q.includes('best asset') || q.includes('best assets') ||
    q.includes('best investment') || q.includes('best investments') ||
    (/best\s+(?:\w+\s+){0,3}returns?\b/.test(q)) ||
    (/highest\s+(?:\w+\s+){0,3}returns?\b/.test(q)) ||
    (/top\s+(?:\w+\s+){0,3}returns?\b/.test(q)) ||
    (/maximum\s+(?:\w+\s+){0,3}returns?\b/.test(q)) ||
    (/best\s+(?:\w+\s+){0,3}performing/.test(q)) ||
    (/best\s+(?:\w+\s+){0,3}gains?\b/.test(q)) ||
    (/highest\s+(?:\w+\s+){0,3}gains?\b/.test(q)) ||
    (/top\s+(?:\w+\s+){0,3}performers?\b/.test(q)) ||
    (/best\s+(?:\w+\s+){0,3}assets?\b/.test(q)) ||
    (/best\s+(?:\w+\s+){0,3}investments?\b/.test(q))
  ) {
    return Intent.PERFORMERS;
  }

  // Query 1: Mutual Fund current year investments
  if (
    (q.includes('mutual fund') || q.includes('sip') || q.includes('funds') || q.includes('mf')) &&
    (q.includes('invested') || q.includes('contribution') || q.includes('deposit')) &&
    (q.includes('this year') || q.includes(String(currentYear)) || q.includes('current year'))
  ) {
    return Intent.MUTUAL_FUND_YEAR_INVESTMENTS;
  }

  // Health Score Audit
  if (q.includes('health')) {
    return Intent.PORTFOLIO_HEALTH;
  }

  // Rebalancing advice
  if (q.includes('rebalance')) {
    return Intent.REBALANCING_ADVICE;
  }

  // Emergency Fund
  if (q.includes('emergency')) {
    return Intent.EMERGENCY_FUND;
  }

  // Rental yield
  if (q.includes('rental yield')) {
    return Intent.RENTAL_YIELD;
  }

  // Expiry dates
  if (q.includes('expiry') || q.includes('expired')) {
    return Intent.EXPIRED_DOCUMENTS;
  }

  // Query 3: Maturity
  if (
    q.includes('maturing') ||
    q.includes('maturity') ||
    q.includes('maturities') ||
    q.includes('matures') ||
    q.includes('expire') ||
    q.includes('due date')
  ) {
    return Intent.MATURITY_TIMELINE;
  }

  // Query 4: Consolidated Allocation Split
  if (
    q.includes('allocation') ||
    q.includes('split') ||
    q.includes('diversification') ||
    q.includes('percentage') ||
    q.includes('portfolio weight')
  ) {
    return Intent.ALLOCATION_SPLIT;
  }

  // Query 5: Insurance reminders
  if (
    q.includes('insurance') ||
    q.includes('policy') ||
    q.includes('premium') ||
    q.includes('renewal')
  ) {
    return Intent.INSURANCE_REMINDERS;
  }

  // Query 6: Specific Gold
  if (
    /\bgold\b/.test(q) &&
    (q.includes('holding') || q.includes('show') || q.includes('my') || q.includes('asset') || q.includes('registry') || q.includes('value') || q.includes('valuation') || q.includes('have') || q.includes('invest') || q.trim() === 'gold')
  ) {
    return Intent.SPECIFIC_GOLD;
  }

  // Specific Mutual Funds
  if (
    (q.includes('mutual fund') || q.includes('sip') || q.includes('funds') || q.includes('mf')) &&
    (q.includes('show') || q.includes('my') || q.includes('list') || q.includes('holding') || q.includes('value') || q.includes('valuation') || q.includes('investment') || q.includes('have') || q.includes('invest') || q.trim() === 'sip' || q.trim() === 'mutual fund')
  ) {
    return Intent.SPECIFIC_MUTUAL_FUNDS;
  }

  // Specific Stocks
  if (
    !q.includes('mutual fund') &&
    !q.includes('sip') &&
    !q.includes('mf') &&
    (q.includes('stock') || q.includes('holding') || q.includes('equity') || q.includes('share')) &&
    (q.includes('show') || q.includes('my') || q.includes('list') || q.includes('value') || q.includes('valuation') || q.includes('direct') || q.includes('have') || q.includes('invest') || q.trim() === 'stocks')
  ) {
    return Intent.SPECIFIC_STOCKS;
  }

  // Specific FDs
  if (
    (q.includes('fixed deposit') || q.includes('fd') || q.includes('fds')) &&
    (q.includes('show') || q.includes('my') || q.includes('list') || q.includes('value') || q.includes('valuation') || q.includes('have') || q.includes('invest') || q.trim() === 'fd' || q.trim() === 'fds' || q.trim() === 'fixed deposit')
  ) {
    return Intent.SPECIFIC_FDS;
  }

  // Query 7: Net Worth
  if (
    q.includes('net worth') ||
    q.includes('wealth') ||
    (q.includes('total') && (q.includes('value') || q.includes('valuation') || q.includes('portfolio')))
  ) {
    return Intent.NET_WORTH;
  }

  // Fallback check: scan portfolios for fuzzy search matches
  if (portfolios && hasSearchMatches(query, portfolios)) {
    return Intent.COMPREHENSIVE_SEARCH;
  }

  return Intent.UNKNOWN;
}

function formatGainINR(value: number): string {
  return value >= 0 ? `+${formatINR(value)}` : formatINR(value);
}

/**
 * Parses queries and executes rules client-side over portfolio data
 */
export function askAssistant(query: string, portfolios: Portfolio[]): AssistantResponse {
  const q = query.toLowerCase().trim();
  const matchedAssets: AssistantResponse['matchedAssets'] = [];
  const intent = detectIntent(q, portfolios);

  // Query 1: Mutual Fund current year investments
  if (intent === Intent.MUTUAL_FUND_YEAR_INVESTMENTS) {
    let totalInvested = 0;
    const currentYear = new Date().getFullYear();

    for (const p of portfolios) {
      if (p.sipAccounts) {
        for (const sip of p.sipAccounts) {
          const startDate = new Date(sip.start_date);
          const startYear = startDate.getFullYear();
          
          let monthsThisYear = 0;
          if (startYear < currentYear) {
            monthsThisYear = new Date().getMonth() + 1;
          } else if (startYear === currentYear) {
            monthsThisYear = new Date().getMonth() - startDate.getMonth() + 1;
          }
          
          if (monthsThisYear > 0) {
            const investedVal = sip.monthly_sip * monthsThisYear;
            totalInvested += investedVal;
            matchedAssets.push({
              name: sip.fund_name,
              type: 'Mutual Fund SIP',
              details: `Monthly SIP: ${formatINR(sip.monthly_sip)} (Invested ${monthsThisYear} months in ${currentYear}: ${formatINR(investedVal)})`,
            });
          }
        }
      }
    }

    return {
      answer: `You have invested a total of **${formatINR(totalInvested)}** in Mutual Fund SIPs during the current calendar year (${currentYear}).`,
      matchedAssets,
    };
  }

  // Helper: Compile all assets for performer and allocation queries
  interface AssetDetail {
    name: string;
    type: string;
    invested: number;
    value: number;
    gain: number;
    gainPct: number;
  }

  const allAssets: AssetDetail[] = [];

  for (const p of portfolios) {
    // Stocks
    for (const h of p.holdings) {
      allAssets.push({
        name: `${h.stockName} (${h.ticker})`,
        type: 'Stock Holding',
        invested: h.amountInvested,
        value: h.currentValue,
        gain: h.unrealizedPnL,
        gainPct: h.pnlPercent,
      });
    }

    // Gold
    for (const g of p.goldHoldings) {
      const val = Number(g.current_valuation) || 0;
      const inv = Number(g.purchase_price) || 0;
      const gain = val - inv;
      const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
      allAssets.push({
        name: g.item_name,
        type: 'Gold Registry',
        invested: inv,
        value: val,
        gain,
        gainPct,
      });
    }

    // Real Estate
    for (const re of p.realEstate) {
      const val = Number(re.current_valuation) || 0;
      const inv = Number(re.purchase_price) || 0;
      const gain = val - inv;
      const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
      allAssets.push({
        name: re.property_name,
        type: 'Real Estate Property',
        invested: inv,
        value: val,
        gain,
        gainPct,
      });
    }

    // Fixed Deposits
    for (const fd of p.fixedDeposits) {
      const inv = getFDInvestedAmount(fd);
      const val = getFDEffectiveValue(fd);
      const gain = val - inv;
      const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
      allAssets.push({
        name: `${fd.bank_name} FD`,
        type: 'Fixed Deposit',
        invested: inv,
        value: val,
        gain,
        gainPct,
      });
    }

    // Recurring Deposits
    if (p.rdAccounts) {
      for (const rd of p.rdAccounts) {
        const inv = getRDInvestedAmount(rd);
        const val = getRDEffectiveValue(rd);
        const gain = val - inv;
        const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
        allAssets.push({
          name: `${rd.bank_name} RD`,
          type: 'Recurring Deposit',
          invested: inv,
          value: val,
          gain,
          gainPct,
        });
      }
    }



    // Mutual Fund SIPs
    if (p.sipAccounts) {
      for (const sip of p.sipAccounts) {
        const inv = getSIPInvestedAmount(sip);
        const val = getSIPEffectiveValue(sip);
        const gain = val - inv;
        const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
        allAssets.push({
          name: sip.fund_name,
          type: 'Mutual Fund SIP',
          invested: inv,
          value: val,
          gain,
          gainPct,
        });
      }
    }
  }

  // Query 2: Performer Queries (Absolute and Percentage returns)
  if (intent === Intent.PERFORMERS) {
    const validAssets = allAssets.filter(a => a.invested > 0);
    if (validAssets.length === 0) {
      return {
        answer: 'Could not determine the highest return asset. Make sure you have entered purchase prices and balances for your holdings.',
        matchedAssets: [],
      };
    }

    const sortedByGain = [...validAssets].sort((a, b) => b.gain - a.gain);
    const sortedByPct = [...validAssets].sort((a, b) => b.gainPct - a.gainPct);

    const topAbs = sortedByGain[0];
    const topPct = sortedByPct[0];

    let answer = `Your absolute highest-returning asset is **${topAbs.name}** (${topAbs.type}) with a total return of **${formatGainINR(topAbs.gain)}** (+${topAbs.gainPct.toFixed(1)}%).\n\n`;
    if (topPct.name !== topAbs.name) {
      answer += `By percentage rate of return, your best performing asset is **${topPct.name}** (${topPct.type}) with a return of **+${topPct.gainPct.toFixed(1)}%** (${formatGainINR(topPct.gain)} absolute gain).\n\n`;
    }

    answer += `### Top 3 Assets by Absolute Return:\n`;
    const top3 = sortedByGain.slice(0, 3);
    top3.forEach((asset, idx) => {
      answer += `${idx + 1}. **${asset.name}** (${asset.type}): **${formatGainINR(asset.gain)}** (+${asset.gainPct.toFixed(1)}%)\n`;
    });

    return {
      answer,
      matchedAssets: top3.map(a => ({ name: a.name, type: a.type, details: `Gain: ${formatGainINR(a.gain)} (+${a.gainPct.toFixed(1)}%)` })),
    };
  }

  // Query 3: Maturity / upcoming maturity timeline queries
  if (intent === Intent.MATURITY_TIMELINE) {
    interface MaturityItem {
      name: string;
      type: string;
      dateStr: string;
      dateObj: Date;
      amount: number;
      isExpired: boolean;
      details: string;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maturities: MaturityItem[] = [];

    // FDs
    for (const p of portfolios) {
      for (const fd of p.fixedDeposits) {
        if (fd.maturity_date) {
          const mDate = new Date(fd.maturity_date);
          if (!isNaN(mDate.getTime())) {
            maturities.push({
              name: `${fd.bank_name} FD`,
              type: 'Fixed Deposit',
              dateStr: fd.maturity_date,
              dateObj: mDate,
              amount: fd.maturity_amount,
              isExpired: mDate.getTime() < today.getTime() && fd.status === 'active',
              details: `Principal: ${formatINR(fd.principal_amount)}, Maturity Val: ${formatINR(fd.maturity_amount)}`,
            });
          }
        }
      }
    }

    // RDs
    for (const p of portfolios) {
      if (p.rdAccounts) {
        for (const rd of p.rdAccounts) {
          if (rd.maturity_date) {
            const mDate = new Date(rd.maturity_date);
            if (!isNaN(mDate.getTime())) {
              maturities.push({
                name: `${rd.bank_name} RD`,
                type: 'Recurring Deposit',
                dateStr: rd.maturity_date,
                dateObj: mDate,
                amount: rd.maturity_amount,
                isExpired: mDate.getTime() < today.getTime() && rd.status === 'active',
                details: `Monthly deposit: ${formatINR(rd.monthly_deposit)}, Maturity Val: ${formatINR(rd.maturity_amount)}`,
              });
            }
          }
        }
      }
    }



    // Insurances
    for (const p of portfolios) {
      for (const ins of p.insurances) {
        if (ins.renewal_date) {
          const rDate = new Date(ins.renewal_date);
          if (!isNaN(rDate.getTime())) {
            maturities.push({
              name: `${ins.provider} - ${ins.policy_name}`,
              type: 'Insurance Renewal',
              dateStr: ins.renewal_date,
              dateObj: rDate,
              amount: ins.premium_amount,
              isExpired: rDate.getTime() < today.getTime(),
              details: `Premium: ${formatINR(ins.premium_amount)}, Cover: ${formatINR(ins.sum_assured)}`,
            });
          }
        }
      }
    }

    // Documents
    for (const p of portfolios) {
      for (const doc of p.documents) {
        if (doc.expiry_date) {
          const eDate = new Date(doc.expiry_date);
          if (!isNaN(eDate.getTime())) {
            maturities.push({
              name: doc.name,
              type: 'Document Expiry',
              dateStr: doc.expiry_date,
              dateObj: eDate,
              amount: 0,
              isExpired: eDate.getTime() < today.getTime(),
              details: `Linked asset: ${doc.asset_type.toUpperCase()}`,
            });
          }
        }
      }
    }

    // Year extraction
    const yearMatch = q.match(/\b(202\d|203\d)\b/);
    const targetYear = yearMatch ? yearMatch[0] : null;

    if (targetYear) {
      const filtered = maturities.filter(m => m.dateStr.startsWith(targetYear));
      if (filtered.length > 0) {
        let answer = `Found **${filtered.length}** investments, insurances, or documents maturing/due in **${targetYear}**:\n\n`;
        filtered.forEach((m) => {
          answer += `- **${m.name}** (${m.type}): due on **${m.dateStr}** (${m.details}).\n`;
        });
        return {
          answer,
          matchedAssets: filtered.map(f => ({ name: f.name, type: f.type, details: `${f.dateStr} - ${f.details}` })),
        };
      } else {
        return {
          answer: `No Fixed Deposits, Recurring Deposits, insurance policies, or documents are maturing/due in **${targetYear}**.`,
          matchedAssets: [],
        };
      }
    }

    // Default to upcoming maturities timeline
    const overdue = maturities.filter(m => m.isExpired).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    const upcoming = maturities.filter(m => !m.isExpired && m.dateObj.getTime() >= today.getTime()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    let answer = `### 📅 Portfolio Maturities & Renewals Timeline\n\n`;
    if (upcoming.length > 0) {
      upcoming.slice(0, 5).forEach((m) => {
        const diffTime = m.dateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const countdown = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`;
        answer += `- **${m.name}** (${m.type}): due on **${m.dateStr}** (${countdown}). ${m.details}.\n`;
      });
    } else {
      answer += `No upcoming maturities or renewals found.\n`;
    }

    if (overdue.length > 0) {
      answer += `\n⚠️ **Expired or Matured Items (Immediate action needed):**\n`;
      overdue.forEach((m) => {
        const diffTime = today.getTime() - m.dateObj.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        answer += `- **${m.name}** (${m.type}): expired/matured on **${m.dateStr}** (${diffDays} days ago). ${m.details}.\n`;
      });
    }

    const matched = [...upcoming.slice(0, 3), ...overdue.slice(0, 3)].map(m => ({
      name: m.name,
      type: m.type,
      details: `${m.dateStr} - ${m.details}`
    }));

    return {
      answer,
      matchedAssets: matched,
    };
  }

  // Compile totals for Allocation Queries
  let stocksTotal = 0;
  let goldTotal = 0;
  let realEstateTotal = 0;
  let fdTotal = 0;
  let rdTotal = 0;
  let sipTotal = 0;

  for (const p of portfolios) {
    stocksTotal += p.stocksValue || 0;
    goldTotal += p.goldValue || 0;
    realEstateTotal += p.realEstateValue || 0;
    fdTotal += p.fdValue || 0;
    rdTotal += p.rdValue || 0;
    sipTotal += p.sipValue || 0;
  }

  const equityTotal = stocksTotal + sipTotal;
  const debtTotal = fdTotal + rdTotal;
  const totalVal = equityTotal + debtTotal + goldTotal + realEstateTotal;

  // Query 4: Allocation Split Queries
  if (intent === Intent.ALLOCATION_SPLIT) {
    if (totalVal === 0) {
      return {
        answer: 'Your total portfolio valuation is currently zero. Add assets to see your allocation distribution.',
        matchedAssets: [],
      };
    }

    const eqPct = (equityTotal / totalVal) * 100;
    const dbPct = (debtTotal / totalVal) * 100;
    const gdPct = (goldTotal / totalVal) * 100;
    const rePct = (realEstateTotal / totalVal) * 100;

    const getProgressBar = (pct: number) => {
      const filled = Math.min(10, Math.round(pct / 10));
      const empty = 10 - filled;
      return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\``;
    };

    let answer = `### 📊 Consolidated Asset Allocation Split\n`;
    answer += `Your total consolidated family net worth is **${formatINR(totalVal)}**:\n\n`;
    answer += `- **Equity (Stocks + Mutual Funds)**: **${formatINR(equityTotal)}** (${eqPct.toFixed(1)}%) ${getProgressBar(eqPct)}\n`;
    answer += `  * Direct Stocks: ${formatINR(stocksTotal)}\n`;
    answer += `  * Mutual Fund SIPs: ${formatINR(sipTotal)}\n`;
    answer += `- **Debt (FD + RD)**: **${formatINR(debtTotal)}** (${dbPct.toFixed(1)}%) ${getProgressBar(dbPct)}\n`;
    answer += `  * Fixed Deposits: ${formatINR(fdTotal)}\n`;
    answer += `  * Recurring Deposits: ${formatINR(rdTotal)}\n`;
    answer += `- **Gold**: **${formatINR(goldTotal)}** (${gdPct.toFixed(1)}%) ${getProgressBar(gdPct)}\n`;
    answer += `- **Real Estate**: **${formatINR(realEstateTotal)}** (${rePct.toFixed(1)}%) ${getProgressBar(rePct)}\n`;

    return {
      answer,
      matchedAssets: [
        { name: 'Equity Class', type: 'Allocation', details: `${eqPct.toFixed(1)}% (${formatINR(equityTotal)})` },
        { name: 'Debt Class', type: 'Allocation', details: `${dbPct.toFixed(1)}% (${formatINR(debtTotal)})` },
        { name: 'Gold Class', type: 'Allocation', details: `${gdPct.toFixed(1)}% (${formatINR(goldTotal)})` },
        { name: 'Real Estate Class', type: 'Allocation', details: `${rePct.toFixed(1)}% (${formatINR(realEstateTotal)})` },
      ],
    };
  }

  // Specific Allocation Classes
  if (intent === Intent.SPECIFIC_GOLD) {
    const gdPct = totalVal > 0 ? (goldTotal / totalVal) * 100 : 0;
    let answer = `You have **${formatINR(goldTotal)}** in Gold Registry holdings, representing **${gdPct.toFixed(1)}%** of your total portfolio.\n\n`;
    answer += `### Gold Inventory:\n`;
    const goldList: AssistantResponse['matchedAssets'] = [];
    for (const p of portfolios) {
      for (const g of p.goldHoldings) {
        answer += `- **${g.item_name}** (${g.purity}, ${g.weight_grams}g): current valuation **${formatINR(g.current_valuation)}**.\n`;
        goldList.push({ name: g.item_name, type: 'Gold', details: `${g.weight_grams}g (${g.purity}) - Value: ${formatINR(g.current_valuation)}` });
      }
    }
    return { answer, matchedAssets: goldList };
  }

  if (intent === Intent.SPECIFIC_MUTUAL_FUNDS) {
    const mfPct = totalVal > 0 ? (sipTotal / totalVal) * 100 : 0;
    let answer = `You have **${formatINR(sipTotal)}** in Mutual Fund SIPs, representing **${mfPct.toFixed(1)}%** of your total portfolio.\n\n`;
    answer += `### Mutual Fund Holdings:\n`;
    const sipList: AssistantResponse['matchedAssets'] = [];
    for (const p of portfolios) {
      if (p.sipAccounts) {
        for (const sip of p.sipAccounts) {
          const val = getSIPEffectiveValue(sip);
          answer += `- **${sip.fund_name}**: Monthly SIP **${formatINR(sip.monthly_sip)}** (Current Val: **${formatINR(val)}**).\n`;
          sipList.push({ name: sip.fund_name, type: 'Mutual Fund SIP', details: `Monthly: ${formatINR(sip.monthly_sip)}, Value: ${formatINR(val)}` });
        }
      }
    }
    return { answer, matchedAssets: sipList };
  }

  if (intent === Intent.SPECIFIC_STOCKS) {
    const stPct = totalVal > 0 ? (stocksTotal / totalVal) * 100 : 0;
    let answer = `You have **${formatINR(stocksTotal)}** in direct Stocks, representing **${stPct.toFixed(1)}%** of your total portfolio.\n\n`;
    answer += `### Stock Portfolio List:\n`;
    const stockList: AssistantResponse['matchedAssets'] = [];
    for (const p of portfolios) {
      for (const h of p.holdings) {
        answer += `- **${h.stockName} (${h.ticker})**: ${h.qty} shares @ avg price ${formatINR(h.avgPrice)} (Current Val: **${formatINR(h.currentValue)}**, P&L: **${formatINR(h.unrealizedPnL)}**).\n`;
        stockList.push({ name: h.stockName, type: 'Stock', details: `${h.qty} shares - Value: ${formatINR(h.currentValue)} (P&L: ${formatINR(h.unrealizedPnL)})` });
      }
    }
    return { answer, matchedAssets: stockList };
  }

  if (intent === Intent.SPECIFIC_FDS) {
    const fdPct = totalVal > 0 ? (fdTotal / totalVal) * 100 : 0;
    let answer = `You have **${formatINR(fdTotal)}** in Fixed Deposits, representing **${fdPct.toFixed(1)}%** of your total portfolio.\n\n`;
    answer += `### Fixed Deposits:\n`;
    const fdList: AssistantResponse['matchedAssets'] = [];
    for (const p of portfolios) {
      for (const fd of p.fixedDeposits) {
        const val = getFDEffectiveValue(fd);
        answer += `- **${fd.bank_name} FD**: Principal **${formatINR(fd.principal_amount)}** @ ${fd.interest_rate}% (Current Val: **${formatINR(val)}**).\n`;
        fdList.push({ name: `${fd.bank_name} FD`, type: 'Fixed Deposit', details: `Principal: ${formatINR(fd.principal_amount)}, Value: ${formatINR(val)}` });
      }
    }
    return { answer, matchedAssets: fdList };
  }

  // Query 5: Insurance / policy due premium reminders
  if (intent === Intent.INSURANCE_REMINDERS) {
    let count = 0;
    let sumCover = 0;
    let annualPremium = 0;
    const activePolicies: {
      provider: string;
      name: string;
      type: string;
      cover: number;
      premium: number;
      renewal: string;
      daysToRenewal: number | null;
    }[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const p of portfolios) {
      count += p.insurances.length;
      for (const ins of p.insurances) {
        sumCover += ins.sum_assured;
        annualPremium += ins.premium_amount;
        
        let daysToRenewal: number | null = null;
        if (ins.renewal_date) {
          const rDate = new Date(ins.renewal_date);
          if (!isNaN(rDate.getTime())) {
            const diffTime = rDate.getTime() - today.getTime();
            daysToRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        activePolicies.push({
          provider: ins.provider,
          name: ins.policy_name,
          type: ins.insurance_type,
          cover: ins.sum_assured,
          premium: ins.premium_amount,
          renewal: ins.renewal_date || 'N/A',
          daysToRenewal
        });
      }
    }

    if (count === 0) {
      return {
        answer: 'You currently do not have any active insurance policies in your portfolio database.',
        matchedAssets: [],
      };
    }

    let answer = `You have **${count}** active insurance policies providing a total combined cover of **${formatINR(sumCover)}**. Your total annual premium payout across these policies is **${formatINR(annualPremium)}**.\n\n`;
    
    const policiesWithRenewal = activePolicies.filter(p => p.renewal !== 'N/A');
    
    if (policiesWithRenewal.length > 0) {
      answer += `### 📅 Insurance Renewals & Reminders:\n\n`;
      // Sort: upcoming renewals (soonest first, overdue ones at the bottom or marked)
      const sortedPolicies = [...policiesWithRenewal].sort((a, b) => {
        if (a.daysToRenewal === null) return 1;
        if (b.daysToRenewal === null) return -1;
        // Keep overdue items at the top to highlight immediately, followed by upcoming
        return a.daysToRenewal - b.daysToRenewal;
      });

      sortedPolicies.forEach((pol) => {
        const typeStr = pol.type.toUpperCase();
        if (pol.daysToRenewal !== null) {
          if (pol.daysToRenewal < 0) {
            answer += `- ⚠️ **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** was due on **${pol.renewal}** (**${Math.abs(pol.daysToRenewal)} days overdue**).\n`;
          } else if (pol.daysToRenewal === 0) {
            answer += `- 🚨 **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** is due **TODAY**.\n`;
          } else if (pol.daysToRenewal <= 30) {
            answer += `- 🔔 **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** is due on **${pol.renewal}** (**in ${pol.daysToRenewal} days**).\n`;
          } else {
            answer += `- **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** is due on **${pol.renewal}** (in ${pol.daysToRenewal} days).\n`;
          }
        } else {
          answer += `- **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** is due (date not specified).\n`;
        }
      });
    }

    return {
      answer,
      matchedAssets: activePolicies.map(pol => ({
        name: `${pol.provider} - ${pol.name}`,
        type: `${pol.type} Insurance`,
        details: `Premium: ${formatINR(pol.premium)}, Cover: ${formatINR(pol.cover)}, Renewal: ${pol.renewal}`
      }))
    };
  }

  // Query 8: Next SIP Date
  if (intent === Intent.NEXT_SIP_DATE) {
    interface SIPItem {
      fundName: string;
      owner: string;
      monthlySIP: number;
      nextSIPDate: string | null;
      nextSIPDateObj: Date | null;
    }
    
    const sips: SIPItem[] = [];
    for (const p of portfolios) {
      if (p.sipAccounts) {
        for (const sip of p.sipAccounts) {
          let dateObj: Date | null = null;
          if (sip.next_sip_date) {
            const d = new Date(sip.next_sip_date);
            if (!isNaN(d.getTime())) {
              dateObj = d;
            }
          }
          sips.push({
            fundName: sip.fund_name,
            owner: p.label,
            monthlySIP: sip.monthly_sip,
            nextSIPDate: sip.next_sip_date || null,
            nextSIPDateObj: dateObj
          });
        }
      }
    }
    
    if (sips.length === 0) {
      return {
        answer: "You have no active Mutual Fund SIP accounts in your portfolio database.",
        matchedAssets: []
      };
    }
    
    const sortedSips = [...sips].sort((a, b) => {
      if (!a.nextSIPDateObj) return 1;
      if (!b.nextSIPDateObj) return -1;
      return a.nextSIPDateObj.getTime() - b.nextSIPDateObj.getTime();
    });
    
    let answer = `### 📅 Upcoming Mutual Fund SIP Schedule\n\n`;
    const matched: AssistantResponse['matchedAssets'] = [];
    
    sortedSips.forEach(sip => {
      const dateStr = sip.nextSIPDate ? `on **${sip.nextSIPDate}**` : 'date not specified';
      answer += `- **${sip.fundName}** (${sip.owner}): Monthly payment of **${formatINR(sip.monthlySIP)}** due ${dateStr}.\n`;
      
      matched.push({
        name: sip.fundName,
        type: 'SIP Due Date',
        details: `Owner: ${sip.owner}, Monthly: ${formatINR(sip.monthlySIP)}, Next Date: ${sip.nextSIPDate || 'N/A'}`
      });
    });
    
    return { answer, matchedAssets: matched };
  }

  // Query 9: Family member breakdown
  if (intent === Intent.FAMILY_BREAKDOWN) {
    let answer = `### 👥 Family Member Portfolio Breakdown\n\n`;
    const matched: AssistantResponse['matchedAssets'] = [];
    
    portfolios.forEach(p => {
      const invested = p.totalInvested;
      const current = p.totalCurrentValue;
      const pnl = current - invested;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
      const sign = pnl >= 0 ? '+' : '';
      
      answer += `- **${p.label}**: Net Worth **${formatINR(current)}** on invested capital of **${formatINR(invested)}** (P&L: **${sign}${formatINR(pnl)}** or **${sign}${pnlPct.toFixed(1)}%**).\n`;
      
      matched.push({
        name: p.label,
        type: 'Family Portfolio',
        details: `Invested: ${formatINR(invested)}, Current: ${formatINR(current)}, P&L: ${sign}${formatINR(pnl)} (${sign}${pnlPct.toFixed(1)}%)`
      });
    });
    
    return { answer, matchedAssets: matched };
  }

  // Fallback net worth FAQ
  if (intent === Intent.NET_WORTH) {
    const totalCurrentVal = portfolios.reduce((s, p) => s + p.totalCurrentValue, 0);
    const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0);
    const pnl = totalCurrentVal - totalInvested;
    const pnlStr = formatGainINR(pnl);
    return {
      answer: `Your total consolidated family net worth today is **${formatINR(totalCurrentVal)}** on an invested capital of **${formatINR(totalInvested)}** (P&L: **${pnlStr}**).`,
      matchedAssets: [],
    };
  }

  // 1. Portfolio Health Audit
  if (intent === Intent.PORTFOLIO_HEALTH) {
    const report = calculateHealthScore(portfolios, null);
    let answer = `### 🩺 Portfolio Health Audit\n`;
    answer += `Your overall portfolio health score is **${report.score}/100**.\n\n`;
    
    answer += `| Category | Description | Status |\n`;
    answer += `| :--- | :--- | :--- |\n`;
    
    // Strengths
    report.strengths.forEach(str => {
      answer += `| Strength | ${str.slice(2)} | ✅ Pass |\n`;
    });
    
    // Risks
    report.risks.forEach(risk => {
      answer += `| Risk | ${risk.slice(2)} | ⚠️ Warning |\n`;
    });

    if (report.risks.length === 0) {
      answer += `\n🌟 **Excellent job!** No major risks or allocation gaps detected. Keep maintaining your SIP discipline!`;
    } else {
      answer += `\n💡 **Action items**: Address the warnings above (like boosting emergency funds or adding insurance policies) to increase your health score.`;
    }

    return {
      answer,
      matchedAssets: [],
    };
  }

  // 2. Rebalancing Advice
  if (intent === Intent.REBALANCING_ADVICE) {
    const targets = getAllocationTargets();
    const targetPcts = {
      equity: targets.stocks,
      debt: targets.fd,
      gold: targets.gold,
      realEstate: targets.realEstate
    };
    const advice = calculateRebalancing(portfolios, null, targetPcts);
    
    let answer = `### ⚖️ Asset Rebalancing Advice\n`;
    answer += `Based on your configured target allocation targets, here is the drift analysis and trade recommendations:\n\n`;
    
    answer += `| Asset Class | Target % | Actual % | Drift | Action Recommendation |\n`;
    answer += `| :--- | :---: | :---: | :---: | :--- |\n`;
    
    const matched: AssistantResponse['matchedAssets'] = [];
    
    advice.forEach(ad => {
      const drift = ad.actualPct - ad.targetPct;
      const driftSign = drift >= 0 ? '+' : '';
      
      answer += `| **${ad.assetClass}** | ${ad.targetPct}% | ${ad.actualPct.toFixed(1)}% | ${driftSign}${drift.toFixed(1)}% | **${ad.recommendation}** |\n`;
      
      if (ad.recommendation !== 'Aligned') {
        matched.push({
          name: ad.assetClass,
          type: 'Rebalancing Trade',
          details: `Drift: ${driftSign}${drift.toFixed(1)}%, Recommendation: ${ad.recommendation}`
        });
      }
    });

    answer += `\n*(Note: Rebalancing orders are recommended only when the trade amount exceeds the minimum action threshold of ${formatINR(5000)})*`;
    
    return {
      answer,
      matchedAssets: matched,
    };
  }

  // 3. Emergency Fund
  if (intent === Intent.EMERGENCY_FUND) {
    let totalFDVal = 0;
    let totalRDVal = 0;
    
    for (const p of portfolios) {
      totalFDVal += p.fdValue || 0;
      totalRDVal += p.rdValue || 0;
    }
    
    const emergencyPool = totalFDVal + totalRDVal;
    const MONTHLY_EXPENSE = 50000;
    const monthsCovered = MONTHLY_EXPENSE > 0 ? emergencyPool / MONTHLY_EXPENSE : 0;
    
    let answer = `### 🚨 Emergency Fund Analysis\n`;
    answer += `Your emergency/liquid capital consists of Fixed Deposits and Recurring Deposits:\n\n`;
    answer += `- **Total liquid capital**: **${formatINR(emergencyPool)}**\n`;
    answer += `  * Fixed Deposits: ${formatINR(totalFDVal)}\n`;
    answer += `  * Recurring Deposits: ${formatINR(totalRDVal)}\n`;
    answer += `- **Assumed monthly expense baseline**: **${formatINR(MONTHLY_EXPENSE)}/month**\n\n`;
    
    answer += `| Metric | Value | Rating |\n`;
    answer += `| :--- | :---: | :---: |\n`;
    answer += `| Months Covered | ${monthsCovered.toFixed(1)} months | ${monthsCovered >= 6 ? '✅ Solid (Excellent)' : monthsCovered >= 3 ? '⚠️ Moderate (Warning)' : '🚨 High Risk (Critical)'} |\n\n`;
    
    if (monthsCovered >= 6) {
      answer += `✓ Your emergency pool covers more than 6 months of baseline living expenses. You have a very healthy buffer.`;
    } else if (monthsCovered >= 3) {
      answer += `⚠ Your emergency fund covers ${monthsCovered.toFixed(1)} months of expenses. It is recommended to boost your deposits to reach at least 6 months of coverage (${formatINR(MONTHLY_EXPENSE * 6)}).`;
    } else {
      answer += `🚨 **Critical Alert**: Your emergency fund covers less than 3 months of expenses. You should prioritize creating additional liquid deposits to protect against sudden income loss or health crises.`;
    }

    return {
      answer,
      matchedAssets: [],
    };
  }

  // 4. Rental Yield
  if (intent === Intent.RENTAL_YIELD) {
    interface PropertyYield {
      name: string;
      owner: string;
      purchasePrice: number;
      currentVal: number;
      monthlyRent: number;
      annualRent: number;
      yieldPct: number;
    }
    
    const props: PropertyYield[] = [];
    for (const p of portfolios) {
      for (const re of p.realEstate) {
        const annualRent = Number(re.monthly_rent) * 12;
        const purchase = Number(re.purchase_price) || 1; // avoid division by zero
        const yieldPct = (annualRent / purchase) * 100;
        props.push({
          name: re.property_name,
          owner: p.label,
          purchasePrice: re.purchase_price,
          currentVal: re.current_valuation,
          monthlyRent: re.monthly_rent,
          annualRent,
          yieldPct
        });
      }
    }
    
    if (props.length === 0) {
      return {
        answer: "You do not have any Real Estate properties registered in your portfolio database.",
        matchedAssets: []
      };
    }
    
    // Sort: highest yield first
    const sortedProps = [...props].sort((a, b) => b.yieldPct - a.yieldPct);
    
    let answer = `### 🏢 Real Estate Rental Yields\n`;
    answer += `Rental yields are calculated as: \`(Monthly Rent × 12) ÷ Purchase Price × 100\`\n\n`;
    
    answer += `| Property Name | Owner | Purchase Price | Monthly Rent | Annual Rent | Yield % |\n`;
    answer += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`;
    
    const matched: AssistantResponse['matchedAssets'] = [];
    
    sortedProps.forEach(pr => {
      answer += `| **${pr.name}** | ${pr.owner} | ${formatINRCompact(pr.purchasePrice)} | ${formatINRCompact(pr.monthlyRent)} | ${formatINRCompact(pr.annualRent)} | **${pr.yieldPct.toFixed(2)}%** |\n`;
      matched.push({
        name: pr.name,
        type: 'Real Estate Property',
        details: `Rent: ${formatINR(pr.monthlyRent)}/mo (Yield: ${pr.yieldPct.toFixed(2)}%)`
      });
    });

    const highestYield = sortedProps[0];
    answer += `\n💡 **Insights**: The highest yielding property is **${highestYield.name}** owned by **${highestYield.owner}** with a yield rate of **${highestYield.yieldPct.toFixed(2)}%**.`;
    
    return {
      answer,
      matchedAssets: matched
    };
  }

  // 5. Expired/Expiring Documents
  if (intent === Intent.EXPIRED_DOCUMENTS) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    interface DocItem {
      name: string;
      owner: string;
      assetType: string;
      expiryDate: string;
      expiryObj: Date;
      daysRemaining: number;
    }
    
    const docs: DocItem[] = [];
    for (const p of portfolios) {
      for (const doc of p.documents) {
        if (doc.expiry_date) {
          const eDate = new Date(doc.expiry_date);
          if (!isNaN(eDate.getTime())) {
            const diffTime = eDate.getTime() - today.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // filter for expired or expiring in next 90 days
            if (daysRemaining <= 90) {
              docs.push({
                name: doc.name,
                owner: p.label,
                assetType: doc.asset_type,
                expiryDate: doc.expiry_date,
                expiryObj: eDate,
                daysRemaining
              });
            }
          }
        }
      }
    }
    
    if (docs.length === 0) {
      return {
        answer: "✓ **Great!** All registered documents are active and no renewals are due in the next 90 days.",
        matchedAssets: []
      };
    }
    
    // Sort: expired first, then soonest expiry
    const sortedDocs = [...docs].sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    let answer = `### 📄 Document Vault Expiries & Renewals\n`;
    answer += `Below are documents that have already expired or are due for renewal in the next 90 days:\n\n`;
    
    answer += `| Document Name | Owner | Asset Class | Expiry Date | Status |\n`;
    answer += `| :--- | :--- | :--- | :---: | :--- |\n`;
    
    const matched: AssistantResponse['matchedAssets'] = [];
    
    sortedDocs.forEach(d => {
      const statusStr = d.daysRemaining < 0
        ? `🔴 Expired (${Math.abs(d.daysRemaining)} days ago)`
        : d.daysRemaining === 0
        ? `🚨 Expires TODAY`
        : `🔔 Expires in ${d.daysRemaining} days`;
        
      answer += `| **${d.name}** | ${d.owner} | ${d.assetType.toUpperCase()} | ${d.expiryDate} | ${statusStr} |\n`;
      
      matched.push({
        name: d.name,
        type: 'Vault Document',
        details: `Expiry: ${d.expiryDate} (${statusStr})`
      });
    });
    
    return {
      answer,
      matchedAssets: matched
    };
  }

  // 6. Comprehensive Search Fallback
  if (intent === Intent.COMPREHENSIVE_SEARCH) {
    const searchTerms = q.split(/\s+/).filter(w => w.length > 2);
    let answer = `### 🔍 Consolidated Search Results\n`;
    answer += `Scanned all family registries for terms matching: ${searchTerms.map(t => `*"${t}"*`).join(', ')}\n\n`;
    
    const matched: AssistantResponse['matchedAssets'] = [];
    
    const addMatch = (name: string, type: string, details: string) => {
      matched.push({ name, type, details });
    };
    
    for (const p of portfolios) {
      // Match holdings
      for (const h of p.holdings) {
        if (searchTerms.some(t => h.ticker.toLowerCase().includes(t) || h.stockName.toLowerCase().includes(t))) {
          addMatch(`${h.stockName} (${h.ticker})`, 'Stock Holding', `Owner: ${p.label}, Qty: ${h.qty}, Current Value: ${formatINR(h.currentValue)}`);
        }
      }
      
      // Match FDs
      for (const fd of p.fixedDeposits) {
        if (searchTerms.some(t => fd.bank_name.toLowerCase().includes(t) || (fd.notes && fd.notes.toLowerCase().includes(t)))) {
          const val = getFDEffectiveValue(fd);
          addMatch(`${fd.bank_name} FD`, 'Fixed Deposit', `Owner: ${p.label}, Principal: ${formatINR(fd.principal_amount)}, Current Value: ${formatINR(val)}`);
        }
      }
      
      // Match RDs
      if (p.rdAccounts) {
        for (const rd of p.rdAccounts) {
          if (searchTerms.some(t => rd.bank_name.toLowerCase().includes(t) || (rd.notes && rd.notes.toLowerCase().includes(t)))) {
            const val = getRDEffectiveValue(rd);
            addMatch(`${rd.bank_name} RD`, 'Recurring Deposit', `Owner: ${p.label}, Monthly: ${formatINR(rd.monthly_deposit)}, Current Value: ${formatINR(val)}`);
          }
        }
      }
      
      // Match SIPs
      if (p.sipAccounts) {
        for (const sip of p.sipAccounts) {
          if (searchTerms.some(t => sip.fund_name.toLowerCase().includes(t) || (sip.notes && sip.notes.toLowerCase().includes(t)))) {
            const val = getSIPEffectiveValue(sip);
            addMatch(sip.fund_name, 'Mutual Fund SIP', `Owner: ${p.label}, Monthly: ${formatINR(sip.monthly_sip)}, Current Value: ${formatINR(val)}`);
          }
        }
      }
      
      // Match Gold
      for (const g of p.goldHoldings) {
        if (searchTerms.some(t => g.item_name.toLowerCase().includes(t) || g.purity.toLowerCase().includes(t) || (g.notes && g.notes.toLowerCase().includes(t)))) {
          addMatch(g.item_name, 'Gold Holding', `Owner: ${p.label}, Wt: ${g.weight_grams}g (${g.purity}), Current Value: ${formatINR(g.current_valuation)}`);
        }
      }
      
      // Match Real Estate
      for (const re of p.realEstate) {
        if (searchTerms.some(t => re.property_name.toLowerCase().includes(t) || re.property_type.toLowerCase().includes(t) || (re.location && re.location.toLowerCase().includes(t)))) {
          addMatch(re.property_name, 'Real Estate', `Owner: ${p.label}, Type: ${re.property_type}, Valuation: ${formatINR(re.current_valuation)}`);
        }
      }
      
      // Match Insurance
      for (const ins of p.insurances) {
        if (searchTerms.some(t => ins.provider.toLowerCase().includes(t) || ins.policy_name.toLowerCase().includes(t) || ins.insurance_type.toLowerCase().includes(t))) {
          addMatch(`${ins.provider} - ${ins.policy_name}`, 'Insurance Policy', `Owner: ${p.label}, Type: ${ins.insurance_type.toUpperCase()}, Sum Assured: ${formatINR(ins.sum_assured)}`);
        }
      }
      
      // Match Documents
      for (const doc of p.documents) {
        if (searchTerms.some(t => doc.name.toLowerCase().includes(t) || doc.file_path.toLowerCase().includes(t) || doc.asset_type.toLowerCase().includes(t))) {
          addMatch(doc.name, 'Document', `Owner: ${p.label}, Class: ${doc.asset_type.toUpperCase()}, Expiry: ${doc.expiry_date || 'N/A'}`);
        }
      }
    }
    
    if (matched.length === 0) {
      answer += `No matching asset names, symbols, bank labels, or documents found for *"#{q}"*. Try a different query.`;
    } else {
      answer += `Found **${matched.length}** matches across your family wealth registry:\n\n`;
      answer += `| Asset Class | Matched Name | Description |\n`;
      answer += `| :--- | :--- | :--- |\n`;
      matched.forEach(m => {
        answer += `| **${m.type}** | ${m.name} | ${m.details} |\n`;
      });
    }
    
    return {
      answer,
      matchedAssets: matched.slice(0, 8)
    };
  }

  return {
    answer: "I couldn't match your exact query. Try asking something like:\n- *'Which of my assets is the top performer?'*\n- *'Show all upcoming maturities'* (or maturities in a specific year like *'maturing in 2027'*)\n- *'What is my current asset allocation split?'*\n- *'Show all insurance due dates and reminders'*",
    matchedAssets: [],
  };
}
