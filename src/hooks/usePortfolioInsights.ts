import { useMemo } from 'react';
import { Portfolio, Holding, FixedDeposit, Insurance } from '../types/portfolio';
import { getFDEffectiveValue } from '../utils/formatters';

/* ── Allocation Targets ── */

export interface AllocationTargets {
  stocks: number;
  fd: number;
  gold: number;
  realEstate: number;
}

export const DEFAULT_ALLOCATION_TARGETS: AllocationTargets = {
  stocks: 60,
  fd: 20,
  gold: 10,
  realEstate: 10,
};

export const ALLOCATION_TARGETS_KEY = 'finance_allocation_targets';

export function getAllocationTargets(): AllocationTargets {
  try {
    const stored = localStorage.getItem(ALLOCATION_TARGETS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AllocationTargets>;
      const t: AllocationTargets = {
        stocks: typeof parsed.stocks === 'number' ? parsed.stocks : DEFAULT_ALLOCATION_TARGETS.stocks,
        fd: typeof parsed.fd === 'number' ? parsed.fd : DEFAULT_ALLOCATION_TARGETS.fd,
        gold: typeof parsed.gold === 'number' ? parsed.gold : DEFAULT_ALLOCATION_TARGETS.gold,
        realEstate: typeof parsed.realEstate === 'number' ? parsed.realEstate : DEFAULT_ALLOCATION_TARGETS.realEstate,
      };
      return t;
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_ALLOCATION_TARGETS };
}

/* ── Alert / Insight types ── */

export interface HoldingInsight {
  holding: Holding;
  portfolioLabel: string;
  portfolioName: string;
}

export interface AllocationSlice {
  label: string;
  actual: number;   // percentage 0–100
  target: number;   // percentage 0–100
  drift: number;    // actual − target
  value: number;
}

export interface ConcentrationWarning {
  ticker: string;
  stockName: string;
  pct: number;
  portfolioLabel: string;
}

export interface FDMaturityAlert {
  fd: FixedDeposit;
  daysLeft: number;
  portfolioLabel: string;
}

export interface InsuranceRenewalAlert {
  insurance: Insurance;
  daysLeft: number;
  portfolioLabel: string;
}

export interface PortfolioBestWorst {
  portfolioLabel: string;
  best: Holding | null;
  worst: Holding | null;
}

export interface HealthScoreBreakdown {
  diversification: number;   // 0–25
  assetBalance: number;      // 0–25
  concentration: number;     // 0–25
  insuranceCoverage: number; // 0–25
  total: number;             // 0–100
}

export interface PortfolioInsights {
  topByValue: HoldingInsight[];
  topGainers: HoldingInsight[];
  topLosers: HoldingInsight[];
  biggestMover: HoldingInsight | null;
  allocationSlices: AllocationSlice[];
  concentrationWarnings: ConcentrationWarning[];
  fdMaturityAlerts: FDMaturityAlert[];
  insuranceRenewalAlerts: InsuranceRenewalAlert[];
  portfolioBestWorst: PortfolioBestWorst[];
  healthScore: HealthScoreBreakdown;
}

/* ── Helpers ── */

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (1000 * 3600 * 24));
}

function allHoldingsWithMeta(portfolios: Portfolio[]): HoldingInsight[] {
  return portfolios.flatMap((p) =>
    p.holdings.map((h) => ({ holding: h, portfolioLabel: p.label, portfolioName: p.name }))
  );
}

const TARGET_ALLOCATION = getAllocationTargets();

/* ── Score calculators ── */

function calcDiversification(allHoldings: Holding[]): number {
  const n = allHoldings.length;
  if (n === 0) return 0;
  if (n >= 15) return 25;
  if (n >= 10) return 22;
  if (n >= 5) return 18;
  if (n >= 3) return 12;
  return 5;
}

function calcAssetBalance(slices: AllocationSlice[]): number {
  if (slices.every((s) => s.value === 0)) return 0;
  const totalDrift = slices.reduce((s, sl) => s + Math.abs(sl.drift), 0);
  // totalDrift can be 0–200 (sum of abs drifts). Lower is better.
  if (totalDrift <= 20) return 25;
  if (totalDrift <= 40) return 20;
  if (totalDrift <= 60) return 15;
  if (totalDrift <= 100) return 10;
  return 5;
}

function calcConcentration(allHoldings: Holding[]): number {
  if (allHoldings.length === 0) return 0;
  const totalEquity = allHoldings.reduce((s, h) => s + h.currentValue, 0);
  if (totalEquity === 0) return 25;

  const sorted = [...allHoldings].sort((a, b) => b.currentValue - a.currentValue);
  const topPct = (sorted[0].currentValue / totalEquity) * 100;
  const top3Pct = sorted.slice(0, 3).reduce((s, h) => s + h.currentValue, 0) / totalEquity * 100;

  let score = 25;
  if (topPct > 30) score -= 12;
  else if (topPct > 20) score -= 8;
  else if (topPct > 15) score -= 4;

  if (top3Pct > 60) score -= 8;
  else if (top3Pct > 50) score -= 4;

  return Math.max(score, 0);
}

function calcInsuranceCoverage(portfolios: Portfolio[]): number {
  const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0);
  const totalCoverage = portfolios.reduce(
    (s, p) => s + p.insurances.reduce((a, i) => a + Number(i.sum_assured), 0),
    0
  );

  if (totalInvested === 0) return 0;
  if (portfolios.every((p) => p.insurances.length === 0)) return 0;

  const ratio = totalCoverage / totalInvested;
  if (ratio >= 5) return 25;
  if (ratio >= 3) return 20;
  if (ratio >= 2) return 15;
  if (ratio >= 1) return 10;
  return 5;
}

/* ── Main hook ── */

export function usePortfolioInsights(portfolios: Portfolio[]): PortfolioInsights {
  return useMemo(() => {
    const all = allHoldingsWithMeta(portfolios);
    const allHoldings = portfolios.flatMap((p) => p.holdings);

    // ── Top by value ──
    const topByValue = [...all]
      .sort((a, b) => b.holding.currentValue - a.holding.currentValue)
      .slice(0, 5);

    // ── Top gainers / losers ──
    const topGainers = [...all]
      .filter((a) => a.holding.pnlPercent > 0)
      .sort((a, b) => b.holding.pnlPercent - a.holding.pnlPercent)
      .slice(0, 5);

    const topLosers = [...all]
      .filter((a) => a.holding.pnlPercent < 0)
      .sort((a, b) => a.holding.pnlPercent - b.holding.pnlPercent)
      .slice(0, 5);

    // ── Today's biggest mover ──
    const biggestMover = all.length > 0
      ? [...all].sort((a, b) => Math.abs(b.holding.todayPnLPercent) - Math.abs(a.holding.todayPnLPercent))[0]
      : null;

    // ── Asset allocation ──
    const stocksVal = portfolios.reduce((s, p) => s + p.holdings.reduce((a, h) => a + h.currentValue, 0), 0);
    const fdVal = portfolios.reduce(
      (s, p) => s + p.fixedDeposits.reduce((a, f) => a + (f.status === 'matured' ? Number(f.maturity_amount) : getFDEffectiveValue(f)), 0),
      0
    );
    const goldVal = portfolios.reduce(
      (s, p) => s + p.goldHoldings.reduce((a, g) => a + Number(g.current_valuation), 0),
      0
    );
    const realEstateVal = portfolios.reduce(
      (s, p) => s + p.realEstate.reduce((a, r) => a + Number(r.current_valuation), 0),
      0
    );
    const totalVal = stocksVal + fdVal + goldVal + realEstateVal;

    const pct = (v: number) => (totalVal > 0 ? (v / totalVal) * 100 : 0);

    const allocationSlices: AllocationSlice[] = [
      { label: 'Stocks', actual: pct(stocksVal), target: TARGET_ALLOCATION.stocks, drift: pct(stocksVal) - TARGET_ALLOCATION.stocks, value: stocksVal },
      { label: 'Fixed Deposits', actual: pct(fdVal), target: TARGET_ALLOCATION.fd, drift: pct(fdVal) - TARGET_ALLOCATION.fd, value: fdVal },
      { label: 'Gold', actual: pct(goldVal), target: TARGET_ALLOCATION.gold, drift: pct(goldVal) - TARGET_ALLOCATION.gold, value: goldVal },
      { label: 'Real Estate', actual: pct(realEstateVal), target: TARGET_ALLOCATION.realEstate, drift: pct(realEstateVal) - TARGET_ALLOCATION.realEstate, value: realEstateVal },
    ];

    // ── Concentration warnings ──
    const concentrationWarnings: ConcentrationWarning[] = [];
    for (const p of portfolios) {
      const eqTotal = p.holdings.reduce((s, h) => s + h.currentValue, 0);
      if (eqTotal === 0) continue;
      for (const h of p.holdings) {
        const holdingPct = (h.currentValue / eqTotal) * 100;
        if (holdingPct > 15) {
          concentrationWarnings.push({
            ticker: h.ticker,
            stockName: h.stockName,
            pct: holdingPct,
            portfolioLabel: p.label,
          });
        }
      }
    }
    concentrationWarnings.sort((a, b) => b.pct - a.pct);

    // ── FD maturity alerts (30 days) ──
    const fdMaturityAlerts: FDMaturityAlert[] = [];
    for (const p of portfolios) {
      for (const fd of p.fixedDeposits) {
        if (fd.status === 'matured') continue;
        const days = daysUntil(fd.maturity_date);
        if (days !== null && days >= 0 && days <= 30) {
          fdMaturityAlerts.push({ fd, daysLeft: days, portfolioLabel: p.label });
        }
      }
    }
    fdMaturityAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    // ── Insurance renewal alerts (60 days) ──
    const insuranceRenewalAlerts: InsuranceRenewalAlert[] = [];
    for (const p of portfolios) {
      for (const ins of p.insurances) {
        const days = daysUntil(ins.renewal_date);
        if (days !== null && days >= 0 && days <= 60) {
          insuranceRenewalAlerts.push({ insurance: ins, daysLeft: days, portfolioLabel: p.label });
        }
      }
    }
    insuranceRenewalAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    // ── Portfolio best / worst ──
    const portfolioBestWorst: PortfolioBestWorst[] = portfolios.map((p) => {
      if (p.holdings.length === 0) return { portfolioLabel: p.label, best: null, worst: null };
      const sorted = [...p.holdings].sort((a, b) => b.pnlPercent - a.pnlPercent);
      return {
        portfolioLabel: p.label,
        best: sorted[0],
        worst: sorted[sorted.length - 1],
      };
    });

    // ── Health score ──
    const diversification = calcDiversification(allHoldings);
    const assetBalance = calcAssetBalance(allocationSlices);
    const concentration = calcConcentration(allHoldings);
    const insuranceCoverage = calcInsuranceCoverage(portfolios);
    const total = diversification + assetBalance + concentration + insuranceCoverage;

    const healthScore: HealthScoreBreakdown = {
      diversification,
      assetBalance,
      concentration,
      insuranceCoverage,
      total,
    };

    return {
      topByValue,
      topGainers,
      topLosers,
      biggestMover,
      allocationSlices,
      concentrationWarnings,
      fdMaturityAlerts,
      insuranceRenewalAlerts,
      portfolioBestWorst,
      healthScore,
    };
  }, [portfolios]);
}
