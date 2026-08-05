export interface BenchmarkReturn {
  period: string;
  nifty50: number;
  sensex: number;
  fd: number;
}

const BENCHMARK_DATA: Record<string, BenchmarkReturn> = {
  '1M': { period: '1M', nifty50: 1.2, sensex: 1.1, fd: 7.0 / 12 },
  '3M': { period: '3M', nifty50: 4.5, sensex: 4.3, fd: 7.0 / 4 },
  '6M': { period: '6M', nifty50: 8.2, sensex: 7.9, fd: 7.0 / 2 },
  '1Y': { period: '1Y', nifty50: 15.4, sensex: 14.8, fd: 7.0 },
  'ALL': { period: 'ALL', nifty50: 22.1, sensex: 21.5, fd: 7.0 }, // using 1Y fd for ALL for simplicity
};

export function getBenchmarkReturns(period: string): BenchmarkReturn {
  return BENCHMARK_DATA[period] || BENCHMARK_DATA['1Y'];
}

export function calculateDelta(portfolioReturn: number, benchmarkReturn: number): number {
  return portfolioReturn - benchmarkReturn;
}
