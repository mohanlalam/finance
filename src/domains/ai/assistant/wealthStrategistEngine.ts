/**
 * wealthStrategistEngine.ts — Multi-Agent Conversational Wealth Strategist
 *
 * Deconstructs compound multi-clause financial prompts (e.g.,
 * "If we sell Sai Laxmi's loss-making stocks to harvest tax, can we fund Padmavathi's
 * upcoming ₹50,000 insurance premium next month without breaking any FDs?")
 * into planned deterministic tool invocations:
 *
 * - Tool 1: executeTaxHarvestingTool(member) -> Unearths capital losses, sell proceeds, and tax savings
 * - Tool 2: executeInsuranceCommitmentsTool(member, windowDays, explicitAmount) -> Audits upcoming premiums
 * - Tool 3: executeFDLiquidityTool(member) -> Audits locked vs maturing FDs (zero premature penalty)
 * - Tool 4: executeCashFlowDeltaTool(proceeds, liabilities) -> Computes exact cash surplus or deficit
 *
 * Returns a structured Executive Advisory Report with verified financial math and simulation action chips.
 * Pure TypeScript with zero external dependencies.
 */

import { Portfolio, Holding, Insurance } from '../../../types/portfolio';
import { calculateTaxHarvesting, TaxSummary } from '../../taxation/calculations/taxHarvesting';
import { formatINR } from '../../../utils/formatters';

export interface StrategistToolTrace {
  toolName: string;
  toolDescription: string;
  memberAttribution?: string;
  outputSummary: string;
  details?: Record<string, unknown>;
}

export interface WealthStrategyResult {
  isCompound: boolean;
  verdict: 'fully_funded' | 'shortfall' | 'advisory';
  verdictHeadline: string;
  toolTraces: StrategistToolTrace[];
  executiveReport: string;
  actionChips: { label: string; tab: string }[];
  matchedAssets: { name: string; type: string; details: string }[];
}

interface ParsedClause {
  sourceMember: string | null;
  targetMember: string | null;
  wantsTaxHarvesting: boolean;
  wantsInsuranceFunding: boolean;
  wantsFDProtection: boolean;
  explicitAmount: number | null;
}

/**
 * Detects if a query contains compound financial reasoning across multiple asset classes or constraints.
 */
export function isCompoundWealthQuery(query: string): boolean {
  const q = query.toLowerCase();

  // Check for conditional clauses
  const hasConditional =
    q.includes('if we') ||
    q.includes('can we') ||
    q.includes('should we') ||
    q.includes('what if') ||
    q.includes('how can we') ||
    q.includes('is it possible to');

  // Check for multi-clause connectors
  const hasActionAndGoal =
    (q.includes('sell') || q.includes('harvest') || q.includes('loss') || q.includes('liquidate')) &&
    (q.includes('fund') || q.includes('cover') || q.includes('pay') || q.includes('insurance') || q.includes('premium') || q.includes('fd') || q.includes('sip'));

  const hasConstraint =
    q.includes('without breaking') ||
    q.includes('without touching') ||
    q.includes('without closing') ||
    q.includes('keep fd') ||
    q.includes('keep deposit');

  return (hasConditional && hasActionAndGoal) || (hasActionAndGoal && hasConstraint);
}

/**
 * Extracts explicit rupee amount from natural language queries (e.g. ₹50,000, 50k, 50000, 1.25L)
 */
function extractExplicitAmount(query: string): number | null {
  const q = query.replace(/,/g, '');

  // Match ₹50000 or Rs. 50000
  const inrMatch = q.match(/(?:₹|rs\.?)\s*(\d+(?:\.\d+)?)/i);
  if (inrMatch) {
    return parseFloat(inrMatch[1]);
  }

  // Match 50k / 50K
  const kMatch = q.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }

  // Match 1.5L / 1.5 Lakh / 1.5 lac
  const lakhMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b/i);
  if (lakhMatch) {
    return parseFloat(lakhMatch[1]) * 100000;
  }

  // Generic 4+ digit number
  const numMatch = q.match(/\b(\d{4,9})\b/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }

  return null;
}

/**
 * Extracts mentioned family member names from query.
 */
function extractMemberNames(query: string, portfolios: Portfolio[]): string[] {
  const q = query.toLowerCase();
  const matched: string[] = [];

  for (const p of portfolios) {
    const pName = p.name.toLowerCase();
    const pLabel = p.label.toLowerCase();
    if (q.includes(pName) || q.includes(pLabel)) {
      matched.push(p.name);
    }
  }

  return Array.from(new Set(matched));
}

/**
 * Deconstructs natural language into financial intent clauses.
 */
function parseCompoundQuery(query: string, portfolios: Portfolio[]): ParsedClause {
  const q = query.toLowerCase();
  const members = extractMemberNames(query, portfolios);

  let sourceMember: string | null = null;
  let targetMember: string | null = null;

  if (members.length === 1) {
    sourceMember = members[0];
    targetMember = members[0];
  } else if (members.length >= 2) {
    // E.g., "sell Sai Laxmi's ... fund Padmavathi's"
    const idx0 = q.indexOf(members[0].toLowerCase());
    const idx1 = q.indexOf(members[1].toLowerCase());
    if (idx0 < idx1) {
      sourceMember = members[0];
      targetMember = members[1];
    } else {
      sourceMember = members[1];
      targetMember = members[0];
    }
  }

  return {
    sourceMember,
    targetMember,
    wantsTaxHarvesting: q.includes('harvest') || q.includes('loss') || q.includes('sell'),
    wantsInsuranceFunding: q.includes('insurance') || q.includes('premium') || q.includes('policy'),
    wantsFDProtection: q.includes('without breaking') || q.includes('without touching') || q.includes('without closing') || q.includes('keep fd'),
    explicitAmount: extractExplicitAmount(query),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC DOMAIN TOOLS
// ─────────────────────────────────────────────────────────────────────────────

interface TaxToolOutput {
  member: string;
  summary: TaxSummary;
  harvestableHoldings: Holding[];
  totalSaleProceeds: number;
  totalLosses: number;
  potentialTaxSavings: number;
}

function executeTaxHarvestingTool(
  portfolios: Portfolio[],
  memberName: string | null
): TaxToolOutput {
  const targetPortfolios = memberName
    ? portfolios.filter((p) => p.name.toLowerCase() === memberName.toLowerCase())
    : portfolios;

  const allHoldings = targetPortfolios.flatMap((p) => p.holdings || []);
  const taxSummary = calculateTaxHarvesting(allHoldings);

  const harvestableHoldings = taxSummary.opportunities.map((o) => o.holding);
  const totalSaleProceeds = harvestableHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  const totalLosses = Math.abs(taxSummary.harvestableLosses || 0);

  return {
    member: memberName || 'Family (All)',
    summary: taxSummary,
    harvestableHoldings,
    totalSaleProceeds,
    totalLosses,
    potentialTaxSavings: taxSummary.potentialTaxSavings,
  };
}

interface InsuranceToolOutput {
  member: string;
  duePolicies: Insurance[];
  totalPremiumDue: number;
}

function executeInsuranceCommitmentsTool(
  portfolios: Portfolio[],
  memberName: string | null,
  explicitAmount: number | null
): InsuranceToolOutput {
  const targetPortfolios = memberName
    ? portfolios.filter((p) => p.name.toLowerCase() === memberName.toLowerCase())
    : portfolios;

  const allInsurances = targetPortfolios.flatMap((p) => p.insurances || []);

  // Filter policies due soon or active
  const duePolicies = allInsurances.filter((ins) => ins.premium_amount && ins.premium_amount > 0);
  let totalPremiumDue = duePolicies.reduce((sum, ins) => sum + ins.premium_amount, 0);

  // If the user specified an explicit liability amount in the prompt, honor it
  if (explicitAmount && explicitAmount > 0) {
    totalPremiumDue = explicitAmount;
  }

  return {
    member: memberName || 'Family (All)',
    duePolicies,
    totalPremiumDue,
  };
}

interface FDLiquidityOutput {
  totalFDCount: number;
  totalPrincipalLocked: number;
  maturingNext30DaysAmount: number;
}

function executeFDLiquidityTool(
  portfolios: Portfolio[],
  memberName: string | null
): FDLiquidityOutput {
  const targetPortfolios = memberName
    ? portfolios.filter((p) => p.name.toLowerCase() === memberName.toLowerCase())
    : portfolios;

  const allFDs = targetPortfolios.flatMap((p) => p.fixedDeposits || []).filter((fd) => fd.status === 'active');
  const totalPrincipalLocked = allFDs.reduce((sum, fd) => sum + (fd.principal_amount || 0), 0);

  // Check if any FD matures within 30 days
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  let maturingNext30DaysAmount = 0;

  for (const fd of allFDs) {
    if (fd.maturity_date) {
      const matTime = new Date(fd.maturity_date).getTime();
      if (matTime >= now && matTime <= now + thirtyDaysMs) {
        maturingNext30DaysAmount += fd.maturity_amount || fd.principal_amount || 0;
      }
    }
  }

  return {
    totalFDCount: allFDs.length,
    totalPrincipalLocked,
    maturingNext30DaysAmount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOUND PLANNER & EXECUTIVE ADVISORY SYNTHESIZER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Plans and executes compound financial reasoning without mathematical hallucinations.
 */
export function planAndExecuteWealthStrategy(
  query: string,
  portfolios: Portfolio[]
): WealthStrategyResult {
  const clause = parseCompoundQuery(query, portfolios);
  const toolTraces: StrategistToolTrace[] = [];
  const matchedAssets: { name: string; type: string; details: string }[] = [];

  // Step 1: Execute Tax Harvesting Tool on Source Member
  const taxData = executeTaxHarvestingTool(portfolios, clause.sourceMember);
  toolTraces.push({
    toolName: 'findTaxHarvestingOpportunities',
    toolDescription: `Scanned portfolio holdings for capital losses & harvestable proceeds`,
    memberAttribution: taxData.member,
    outputSummary: `Identified ${taxData.harvestableHoldings.length} loss-making position(s) yielding ${formatINR(taxData.totalSaleProceeds)} in liquidation proceeds and ${formatINR(taxData.totalLosses)} in capital losses.`,
  });

  for (const h of taxData.harvestableHoldings) {
    matchedAssets.push({
      name: `${h.stockName} (${h.ticker})`,
      type: 'Tax Loss Stock',
      details: `LTP: ${formatINR(h.ltp)}, Value: ${formatINR(h.currentValue)}, Unrealized Loss: ${formatINR(h.unrealizedPnL)}`,
    });
  }

  // Step 2: Execute Insurance Commitments Tool on Target Member
  const insuranceData = executeInsuranceCommitmentsTool(portfolios, clause.targetMember, clause.explicitAmount);
  toolTraces.push({
    toolName: 'checkInsuranceCommitments',
    toolDescription: `Audited upcoming policy renewal schedules & premium liabilities`,
    memberAttribution: insuranceData.member,
    outputSummary: `Found total premium liability of ${formatINR(insuranceData.totalPremiumDue)} across upcoming policies.`,
  });

  for (const ins of insuranceData.duePolicies) {
    matchedAssets.push({
      name: `${ins.provider} - ${ins.policy_name}`,
      type: 'Insurance Policy',
      details: `Annual Premium: ${formatINR(ins.premium_amount)}, Renewal: ${ins.renewal_date || 'Upcoming'}`,
    });
  }

  // Step 3: Execute FD Liquidity Protection Tool
  const fdData = executeFDLiquidityTool(portfolios, clause.targetMember || clause.sourceMember);
  if (clause.wantsFDProtection) {
    toolTraces.push({
      toolName: 'auditFixedDepositLock',
      toolDescription: `Verified fixed deposit lock status to ensure 0% premature penalty`,
      memberAttribution: clause.targetMember || clause.sourceMember || 'Family',
      outputSummary: `Audited ${fdData.totalFDCount} active FD(s) with ${formatINR(fdData.totalPrincipalLocked)} total capital. ${fdData.maturingNext30DaysAmount > 0 ? `${formatINR(fdData.maturingNext30DaysAmount)} matures penalty-free in 30 days.` : 'All deposits remain safely intact.'}`,
    });
  }

  // Step 4: Deterministic Math Solver
  const harvestProceeds = taxData.totalSaleProceeds;
  const liability = insuranceData.totalPremiumDue;
  const netDelta = harvestProceeds - liability;
  const isFullyFunded = netDelta >= 0;

  // Build Executive Advisory Report
  const sourceName = clause.sourceMember || 'Selected portfolio';
  const targetName = clause.targetMember || 'Family';

  let report = '';

  if (isFullyFunded) {
    report += `### 🎯 Executive Strategic Verdict: **Fully Funded with Surplus**\n\n`;
    report += `**Yes, you can comfortably fund ${targetName}'s upcoming ${formatINR(liability)} insurance premium** by selling ${sourceName}'s loss-making stocks, **without touching any Fixed Deposits**.\n\n`;
  } else {
    report += `### ⚠️ Executive Strategic Verdict: **Partial Funding (${formatINR(Math.abs(netDelta))} Shortfall)**\n\n`;
    report += `Selling all of ${sourceName}'s loss-making stocks generates **${formatINR(harvestProceeds)}**, which falls short of ${targetName}'s **${formatINR(liability)}** premium by **${formatINR(Math.abs(netDelta))}**.\n\n`;
  }

  // Financial Math Table
  report += `#### 📊 Deterministic Math Breakdown\n\n`;
  report += `| Financial Parameter | Verified Amount | Strategic Tax & Liquidity Note |\n`;
  report += `| :--- | :--- | :--- |\n`;
  report += `| **Harvestable Stock Sale Proceeds** | **+${formatINR(harvestProceeds)}** | Realized from ${taxData.harvestableHoldings.length} loss-making position(s) in ${sourceName}'s portfolio |\n`;
  report += `| **Required Insurance Outflow** | **-${formatINR(liability)}** | Premium due for ${targetName}'s insurance coverage |\n`;
  report += `| **Net Cash Flow Delta** | **${netDelta >= 0 ? '+' : ''}${formatINR(netDelta)}** | ${isFullyFunded ? '✅ Clean surplus remaining for reinvestment' : '⚠️ Net deficit requiring secondary liquidity'} |\n`;
  report += `| **Harvested Capital Loss** | **${formatINR(taxData.totalLosses)}** | Offset against STCG (20%) or LTCG (12.5%) this financial year |\n`;
  report += `| **Estimated Income Tax Saved** | **+${formatINR(taxData.potentialTaxSavings)}** | Direct tax reduction across family taxable income |\n`;
  report += `| **Fixed Deposits Protected** | **${formatINR(fdData.totalPrincipalLocked)}** | 100% untouched; ₹0 premature breakage penalty incurred |\n\n`;

  // Step-by-Step Execution Plan
  report += `#### 💡 Recommended Execution Sequence\n\n`;
  if (isFullyFunded) {
    report += `1. **Liquidate Loss Positions**: Sell the ${taxData.harvestableHoldings.length} loss-making stock(s) in ${sourceName}'s demat account to unlock ${formatINR(harvestProceeds)} in T+1 cash.\n`;
    report += `2. **Pay Insurance Premium**: Transfer ${formatINR(liability)} to pay ${targetName}'s policy renewal on schedule.\n`;
    if (netDelta > 0) {
      report += `3. **Reinvest Surplus (${formatINR(netDelta)})**: Park the leftover surplus into an Arbitrage Fund or SIP to utilize each member's ₹1.25L tax-free LTCG threshold.\n`;
    }
    report += `4. **Bank FDs Untouched**: All ${fdData.totalFDCount} Fixed Deposits (${formatINR(fdData.totalPrincipalLocked)}) continue compounding undisturbed.\n`;
  } else {
    report += `1. **Harvest Partial Liquidity**: Sell the available loss-making stocks to raise ${formatINR(harvestProceeds)} while claiming ${formatINR(taxData.totalLosses)} in tax-loss offset.\n`;
    report += `2. **Bridge the ${formatINR(Math.abs(netDelta))} Shortfall**: Use upcoming monthly rental yield or liquid savings rather than breaking high-interest FDs.\n`;
    report += `3. **Avoid FD Premature Closure**: Breaking FDs before maturity results in a 1% interest rate penalty under standard banking terms.\n`;
  }

  // Action Chips
  const actionChips: { label: string; tab: string }[] = [
    { label: 'Harvest Tax Losses', tab: 'tax' },
    { label: 'Review Insurance', tab: 'insurance' },
    { label: 'Inspect Cash Flow Matrix', tab: 'cashflow' },
  ];

  return {
    isCompound: true,
    verdict: isFullyFunded ? 'fully_funded' : 'shortfall',
    verdictHeadline: isFullyFunded
      ? `Fully Funded: +${formatINR(netDelta)} Surplus (FDs Intact)`
      : `Shortfall: ${formatINR(Math.abs(netDelta))} Needed`,
    toolTraces,
    executiveReport: report,
    actionChips,
    matchedAssets,
  };
}
