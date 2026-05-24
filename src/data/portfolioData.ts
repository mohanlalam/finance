import { Holding, Portfolio } from '../types/portfolio';

function buildPortfolio(
  name: 'personal' | 'mother' | 'wife',
  label: string,
  holdings: Holding[]
): Portfolio {
  const totalInvested = holdings.reduce((s, h) => s + h.amountInvested, 0);
  const totalCurrentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = (totalPnL / totalInvested) * 100;
  return {
    id: '',
    name,
    label,
    holdings,
    fixedDeposits: [],
    goldHoldings: [],
    realEstate: [],
    insurances: [],
    documents: [],
    totalInvested,
    totalCurrentValue,
    totalPnL,
    totalPnLPercent,
  };
}

const myHoldings: Holding[] = [
  { sno: 1, stockName: 'Kotak Nifty Alpha 50 ETF', ticker: 'ALPHA', yahooSymbol: 'ALPHA.NS', qty: 15266, avgPrice: 47.83, weekLow52: 42.00, weekHigh52: 53.60, ltp: 48.11, amountInvested: 730172.78, unrealizedPnL: 4274.48, pnlPercent: 0.59, todayPnLPercent: -0.37, currentValue: 15266 * 48.11 },
  { sno: 2, stockName: 'Nippon IN ETF Nifty Bank BeES', ticker: 'BANKBEES', yahooSymbol: 'BANKBEES.NS', qty: 1932, avgPrice: 517.5295, weekLow52: 515.98, weekHigh52: 638.99, ltp: 576.69, amountInvested: 999866.994, unrealizedPnL: 114298.09, pnlPercent: 11.43, todayPnLPercent: -0.53, currentValue: 1932 * 576.69 },
  { sno: 3, stockName: 'Greaves Cotton Limited', ticker: 'GREAVESCOT', yahooSymbol: 'GREAVESCOT.NS', qty: 1, avgPrice: 282, weekLow52: 119.99, weekHigh52: 244.30, ltp: 156.66, amountInvested: 282, unrealizedPnL: -125.34, pnlPercent: -44.45, todayPnLPercent: -0.44, currentValue: 1 * 156.66 },
  { sno: 4, stockName: 'ICICI Pru Nifty Healthcare ETF', ticker: 'HEALTHIETF', yahooSymbol: 'HEALTHIETF.NS', qty: 135, avgPrice: 146.9111, weekLow52: 135.43, weekHigh52: 157.19, ltp: 147.51, amountInvested: 19832.9985, unrealizedPnL: 80.85, pnlPercent: 0.41, todayPnLPercent: -0.18, currentValue: 135 * 147.51 },
  { sno: 5, stockName: 'Hero Motocorp Limited', ticker: 'HEROMOTOCO', yahooSymbol: 'HEROMOTOCO.NS', qty: 1, avgPrice: 4940, weekLow52: 3664.30, weekHigh52: 6388.50, ltp: 5146.50, amountInvested: 4940, unrealizedPnL: 206.50, pnlPercent: 4.18, todayPnLPercent: -2.67, currentValue: 1 * 5146.50 },
  { sno: 6, stockName: 'ICICI Prudential Nifty 50 ETF', ticker: 'NIFTYIETF', yahooSymbol: 'NIFTYIETF.NS', qty: 1045, avgPrice: 287, weekLow52: 250.40, weekHigh52: 328.24, ltp: 272.09, amountInvested: 299915, unrealizedPnL: -15580.95, pnlPercent: -5.20, todayPnLPercent: -0.44, currentValue: 1045 * 272.09 },
  { sno: 9, stockName: 'Kaynes Technology India Limited', ticker: 'KAYNES', yahooSymbol: 'KAYNES.NS', qty: 12, avgPrice: 4454, weekLow52: 3294.90, weekHigh52: 7705.00, ltp: 4119.20, amountInvested: 53448, unrealizedPnL: -4017.60, pnlPercent: -7.52, todayPnLPercent: 2.55, currentValue: 12 * 4119.20 },
  { sno: 10, stockName: 'Zerodha Nifty 1D Rate Liq ETF', ticker: 'LIQUIDCASE', yahooSymbol: 'LIQUIDCASE.NS', qty: 1337, avgPrice: 110.42, weekLow52: 102.00, weekHigh52: 113.64, ltp: 113.64, amountInvested: 147631.54, unrealizedPnL: 4305.14, pnlPercent: 2.92, todayPnLPercent: 0.02, currentValue: 1337 * 113.64 },
  { sno: 11, stockName: 'ICICI Nifty200 Momentum 30 ETF', ticker: 'MOM30IETF', yahooSymbol: 'MOM30IETF.NS', qty: 4937, avgPrice: 32.3731, weekLow52: 26.00, weekHigh52: 33.61, ltp: 30.98, amountInvested: 159825.9947, unrealizedPnL: -6877.73, pnlPercent: -4.30, todayPnLPercent: -0.42, currentValue: 4937 * 30.98 },
  { sno: 12, stockName: 'ICICI Pru Nifty Next 50 ETF', ticker: 'NEXT50IETF', yahooSymbol: 'NEXT50IETF.NS', qty: 8423, avgPrice: 70.18, weekLow52: 62.60, weekHigh52: 76.55, ltp: 72.42, amountInvested: 591126.14, unrealizedPnL: 18867.52, pnlPercent: 3.19, todayPnLPercent: 0.33, currentValue: 8423 * 72.42 },
  { sno: 13, stockName: 'NTPC Limited', ticker: 'NTPC', yahooSymbol: 'NTPC.NS', qty: 1, avgPrice: 411.55, weekLow52: 315.55, weekHigh52: 397.25, ltp: 389.30, amountInvested: 411.55, unrealizedPnL: -22.25, pnlPercent: -5.41, todayPnLPercent: -0.84, currentValue: 1 * 389.30 },
  { sno: 14, stockName: 'Reliance Industries Limited', ticker: 'RELIANCE', yahooSymbol: 'RELIANCE.NS', qty: 2, avgPrice: 1600, weekLow52: 1227.60, weekHigh52: 1611.80, ltp: 1333.90, amountInvested: 3200, unrealizedPnL: -532.20, pnlPercent: -16.63, todayPnLPercent: -0.76, currentValue: 2 * 1333.90 },
  { sno: 15, stockName: 'MiraeAs NftSmC250 Mt Ql100 ETF', ticker: 'SMALLCAP', yahooSymbol: 'SMALLCAP.NS', qty: 5084, avgPrice: 46.26, weekLow52: 37.34, weekHigh52: 54.50, ltp: 42.94, amountInvested: 235185.84, unrealizedPnL: -16878.88, pnlPercent: -7.18, todayPnLPercent: 0.56, currentValue: 5084 * 42.94 },
  { sno: 16, stockName: 'Tata Motors Limited', ticker: 'TMCV', yahooSymbol: 'TATAMOTORS.NS', qty: 1, avgPrice: 290.4582, weekLow52: 306.30, weekHigh52: 509.00, ltp: 438.50, amountInvested: 290.4582, unrealizedPnL: 148.04, pnlPercent: 50.97, todayPnLPercent: 0.76, currentValue: 1 * 438.50 },
  { sno: 17, stockName: 'Tata Motors Passenger Vehicles', ticker: 'TMPV', yahooSymbol: 'TATAMTRDVR.NS', qty: 1, avgPrice: 641.9918, weekLow52: 294.30, weekHigh52: 450.40, ltp: 355.25, amountInvested: 641.9918, unrealizedPnL: -286.74, pnlPercent: -44.66, todayPnLPercent: -0.74, currentValue: 1 * 355.25 },
  { sno: 18, stockName: 'Waaree Energies Limited', ticker: 'WAAREEENER', yahooSymbol: 'WAAREEENER.NS', qty: 9, avgPrice: 1503, weekLow52: 2176.20, weekHigh52: 3865.00, ltp: 3420.80, amountInvested: 13527, unrealizedPnL: 17260.20, pnlPercent: 127.60, todayPnLPercent: -0.15, currentValue: 9 * 3420.80 },
];

const motherHoldings: Holding[] = [
  { sno: 1, stockName: 'Motilal Osw Nifty500 Mmt50 ETF', ticker: 'MOMENTUM50', yahooSymbol: 'MOMENTUM50.NS', qty: 6201, avgPrice: 54.92, weekLow52: 44.96, weekHigh52: 56.90, ltp: 50.99, amountInvested: 340558.92, unrealizedPnL: -24369.93, pnlPercent: -7.16, todayPnLPercent: -0.33, currentValue: 6201 * 50.99 },
  { sno: 2, stockName: 'Kotak Nifty Alpha 50 ETF', ticker: 'ALPHA', yahooSymbol: 'ALPHA.NS', qty: 4467, avgPrice: 49.12, weekLow52: 42.00, weekHigh52: 53.60, ltp: 48.11, amountInvested: 219419.04, unrealizedPnL: -4511.67, pnlPercent: -2.06, todayPnLPercent: -0.37, currentValue: 4467 * 48.11 },
  { sno: 3, stockName: 'MiraeAs NftSmC250 Mt Ql100 ETF', ticker: 'SMALLCAP', yahooSymbol: 'SMALLCAP.NS', qty: 2700, avgPrice: 47.09, weekLow52: 37.34, weekHigh52: 54.50, ltp: 42.94, amountInvested: 127143, unrealizedPnL: -11205.00, pnlPercent: -8.81, todayPnLPercent: 0.56, currentValue: 2700 * 42.94 },
  { sno: 4, stockName: 'Nippon India Nifty Pharma ETF', ticker: 'PHARMABEES', yahooSymbol: 'PHARMABEES.NS', qty: 2000, avgPrice: 21.3, weekLow52: 20.59, weekHigh52: 26.52, ltp: 23.01, amountInvested: 42600, unrealizedPnL: 3420.00, pnlPercent: 8.03, todayPnLPercent: -0.17, currentValue: 2000 * 23.01 },
  { sno: 5, stockName: 'ICICI Nifty200 Momentum 30 ETF', ticker: 'MOM30IETF', yahooSymbol: 'MOM30IETF.NS', qty: 900, avgPrice: 33.58, weekLow52: 26.00, weekHigh52: 33.61, ltp: 30.98, amountInvested: 30222, unrealizedPnL: -2340.00, pnlPercent: -7.74, todayPnLPercent: -0.42, currentValue: 900 * 30.98 },
  { sno: 6, stockName: 'Nippon India ETF Nifty 50 BeES', ticker: 'NIFTYBEES', yahooSymbol: 'NIFTYBEES.NS', qty: 133, avgPrice: 261.4, weekLow52: 251.70, weekHigh52: 302.25, ltp: 273.35, amountInvested: 34766.2, unrealizedPnL: 1589.35, pnlPercent: 4.57, todayPnLPercent: -0.15, currentValue: 133 * 273.35 },
  { sno: 8, stockName: 'Nippon ETF Nifty Next 50 Jr BeES', ticker: 'JUNIORBEES', yahooSymbol: 'JUNIORBEES.NS', qty: 10, avgPrice: 617, weekLow52: 632.34, weekHigh52: 777.00, ltp: 741.33, amountInvested: 6170, unrealizedPnL: 1243.30, pnlPercent: 20.15, todayPnLPercent: 0.37, currentValue: 10 * 741.33 },
  { sno: 10, stockName: 'NTPC Limited', ticker: 'NTPC', yahooSymbol: 'NTPC.NS', qty: 1, avgPrice: 424, weekLow52: 315.55, weekHigh52: 397.20, ltp: 389.30, amountInvested: 424, unrealizedPnL: -34.70, pnlPercent: -8.18, todayPnLPercent: -0.85, currentValue: 1 * 389.30 },
];

const wifeHoldings: Holding[] = [
  { sno: 1, stockName: 'Power Grid Corporation of India', ticker: 'POWERGRID', yahooSymbol: 'POWERGRID.NS', qty: 5, avgPrice: 267.6, weekLow52: 250.00, weekHigh52: 322.00, ltp: 311.55, amountInvested: 1338, unrealizedPnL: 219.75, pnlPercent: 16.42, todayPnLPercent: -0.29, currentValue: 5 * 311.55 },
  { sno: 2, stockName: 'Zerodha Nifty Midcap 150 ETF', ticker: 'MID150CASE', yahooSymbol: 'MID150CASE.NS', qty: 11080, avgPrice: 11.05, weekLow52: 9.31, weekHigh52: 12.00, ltp: 10.84, amountInvested: 122434, unrealizedPnL: -2326.80, pnlPercent: -1.90, todayPnLPercent: 0.28, currentValue: 11080 * 10.84 },
  { sno: 3, stockName: 'Anant Raj Limited', ticker: 'ANANTRAJ', yahooSymbol: 'ANANTRAJ.NS', qty: 100, avgPrice: 500, weekLow52: 403.00, weekHigh52: 743.65, ltp: 504.95, amountInvested: 50000, unrealizedPnL: 495.00, pnlPercent: 0.99, todayPnLPercent: 0.32, currentValue: 100 * 504.95 },
  { sno: 4, stockName: 'Tata Gold ETF', ticker: 'TATAGOLD', yahooSymbol: 'TATAGOLD.NS', qty: 11945, avgPrice: 16.99, weekLow52: 8.00, weekHigh52: 17.70, ltp: 14.73, amountInvested: 202945.55, unrealizedPnL: -26995.70, pnlPercent: -13.30, todayPnLPercent: 0.27, currentValue: 11945 * 14.73 },
];

export const personalPortfolio = buildPortfolio('personal', 'My Portfolio', myHoldings);
export const motherPortfolio = buildPortfolio('mother', "Mother's Portfolio", motherHoldings);
export const wifePortfolio = buildPortfolio('wife', "Wife's Portfolio", wifeHoldings);

export const allPortfolios: Portfolio[] = [personalPortfolio, motherPortfolio, wifePortfolio];

export const familyTotals = {
  totalInvested: allPortfolios.reduce((s, p) => s + p.totalInvested, 0),
  totalCurrentValue: allPortfolios.reduce((s, p) => s + p.totalCurrentValue, 0),
  totalPnL: allPortfolios.reduce((s, p) => s + p.totalPnL, 0),
  get totalPnLPercent() {
    return (this.totalPnL / this.totalInvested) * 100;
  },
};
