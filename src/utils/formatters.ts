import { FixedDeposit } from '../types/portfolio';

// ─── SSY Historical Interest Rates (Government-notified) ───
// Maps FY start year → rate (%). FY 2024 means April 2024 – March 2025.
// Source: Ministry of Finance quarterly notifications.
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

/** Returns the SSY rate applicable for a financial year starting at `fyStartYear`. */
export function getSSYRateForFY(fyStartYear: number): number {
  // Exact match
  if (SSY_HISTORICAL_RATES[fyStartYear] !== undefined) {
    return SSY_HISTORICAL_RATES[fyStartYear];
  }
  // Before first known FY – use earliest
  const years = Object.keys(SSY_HISTORICAL_RATES).map(Number).sort((a, b) => a - b);
  if (fyStartYear < years[0]) return SSY_HISTORICAL_RATES[years[0]];
  // After last known FY – use latest
  const latestYear = years[years.length - 1];
  if (fyStartYear > latestYear) return SSY_HISTORICAL_RATES[latestYear];
  // Fallback
  return 8.2;
}

/**
 * Compute SSY maturity amount using correct annual compounding.
 *
 * Rules:
 *  - Deposits are made for the first 15 financial years from account opening.
 *  - Interest compounds annually (credited on 31 March each year).
 *  - The rate for each FY is looked up from SSY_HISTORICAL_RATES.
 *  - If `overrideRate` is provided it overrides the historical lookup.
 *  - Account matures 21 years from account start date.
 *
 * @param startDateStr  ISO date of account opening
 * @param annualDeposit Default annual contribution amount
 * @param contributions Optional array of actual contribution records
 * @param overrideRate  Single fixed rate to use instead of historical rates (optional)
 */
export function calculateSSYMaturityWithRates(
  startDateStr: string,
  annualDeposit: number,
  contributions?: { date: string; amount: number }[],
  overrideRate?: number
): { maturityAmount: number; yearlyBreakdown: { fy: string; fyStartYear: number; deposit: number; interestRate: number; interestEarned: number; closingBalance: number }[] } {
  const accountStart = parseISODateForSSY(startDateStr);
  if (!accountStart) return { maturityAmount: 0, yearlyBreakdown: [] };

  // Find the FY that contains the account start date
  const acctFYStart = getFYStartYear(accountStart);
  const maturityYear = accountStart.getUTCFullYear() + 21;

  let balance = 0;
  const breakdown: { fy: string; fyStartYear: number; deposit: number; interestRate: number; interestEarned: number; closingBalance: number }[] = [];

  for (let fyStart = acctFYStart; fyStart < maturityYear; fyStart++) {
    const fyStartDate = new Date(Date.UTC(fyStart, 3, 1));    // April 1
    const fyEndDate   = new Date(Date.UTC(fyStart + 1, 2, 31)); // March 31
    const fyYear      = fyStart;

    // Contributions happen only in first 15 years
    const depositYear = fyStart - acctFYStart; // 0-indexed
    let deposit = 0;
    if (depositYear < 15) {
      if (contributions && contributions.length > 0) {
        // Sum actual contributions that fall within this FY
        deposit = contributions
          .filter((c) => {
            const d = parseISODateForSSY(c.date);
            if (!d) return false;
            return d.getTime() >= fyStartDate.getTime() && d.getTime() <= fyEndDate.getTime();
          })
          .reduce((s, c) => s + c.amount, 0);
        // If no contributions recorded yet for this future FY, use default
        if (deposit === 0 && fyStartDate.getTime() > Date.now()) {
          deposit = annualDeposit;
        }
      } else {
        deposit = annualDeposit;
      }
    }

    balance += deposit;
    const rate = overrideRate !== undefined ? overrideRate : getSSYRateForFY(fyYear);
    const interest = parseFloat((balance * rate / 100).toFixed(2));
    balance = parseFloat((balance + interest).toFixed(2));

    breakdown.push({
      fy: `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`,
      fyStartYear: fyStart,
      deposit,
      interestRate: rate,
      interestEarned: interest,
      closingBalance: balance,
    });
  }

  return { maturityAmount: balance, yearlyBreakdown: breakdown };
}

/** Parse an ISO date string as UTC (avoids timezone shift issues). */
function parseISODateForSSY(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  return isNaN(d.getTime()) ? null : d;
}

/** Returns the April-start year for the financial year containing `date`. */
function getFYStartYear(date: Date): number {
  const m = date.getUTCMonth(); // 0=Jan … 3=Apr
  return m >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
}

export function formatINR(value: number): string {
  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function pnlColor(value: number): string {
  return value >= 0 ? 'text-emerald-600' : 'text-red-500';
}

export function pnlBg(value: number): string {
  return value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600';
}

export function getDocumentUrl(filePath: string): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  return `${base}/storage/v1/object/public/investment-documents/${filePath}`;
}

/**
 * Compute the future value of a single SSY deposit using annual compounding.
 * SSY interest is credited on 31 March (end of each FY).
 * Within a partial FY (first and last year of accumulation), simple interest is applied pro-rata.
 */
export function getCompoundedDepositValue(amount: number, depositDate: Date, endDate: Date, ratePercent: number): number {
  if (endDate.getTime() <= depositDate.getTime()) return amount;

  const r = ratePercent / 100;
  let balance = amount;
  let currentDate = depositDate;

  // Walk year-by-year until endDate, crediting interest on March 31 each year
  const depositFYStart = getFYStartYear(depositDate);
  const endFYStart = getFYStartYear(endDate);

  for (let fyStart = depositFYStart; fyStart <= endFYStart; fyStart++) {
    const fyEnd = new Date(Date.UTC(fyStart + 1, 2, 31)); // March 31 of next calendar year
    const periodEnd = fyEnd.getTime() < endDate.getTime() ? fyEnd : endDate;
    const msPerYear = 365.25 * 24 * 3600 * 1000;
    const t = (periodEnd.getTime() - currentDate.getTime()) / msPerYear;

    if (periodEnd.getTime() >= endDate.getTime()) {
      // Last (partial) period — simple interest pro-rata
      balance += balance * r * t;
      break;
    } else {
      // Full financial year — simple interest (SSY is annual not compound within year)
      balance += balance * r * t;
      currentDate = new Date(Date.UTC(fyStart + 1, 3, 1)); // April 1 of next FY
    }
  }

  return balance;
}

export function getSSYContributions(f: FixedDeposit, end: Date): { date: string; amount: number }[] {
  if (f.contributions && f.contributions.length > 0) {
    return f.contributions;
  }
  
  const list: { date: string; amount: number }[] = [];
  const start = new Date(f.start_date);
  const p = Number(f.principal_amount);
  
  for (let i = 0; i < 15; i++) {
    const depDate = new Date(start.getFullYear() + i, start.getMonth(), start.getDate());
    if (depDate.getTime() <= end.getTime()) {
      list.push({
        date: depDate.toISOString().split('T')[0],
        amount: p
      });
    }
  }
  return list;
}

export function getFDInvestedAmount(f: FixedDeposit): number {
  if (f.fd_type === 'ssy' && f.contributions && f.contributions.length > 0) {
    return f.contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  }
  return Number(f.principal_amount);
}

export function getSSYMaturityValue(f: FixedDeposit): number {
  if (f.fd_type !== 'ssy') {
    return getFDEffectiveValue(f);
  }
  // Always recalculate using the accurate rate-aware engine so the stored
  // maturity_amount (which may use a single rate) is upgraded if needed.
  const { maturityAmount } = calculateSSYMaturityWithRates(
    f.start_date,
    Number(f.principal_amount),
    f.contributions,
    // Use the stored rate only if it differs from 0 – lets user override
    Number(f.interest_rate) > 0 ? undefined : 8.2
  );
  return maturityAmount > 0 ? maturityAmount : Number(f.maturity_amount) || 0;
}

export function getFDEffectiveValue(f: FixedDeposit, upToDate: Date = new Date()): number {
  const p = Number(f.principal_amount);
  const r = Number(f.interest_rate);
  const s = new Date(f.start_date);
  
  if (f.fd_type === 'sip') {
    return Number(f.maturity_amount);
  }
  
  if (f.status === 'matured') {
    return Number(f.maturity_amount);
  }
  
  const end = f.maturity_date && new Date(f.maturity_date).getTime() < upToDate.getTime()
    ? new Date(f.maturity_date)
    : upToDate;
    
  const timeDiff = end.getTime() - s.getTime();
  const years = timeDiff / (1000 * 3600 * 24 * 365.25);
  
  if (years > 0 && !isNaN(r) && !isNaN(s.getTime())) {
    if (!isNaN(p)) {
      if (f.fd_type === 'ssy') {
        const contributions = getSSYContributions(f, end);
        const totalValue = contributions.reduce((sum, c) => {
          return sum + getCompoundedDepositValue(c.amount, new Date(c.date), end, r);
        }, 0);
        return totalValue;
      }

      if (f.fd_type === 'recurring') {
        // RDs: each monthly installment compounds quarterly from its own deposit date
        const totalMonths = Math.max(1, Math.round(years * 12));
        // Use contributions array if available, otherwise divide principal evenly
        const monthlyAmount = (f.contributions && f.contributions.length > 0)
          ? f.contributions.reduce((sum, c) => sum + c.amount, 0) / f.contributions.length
          : p / totalMonths;
        let total = 0;
        for (let m = 0; m < totalMonths; m++) {
          const remainingYears = (totalMonths - m) / 12;
          total += monthlyAmount * Math.pow(1 + r / 400, 4 * remainingYears);
        }
        return total > 0 ? total : p;
      }

      // FDs compound quarterly
      return p * Math.pow(1 + r / 400, 4 * years);
    }
  }
  return p;
}
