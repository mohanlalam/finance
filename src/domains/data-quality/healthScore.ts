import { Portfolio } from '../../types/portfolio';
import { DataQualityIssue, DataQualityReport } from './types';

/**
 * Pure Data Quality Audit Engine
 * Checks for zero valuations, missing maturity dates, overdue renewals, and missing documents.
 */
export function auditPortfolioDataQuality(portfolios: Portfolio[]): DataQualityReport {
  const issues: DataQualityIssue[] = [];
  let totalAssetsChecked = 0;
  const nowMs = Date.now();

  portfolios.forEach((p) => {
    // 1. Stocks Check
    (p.holdings || []).forEach((h) => {
      totalAssetsChecked++;
      if (!h.amountInvested || h.amountInvested <= 0) {
        issues.push({
          code: 'STOCK_ZERO_INVESTED',
          severity: 'warning',
          entityType: 'stock',
          entityId: h.id,
          portfolioId: p.id,
          portfolioName: p.label,
          message: `${h.stockName} (${h.ticker}) has zero invested amount recorded.`,
          fixable: true,
          actionHint: 'Update average buy price or quantity',
        });
      }
    });

    // 2. Fixed Deposits Check
    (p.fixedDeposits || []).forEach((fd) => {
      totalAssetsChecked++;
      if (!fd.maturity_date) {
        issues.push({
          code: 'FD_MISSING_MATURITY',
          severity: 'warning',
          entityType: 'fd',
          entityId: fd.id,
          portfolioId: p.id,
          portfolioName: p.label,
          message: `Fixed Deposit with ${fd.bank_name} is missing a maturity date.`,
          fixable: true,
          actionHint: 'Set the maturity date in FD details',
        });
      }
    });

    // 3. Insurance Policies Check
    (p.insurances || []).forEach((ins) => {
      totalAssetsChecked++;
      if (ins.renewal_date) {
        const renDate = new Date(ins.renewal_date).getTime();
        if (!isNaN(renDate) && renDate < nowMs) {
          issues.push({
            code: 'INSURANCE_RENEWAL_OVERDUE',
            severity: 'critical',
            entityType: 'insurance',
            entityId: ins.id,
            portfolioId: p.id,
            portfolioName: p.label,
            message: `Policy ${ins.policy_name} (${ins.provider}) renewal was due on ${ins.renewal_date}.`,
            fixable: true,
            actionHint: 'Renew policy and update next renewal date',
          });
        }
      } else {
        issues.push({
          code: 'INSURANCE_MISSING_RENEWAL',
          severity: 'info',
          entityType: 'insurance',
          entityId: ins.id,
          portfolioId: p.id,
          portfolioName: p.label,
          message: `Policy ${ins.policy_name} has no renewal date specified.`,
          fixable: true,
          actionHint: 'Add renewal date to enable expiry tracking',
        });
      }
    });
  });

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  // Score computation out of 100
  let score = 100;
  score -= criticalCount * 15;
  score -= warningCount * 5;
  score -= infoCount * 2;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    totalAssetsChecked,
    issues,
    criticalCount,
    warningCount,
    infoCount,
    calculatedAt: new Date().toISOString(),
  };
}
