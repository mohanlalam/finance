import { Portfolio, AssetTab } from '../types/portfolio';

export type HealthSeverity = 'critical' | 'warning' | 'info';

export interface HealthIssue {
  id: string;
  category: 'deposit' | 'valuation' | 'document' | 'insurance' | 'sip' | 'market_data' | 'completeness';
  severity: HealthSeverity;
  title: string;
  description: string;
  assetTab: AssetTab;
  portfolioName?: string;
  portfolioLabel?: string;
  assetId?: string;
  actionLabel?: string;
}

export interface PortfolioHealthSummary {
  score: number; // 0 to 100
  totalChecks: number;
  passedChecks: number;
  issues: HealthIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * Evaluates the entire family portfolio for missing metadata, zero valuations,
 * unlinked documents, overdue maturities/SIPs, expired insurances, and incomplete market data.
 */
export function analyzePortfolioHealth(
  portfolios: Portfolio[],
  options?: { isPriceStale?: boolean; priceStatus?: string }
): PortfolioHealthSummary {
  const issues: HealthIssue[] = [];
  let totalItems = 0;
  const now = new Date();
  const nowMs = now.getTime();

  // Helper to test if a date string is past
  const isPast = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    const t = Date.parse(dateStr);
    return !isNaN(t) && t < nowMs;
  };

  // Collect linked document asset IDs to detect unlinked assets
  const linkedDocumentAssetIds = new Set<string>();
  portfolios.forEach(p => {
    p.documents?.forEach(doc => {
      if (doc.asset_id) linkedDocumentAssetIds.add(doc.asset_id);
    });
  });

  for (const p of portfolios) {
    const pLabel = p.label || p.name;
    const pName = p.name;

    // 1. Fixed Deposits Checks
    p.fixedDeposits?.forEach(fd => {
      totalItems++;
      // Missing maturity date
      if (!fd.maturity_date && fd.status !== 'matured') {
        issues.push({
          id: `fd-no-mat-${fd.id}`,
          category: 'deposit',
          severity: 'warning',
          title: `FD missing maturity date`,
          description: `${fd.bank_name} deposit has no maturity date set.`,
          assetTab: 'fd',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: fd.id,
          actionLabel: 'Set Date',
        });
      }
      // Overdue active FD
      if (fd.maturity_date && isPast(fd.maturity_date) && fd.status !== 'matured') {
        issues.push({
          id: `fd-overdue-${fd.id}`,
          category: 'deposit',
          severity: 'critical',
          title: `FD matured & unclosed`,
          description: `${fd.bank_name} deposit matured on ${fd.maturity_date}. Mark as matured or renew.`,
          assetTab: 'fd',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: fd.id,
          actionLabel: 'Review FD',
        });
      }
      // Zero principal
      if (!fd.principal_amount || fd.principal_amount <= 0) {
        issues.push({
          id: `fd-zero-${fd.id}`,
          category: 'valuation',
          severity: 'critical',
          title: `FD with ₹0 principal`,
          description: `${fd.bank_name} has no valid principal amount recorded.`,
          assetTab: 'fd',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: fd.id,
          actionLabel: 'Fix Amount',
        });
      }
      // Missing certificate
      if (!linkedDocumentAssetIds.has(fd.id) && fd.principal_amount >= 50000) {
        issues.push({
          id: `fd-no-doc-${fd.id}`,
          category: 'document',
          severity: 'info',
          title: `No FD certificate attached`,
          description: `${fd.bank_name} (${pLabel}) has no supporting deposit advice uploaded.`,
          assetTab: 'fd',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: fd.id,
          actionLabel: 'Attach Doc',
        });
      }
    });

    // 2. Recurring Deposits Checks
    p.rdAccounts?.forEach(rd => {
      totalItems++;
      if (rd.maturity_date && isPast(rd.maturity_date) && rd.status !== 'matured') {
        issues.push({
          id: `rd-overdue-${rd.id}`,
          category: 'deposit',
          severity: 'critical',
          title: `RD tenure complete`,
          description: `${rd.bank_name} RD matured on ${rd.maturity_date}.`,
          assetTab: 'rd',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: rd.id,
          actionLabel: 'Review RD',
        });
      }
      if (!rd.monthly_deposit || rd.monthly_deposit <= 0) {
        issues.push({
          id: `rd-zero-${rd.id}`,
          category: 'valuation',
          severity: 'critical',
          title: `RD with ₹0 monthly installment`,
          description: `${rd.bank_name} has invalid monthly installment.`,
          assetTab: 'rd',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: rd.id,
          actionLabel: 'Fix Amount',
        });
      }
    });

    // 3. SIP Mutual Funds Checks
    p.sipAccounts?.forEach(sip => {
      totalItems++;
      if (sip.next_sip_date && isPast(sip.next_sip_date)) {
        issues.push({
          id: `sip-overdue-${sip.id}`,
          category: 'sip',
          severity: 'warning',
          title: `Overdue SIP debit`,
          description: `${sip.fund_name} scheduled SIP date (${sip.next_sip_date}) has passed.`,
          assetTab: 'sip',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: sip.id,
          actionLabel: 'Update SIP',
        });
      }
      if (!sip.monthly_sip || sip.monthly_sip <= 0) {
        issues.push({
          id: `sip-zero-${sip.id}`,
          category: 'valuation',
          severity: 'warning',
          title: `SIP with ₹0 installment`,
          description: `${sip.fund_name} has zero monthly SIP amount.`,
          assetTab: 'sip',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: sip.id,
          actionLabel: 'Edit SIP',
        });
      }
      if (sip.navIsStale) {
        issues.push({
          id: `sip-stale-${sip.id}`,
          category: 'market_data',
          severity: 'info',
          title: `Stale AMFI NAV`,
          description: `${sip.fund_name} is using fallback/cached NAV price.`,
          assetTab: 'sip',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: sip.id,
          actionLabel: 'Refresh NAV',
        });
      }
    });

    // 4. Gold Holdings Checks
    p.goldHoldings?.forEach(gold => {
      totalItems++;
      if (!gold.weight_grams || gold.weight_grams <= 0) {
        issues.push({
          id: `gold-zero-wt-${gold.id}`,
          category: 'valuation',
          severity: 'critical',
          title: `Gold with zero weight`,
          description: `${gold.item_name} has 0 grams recorded.`,
          assetTab: 'gold',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: gold.id,
          actionLabel: 'Edit Weight',
        });
      }
      if (!gold.purchase_price || gold.purchase_price <= 0) {
        issues.push({
          id: `gold-zero-price-${gold.id}`,
          category: 'valuation',
          severity: 'warning',
          title: `Gold with zero purchase cost`,
          description: `${gold.item_name} has ₹0 purchase cost recorded.`,
          assetTab: 'gold',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: gold.id,
          actionLabel: 'Set Price',
        });
      }
      if (!linkedDocumentAssetIds.has(gold.id)) {
        issues.push({
          id: `gold-no-doc-${gold.id}`,
          category: 'document',
          severity: 'info',
          title: `No invoice or purity certificate`,
          description: `${gold.item_name} (${gold.purity}) has no linked hallmark receipt.`,
          assetTab: 'gold',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: gold.id,
          actionLabel: 'Attach Bill',
        });
      }
    });

    // 5. Real Estate Checks
    p.realEstate?.forEach(prop => {
      totalItems++;
      if (!prop.current_valuation || prop.current_valuation <= 0) {
        issues.push({
          id: `re-zero-val-${prop.id}`,
          category: 'valuation',
          severity: 'critical',
          title: `Property with ₹0 valuation`,
          description: `${prop.property_name} has no market valuation recorded.`,
          assetTab: 'real_estate',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: prop.id,
          actionLabel: 'Set Value',
        });
      }
      if (!linkedDocumentAssetIds.has(prop.id)) {
        issues.push({
          id: `re-no-doc-${prop.id}`,
          category: 'document',
          severity: 'warning',
          title: `No deed / tax receipt linked`,
          description: `${prop.property_name} has no property deed or receipt in Document Vault.`,
          assetTab: 'real_estate',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: prop.id,
          actionLabel: 'Attach Deed',
        });
      }
    });

    // 6. Insurance Checks
    p.insurances?.forEach(ins => {
      totalItems++;
      if (ins.renewal_date && isPast(ins.renewal_date)) {
        issues.push({
          id: `ins-expired-${ins.id}`,
          category: 'insurance',
          severity: 'critical',
          title: `Policy renewal lapsed`,
          description: `${ins.policy_name} (${ins.insurance_type}) renewal date was ${ins.renewal_date}.`,
          assetTab: 'insurance',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: ins.id,
          actionLabel: 'Renew Policy',
        });
      }
      if (!ins.renewal_date) {
        issues.push({
          id: `ins-no-date-${ins.id}`,
          category: 'insurance',
          severity: 'warning',
          title: `Missing policy renewal date`,
          description: `${ins.policy_name} has no renewal date specified.`,
          assetTab: 'insurance',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: ins.id,
          actionLabel: 'Set Date',
        });
      }
      if (!ins.sum_assured || ins.sum_assured <= 0) {
        issues.push({
          id: `ins-zero-sum-${ins.id}`,
          category: 'valuation',
          severity: 'warning',
          title: `Insurance with ₹0 sum assured`,
          description: `${ins.policy_name} has ₹0 sum assured cover.`,
          assetTab: 'insurance',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: ins.id,
          actionLabel: 'Fix Sum Assured',
        });
      }
      if (!linkedDocumentAssetIds.has(ins.id)) {
        issues.push({
          id: `ins-no-doc-${ins.id}`,
          category: 'document',
          severity: 'info',
          title: `No policy document uploaded`,
          description: `${ins.policy_name} has no digital policy schedule attached.`,
          assetTab: 'insurance',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: ins.id,
          actionLabel: 'Upload Policy',
        });
      }
    });

    // 7. Stock Holdings Checks
    p.holdings?.forEach(h => {
      totalItems++;
      if (!h.qty || h.qty <= 0) {
        issues.push({
          id: `stock-zero-qty-${h.id}`,
          category: 'completeness',
          severity: 'critical',
          title: `Stock with zero quantity`,
          description: `${h.ticker} has 0 shares.`,
          assetTab: 'stocks',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: h.id,
          actionLabel: 'Fix Qty',
        });
      }
      if (!h.avgPrice || h.avgPrice <= 0) {
        issues.push({
          id: `stock-zero-price-${h.id}`,
          category: 'valuation',
          severity: 'warning',
          title: `Stock with zero avg price`,
          description: `${h.ticker} has ₹0 average buy price.`,
          assetTab: 'stocks',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: h.id,
          actionLabel: 'Set Buy Price',
        });
      }
      if ((!h.weekLow52 || h.weekLow52 <= 0 || !h.weekHigh52 || h.weekHigh52 <= 0) && h.ltp > 0) {
        issues.push({
          id: `stock-no-52w-${h.id}`,
          category: 'market_data',
          severity: 'info',
          title: `Incomplete 52-week range`,
          description: `${h.ticker} is missing 52-week high/low market metrics.`,
          assetTab: 'stocks',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: h.id,
          actionLabel: 'Refresh Price',
        });
      }
    });

    // 8. Document Vault Expiries
    p.documents?.forEach(doc => {
      totalItems++;
      if (doc.expiry_date && isPast(doc.expiry_date)) {
        issues.push({
          id: `doc-expired-${doc.id}`,
          category: 'document',
          severity: 'warning',
          title: `Document expired`,
          description: `"${doc.name}" expired on ${doc.expiry_date}.`,
          assetTab: 'documents',
          portfolioName: pName,
          portfolioLabel: pLabel,
          assetId: doc.id,
          actionLabel: 'Review Vault',
        });
      }
    });
  }

  // Stale market feed check
  if (options?.isPriceStale || options?.priceStatus === 'error') {
    issues.push({
      id: 'market-stale-price-sync',
      category: 'market_data',
      severity: 'warning',
      title: 'Market prices may be out of date',
      description: 'Stock & NAV prices have not updated recently. Tap refresh to sync live rates.',
      assetTab: 'stocks',
      actionLabel: 'Sync Now',
    });
  }

  // Score calculation:
  // Critical issue: -12 pts each
  // Warning issue: -5 pts each
  // Info issue: -2 pts each
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  const totalDeductions = criticalCount * 12 + warningCount * 5 + infoCount * 2;
  const score = Math.max(0, Math.min(100, Math.round(100 - totalDeductions)));
  const totalChecks = Math.max(totalItems, 1) + 5;
  const passedChecks = Math.max(0, totalChecks - issues.length);

  return {
    score,
    totalChecks,
    passedChecks,
    issues,
    criticalCount,
    warningCount,
    infoCount,
  };
}

export interface HealthSnapshot {
  timestamp: string; // ISO date string
  score: number;
  criticalCount: number;
  warningCount: number;
  totalChecks: number;
}

const HEALTH_HISTORY_KEY = 'family_finance_health_history_v1';
const HEALTH_FIXED_ISSUES_KEY = 'family_finance_fixed_issues_v1';

/**
 * Persists a health audit snapshot into localStorage with a 30-entry rolling history.
 */
export function saveHealthSnapshot(summary: PortfolioHealthSummary): HealthSnapshot[] {
  try {
    const raw = localStorage.getItem(HEALTH_HISTORY_KEY);
    const history: HealthSnapshot[] = raw ? JSON.parse(raw) : [];

    const nowIso = new Date().toISOString();
    const newSnapshot: HealthSnapshot = {
      timestamp: nowIso,
      score: summary.score,
      criticalCount: summary.criticalCount,
      warningCount: summary.warningCount,
      totalChecks: summary.totalChecks,
    };

    // Avoid multiple entries within the same hour
    const last = history[history.length - 1];
    if (last && Date.now() - new Date(last.timestamp).getTime() < 3600000) {
      history[history.length - 1] = newSnapshot;
    } else {
      history.push(newSnapshot);
    }

    // Keep last 30 snapshots
    const trimmed = history.slice(-30);
    localStorage.setItem(HEALTH_HISTORY_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.warn('[dataQuality] Failed to save health snapshot', err);
    return [];
  }
}

/**
 * Retrieves the historical health snapshots from storage.
 */
export function getHealthHistory(): HealthSnapshot[] {
  try {
    const raw = localStorage.getItem(HEALTH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Records an issue as resolved to track monthly progress.
 */
export function recordIssueResolved(issueId: string): void {
  try {
    const raw = localStorage.getItem(HEALTH_FIXED_ISSUES_KEY);
    const fixed: { id: string; resolvedAt: string }[] = raw ? JSON.parse(raw) : [];
    fixed.push({ id: issueId, resolvedAt: new Date().toISOString() });
    localStorage.setItem(HEALTH_FIXED_ISSUES_KEY, JSON.stringify(fixed.slice(-100)));
  } catch (err) {
    console.warn('[dataQuality] Failed to record resolved issue', err);
  }
}

/**
 * Returns the count of issues resolved in the current month.
 */
export function getMonthlyResolvedCount(): number {
  try {
    const raw = localStorage.getItem(HEALTH_FIXED_ISSUES_KEY);
    if (!raw) return 0;
    const fixed: { id: string; resolvedAt: string }[] = JSON.parse(raw);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return fixed.filter(f => f.resolvedAt?.startsWith(currentMonth)).length;
  } catch {
    return 0;
  }
}
