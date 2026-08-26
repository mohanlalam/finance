import { Portfolio } from '../../../types/portfolio';
import { calculateCAGR } from './cagr';
import { calculateXIRR, CashFlow } from './xirr';
import { getRDInvestedAmount, getElapsedMonthsStandard } from '../../assets/rd/calculations/rdCompounding';
import { getSIPInvestedAmount } from '../../assets/sip/calculations/sipValuation';
import { parseLocalDate, formatLocalDate, getDaysInMonth } from '../../../utils/dateUtils';

// Fast in-memory LRU cache for XIRR results
const xirrResultCache = new Map<string, number | null>();
const MAX_XIRR_CACHE_SIZE = 50;

function getFromXirrCache(key: string): number | null | undefined {
  if (!xirrResultCache.has(key)) return undefined;
  const val = xirrResultCache.get(key) ?? null;
  // Refresh recency on access (move to end of Map insertion order)
  xirrResultCache.delete(key);
  xirrResultCache.set(key, val);
  return val;
}

function setInXirrCache(key: string, val: number | null): void {
  if (xirrResultCache.has(key)) {
    xirrResultCache.delete(key);
  } else if (xirrResultCache.size >= MAX_XIRR_CACHE_SIZE) {
    const oldestKey = xirrResultCache.keys().next().value;
    if (oldestKey) xirrResultCache.delete(oldestKey);
  }
  xirrResultCache.set(key, val);
}

function getPortfolioCacheKey(p: Portfolio): string {
  const holdingsCount = p.holdings?.length ?? 0;
  const fdsCount = p.fixedDeposits?.length ?? 0;
  const rdsCount = p.rdAccounts?.length ?? 0;
  const sipsCount = p.sipAccounts?.length ?? 0;
  const goldCount = p.goldHoldings?.length ?? 0;
  const reCount = p.realEstate?.length ?? 0;
  return `${p.id || p.name}:${Math.round(p.totalInvested)}:${Math.round(p.totalCurrentValue)}:${holdingsCount}:${fdsCount}:${rdsCount}:${sipsCount}:${goldCount}:${reCount}`;
}

export function calculateWeightedAge(portfolio: Portfolio): number {
  if (!portfolio) return 1.0;
  let weightedTimeSum = 0;
  let totalInvested = 0;
  const now = Date.now();
  const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;

  const processDate = (startDateStr?: string): number | null => {
    if (!startDateStr) return null;
    const start = parseLocalDate(startDateStr);
    if (isNaN(start)) return null;
    return Math.max(0, (now - start) / MS_PER_YEAR);
  };

  const fds = portfolio.fixedDeposits || [];
  for (let i = 0; i < fds.length; i++) {
    const fd = fds[i];
    const amt = Math.max(0, Number(fd.principal_amount) || 0);
    const age = processDate(fd.start_date) ?? 0;
    weightedTimeSum += amt * age;
    totalInvested += amt;
  }

  if (portfolio.rdAccounts) {
    for (const rd of portfolio.rdAccounts) {
      const amt = Math.max(0, Number(getRDInvestedAmount(rd)) || 0);
      const age = processDate(rd.start_date) ?? 0;
      weightedTimeSum += amt * (age / 2);
      totalInvested += amt;
    }
  }

  if (portfolio.sipAccounts) {
    for (const sip of portfolio.sipAccounts) {
      const amt = Math.max(0, Number(getSIPInvestedAmount(sip)) || 0);
      const age = processDate(sip.start_date) ?? 0;
      weightedTimeSum += amt * (age / 2);
      totalInvested += amt;
    }
  }

  const holdings = portfolio.holdings || [];
  for (const stock of holdings) {
    const amt = Math.max(0, Number(stock.amountInvested) || 0);
    const age = processDate((stock as { created_at?: string }).created_at) ??
                processDate((stock as { createdAt?: string }).createdAt) ??
                processDate((portfolio as { created_at?: string }).created_at) ??
                processDate((portfolio as { createdAt?: string }).createdAt) ??
                1.0;
    weightedTimeSum += amt * age;
    totalInvested += amt;
  }

  const goldHoldings = portfolio.goldHoldings || [];
  for (const gold of goldHoldings) {
    const amt = Math.max(0, Number(gold.purchase_price) || 0);
    const age = processDate(gold.purchase_date) ?? 1.0;
    weightedTimeSum += amt * age;
    totalInvested += amt;
  }

  const realEstate = portfolio.realEstate || [];
  for (const re of realEstate) {
    const amt = Math.max(0, Number(re.purchase_price) || 0);
    const age = processDate(re.purchase_date) ?? 2.0;
    weightedTimeSum += amt * age;
    totalInvested += amt;
  }

  if (isNaN(totalInvested) || totalInvested <= 0) return 1.0;
  const res = weightedTimeSum / totalInvested;
  return isNaN(res) ? 1.0 : res;
}

export function getPortfolioCashFlows(portfolio: Portfolio, target: CashFlow[] = []): CashFlow[] {
  if (!portfolio) return target;
  const cashflows = target;
  const now = new Date();
  const nowMs = now.getTime();
  const nowStr = formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());

  const addFlow = (dateStr: string | undefined, amount: number) => {
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return;
    const time = parseLocalDate(dateStr);
    const date = isNaN(time) ? nowStr : dateStr!;
    cashflows.push({ date, amount: -amt });
  };

  if (portfolio.fixedDeposits) {
    const fds = portfolio.fixedDeposits;
    const fdsLen = fds.length;
    for (let i = 0; i < fdsLen; i++) {
      addFlow(fds[i].start_date, fds[i].principal_amount);
    }
  }

  if (portfolio.rdAccounts) {
    const rds = portfolio.rdAccounts;
    const rdsLen = rds.length;
    for (let i = 0; i < rdsLen; i++) {
      const rd = rds[i];
      if (rd.contributions && rd.contributions.length > 0) {
        const cLen = rd.contributions.length;
        for (let j = 0; j < cLen; j++) {
          const cDateMs = parseLocalDate(rd.contributions[j].date);
          if (isNaN(cDateMs) || cDateMs <= nowMs) {
            addFlow(rd.contributions[j].date, Number(rd.contributions[j].amount));
          }
        }
      } else {
        const startTime = parseLocalDate(rd.start_date);
        if (isNaN(startTime)) {
          addFlow(rd.start_date, getRDInvestedAmount(rd, now));
          continue;
        }
        const start = new Date(startTime);
        const elapsed = getElapsedMonthsStandard(start, now);
        const monthlyAmount = Number(rd.monthly_deposit);
        const startYear = start.getFullYear();
        const startMonth = start.getMonth();
        const startDay = start.getDate();

        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth();
        const nowDay = now.getDate();

        for (let m = 0; m < elapsed; m++) {
          const targetYear = startYear + Math.floor((startMonth + m) / 12);
          const targetMonth = (startMonth + m) % 12;
          const lastDay = getDaysInMonth(targetYear, targetMonth);
          const clampedDay = Math.min(startDay, lastDay);
          const isBeforeNow = targetYear < nowYear || 
            (targetYear === nowYear && (targetMonth < nowMonth || (targetMonth === nowMonth && clampedDay <= nowDay)));
          if (isBeforeNow) {
            addFlow(formatLocalDate(targetYear, targetMonth, clampedDay), monthlyAmount);
          }
        }
      }
    }
  }

  if (portfolio.sipAccounts) {
    const sips = portfolio.sipAccounts;
    const sipsLen = sips.length;
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();

    for (let i = 0; i < sipsLen; i++) {
      const sip = sips[i];
      const startTime = parseLocalDate(sip.start_date);
      if (isNaN(startTime)) {
        addFlow(sip.start_date, getSIPInvestedAmount(sip, now));
        continue;
      }
      const start = new Date(startTime);
      const elapsed = getElapsedMonthsStandard(start, now);
      const monthlyAmount = Number(sip.monthly_sip);
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const startDay = start.getDate();

      for (let m = 0; m < elapsed; m++) {
        const targetYear = startYear + Math.floor((startMonth + m) / 12);
        const targetMonth = (startMonth + m) % 12;
        const lastDay = getDaysInMonth(targetYear, targetMonth);
        const clampedDay = Math.min(startDay, lastDay);
        const isBeforeNow = targetYear < nowYear || 
          (targetYear === nowYear && (targetMonth < nowMonth || (targetMonth === nowMonth && clampedDay <= nowDay)));
        if (isBeforeNow) {
          addFlow(formatLocalDate(targetYear, targetMonth, clampedDay), monthlyAmount);
        }
      }
    }
  }

  if (portfolio.holdings) {
    const holdings = portfolio.holdings;
    const hLen = holdings.length;
    for (let i = 0; i < hLen; i++) {
      const stock = holdings[i];
      const date = (stock as { created_at?: string }).created_at ||
                   (stock as { createdAt?: string }).createdAt ||
                   (portfolio as { created_at?: string }).created_at ||
                   (portfolio as { createdAt?: string }).createdAt ||
                   nowStr;
      addFlow(date, stock.amountInvested);
    }
  }

  if (portfolio.goldHoldings) {
    for (let i = 0; i < portfolio.goldHoldings.length; i++) {
      const g = portfolio.goldHoldings[i];
      if (!g) continue;
      const inv = Number(g.purchase_price);
      if (isNaN(inv) || inv <= 0) continue;
      const d = g.purchase_date && !isNaN(parseLocalDate(g.purchase_date))
        ? g.purchase_date
        : nowStr;
      cashflows.push({ date: d, amount: -inv });
    }
  }

  if (portfolio.realEstate) {
    for (let i = 0; i < portfolio.realEstate.length; i++) {
      const re = portfolio.realEstate[i];
      if (!re) continue;
      const inv = Number(re.purchase_price);
      if (isNaN(inv) || inv <= 0) continue;
      const d = re.purchase_date && !isNaN(parseLocalDate(re.purchase_date))
        ? re.purchase_date
        : nowStr;
      cashflows.push({ date: d, amount: -inv });
    }
  }

  return cashflows;
}

export function calculatePortfolioXIRR(portfolio: Portfolio): number | null {
  if (!portfolio) return null;

  const cacheKey = getPortfolioCacheKey(portfolio);
  const cached = getFromXirrCache(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const cashflows = getPortfolioCashFlows(portfolio);
  const currentVal = Number(portfolio.totalCurrentValue);
  if (cashflows.length === 0 || isNaN(currentVal) || currentVal <= 0) {
    setInXirrCache(cacheKey, null);
    return null;
  }

  const now = new Date();
  const nowStr = formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
  cashflows.push({ date: nowStr, amount: currentVal });

  const result = calculateXIRR(cashflows);
  const finalVal = typeof result === 'number' && !isNaN(result) ? result : null;

  setInXirrCache(cacheKey, finalVal);
  return finalVal;
}

export function calculateMultiplePortfoliosXIRR(portfolios: Portfolio[]): number | null {
  if (!portfolios || portfolios.length === 0) return null;

  const multiKey = portfolios.map(getPortfolioCacheKey).join('::');
  const cached = getFromXirrCache(multiKey);
  if (cached !== undefined) {
    return cached;
  }

  const cashflows: CashFlow[] = [];
  let totalCurrentValue = 0;

  for (let i = 0; i < portfolios.length; i++) {
    const p = portfolios[i];
    if (!p) continue;
    getPortfolioCashFlows(p, cashflows);
    const val = Number(p.totalCurrentValue);
    if (!isNaN(val) && val > 0) totalCurrentValue += val;
  }

  if (cashflows.length === 0 || totalCurrentValue <= 0) {
    setInXirrCache(multiKey, null);
    return null;
  }

  const now = new Date();
  const nowStr = formatLocalDate(now.getFullYear(), now.getMonth(), now.getDate());
  cashflows.push({ date: nowStr, amount: totalCurrentValue });

  const result = calculateXIRR(cashflows);
  const finalVal = typeof result === 'number' && !isNaN(result) ? result : null;

  setInXirrCache(multiKey, finalVal);
  return finalVal;
}

export function getPortfolioAnnualizedReturn(portfolio: Portfolio): number {
  if (!portfolio) return 0;
  const xirr = calculatePortfolioXIRR(portfolio);
  if (xirr !== null && !isNaN(xirr) && xirr !== 0) return xirr;

  const age = calculateWeightedAge(portfolio);
  const cagr = calculateCAGR(portfolio.totalInvested, portfolio.totalCurrentValue, age);
  if (!isNaN(cagr) && cagr !== 0) return cagr;

  const inv = Number(portfolio.totalInvested) || 0;
  const curr = Number(portfolio.totalCurrentValue) || 0;
  return inv > 0 ? (curr - inv) / inv : 0;
}

export function getMultiplePortfoliosAnnualizedReturn(portfolios: Portfolio[]): number {
  if (!portfolios || portfolios.length === 0) return 0;
  const xirr = calculateMultiplePortfoliosXIRR(portfolios);
  if (xirr !== null && !isNaN(xirr) && xirr !== 0) return xirr;

  let weightedTimeSum = 0;
  let totalInvestedForAge = 0;
  let totalInvested = 0;
  let totalCurrentValue = 0;

  for (let i = 0; i < portfolios.length; i++) {
    const p = portfolios[i];
    if (!p) continue;
    const inv = Math.max(0, Number(p.totalInvested) || 0);
    const curr = Math.max(0, Number(p.totalCurrentValue) || 0);
    const age = calculateWeightedAge(p);

    weightedTimeSum += inv * age;
    totalInvestedForAge += inv;
    totalInvested += inv;
    totalCurrentValue += curr;
  }

  const combinedAge = totalInvestedForAge > 0 ? weightedTimeSum / totalInvestedForAge : 1.0;
  const cagr = calculateCAGR(totalInvested, totalCurrentValue, combinedAge);
  if (!isNaN(cagr) && cagr !== 0) return cagr;

  return totalInvested > 0 ? (totalCurrentValue - totalInvested) / totalInvested : 0;
}
