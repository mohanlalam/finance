import { useMemo } from 'react';
import { Portfolio, Holding, FixedDeposit, Insurance } from '../types/portfolio';
import { FD_MATURITY_WARNING_DAYS, INSURANCE_RENEWAL_WARNING_DAYS } from '../utils/constants';
import { getPolicyRenewalStatus } from '../domains/assets/insurance/calculations/insuranceValuation';

/* ── Alert / Insight types ── */

export interface HoldingInsight {
  holding: Holding;
  portfolioLabel: string;
  portfolioName: string;
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

export interface PortfolioInsights {
  topByValue: HoldingInsight[];
  topGainers: HoldingInsight[];
  topLosers: HoldingInsight[];
  biggestMover: HoldingInsight | null;
  biggestMovers: HoldingInsight[];
  fdMaturityAlerts: FDMaturityAlert[];
  insuranceRenewalAlerts: InsuranceRenewalAlert[];
  portfolioBestWorst: PortfolioBestWorst[];
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

/* ── Main hook ── */

export function usePortfolioInsights(portfolios: Portfolio[]): PortfolioInsights {
  return useMemo(() => {
    const all = allHoldingsWithMeta(portfolios);
    const nowMs = Date.now();

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

    // ── FD maturity alerts (30 days + overdue) ──
    const fdMaturityAlerts: FDMaturityAlert[] = [];
    for (let i = 0; i < portfolios.length; i++) {
      const p = portfolios[i];
      if (!p || !p.fixedDeposits) continue;
      for (let j = 0; j < p.fixedDeposits.length; j++) {
        const fd = p.fixedDeposits[j];
        if (fd.status === 'matured') continue;
        const days = daysUntil(fd.maturity_date, nowMs);
        if (days !== null && days <= FD_MATURITY_WARNING_DAYS && days >= -365) {
          fdMaturityAlerts.push({ fd, daysLeft: days, portfolioLabel: p.label });
        }
      }
    }
    fdMaturityAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    // ── Insurance renewal alerts (60 days + overdue) ──
    const insuranceRenewalAlerts: InsuranceRenewalAlert[] = [];
    const nowDate = new Date(nowMs);
    for (let i = 0; i < portfolios.length; i++) {
      const p = portfolios[i];
      if (!p || !p.insurances) continue;
      for (let j = 0; j < p.insurances.length; j++) {
        const ins = p.insurances[j];
        const renewal = getPolicyRenewalStatus(ins, nowDate);
        if (renewal.daysRemaining !== Infinity && renewal.daysRemaining <= INSURANCE_RENEWAL_WARNING_DAYS && renewal.daysRemaining >= -365) {
          insuranceRenewalAlerts.push({ insurance: ins, daysLeft: renewal.daysRemaining, portfolioLabel: p.label });
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

      const gainers = p.holdings.filter((h) => h.pnlPercent > 0);
      const losers = p.holdings.filter((h) => h.pnlPercent < 0);

      let bestH: Holding | null = null;
      if (gainers.length > 0) {
        bestH = gainers.reduce((max, h) => (h.pnlPercent > max.pnlPercent ? h : max), gainers[0]);
      }

      let worstH: Holding | null = null;
      if (losers.length > 0) {
        worstH = losers.reduce((min, h) => (h.pnlPercent < min.pnlPercent ? h : min), losers[0]);
      }

      portfolioBestWorst.push({
        portfolioLabel: p.label,
        best: bestH,
        worst: worstH,
      });
    }

    return {
      topByValue,
      topGainers,
      topLosers,
      biggestMover,
      biggestMovers,
      fdMaturityAlerts,
      insuranceRenewalAlerts,
      portfolioBestWorst,
    };
  }, [portfolios]);
}
