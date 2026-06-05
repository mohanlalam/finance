import { Portfolio } from '../types/portfolio';

import { formatINR } from './formatters';

export interface AssistantResponse {
  answer: string;
  matchedAssets: { name: string; type: string; details: string }[];
}

/**
 * Parses queries and executes rules client-side over portfolio data
 */
export function askAssistant(query: string, portfolios: Portfolio[]): AssistantResponse {
  const q = query.toLowerCase().trim();
  const matchedAssets: AssistantResponse['matchedAssets'] = [];

  // Query 1: "How much have I invested in mutual funds this year?"
  if (
    (q.includes('mutual fund') || q.includes('sip') || q.includes('funds')) &&
    (q.includes('invested') || q.includes('contribution')) &&
    (q.includes('this year') || q.includes('2026') || q.includes('current year'))
  ) {
    let totalInvested = 0;
    const currentYear = new Date().getFullYear();

    for (const p of portfolios) {
      if (p.sipAccounts) {
        for (const sip of p.sipAccounts) {
          const startDate = new Date(sip.start_date);
          const startYear = startDate.getFullYear();
          
          let monthsThisYear = 0;
          if (startYear < currentYear) {
            // Started in a prior year, count all elapsed months in current year (Jan-Jun 2026 = 6 months)
            monthsThisYear = new Date().getMonth() + 1;
          } else if (startYear === currentYear) {
            // Started this year
            monthsThisYear = new Date().getMonth() - startDate.getMonth() + 1;
          }
          
          if (monthsThisYear > 0) {
            const investedVal = sip.monthly_sip * monthsThisYear;
            totalInvested += investedVal;
            matchedAssets.push({
              name: sip.fund_name,
              type: 'Mutual Fund SIP',
              details: `Monthly SIP: ${formatINR(sip.monthly_sip)} (Invested ${monthsThisYear} months in 2026: ${formatINR(investedVal)})`,
            });
          }
        }
      }
    }

    return {
      answer: `You have invested a total of **${formatINR(totalInvested)}** in Mutual Fund SIPs during the current calendar year (2026).`,
      matchedAssets,
    };
  }

  // Query 2: "Which asset gave the highest return?"
  if (
    q.includes('highest return') ||
    q.includes('best return') ||
    q.includes('top return') ||
    q.includes('maximum return') ||
    q.includes('best performing') ||
    q.includes('highest gain')
  ) {
    let highestReturnVal = -99999999;
    let bestAsset: { name: string; type: string; gain: number; gainPct: number } | null = null;

    // Check Stocks
    for (const p of portfolios) {
      for (const h of p.holdings) {
        if (h.unrealizedPnL > highestReturnVal) {
          highestReturnVal = h.unrealizedPnL;
          bestAsset = {
            name: `${h.stockName} (${h.ticker})`,
            type: 'Stock Holding',
            gain: h.unrealizedPnL,
            gainPct: h.pnlPercent,
          };
        }
      }
    }

    // Check Gold
    for (const p of portfolios) {
      for (const g of p.goldHoldings) {
        const gain = g.current_valuation - g.purchase_price;
        const gainPct = g.purchase_price > 0 ? (gain / g.purchase_price) * 100 : 0;
        if (gain > highestReturnVal) {
          highestReturnVal = gain;
          bestAsset = {
            name: g.item_name,
            type: 'Gold Registry',
            gain,
            gainPct,
          };
        }
      }
    }

    // Check Real Estate
    for (const p of portfolios) {
      for (const re of p.realEstate) {
        const gain = re.current_valuation - re.purchase_price;
        const gainPct = re.purchase_price > 0 ? (gain / re.purchase_price) * 100 : 0;
        if (gain > highestReturnVal) {
          highestReturnVal = gain;
          bestAsset = {
            name: re.property_name,
            type: 'Real Estate Property',
            gain,
            gainPct,
          };
        }
      }
    }

    if (bestAsset) {
      matchedAssets.push({
        name: bestAsset.name,
        type: bestAsset.type,
        details: `Return: +${formatINR(bestAsset.gain)} (+${bestAsset.gainPct.toFixed(1)}%)`,
      });
      return {
        answer: `Your highest returning asset by absolute gain is **${bestAsset.name}** (${bestAsset.type}), with a total return of **+${formatINR(bestAsset.gain)}** (+${bestAsset.gainPct.toFixed(1)}%).`,
        matchedAssets,
      };
    }

    return {
      answer: 'Could not determine the highest return asset. Make sure you have entered purchase prices for your holdings.',
      matchedAssets,
    };
  }

  // Query 3: "Show all investments maturing in 2027"
  if (q.includes('maturing') || q.includes('maturity')) {
    const yearMatch = q.match(/\b(202\d|203\d)\b/);
    const targetYear = yearMatch ? yearMatch[0] : null;

    if (targetYear) {

      // Check FDs
      for (const p of portfolios) {
        for (const fd of p.fixedDeposits) {
          if (fd.maturity_date && fd.maturity_date.startsWith(targetYear)) {
            matchedAssets.push({
              name: `${fd.bank_name} FD`,
              type: 'Fixed Deposit',
              details: `Matures on ${fd.maturity_date}. Principal: ${formatINR(fd.principal_amount)}. Maturity Value: ${formatINR(fd.maturity_amount)}.`,
            });
          }
        }
      }

      // Check RDs
      for (const p of portfolios) {
        if (p.rdAccounts) {
          for (const rd of p.rdAccounts) {
            if (rd.maturity_date && rd.maturity_date.startsWith(targetYear)) {
              matchedAssets.push({
                name: `${rd.bank_name} RD`,
                type: 'Recurring Deposit',
                details: `Matures on ${rd.maturity_date}. Monthly: ${formatINR(rd.monthly_deposit)}. Maturity Value: ${formatINR(rd.maturity_amount)}.`,
              });
            }
          }
        }
      }

      // Check SSYs
      for (const p of portfolios) {
        if (p.ssyAccounts) {
          for (const ssy of p.ssyAccounts) {
            if (ssy.maturity_date && ssy.maturity_date.startsWith(targetYear)) {
              matchedAssets.push({
                name: `${ssy.bank_name} SSY`,
                type: 'Sukanya Samriddhi Yojana',
                details: `Matures on ${ssy.maturity_date}. Target Annual: ${formatINR(ssy.annual_deposit)}. Maturity Value: ${formatINR(ssy.maturity_amount)}.`,
              });
            }
          }
        }
      }

      if (matchedAssets.length > 0) {
        return {
          answer: `Found **${matchedAssets.length}** investments maturing in **${targetYear}**:`,
          matchedAssets,
        };
      } else {
        return {
          answer: `You do not have any Fixed Deposits, Recurring Deposits, or SSY accounts maturing in the year **${targetYear}**.`,
          matchedAssets,
        };
      }
    }
  }

  // General FAQ matching or fallback
  if (q.includes('net worth') || q.includes('wealth') || q.includes('total value')) {
    const totalCurrentVal = portfolios.reduce((s, p) => s + p.totalCurrentValue, 0);
    const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0);
    return {
      answer: `Your total consolidated family net worth today is **${formatINR(totalCurrentVal)}** on an invested capital of **${formatINR(totalInvested)}** (P&L: **+${formatINR(totalCurrentVal - totalInvested)}**).`,
      matchedAssets: [],
    };
  }

  if (q.includes('insurance') || q.includes('policy') || q.includes('term') || q.includes('health')) {
    let count = 0;
    let sumCover = 0;
    for (const p of portfolios) {
      count += p.insurances.length;
      sumCover += p.insurances.reduce((s, i) => s + i.sum_assured, 0);
    }
    return {
      answer: `You have **${count}** active insurance policies with a total combined sum assured cover of **${formatINR(sumCover)}**.`,
      matchedAssets: [],
    };
  }

  return {
    answer: "I couldn't match your exact query. Try asking something like:\n- *'How much have I invested in mutual funds this year?'*\n- *'Which asset gave the highest return?'*\n- *'Show all investments maturing in 2027'*",
    matchedAssets: [],
  };
}
