import { Portfolio } from '../../../types/portfolio';

/**
 * Supported financial query intents
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
export function hasSearchMatches(query: string, portfolios: Portfolio[]): boolean {
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
