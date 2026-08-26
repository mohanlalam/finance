



export function formatINR(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absVal = Math.abs(value);
  if (absVal >= 10000000) {
    return `${sign}₹${(absVal / 10000000).toFixed(2)}Cr`;
  }
  if (absVal >= 100000) {
    return `${sign}₹${(absVal / 100000).toFixed(2)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatFullINR(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
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

export {
  getFDInvestedAmount,
  getFDEffectiveValue,
  calculateFDEffectiveValue,
  calculateFDMaturityValue,
} from '../domains/assets/fd/calculations/fdCompounding';

export function formatINRCompact(value: number): string {
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absVal >= 10000000) return `${sign}₹${(absVal / 10000000).toFixed(2)}Cr`;
  if (absVal >= 100000) return `${sign}₹${(absVal / 100000).toFixed(2)}L`;
  return `${sign}₹${Math.round(absVal).toLocaleString('en-IN')}`;
}

