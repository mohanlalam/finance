import { useMemo, useState, useEffect } from 'react';
import { Portfolio, Holding, FixedDeposit, Insurance } from '../types/portfolio';
import { FD_MATURITY_WARNING_DAYS, INSURANCE_RENEWAL_WARNING_DAYS } from '../utils/constants';

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

let _cachedTargets: AllocationTargets | null = null;

export function getAllocationTargets(): AllocationTargets {
  if (_cachedTargets) return _cachedTargets;
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(ALLOCATION_TARGETS_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AllocationTargets>;
      _cachedTargets = {
        stocks: typeof parsed.stocks === 'number' ? parsed.stocks : DEFAULT_ALLOCATION_TARGETS.stocks,
        fd: typeof parsed.fd === 'number' ? parsed.fd : DEFAULT_ALLOCATION_TARGETS.fd,
        gold: typeof parsed.gold === 'number' ? parsed.gold : DEFAULT_ALLOCATION_TARGETS.gold,
        realEstate: typeof parsed.realEstate === 'number' ? parsed.realEstate : DEFAULT_ALLOCATION_TARGETS.realEstate,
      };
      return _cachedTargets;
    }
  } catch { /* ignore */ }
  _cachedTargets = { ...DEFAULT_ALLOCATION_TARGETS };
  return _cachedTargets;
}

export function invalidateAllocationTargetsCache(): void {
  _cachedTargets = null;
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
  biggestMovers: HoldingInsight[];
  allocationSlices: AllocationSlice[];
  concentrationWarnings: ConcentrationWarning[];
  fdMaturityAlerts: FDMaturityAlert[];
  insuranceRenewalAlerts: InsuranceRenewalAlert[];
  portfolioBestWorst: PortfolioBestWorst[];
  healthScore: HealthScoreBreakdown;
}

/* ── Helpers ── */

function daysUntil(dateStr: string | null | undefined, nowMs: number): number | null {
  if (!dateStr) return null;
  const t = Date.parse(dateStr);
  if (isNaN(t)) return null;
  return Math.ceil((t - nowMs) / (1000 * 3600 * 24));
}

function allHoldingsWithMeta(portfolios: Portfolio[]): HoldingInsight[] {
  const result: HoldingInsight[] = [];
  for (let i = 0; i < portfolios.length; i++) {
    const p = portfolios[i];
    if (!p || !p.holdings) continue;
    for (let j = 0; j < p.holdings.length; j++) {
      result.push({ holding: p.holdings[j], portfolioLabel: p.label, portfolioName: p.name });
    }
  }
  return result;
}

/* ── Score calculators ── */

function calcDiversification(allHoldingsCount: number): number {
  if (allHoldingsCount === 0) return 0;
  if (allHoldingsCount >= 15) return 25;
  if (allHoldingsCount >= 10) return 22;
  if (allHoldingsCount >= 5) return 18;
  if (allHoldingsCount >= 3) return 12;
  return 5;
}

function calcAssetBalance(slices: AllocationSlice[]): number {
  let hasValue = false;
  let totalDrift = 0;
  for (let i = 0; i < slices.length; i++) {
    if (slices[i].value > 0) hasValue = true;
    totalDrift += Math.abs(slices[i].drift);
  }
  if (!hasValue) return 0;
  if (totalDrift <= 20) return 25;
  if (totalDrift <= 40) return 20;
  if (totalDrift <= 60) return 15;
  if (totalDrift <= 100) return 10;
  return 5;
}

function calcConcentration(allHoldings: Holding[]): number {
  const n = allHoldings.length;
  if (n === 0) return 0;
  let totalEquity = 0;
  for (let i = 0; i < n; i++) {
    totalEquity += Number(allHoldings[i]?.currentValue) || 0;
  }
  if (totalEquity === 0) return 25;

  const sorted = [...allHoldings].sort((a, b) => b.currentValue - a.currentValue);
  const topPct = (sorted[0].currentValue / totalEquity) * 100;
  let top3Sum = 0;
  const top3Count = Math.min(3, sorted.length);
  for (let i = 0; i < top3Count; i++) {
    top3Sum += sorted[i].currentValue;
  }
  const top3Pct = (top3Sum / totalEquity) * 100;

  let score = 25;
  if (topPct > 30) score -= 12;
  else if (topPct > 20) score -= 8;
  else if (topPct > 15) score -= 4;

  if (top3Pct > 60) score -= 8;
  else if (top3Pct > 50) score -= 4;

  return Math.max(score, 0);
}

function calcInsuranceCoverage(portfolios: Portfolio[]): number {
  let totalInvested = 0;
  let totalCoverage = 0;
  let hasInsurances = false;

  for (let i = 0; i < portfolios.length; i++) {
    const p = portfolios[i];
    if (!p) continue;
    totalInvested += Number(p.totalInvested) || 0;
    if (p.insurances && p.insurances.length > 0) {
      hasInsurances = true;
      for (let j = 0; j < p.insurances.length; j++) {
        totalCoverage += Number(p.insurances[j]?.sum_assured) || 0;
      }
    }
  }

  if (totalInvested === 0 || !hasInsurances) return 0;

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
    const TARGET_ALLOCATION = getAllocationTargets();
    const all = allHoldingsWithMeta(portfolios);
    const nowMs = Date.now();

    // Flatten holdings efficiently
    const allHoldings: Holding[] = [];
    for (let i = 0; i < all.length; i++) {
      allHoldings.push(all[i].holding);
    }

    // ── Top by value ──
    const topByValue = [...all]
      .sort((a, b) => b.holding.currentValue - a.holding.currentValue)
      .slice(0, 5);

    // ── Top gainers / losers ──
    const topGainers = all
      .filter((a) => a.holding.pnlPercent > 0)
      .sort((a, b) => b.holding.pnlPercent - a.holding.pnlPercent)
      .slice(0, 5);

    const topLosers = all
      .filter((a) => a.holding.pnlPercent < 0)
      .sort((a, b) => a.holding.pnlPercent - b.holding.pnlPercent)
      .slice(0, 5);

    // ── Today's biggest movers (Top 5) ──
    const biggestMovers = all.length > 0
      ? [...all].sort((a, b) => Math.abs(b.holding.todayPnLPercent) - Math.abs(a.holding.todayPnLPercent)).slice(0, 5)
      : [];
    const biggestMover = biggestMovers[0] || null;

    // ── Asset allocation (Single pass aggregation) ──
    let totalStocksVal = 0;
    let totalFdVal = 0;
    let goldVal = 0;
    let realEstateVal = 0;

    for (let i = 0; i < portfolios.length; i++) {
      const p = portfolios[i];
      if (!p) continue;
      totalStocksVal += (Number(p.stocksValue) || 0) + (Number(p.sipValue) || 0);
      totalFdVal += (Number(p.fdValue) || 0) + (Number(p.rdValue) || 0);
      goldVal += Number(p.goldValue) || 0;
      realEstateVal += Number(p.realEstateValue) || 0;
    }
    const totalVal = totalStocksVal + totalFdVal + goldVal + realEstateVal;

    const pct = (v: number) => (totalVal > 0 ? (v / totalVal) * 100 : 0);

    const allocationSlices: AllocationSlice[] = [
      { label: 'Stocks', actual: pct(totalStocksVal), target: TARGET_ALLOCATION.stocks, drift: pct(totalStocksVal) - TARGET_ALLOCATION.stocks, value: totalStocksVal },
      { label: 'Fixed Deposits', actual: pct(totalFdVal), target: TARGET_ALLOCATION.fd, drift: pct(totalFdVal) - TARGET_ALLOCATION.fd, value: totalFdVal },
      { label: 'Gold', actual: pct(goldVal), target: TARGET_ALLOCATION.gold, drift: pct(goldVal) - TARGET_ALLOCATION.gold, value: goldVal },
      { label: 'Real Estate', actual: pct(realEstateVal), target: TARGET_ALLOCATION.realEstate, drift: pct(realEstateVal) - TARGET_ALLOCATION.realEstate, value: realEstateVal },
    ];

    // ── Concentration warnings ──
    const concentrationWarnings: ConcentrationWarning[] = [];
    for (let i = 0; i < portfolios.length; i++) {
      const p = portfolios[i];
      if (!p || !p.holdings || p.holdings.length === 0) continue;
      let eqTotal = 0;
      for (let j = 0; j < p.holdings.length; j++) {
        eqTotal += Number(p.holdings[j]?.currentValue) || 0;
      }
      if (eqTotal === 0) continue;
      for (let j = 0; j < p.holdings.length; j++) {
        const h = p.holdings[j];
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
    for (let i = 0; i < portfolios.length; i++) {
      const p = portfolios[i];
      if (!p || !p.fixedDeposits) continue;
      for (let j = 0; j < p.fixedDeposits.length; j++) {
        const fd = p.fixedDeposits[j];
        if (fd.status === 'matured') continue;
        const days = daysUntil(fd.maturity_date, nowMs);
        if (days !== null && days >= 0 && days <= FD_MATURITY_WARNING_DAYS) {
          fdMaturityAlerts.push({ fd, daysLeft: days, portfolioLabel: p.label });
        }
      }
    }
    fdMaturityAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    // ── Insurance renewal alerts (60 days) ──
    const insuranceRenewalAlerts: InsuranceRenewalAlert[] = [];
    for (let i = 0; i < portfolios.length; i++) {
      const p = portfolios[i];
      if (!p || !p.insurances) continue;
      for (let j = 0; j < p.insurances.length; j++) {
        const ins = p.insurances[j];
        const days = daysUntil(ins.renewal_date, nowMs);
        if (days !== null && days >= 0 && days <= INSURANCE_RENEWAL_WARNING_DAYS) {
          insuranceRenewalAlerts.push({ insurance: ins, daysLeft: days, portfolioLabel: p.label });
        }
      }
    }
    insuranceRenewalAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    // ── Portfolio best / worst ──
    const portfolioBestWorst: PortfolioBestWorst[] = [];
    for (let i = 0; i < portfolios.length; i++) {
      const p = portfolios[i];
      if (!p || !p.holdings || p.holdings.length === 0) {
        portfolioBestWorst.push({ portfolioLabel: p?.label ?? '', best: null, worst: null });
        continue;
      }
      let bestH: Holding = p.holdings[0];
      let worstH: Holding = p.holdings[0];
      for (let j = 1; j < p.holdings.length; j++) {
        const h = p.holdings[j];
        if (h.pnlPercent > bestH.pnlPercent) bestH = h;
        if (h.pnlPercent < worstH.pnlPercent) worstH = h;
      }
      portfolioBestWorst.push({
        portfolioLabel: p.label,
        best: bestH,
        worst: worstH,
      });
    }

    // ── Health score ──
    const diversification = calcDiversification(allHoldings.length);
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
      biggestMovers,
      allocationSlices,
      concentrationWarnings,
      fdMaturityAlerts,
      insuranceRenewalAlerts,
      portfolioBestWorst,
      healthScore,
    };
  }, [portfolios]);
}
