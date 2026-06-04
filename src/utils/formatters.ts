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
        // SSY interest compounds on every April 1st (end of Indian financial year)
        const rate = r / 100;
        const startYear = s.getUTCFullYear();
        const endYear = end.getUTCFullYear();
        const aprilFirsts: Date[] = [];
        
        for (let year = startYear - 1; year <= endYear + 1; year++) {
          const april1 = new Date(Date.UTC(year, 3, 1));
          if (april1.getTime() > s.getTime() && april1.getTime() <= end.getTime()) {
            aprilFirsts.push(april1);
          }
        }
        
        aprilFirsts.sort((a, b) => a.getTime() - b.getTime());
        
        let currentPrincipal = p;
        let currentDate = s;
        const millisecondsPerYear = 1000 * 3600 * 24 * 365.25;
        
        for (const april1 of aprilFirsts) {
          const t = (april1.getTime() - currentDate.getTime()) / millisecondsPerYear;
          const interest = currentPrincipal * rate * t;
          currentPrincipal += interest;
          currentDate = april1;
        }
        
        const finalT = (end.getTime() - currentDate.getTime()) / millisecondsPerYear;
        const finalInterest = currentPrincipal * rate * finalT;
        
        return currentPrincipal + finalInterest;
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
