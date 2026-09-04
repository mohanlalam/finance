import { Portfolio } from '../../../types/portfolio';
import { isCompoundWealthQuery, planAndExecuteWealthStrategy } from './wealthStrategistEngine';
import { Intent, detectIntent } from './intentClassifier';
import { AssistantResponse, ActionChip, formatGainINR } from './assistantTypes';

import {
  handleNetWorth,
  handleEmergencyFund,
  handleAllocationSplit,
  handleFamilyBreakdown,
} from './intents/wealthIntents';
import {
  handleMutualFundYearInvestments,
  handleSpecificGold,
  handleSpecificMutualFunds,
  handleSpecificStocks,
  handleSpecificFDs,
  handleRentalYield,
} from './intents/assetIntents';
import {
  handleMaturityTimeline,
  handleInsuranceReminders,
  handleNextSIPDate,
  handleExpiredDocuments,
} from './intents/timelineIntents';
import {
  handlePerformers,
  handleComprehensiveSearch,
} from './intents/performanceIntents';

export type { ActionChip, AssistantResponse };
export { formatGainINR };
export { Intent, normalizeQuery, detectIntent, hasSearchMatches } from './intentClassifier';

/**
 * Parses queries and executes rules client-side over portfolio data
 */
export function askAssistant(query: string, portfolios: Portfolio[]): AssistantResponse {
  // Check for Compound Wealth Reasoning first
  if (isCompoundWealthQuery(query)) {
    const compoundResult = planAndExecuteWealthStrategy(query, portfolios);
    return {
      answer: compoundResult.executiveReport,
      matchedAssets: compoundResult.matchedAssets,
      toolsUsed: compoundResult.toolTraces.map((t) => ({
        toolName: t.toolName,
        description: t.toolDescription,
        summary: t.outputSummary,
      })),
      actionChips: compoundResult.actionChips,
      verdictHeadline: compoundResult.verdictHeadline,
    };
  }

  const q = query.toLowerCase().trim();
  const intent = detectIntent(q, portfolios);

  // Intent: Mutual Fund current year investments
  if (intent === Intent.MUTUAL_FUND_YEAR_INVESTMENTS) {
    return handleMutualFundYearInvestments(portfolios);
  }

  // Intent: Performer Queries
  if (intent === Intent.PERFORMERS) {
    return handlePerformers(portfolios);
  }

  // Intent: Maturity / Upcoming timeline
  if (intent === Intent.MATURITY_TIMELINE) {
    return handleMaturityTimeline(q, portfolios);
  }

  // Aggregate values needed for allocation & specific classes
  let stocksTotal = 0;
  let goldTotal = 0;
  let realEstateTotal = 0;
  let fdTotal = 0;
  let rdTotal = 0;
  let sipTotal = 0;

  for (const p of portfolios) {
    stocksTotal += p.stocksValue || 0;
    goldTotal += p.goldValue || 0;
    realEstateTotal += p.realEstateValue || 0;
    fdTotal += p.fdValue || 0;
    rdTotal += p.rdValue || 0;
    sipTotal += p.sipValue || 0;
  }

  const equityTotal = stocksTotal + sipTotal;
  const debtTotal = fdTotal + rdTotal;
  const totalVal = equityTotal + debtTotal + goldTotal + realEstateTotal;

  // Intent: Allocation Split
  if (intent === Intent.ALLOCATION_SPLIT) {
    return handleAllocationSplit(
      totalVal,
      equityTotal,
      debtTotal,
      stocksTotal,
      sipTotal,
      fdTotal,
      rdTotal,
      goldTotal,
      realEstateTotal
    );
  }

  // Intent: Specific Asset Classes
  if (intent === Intent.SPECIFIC_GOLD) {
    return handleSpecificGold(portfolios, totalVal, goldTotal);
  }

  if (intent === Intent.SPECIFIC_MUTUAL_FUNDS) {
    return handleSpecificMutualFunds(portfolios, totalVal, sipTotal);
  }

  if (intent === Intent.SPECIFIC_STOCKS) {
    return handleSpecificStocks(portfolios, totalVal, stocksTotal);
  }

  if (intent === Intent.SPECIFIC_FDS) {
    return handleSpecificFDs(portfolios, totalVal, fdTotal);
  }

  // Intent: Insurance Reminders
  if (intent === Intent.INSURANCE_REMINDERS) {
    return handleInsuranceReminders(portfolios);
  }

  // Intent: Next SIP Date
  if (intent === Intent.NEXT_SIP_DATE) {
    return handleNextSIPDate(portfolios);
  }

  // Intent: Family Member Breakdown
  if (intent === Intent.FAMILY_BREAKDOWN) {
    return handleFamilyBreakdown(portfolios);
  }

  // Intent: Net Worth
  if (intent === Intent.NET_WORTH) {
    return handleNetWorth(portfolios);
  }

  // Intent: Emergency Fund
  if (intent === Intent.EMERGENCY_FUND) {
    return handleEmergencyFund(portfolios);
  }

  // Intent: Rental Yield
  if (intent === Intent.RENTAL_YIELD) {
    return handleRentalYield(portfolios);
  }

  // Intent: Expired Documents
  if (intent === Intent.EXPIRED_DOCUMENTS) {
    return handleExpiredDocuments(portfolios);
  }

  // Intent: Comprehensive Search Fallback
  if (intent === Intent.COMPREHENSIVE_SEARCH) {
    return handleComprehensiveSearch(q, portfolios);
  }

  return {
    answer: "I couldn't match your exact query. Try asking something like:\n- *'Which of my assets is the top performer?'*\n- *'Show all upcoming maturities'* (or maturities in a specific year like *'maturing in 2027'*)\n- *'What is my current asset allocation split?'*\n- *'Show all insurance due dates and reminders'*",
    matchedAssets: [],
  };
}
