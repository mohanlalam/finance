import { FixedDeposit } from '../types/portfolio';

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

export function getCompoundedDepositValue(amount: number, depositDate: Date, endDate: Date, ratePercent: number): number {
  if (endDate.getTime() <= depositDate.getTime()) return amount;
  
  const r = ratePercent / 100;
  const startYear = depositDate.getUTCFullYear();
  const endYear = endDate.getUTCFullYear();
  const aprilFirsts: Date[] = [];
  
  for (let y = startYear - 1; y <= endYear + 1; y++) {
    const april1 = new Date(Date.UTC(y, 3, 1));
    if (april1.getTime() > depositDate.getTime() && april1.getTime() <= endDate.getTime()) {
      aprilFirsts.push(april1);
    }
  }
  
  aprilFirsts.sort((a, b) => a.getTime() - b.getTime());
  
  const millisecondsPerYear = 1000 * 3600 * 24 * 365.25;
  let balance = amount;
  let currentDate = depositDate;
  
  for (const april1 of aprilFirsts) {
    const t = (april1.getTime() - currentDate.getTime()) / millisecondsPerYear;
    const interest = balance * r * t;
    balance += interest;
    currentDate = april1;
  }
  
  const finalT = (endDate.getTime() - currentDate.getTime()) / millisecondsPerYear;
  const finalInterest = balance * r * finalT;
  return balance + finalInterest;
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
  if (Number(f.maturity_amount) > 0) {
    return Number(f.maturity_amount);
  }
  if (f.maturity_date) {
    return getFDEffectiveValue(f, new Date(f.maturity_date));
  }
  return getFDEffectiveValue(f);
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
