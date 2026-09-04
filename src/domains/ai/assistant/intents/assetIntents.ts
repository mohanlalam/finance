import { Portfolio } from '../../../../types/portfolio';
import { formatINR, formatINRCompact } from '../../../../utils/formatters';
import { getFDEffectiveValue } from '../../../assets/fd/calculations/fdCompounding';
import { getSIPEffectiveValue } from '../../../assets/sip/calculations/sipValuation';
import { AssistantResponse } from '../assistantTypes';

export function handleMutualFundYearInvestments(portfolios: Portfolio[]): AssistantResponse {
  let totalInvested = 0;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const matchedAssets: AssistantResponse['matchedAssets'] = [];

  for (const p of portfolios) {
    if (p.sipAccounts) {
      for (const sip of p.sipAccounts) {
        const startDate = new Date(sip.start_date);
        const startYear = startDate.getFullYear();

        let monthsThisYear = 0;
        if (startYear < currentYear) {
          monthsThisYear = currentMonth + 1;
        } else if (startYear === currentYear) {
          monthsThisYear = currentMonth - startDate.getMonth() + 1;
        }

        if (monthsThisYear > 0) {
          const investedVal = sip.monthly_sip * monthsThisYear;
          totalInvested += investedVal;
          matchedAssets.push({
            name: sip.fund_name,
            type: 'Mutual Fund SIP',
            details: `Monthly SIP: ${formatINR(sip.monthly_sip)} (Invested ${monthsThisYear} months in ${currentYear}: ${formatINR(investedVal)})`,
          });
        }
      }
    }
  }

  return {
    answer: `You have invested a total of **${formatINR(totalInvested)}** in Mutual Fund SIPs during the current calendar year (${currentYear}).`,
    matchedAssets,
  };
}

export function handleSpecificGold(portfolios: Portfolio[], totalVal: number, goldTotal: number): AssistantResponse {
  const gdPct = totalVal > 0 ? (goldTotal / totalVal) * 100 : 0;
  let answer = `You have **${formatINR(goldTotal)}** in Gold Registry holdings, representing **${gdPct.toFixed(1)}%** of your total portfolio.\n\n`;
  answer += `### Gold Inventory:\n`;
  const goldList: AssistantResponse['matchedAssets'] = [];
  for (const p of portfolios) {
    for (const g of p.goldHoldings) {
      answer += `- **${g.item_name}** (${g.purity}, ${g.weight_grams}g): current valuation **${formatINR(g.current_valuation)}**.\n`;
      goldList.push({ name: g.item_name, type: 'Gold', details: `${g.weight_grams}g (${g.purity}) - Value: ${formatINR(g.current_valuation)}` });
    }
  }
  return { answer, matchedAssets: goldList };
}

export function handleSpecificMutualFunds(portfolios: Portfolio[], totalVal: number, sipTotal: number): AssistantResponse {
  const mfPct = totalVal > 0 ? (sipTotal / totalVal) * 100 : 0;
  let answer = `You have **${formatINR(sipTotal)}** in Mutual Fund SIPs, representing **${mfPct.toFixed(1)}%** of your total portfolio.\n\n`;
  answer += `### Mutual Fund Holdings:\n`;
  const sipList: AssistantResponse['matchedAssets'] = [];
  for (const p of portfolios) {
    if (p.sipAccounts) {
      for (const sip of p.sipAccounts) {
        const val = getSIPEffectiveValue(sip);
        answer += `- **${sip.fund_name}**: Monthly SIP **${formatINR(sip.monthly_sip)}** (Current Val: **${formatINR(val)}**).\n`;
        sipList.push({ name: sip.fund_name, type: 'Mutual Fund SIP', details: `Monthly: ${formatINR(sip.monthly_sip)}, Value: ${formatINR(val)}` });
      }
    }
  }
  return { answer, matchedAssets: sipList };
}

export function handleSpecificStocks(portfolios: Portfolio[], totalVal: number, stocksTotal: number): AssistantResponse {
  const stPct = totalVal > 0 ? (stocksTotal / totalVal) * 100 : 0;
  let answer = `You have **${formatINR(stocksTotal)}** in direct Stocks, representing **${stPct.toFixed(1)}%** of your total portfolio.\n\n`;
  answer += `### Stock Portfolio List:\n`;
  const stockList: AssistantResponse['matchedAssets'] = [];
  for (const p of portfolios) {
    for (const h of p.holdings) {
      answer += `- **${h.stockName} (${h.ticker})**: ${h.qty} shares @ avg price ${formatINR(h.avgPrice)} (Current Val: **${formatINR(h.currentValue)}**, P&L: **${formatINR(h.unrealizedPnL)}**).\n`;
      stockList.push({ name: h.stockName, type: 'Stock', details: `${h.qty} shares - Value: ${formatINR(h.currentValue)} (P&L: ${formatINR(h.unrealizedPnL)})` });
    }
  }
  return { answer, matchedAssets: stockList };
}

export function handleSpecificFDs(portfolios: Portfolio[], totalVal: number, fdTotal: number): AssistantResponse {
  const fdPct = totalVal > 0 ? (fdTotal / totalVal) * 100 : 0;
  let answer = `You have **${formatINR(fdTotal)}** in Fixed Deposits, representing **${fdPct.toFixed(1)}%** of your total portfolio.\n\n`;
  answer += `### Fixed Deposits:\n`;
  const fdList: AssistantResponse['matchedAssets'] = [];
  for (const p of portfolios) {
    for (const fd of p.fixedDeposits) {
      const val = getFDEffectiveValue(fd);
      answer += `- **${fd.bank_name} FD**: Principal **${formatINR(fd.principal_amount)}** @ ${fd.interest_rate}% (Current Val: **${formatINR(val)}**).\n`;
      fdList.push({ name: `${fd.bank_name} FD`, type: 'Fixed Deposit', details: `Principal: ${formatINR(fd.principal_amount)}, Value: ${formatINR(val)}` });
    }
  }
  return { answer, matchedAssets: fdList };
}

export function handleRentalYield(portfolios: Portfolio[]): AssistantResponse {
  interface PropertyYield {
    name: string;
    owner: string;
    purchasePrice: number;
    currentVal: number;
    monthlyRent: number;
    annualRent: number;
    yieldPct: number;
  }

  const props: PropertyYield[] = [];
  for (const p of portfolios) {
    for (const re of p.realEstate) {
      const annualRent = (Number(re.monthly_rent) || 0) * 12;
      const denominator = Number(re.purchase_price) > 0 
        ? Number(re.purchase_price) 
        : (Number(re.current_valuation) > 0 ? Number(re.current_valuation) : 0);
      const yieldPct = denominator > 0 ? (annualRent / denominator) * 100 : 0;
      props.push({
        name: re.property_name,
        owner: p.label,
        purchasePrice: re.purchase_price,
        currentVal: re.current_valuation,
        monthlyRent: re.monthly_rent,
        annualRent,
        yieldPct
      });
    }
  }

  if (props.length === 0) {
    return {
      answer: "You do not have any Real Estate properties registered in your portfolio database.",
      matchedAssets: []
    };
  }

  const sortedProps = [...props].sort((a, b) => b.yieldPct - a.yieldPct);

  let answer = `### 🏢 Real Estate Rental Yields\n`;
  answer += `Rental yields are calculated as: \`(Monthly Rent × 12) ÷ Purchase Price × 100\`\n\n`;

  answer += `| Property Name | Owner | Purchase Price | Monthly Rent | Annual Rent | Yield % |\n`;
  answer += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`;

  const matched: AssistantResponse['matchedAssets'] = [];

  sortedProps.forEach(pr => {
    answer += `| **${pr.name}** | ${pr.owner} | ${formatINRCompact(pr.purchasePrice)} | ${formatINRCompact(pr.monthlyRent)} | ${formatINRCompact(pr.annualRent)} | **${pr.yieldPct.toFixed(2)}%** |\n`;
    matched.push({
      name: pr.name,
      type: 'Real Estate Property',
      details: `Rent: ${formatINR(pr.monthlyRent)}/mo (Yield: ${pr.yieldPct.toFixed(2)}%)`
    });
  });

  const highestYield = sortedProps[0];
  answer += `\n💡 **Insights**: The highest yielding property is **${highestYield.name}** owned by **${highestYield.owner}** with a yield rate of **${highestYield.yieldPct.toFixed(2)}%**.`;

  return {
    answer,
    matchedAssets: matched
  };
}
