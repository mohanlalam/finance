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
  const maturityDate = new Date(Date.UTC(accountStart.getUTCFullYear() + 21, accountStart.getUTCMonth(), accountStart.getUTCDate()));
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
    let fyContributions: { date: string; amount: number }[] = [];

    if (depositYear < 15) {
      if (contributions && contributions.length > 0) {
        fyContributions = contributions.filter((c) => {
          const d = parseISODateUTC(c.date);
          if (!d) return false;
          return d.getTime() >= fyStartDate.getTime() && d.getTime() <= fyEndDate.getTime();
        });
        rawDeposit = fyContributions.reduce((s, c) => s + c.amount, 0);

        if (rawDeposit === 0 && isFutureFY) {
          rawDeposit = annualDeposit;
          fyContributions = [{ date: `${fyStart}-04-01`, amount: annualDeposit }];
        }
      } else {
        rawDeposit = annualDeposit;
        fyContributions = [{ date: `${fyStart}-04-01`, amount: annualDeposit }];
      }

      // Sort and cap contributions chronologically
      const sortedFyContribs = [...fyContributions].sort(
        (a, b) => (parseISODateUTC(a.date)?.getTime() ?? 0) - (parseISODateUTC(b.date)?.getTime() ?? 0)
      );

      let runningTotal = 0;
      const cappedFyContribs = sortedFyContribs.map((c) => {
        const remaining = SSY_MAX_FY_DEPOSIT - runningTotal;
        const allowed = Math.max(0, Math.min(c.amount, remaining));
        runningTotal += allowed;
        return { date: c.date, amount: allowed };
      });

      deposit = runningTotal;
      depositCapped = rawDeposit > SSY_MAX_FY_DEPOSIT;
      fyContributions = cappedFyContribs;
    }

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

    // Month-by-month interest calculation
    // Monthly interest is based on the lowest balance between the 5th day and the end of the month
    // Meaning deposits made on or before 5th of month 'm' earn interest for month 'm'
    let yearInterestSum = 0;
    for (let m = 0; m < 12; m++) {
      const calYear = m < 9 ? fyStart : fyStart + 1;
      const calMonth = m < 9 ? m + 3 : m - 9;
      
      const monthStart = new Date(Date.UTC(calYear, calMonth, 1));
      if (monthStart.getTime() > maturityDate.getTime()) {
        continue;
      }

      // Cutoff date is the 5th of that month
      const cutoff = new Date(Date.UTC(calYear, calMonth, 5, 23, 59, 59));

      // Sum deposits made in this FY on or before this cutoff
      const depositsBeforeCutoff = fyContributions
        .filter((c) => {
          const d = parseISODateUTC(c.date);
          if (!d) return false;
          return d.getTime() <= cutoff.getTime();
        })
        .reduce((sum, c) => sum + c.amount, 0);

      const balanceForMonth = balance + depositsBeforeCutoff;
      const monthlyInterest = balanceForMonth * (rate / 12 / 100);
      yearInterestSum += monthlyInterest;
    }

    const interest = parseFloat(yearInterestSum.toFixed(2));
    balance = parseFloat((balance + deposit + interest).toFixed(2));

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
  const contributions = getSSYContributions(account, new Date());
  const fyTotals: Record<number, number> = {};
  for (const c of contributions) {
    const d = parseISODateUTC(c.date);
    if (!d || isNaN(d.getTime())) continue;
    const m = d.getUTCMonth();
    const fyStartYear = m >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
    fyTotals[fyStartYear] = (fyTotals[fyStartYear] ?? 0) + c.amount;
  }
  return Object.values(fyTotals)
    .reduce((sum, amt) => sum + Math.min(amt, SSY_MAX_FY_DEPOSIT), 0);
}

/**
 * Returns current accrued valuation of an SSY account.
 */
export function getSSYEffectiveValue(account: SSYAccount, upToDate: Date = new Date()): number {
  const start = parseISODateUTC(account.start_date);
  if (!start) return Number(account.annual_deposit);

  if (account.status === 'matured') {
    return Number(account.maturity_amount);
  }

  // Run the full financial year growth simulation
  const { yearlyBreakdown } = calculateSSYMaturityWithRates(
    account.start_date,
    Number(account.annual_deposit),
    account.contributions,
    account.rate_schedule,
    Number(account.interest_rate) > 0 ? Number(account.interest_rate) : 8.2
  );

  if (yearlyBreakdown.length === 0) {
    return Number(account.annual_deposit);
  }

  const evalFYStartYear = getFYStartYear(upToDate);
  const acctFYStart = getFYStartYear(start);
  const maturityYear = start.getUTCFullYear() + 21;

  if (evalFYStartYear < acctFYStart) {
    return 0;
  }

  if (evalFYStartYear >= maturityYear) {
    return yearlyBreakdown[yearlyBreakdown.length - 1].closingBalance;
  }

  const idx = evalFYStartYear - acctFYStart;
  if (idx < 0 || idx >= yearlyBreakdown.length) {
    return Number(account.annual_deposit);
  }

  const row = yearlyBreakdown[idx];
  const lastClosingBalance = idx > 0 ? yearlyBreakdown[idx - 1].closingBalance : 0;

  const fyStartDate = new Date(Date.UTC(row.fyStartYear, 3, 1));
  const isFutureRelToEval = fyStartDate.getTime() > upToDate.getTime();

  let deposits = 0;
  if (isFutureRelToEval || !account.contributions || account.contributions.length === 0) {
    deposits = row.deposit;
  } else {
    deposits = (account.contributions || [])
      .filter((c) => {
        const d = parseISODateUTC(c.date);
        if (!d) return false;
        return d.getTime() >= fyStartDate.getTime() && d.getTime() <= upToDate.getTime();
      })
      .reduce((sum, c) => sum + c.amount, 0);
    deposits = Math.min(deposits, SSY_MAX_FY_DEPOSIT);
  }

  const elapsedMs = Math.max(0, upToDate.getTime() - fyStartDate.getTime());
  const isFullFY = (upToDate.getUTCMonth() === 2 && upToDate.getUTCDate() === 31) ||
                   (upToDate.getMonth() === 2 && upToDate.getDate() === 31);
  const fraction = isFullFY ? 1.0 : elapsedMs / (365.25 * 24 * 3600 * 1000);
  const rate = row.interestRate;

  const interest = (lastClosingBalance + deposits) * (rate / 100) * Math.min(1.0, fraction);
  return parseFloat((lastClosingBalance + deposits + interest).toFixed(2));
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
