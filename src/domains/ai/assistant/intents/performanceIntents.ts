import { Portfolio } from '../../../../types/portfolio';
import { formatINR } from '../../../../utils/formatters';
import { getFDInvestedAmount, getFDEffectiveValue } from '../../../assets/fd/calculations/fdCompounding';
import { getRDInvestedAmount, getRDEffectiveValue } from '../../../assets/rd/calculations/rdCompounding';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../../../assets/sip/calculations/sipValuation';
import { AssistantResponse, formatGainINR } from '../assistantTypes';

export function handlePerformers(portfolios: Portfolio[]): AssistantResponse {
  interface AssetDetail {
    name: string;
    type: string;
    invested: number;
    value: number;
    gain: number;
    gainPct: number;
  }

  const allAssets: AssetDetail[] = [];

  for (const p of portfolios) {
    // Stocks
    for (const h of p.holdings) {
      allAssets.push({
        name: `${h.stockName} (${h.ticker})`,
        type: 'Stock Holding',
        invested: h.amountInvested,
        value: h.currentValue,
        gain: h.unrealizedPnL,
        gainPct: h.pnlPercent,
      });
    }

    // Gold
    for (const g of p.goldHoldings) {
      const val = Number(g.current_valuation) || 0;
      const inv = Number(g.purchase_price) || 0;
      const gain = val - inv;
      const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
      allAssets.push({
        name: g.item_name,
        type: 'Gold Registry',
        invested: inv,
        value: val,
        gain,
        gainPct,
      });
    }

    // Real Estate
    for (const re of p.realEstate) {
      const val = Number(re.current_valuation) || 0;
      const inv = Number(re.purchase_price) || 0;
      const gain = val - inv;
      const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
      allAssets.push({
        name: re.property_name,
        type: 'Real Estate Property',
        invested: inv,
        value: val,
        gain,
        gainPct,
      });
    }

    // Fixed Deposits
    for (const fd of p.fixedDeposits) {
      const inv = getFDInvestedAmount(fd);
      const val = getFDEffectiveValue(fd);
      const gain = val - inv;
      const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
      allAssets.push({
        name: `${fd.bank_name} FD`,
        type: 'Fixed Deposit',
        invested: inv,
        value: val,
        gain,
        gainPct,
      });
    }

    // Recurring Deposits
    if (p.rdAccounts) {
      for (const rd of p.rdAccounts) {
        const inv = getRDInvestedAmount(rd);
        const val = getRDEffectiveValue(rd);
        const gain = val - inv;
        const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
        allAssets.push({
          name: `${rd.bank_name} RD`,
          type: 'Recurring Deposit',
          invested: inv,
          value: val,
          gain,
          gainPct,
        });
      }
    }

    // Mutual Fund SIPs
    if (p.sipAccounts) {
      for (const sip of p.sipAccounts) {
        const inv = getSIPInvestedAmount(sip);
        const val = getSIPEffectiveValue(sip);
        const gain = val - inv;
        const gainPct = inv > 0 ? (gain / inv) * 100 : 0;
        allAssets.push({
          name: sip.fund_name,
          type: 'Mutual Fund SIP',
          invested: inv,
          value: val,
          gain,
          gainPct,
        });
      }
    }
  }

  const validAssets = allAssets.filter(a => a.invested > 0);
  if (validAssets.length === 0) {
    return {
      answer: 'Could not determine the highest return asset. Make sure you have entered purchase prices and balances for your holdings.',
      matchedAssets: [],
    };
  }

  const sortedByGain = [...validAssets].sort((a, b) => b.gain - a.gain);
  const sortedByPct = [...validAssets].sort((a, b) => b.gainPct - a.gainPct);

  const topAbs = sortedByGain[0];
  const topPct = sortedByPct[0];

  let answer = `Your absolute highest-returning asset is **${topAbs.name}** (${topAbs.type}) with a total return of **${formatGainINR(topAbs.gain)}** (+${topAbs.gainPct.toFixed(1)}%).\n\n`;
  if (topPct.name !== topAbs.name) {
    answer += `By percentage rate of return, your best performing asset is **${topPct.name}** (${topPct.type}) with a return of **+${topPct.gainPct.toFixed(1)}%** (${formatGainINR(topPct.gain)} absolute gain).\n\n`;
  }

  answer += `### Top 3 Assets by Absolute Return:\n`;
  const top3 = sortedByGain.slice(0, 3);
  top3.forEach((asset, idx) => {
    answer += `${idx + 1}. **${asset.name}** (${asset.type}): **${formatGainINR(asset.gain)}** (+${asset.gainPct.toFixed(1)}%)\n`;
  });

  return {
    answer,
    matchedAssets: top3.map(a => ({ name: a.name, type: a.type, details: `Gain: ${formatGainINR(a.gain)} (+${a.gainPct.toFixed(1)}%)` })),
  };
}

export function handleComprehensiveSearch(query: string, portfolios: Portfolio[]): AssistantResponse {
  const searchTerms = query.split(/\s+/).filter(w => w.length > 2);
  let answer = `### 🔍 Consolidated Search Results\n`;
  answer += `Scanned all family registries for terms matching: ${searchTerms.map(t => `*"${t}"*`).join(', ')}\n\n`;

  const matched: AssistantResponse['matchedAssets'] = [];

  const addMatch = (name: string, type: string, details: string) => {
    matched.push({ name, type, details });
  };

  for (const p of portfolios) {
    // Match holdings
    for (const h of p.holdings) {
      if (searchTerms.some(t => h.ticker.toLowerCase().includes(t) || h.stockName.toLowerCase().includes(t))) {
        addMatch(`${h.stockName} (${h.ticker})`, 'Stock Holding', `Owner: ${p.label}, Qty: ${h.qty}, Current Value: ${formatINR(h.currentValue)}`);
      }
    }

    // Match FDs
    for (const fd of p.fixedDeposits) {
      if (searchTerms.some(t => fd.bank_name.toLowerCase().includes(t) || (fd.notes && fd.notes.toLowerCase().includes(t)))) {
        const val = getFDEffectiveValue(fd);
        addMatch(`${fd.bank_name} FD`, 'Fixed Deposit', `Owner: ${p.label}, Principal: ${formatINR(fd.principal_amount)}, Current Value: ${formatINR(val)}`);
      }
    }

    // Match RDs
    if (p.rdAccounts) {
      for (const rd of p.rdAccounts) {
        if (searchTerms.some(t => rd.bank_name.toLowerCase().includes(t) || (rd.notes && rd.notes.toLowerCase().includes(t)))) {
          const val = getRDEffectiveValue(rd);
          addMatch(`${rd.bank_name} RD`, 'Recurring Deposit', `Owner: ${p.label}, Monthly: ${formatINR(rd.monthly_deposit)}, Current Value: ${formatINR(val)}`);
        }
      }
    }

    // Match SIPs
    if (p.sipAccounts) {
      for (const sip of p.sipAccounts) {
        if (searchTerms.some(t => sip.fund_name.toLowerCase().includes(t) || (sip.notes && sip.notes.toLowerCase().includes(t)))) {
          const val = getSIPEffectiveValue(sip);
          addMatch(sip.fund_name, 'Mutual Fund SIP', `Owner: ${p.label}, Monthly: ${formatINR(sip.monthly_sip)}, Current Value: ${formatINR(val)}`);
        }
      }
    }

    // Match Gold
    for (const g of p.goldHoldings) {
      if (searchTerms.some(t => g.item_name.toLowerCase().includes(t) || g.purity.toLowerCase().includes(t) || (g.notes && g.notes.toLowerCase().includes(t)))) {
        addMatch(g.item_name, 'Gold Holding', `Owner: ${p.label}, Wt: ${g.weight_grams}g (${g.purity}), Current Value: ${formatINR(g.current_valuation)}`);
      }
    }

    // Match Real Estate
    for (const re of p.realEstate) {
      if (searchTerms.some(t => re.property_name.toLowerCase().includes(t) || re.property_type.toLowerCase().includes(t) || (re.location && re.location.toLowerCase().includes(t)))) {
        addMatch(re.property_name, 'Real Estate', `Owner: ${p.label}, Type: ${re.property_type}, Valuation: ${formatINR(re.current_valuation)}`);
      }
    }

    // Match Insurance
    for (const ins of p.insurances) {
      if (searchTerms.some(t => ins.provider.toLowerCase().includes(t) || ins.policy_name.toLowerCase().includes(t) || ins.insurance_type.toLowerCase().includes(t))) {
        addMatch(`${ins.provider} - ${ins.policy_name}`, 'Insurance Policy', `Owner: ${p.label}, Type: ${ins.insurance_type.toUpperCase()}, Sum Assured: ${formatINR(ins.sum_assured)}`);
      }
    }

    // Match Documents
    for (const doc of p.documents) {
      if (searchTerms.some(t => doc.name.toLowerCase().includes(t) || doc.file_path.toLowerCase().includes(t) || doc.asset_type.toLowerCase().includes(t))) {
        addMatch(doc.name, 'Document', `Owner: ${p.label}, Class: ${doc.asset_type.toUpperCase()}, Expiry: ${doc.expiry_date || 'N/A'}`);
      }
    }
  }

  if (matched.length === 0) {
    answer += `No matching asset names, symbols, bank labels, or documents found for *"${query}"*. Try a different query.`;
  } else {
    answer += `Found **${matched.length}** matches across your family wealth registry:\n\n`;
    answer += `| Asset Class | Matched Name | Description |\n`;
    answer += `| :--- | :--- | :--- |\n`;
    matched.forEach(m => {
      answer += `| **${m.type}** | ${m.name} | ${m.details} |\n`;
    });
  }

  return {
    answer,
    matchedAssets: matched.slice(0, 8)
  };
}
