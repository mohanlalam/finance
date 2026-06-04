import { SSYAccount } from '../types/portfolio';

// ─── SSY Historical Interest Rates (Government-notified) ───
// Maps FY start year → rate (%). FY 2024 means April 2024 – March 2025.
export const SSY_HISTORICAL_RATES: Record<number, number> = {
  2014: 9.1,
  2015: 9.2,
  2016: 8.6,
  2017: 8.3,
  2018: 8.1,
  2019: 8.4,
  2020: 7.6,
  2021: 7.6,
  2022: 7.6,
  2023: 8.0,
  2024: 8.2,
  2025: 8.2,
};

export const SSY_MAX_FY_DEPOSIT = 150000;
export const SSY_MIN_FY_DEPOSIT = 250;

/** Returns the SSY rate applicable for a given FY, checking overrides first. */
export function getSSYRateForFY(
  fyStartYear: number,
  rateSchedule?: { fyStartYear: number; rate: number }[]
): number {
  if (rateSchedule && rateSchedule.length > 0) {
    const override = rateSchedule.find((r) => r.fyStartYear === fyStartYear);
    if (override !== undefined) return override.rate;
  }
  if (SSY_HISTORICAL_RATES[fyStartYear] !== undefined) {
    return SSY_HISTORICAL_RATES[fyStartYear];
  }
  const years = Object.keys(SSY_HISTORICAL_RATES).map(Number).sort((a, b) => a - b);
  if (fyStartYear < years[0]) return SSY_HISTORICAL_RATES[years[0]];
  const latestYear = years[years.length - 1];
  if (fyStartYear > latestYear) return SSY_HISTORICAL_RATES[latestYear];
  return 8.2;
}

/** Parse an ISO date string as UTC (avoids timezone shift issues). */
export function parseISODateUTC(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  return isNaN(d.getTime()) ? null : d;
}

/** Returns the April-start year for the financial year containing `date`. */
export function getFYStartYear(date: Date): number {
  const m = date.getUTCMonth(); // 0=Jan … 3=Apr
  return m >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
}

/**
 * Compute SSY maturity using correct annual compounding.
 *
 * Rules (per scheme):
 *  - Deposits: first 15 FYs from account-opening FY, capped at ₹1.5L/FY.
 *  - Interest: credited annually on 31 March for all 21 years.
 *  - Rate per FY: from rateSchedule overrides → SSY_HISTORICAL_RATES → futureRate fallback.
 */
export function calculateSSYMaturityWithRates(
  startDateStr: string,
  annualDeposit: number,
  contributions?: { date: string; amount: number }[],
  rateSchedule?: { fyStartYear: number; rate: number }[],
  futureRate?: number
): {
  maturityAmount: number;
  yearlyBreakdown: {
    fy: string;
    fyStartYear: number;
    deposit: number;
    actualDeposit: number;   // raw sum from contributions (may exceed cap)
    depositCapped: boolean;  // true if actual > SSY_MAX
    interestRate: number;
    interestEarned: number;
    closingBalance: number;
    isFuture: boolean;
  }[];
} {
  const accountStart = parseISODateUTC(startDateStr);
  if (!accountStart) return { maturityAmount: 0, yearlyBreakdown: [] };

  const acctFYStart = getFYStartYear(accountStart);
  const maturityYear = accountStart.getUTCFullYear() + 21;
  const nowMs = Date.now();

  let balance = 0;
  const breakdown: ReturnType<typeof calculateSSYMaturityWithRates>['yearlyBreakdown'] = [];

  for (let fyStart = acctFYStart; fyStart < maturityYear; fyStart++) {
    const fyStartDate = new Date(Date.UTC(fyStart, 3, 1));    // April 1
    const fyEndDate   = new Date(Date.UTC(fyStart + 1, 2, 31)); // March 31
    const depositYear = fyStart - acctFYStart;                 // 0-indexed
    const isFutureFY  = fyStartDate.getTime() > nowMs;

    let rawDeposit = 0;
    let deposit = 0;
    let depositCapped = false;

    if (depositYear < 15) {
      if (contributions && contributions.length > 0) {
        rawDeposit = contributions
          .filter((c) => {
            const d = parseISODateUTC(c.date);
            if (!d) return false;
            return d.getTime() >= fyStartDate.getTime() && d.getTime() <= fyEndDate.getTime();
          })
          .reduce((s, c) => s + c.amount, 0);

        if (rawDeposit === 0 && isFutureFY) {
          rawDeposit = annualDeposit;
        }

        if (rawDeposit > SSY_MAX_FY_DEPOSIT) {
          deposit = SSY_MAX_FY_DEPOSIT;
          depositCapped = true;
        } else {
          deposit = rawDeposit;
        }
      } else {
        rawDeposit = annualDeposit;
        deposit = Math.min(annualDeposit, SSY_MAX_FY_DEPOSIT);
        depositCapped = annualDeposit > SSY_MAX_FY_DEPOSIT;
      }
    }

    balance += deposit;

    let rate: number;
    if (rateSchedule && rateSchedule.length > 0) {
      const override = rateSchedule.find((r) => r.fyStartYear === fyStart);
      if (override !== undefined) {
        rate = override.rate;
      } else {
        rate = SSY_HISTORICAL_RATES[fyStart] !== undefined
          ? SSY_HISTORICAL_RATES[fyStart]
          : (futureRate ?? 8.2);
      }
    } else {
      rate = SSY_HISTORICAL_RATES[fyStart] !== undefined
        ? SSY_HISTORICAL_RATES[fyStart]
        : (futureRate ?? 8.2);
    }

    const interest = parseFloat((balance * rate / 100).toFixed(2));
    balance = parseFloat((balance + interest).toFixed(2));

    breakdown.push({
      fy: `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`,
      fyStartYear: fyStart,
      deposit,
      actualDeposit: rawDeposit,
      depositCapped,
      interestRate: rate,
      interestEarned: interest,
      closingBalance: balance,
      isFuture: isFutureFY,
    });
  }

  return { maturityAmount: balance, yearlyBreakdown: breakdown };
}

/**
 * Compute the future value of a single SSY deposit using annual compounding.
 * SSY interest is credited on 31 March (end of each FY).
 */
export function getCompoundedDepositValue(
  amount: number,
  depositDate: Date,
  endDate: Date,
  ratePercent: number
): number {
  if (endDate.getTime() <= depositDate.getTime()) return amount;

  const r = ratePercent / 100;
  let balance = amount;
  let currentDate = depositDate;

  const depositFYStart = getFYStartYear(depositDate);
  const endFYStart = getFYStartYear(endDate);

  for (let fyStart = depositFYStart; fyStart <= endFYStart; fyStart++) {
    const fyEnd = new Date(Date.UTC(fyStart + 1, 2, 31)); // March 31
    const periodEnd = fyEnd.getTime() < endDate.getTime() ? fyEnd : endDate;
    const msPerYear = 365.25 * 24 * 3600 * 1000;
    const t = (periodEnd.getTime() - currentDate.getTime()) / msPerYear;

    const isFullFY = (currentDate.getUTCMonth() === 3 && currentDate.getUTCDate() === 1 && periodEnd.getUTCMonth() === 2 && periodEnd.getUTCDate() === 31) ||
                     (currentDate.getUTCMonth() === 2 && currentDate.getUTCDate() === 31 && periodEnd.getUTCMonth() === 2 && periodEnd.getUTCDate() === 31);
    const actualT = isFullFY ? 1.0 : t;

    if (periodEnd.getTime() >= endDate.getTime()) {
      balance += balance * r * actualT;
      break;
    } else {
      balance += balance * r * actualT;
      currentDate = periodEnd;
    }
  }

  return balance;
}

export function getSSYContributions(account: SSYAccount, end: Date): { date: string; amount: number }[] {
  if (account.contributions && account.contributions.length > 0) {
    return account.contributions;
  }
  
  const list: { date: string; amount: number }[] = [];
  const start = parseISODateUTC(account.start_date);
  if (!start) return [];
  const p = Number(account.annual_deposit);
  
  for (let i = 0; i < 15; i++) {
    const depDate = new Date(Date.UTC(start.getUTCFullYear() + i, start.getUTCMonth(), start.getUTCDate()));
    if (depDate.getTime() <= end.getTime()) {
      list.push({
        date: depDate.toISOString().split('T')[0],
        amount: p
      });
    }
  }
  return list;
}

/**
 * Returns the total amount actually invested in an SSY account.
 */
export function getSSYInvestedAmount(account: SSYAccount): number {
  if (account.contributions && account.contributions.length > 0) {
    const fyTotals: Record<number, number> = {};
    for (const c of account.contributions) {
      const d = parseISODateUTC(c.date);
      if (!d || isNaN(d.getTime())) continue;
      const m = d.getUTCMonth();
      const fyStartYear = m >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
      fyTotals[fyStartYear] = (fyTotals[fyStartYear] ?? 0) + c.amount;
    }
    return Object.values(fyTotals)
      .reduce((sum, amt) => sum + Math.min(amt, SSY_MAX_FY_DEPOSIT), 0);
  }
  return 0;
}

/**
 * Returns current accrued valuation of an SSY account.
 */
export function getSSYEffectiveValue(account: SSYAccount, upToDate: Date = new Date()): number {
  const p = Number(account.annual_deposit);
  const r = Number(account.interest_rate);
  const s = parseISODateUTC(account.start_date);
  if (!s) return p;
  
  if (account.status === 'matured') {
    return Number(account.maturity_amount);
  }
  
  const maturityDate = parseISODateUTC(account.maturity_date);
  const end = maturityDate && maturityDate.getTime() < upToDate.getTime()
    ? maturityDate
    : upToDate;
     
  const timeDiff = end.getTime() - s.getTime();
  const years = timeDiff / (1000 * 3600 * 24 * 365.25);
  
  if (years > 0 && !isNaN(r) && !isNaN(s.getTime())) {
    const contributions = getSSYContributions(account, end);
    const totalValue = contributions.reduce((sum, c) => {
      const depDate = parseISODateUTC(c.date);
      if (!depDate) return sum;
      return sum + getCompoundedDepositValue(c.amount, depDate, end, r);
    }, 0);
    return totalValue;
  }
  return p;
}

export function getSSYMaturityValue(account: SSYAccount): number {
  const { maturityAmount } = calculateSSYMaturityWithRates(
    account.start_date,
    Number(account.annual_deposit),
    account.contributions,
    account.rate_schedule,
    Number(account.interest_rate) > 0 ? Number(account.interest_rate) : 8.2
  );
  return maturityAmount > 0 ? maturityAmount : Number(account.maturity_amount) || 0;
}
