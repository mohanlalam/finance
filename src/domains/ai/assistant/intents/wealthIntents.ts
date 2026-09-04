import { Portfolio } from '../../../../types/portfolio';
import { formatINR } from '../../../../utils/formatters';
import { AssistantResponse, formatGainINR } from '../assistantTypes';

export function handleNetWorth(portfolios: Portfolio[]): AssistantResponse {
  const totalCurrentVal = portfolios.reduce((s, p) => s + p.totalCurrentValue, 0);
  const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0);
  const pnl = totalCurrentVal - totalInvested;
  const pnlStr = formatGainINR(pnl);
  return {
    answer: `Your total consolidated family net worth today is **${formatINR(totalCurrentVal)}** on an invested capital of **${formatINR(totalInvested)}** (P&L: **${pnlStr}**).`,
    matchedAssets: [],
  };
}

export function handleEmergencyFund(portfolios: Portfolio[]): AssistantResponse {
  let totalFDVal = 0;
  let totalRDVal = 0;

  for (const p of portfolios) {
    totalFDVal += p.fdValue || 0;
    totalRDVal += p.rdValue || 0;
  }

  const emergencyPool = totalFDVal + totalRDVal;
  const MONTHLY_EXPENSE = 50000;
  const monthsCovered = MONTHLY_EXPENSE > 0 ? emergencyPool / MONTHLY_EXPENSE : 0;

  let answer = `### 🚨 Emergency Fund Analysis\n`;
  answer += `Your emergency/liquid capital consists of Fixed Deposits and Recurring Deposits:\n\n`;
  answer += `- **Total liquid capital**: **${formatINR(emergencyPool)}**\n`;
  answer += `  * Fixed Deposits: ${formatINR(totalFDVal)}\n`;
  answer += `  * Recurring Deposits: ${formatINR(totalRDVal)}\n`;
  answer += `- **Assumed monthly expense baseline**: **${formatINR(MONTHLY_EXPENSE)}/month**\n\n`;

  answer += `| Metric | Value | Rating |\n`;
  answer += `| :--- | :---: | :---: |\n`;
  answer += `| Months Covered | ${monthsCovered.toFixed(1)} months | ${monthsCovered >= 6 ? '✅ Solid (Excellent)' : monthsCovered >= 3 ? '⚠️ Moderate (Warning)' : '🚨 High Risk (Critical)'} |\n\n`;

  if (monthsCovered >= 6) {
    answer += `✓ Your emergency pool covers more than 6 months of baseline living expenses. You have a very healthy buffer.`;
  } else if (monthsCovered >= 3) {
    answer += `⚠ Your emergency fund covers ${monthsCovered.toFixed(1)} months of expenses. It is recommended to boost your deposits to reach at least 6 months of coverage (${formatINR(MONTHLY_EXPENSE * 6)}).`;
  } else {
    answer += `🚨 **Critical Alert**: Your emergency fund covers less than 3 months of expenses. You should prioritize creating additional liquid deposits to protect against sudden income loss or health crises.`;
  }

  return {
    answer,
    matchedAssets: [],
  };
}

export function handleAllocationSplit(
  totalVal: number,
  equityTotal: number,
  debtTotal: number,
  stocksTotal: number,
  sipTotal: number,
  fdTotal: number,
  rdTotal: number,
  goldTotal: number,
  realEstateTotal: number
): AssistantResponse {
  if (totalVal === 0) {
    return {
      answer: 'Your total portfolio valuation is currently zero. Add assets to see your allocation distribution.',
      matchedAssets: [],
    };
  }

  const eqPct = (equityTotal / totalVal) * 100;
  const dbPct = (debtTotal / totalVal) * 100;
  const gdPct = (goldTotal / totalVal) * 100;
  const rePct = (realEstateTotal / totalVal) * 100;

  const getProgressBar = (pct: number) => {
    const filled = Math.min(10, Math.round(pct / 10));
    const empty = 10 - filled;
    return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\``;
  };

  let answer = `### 📊 Consolidated Asset Allocation Split\n`;
  answer += `Your total consolidated family net worth is **${formatINR(totalVal)}**:\n\n`;
  answer += `- **Equity (Stocks + Mutual Funds)**: **${formatINR(equityTotal)}** (${eqPct.toFixed(1)}%) ${getProgressBar(eqPct)}\n`;
  answer += `  * Direct Stocks: ${formatINR(stocksTotal)}\n`;
  answer += `  * Mutual Fund SIPs: ${formatINR(sipTotal)}\n`;
  answer += `- **Debt (FD + RD)**: **${formatINR(debtTotal)}** (${dbPct.toFixed(1)}%) ${getProgressBar(dbPct)}\n`;
  answer += `  * Fixed Deposits: ${formatINR(fdTotal)}\n`;
  answer += `  * Recurring Deposits: ${formatINR(rdTotal)}\n`;
  answer += `- **Gold**: **${formatINR(goldTotal)}** (${gdPct.toFixed(1)}%) ${getProgressBar(gdPct)}\n`;
  answer += `- **Real Estate**: **${formatINR(realEstateTotal)}** (${rePct.toFixed(1)}%) ${getProgressBar(rePct)}\n`;

  return {
    answer,
    matchedAssets: [
      { name: 'Equity Class', type: 'Allocation', details: `${eqPct.toFixed(1)}% (${formatINR(equityTotal)})` },
      { name: 'Debt Class', type: 'Allocation', details: `${dbPct.toFixed(1)}% (${formatINR(debtTotal)})` },
      { name: 'Gold Class', type: 'Allocation', details: `${gdPct.toFixed(1)}% (${formatINR(goldTotal)})` },
      { name: 'Real Estate Class', type: 'Allocation', details: `${rePct.toFixed(1)}% (${formatINR(realEstateTotal)})` },
    ],
  };
}

export function handleFamilyBreakdown(portfolios: Portfolio[]): AssistantResponse {
  let answer = `### 👥 Family Member Portfolio Breakdown\n\n`;
  const matched: AssistantResponse['matchedAssets'] = [];

  portfolios.forEach(p => {
    const invested = p.totalInvested;
    const current = p.totalCurrentValue;
    const pnl = current - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    const sign = pnl >= 0 ? '+' : '';

    answer += `- **${p.label}**: Net Worth **${formatINR(current)}** on invested capital of **${formatINR(invested)}** (P&L: **${sign}${formatINR(pnl)}** or **${sign}${pnlPct.toFixed(1)}%**).\n`;

    matched.push({
      name: p.label,
      type: 'Family Portfolio',
      details: `Invested: ${formatINR(invested)}, Current: ${formatINR(current)}, P&L: ${sign}${formatINR(pnl)} (${sign}${pnlPct.toFixed(1)}%)`
    });
  });

  return { answer, matchedAssets: matched };
}
