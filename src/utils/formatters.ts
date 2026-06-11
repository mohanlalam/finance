import { FixedDeposit } from '../types/portfolio';
import { compoundValue } from './mathUtils';



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

export function getFDInvestedAmount(f: FixedDeposit): number {
  return Number(f.principal_amount);
}

export function getFDEffectiveValue(f: FixedDeposit, upToDate: Date = new Date()): number {
  const p = Number(f.principal_amount);
  const r = Number(f.interest_rate);
  const s = new Date(f.start_date);
  
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
      // FDs compound half-yearly
      return compoundValue(p, r, 2, years);
    }
  }
  return p;
}

export function formatINRCompact(value: number): string {
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absVal >= 10000000) return `${sign}₹${(absVal / 10000000).toFixed(2)}Cr`;
  if (absVal >= 100000) return `${sign}₹${(absVal / 100000).toFixed(2)}L`;
  return `${sign}₹${Math.round(absVal).toLocaleString('en-IN')}`;
}

