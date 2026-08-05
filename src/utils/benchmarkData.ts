export interface BenchmarkReturn {
  period: string;
  nifty50: number;
  sensex: number;
  fd: number;
}

export const BENCHMARK_LAST_UPDATED = 'Aug 2025';

const ANNUAL_RATES = {
  nifty50: 15.0,
  sensex: 14.2,
  fd: 7.0
};

const calcReturn = (annualRate: number, months: number) => {
  return (Math.pow(1 + annualRate / 100, months / 12) - 1) * 100;
};

const BENCHMARK_DATA: Record<string, BenchmarkReturn> = {
  '1M': { period: '1M', nifty50: calcReturn(ANNUAL_RATES.nifty50, 1), sensex: calcReturn(ANNUAL_RATES.sensex, 1), fd: calcReturn(ANNUAL_RATES.fd, 1) },
  '3M': { period: '3M', nifty50: calcReturn(ANNUAL_RATES.nifty50, 3), sensex: calcReturn(ANNUAL_RATES.sensex, 3), fd: calcReturn(ANNUAL_RATES.fd, 3) },
  '6M': { period: '6M', nifty50: calcReturn(ANNUAL_RATES.nifty50, 6), sensex: calcReturn(ANNUAL_RATES.sensex, 6), fd: calcReturn(ANNUAL_RATES.fd, 6) },
  '1Y': { period: '1Y', nifty50: calcReturn(ANNUAL_RATES.nifty50, 12), sensex: calcReturn(ANNUAL_RATES.sensex, 12), fd: calcReturn(ANNUAL_RATES.fd, 12) },
  'ALL': { period: 'ALL', nifty50: calcReturn(ANNUAL_RATES.nifty50, 24), sensex: calcReturn(ANNUAL_RATES.sensex, 24), fd: calcReturn(ANNUAL_RATES.fd, 24) },
};

export function getBenchmarkReturns(period: string): BenchmarkReturn {
  return BENCHMARK_DATA[period] || BENCHMARK_DATA['1Y'];
}

export function calculateDelta(portfolioReturn: number, benchmarkReturn: number): number {
  return portfolioReturn - benchmarkReturn;
}
