import { Portfolio } from '../../../../types/portfolio';
import { formatINR } from '../../../../utils/formatters';
import { AssistantResponse } from '../assistantTypes';

export function handleMaturityTimeline(query: string, portfolios: Portfolio[]): AssistantResponse {
  interface MaturityItem {
    name: string;
    type: string;
    dateStr: string;
    dateObj: Date;
    amount: number;
    isExpired: boolean;
    details: string;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maturities: MaturityItem[] = [];

  // FDs
  for (const p of portfolios) {
    for (const fd of p.fixedDeposits) {
      if (fd.maturity_date) {
        const mDate = new Date(fd.maturity_date);
        if (!isNaN(mDate.getTime())) {
          maturities.push({
            name: `${fd.bank_name} FD`,
            type: 'Fixed Deposit',
            dateStr: fd.maturity_date,
            dateObj: mDate,
            amount: fd.maturity_amount,
            isExpired: mDate.getTime() < today.getTime() && fd.status === 'active',
            details: `Principal: ${formatINR(fd.principal_amount)}, Maturity Val: ${formatINR(fd.maturity_amount)}`,
          });
        }
      }
    }
  }

  // RDs
  for (const p of portfolios) {
    if (p.rdAccounts) {
      for (const rd of p.rdAccounts) {
        if (rd.maturity_date) {
          const mDate = new Date(rd.maturity_date);
          if (!isNaN(mDate.getTime())) {
            maturities.push({
              name: `${rd.bank_name} RD`,
              type: 'Recurring Deposit',
              dateStr: rd.maturity_date,
              dateObj: mDate,
              amount: rd.maturity_amount,
              isExpired: mDate.getTime() < today.getTime() && rd.status === 'active',
              details: `Monthly deposit: ${formatINR(rd.monthly_deposit)}, Maturity Val: ${formatINR(rd.maturity_amount)}`,
            });
          }
        }
      }
    }
  }

  // Insurances
  for (const p of portfolios) {
    for (const ins of p.insurances) {
      if (ins.renewal_date) {
        const rDate = new Date(ins.renewal_date);
        if (!isNaN(rDate.getTime())) {
          maturities.push({
            name: `${ins.provider} - ${ins.policy_name}`,
            type: 'Insurance Renewal',
            dateStr: ins.renewal_date,
            dateObj: rDate,
            amount: ins.premium_amount,
            isExpired: rDate.getTime() < today.getTime(),
            details: `Premium: ${formatINR(ins.premium_amount)}, Cover: ${formatINR(ins.sum_assured)}`,
          });
        }
      }
    }
  }

  // Documents
  for (const p of portfolios) {
    for (const doc of p.documents) {
      if (doc.expiry_date) {
        const eDate = new Date(doc.expiry_date);
        if (!isNaN(eDate.getTime())) {
          maturities.push({
            name: doc.name,
            type: 'Document Expiry',
            dateStr: doc.expiry_date,
            dateObj: eDate,
            amount: 0,
            isExpired: eDate.getTime() < today.getTime(),
            details: `Linked asset: ${doc.asset_type.toUpperCase()}`,
          });
        }
      }
    }
  }

  // Year extraction
  const yearMatch = query.match(/\b(202\d|203\d)\b/);
  const targetYear = yearMatch ? yearMatch[0] : null;

  if (targetYear) {
    const filtered = maturities.filter(m => m.dateStr.startsWith(targetYear));
    if (filtered.length > 0) {
      let answer = `Found **${filtered.length}** investments, insurances, or documents maturing/due in **${targetYear}**:\n\n`;
      filtered.forEach((m) => {
        answer += `- **${m.name}** (${m.type}): due on **${m.dateStr}** (${m.details}).\n`;
      });
      return {
        answer,
        matchedAssets: filtered.map(f => ({ name: f.name, type: f.type, details: `${f.dateStr} - ${f.details}` })),
      };
    } else {
      return {
        answer: `No Fixed Deposits, Recurring Deposits, insurance policies, or documents are maturing/due in **${targetYear}**.`,
        matchedAssets: [],
      };
    }
  }

  // Default to upcoming maturities timeline
  const overdue = maturities.filter(m => m.isExpired).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  const upcoming = maturities.filter(m => !m.isExpired && m.dateObj.getTime() >= today.getTime()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  let answer = `### 📅 Portfolio Maturities & Renewals Timeline\n\n`;
  if (upcoming.length > 0) {
    upcoming.slice(0, 5).forEach((m) => {
      const diffTime = m.dateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const countdown = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`;
      answer += `- **${m.name}** (${m.type}): due on **${m.dateStr}** (${countdown}). ${m.details}.\n`;
    });
  } else {
    answer += `No upcoming maturities or renewals found.\n`;
  }

  if (overdue.length > 0) {
    answer += `\n⚠️ **Expired or Matured Items (Immediate action needed):**\n`;
    overdue.forEach((m) => {
      const diffTime = today.getTime() - m.dateObj.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      answer += `- **${m.name}** (${m.type}): expired/matured on **${m.dateStr}** (${diffDays} days ago). ${m.details}.\n`;
    });
  }

  const matched = [...upcoming.slice(0, 3), ...overdue.slice(0, 3)].map(m => ({
    name: m.name,
    type: m.type,
    details: `${m.dateStr} - ${m.details}`
  }));

  return {
    answer,
    matchedAssets: matched,
  };
}

export function handleInsuranceReminders(portfolios: Portfolio[]): AssistantResponse {
  let count = 0;
  let sumCover = 0;
  let annualPremium = 0;
  const activePolicies: {
    provider: string;
    name: string;
    type: string;
    cover: number;
    premium: number;
    renewal: string;
    daysToRenewal: number | null;
  }[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const p of portfolios) {
    count += p.insurances.length;
    for (const ins of p.insurances) {
      sumCover += ins.sum_assured;
      annualPremium += ins.premium_amount;

      let daysToRenewal: number | null = null;
      if (ins.renewal_date) {
        const rDate = new Date(ins.renewal_date);
        if (!isNaN(rDate.getTime())) {
          const diffTime = rDate.getTime() - today.getTime();
          daysToRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      activePolicies.push({
        provider: ins.provider,
        name: ins.policy_name,
        type: ins.insurance_type,
        cover: ins.sum_assured,
        premium: ins.premium_amount,
        renewal: ins.renewal_date || 'N/A',
        daysToRenewal
      });
    }
  }

  if (count === 0) {
    return {
      answer: 'You currently do not have any active insurance policies in your portfolio database.',
      matchedAssets: [],
    };
  }

  let answer = `You have **${count}** active insurance policies providing a total combined cover of **${formatINR(sumCover)}**. Your total annual premium payout across these policies is **${formatINR(annualPremium)}**.\n\n`;

  const policiesWithRenewal = activePolicies.filter(p => p.renewal !== 'N/A');

  if (policiesWithRenewal.length > 0) {
    answer += `### 📅 Insurance Renewals & Reminders:\n\n`;
    const sortedPolicies = [...policiesWithRenewal].sort((a, b) => {
      if (a.daysToRenewal === null) return 1;
      if (b.daysToRenewal === null) return -1;
      return a.daysToRenewal - b.daysToRenewal;
    });

    sortedPolicies.forEach((pol) => {
      const typeStr = pol.type.toUpperCase();
      if (pol.daysToRenewal !== null) {
        if (pol.daysToRenewal < 0) {
          answer += `- ⚠️ **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** was due on **${pol.renewal}** (**${Math.abs(pol.daysToRenewal)} days overdue**).\n`;
        } else if (pol.daysToRenewal === 0) {
          answer += `- 🚨 **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** is due **TODAY**.\n`;
        } else if (pol.daysToRenewal <= 30) {
          answer += `- 🔔 **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** is due on **${pol.renewal}** (**in ${pol.daysToRenewal} days**).\n`;
        } else {
          answer += `- **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** is due on **${pol.renewal}** (in ${pol.daysToRenewal} days).\n`;
        }
      } else {
        answer += `- **${pol.provider} - ${pol.name}** (${typeStr}): Premium **${formatINR(pol.premium)}** is due (date not specified).\n`;
      }
    });
  }

  return {
    answer,
    matchedAssets: activePolicies.map(pol => ({
      name: `${pol.provider} - ${pol.name}`,
      type: `${pol.type} Insurance`,
      details: `Premium: ${formatINR(pol.premium)}, Cover: ${formatINR(pol.cover)}, Renewal: ${pol.renewal}`
    }))
  };
}

export function handleNextSIPDate(portfolios: Portfolio[]): AssistantResponse {
  interface SIPItem {
    fundName: string;
    owner: string;
    monthlySIP: number;
    nextSIPDate: string | null;
    nextSIPDateObj: Date | null;
  }

  const sips: SIPItem[] = [];
  for (const p of portfolios) {
    if (p.sipAccounts) {
      for (const sip of p.sipAccounts) {
        let dateObj: Date | null = null;
        if (sip.next_sip_date) {
          const d = new Date(sip.next_sip_date);
          if (!isNaN(d.getTime())) {
            dateObj = d;
          }
        }
        sips.push({
          fundName: sip.fund_name,
          owner: p.label,
          monthlySIP: sip.monthly_sip,
          nextSIPDate: sip.next_sip_date || null,
          nextSIPDateObj: dateObj
        });
      }
    }
  }

  if (sips.length === 0) {
    return {
      answer: "You have no active Mutual Fund SIP accounts in your portfolio database.",
      matchedAssets: []
    };
  }

  const sortedSips = [...sips].sort((a, b) => {
    if (!a.nextSIPDateObj) return 1;
    if (!b.nextSIPDateObj) return -1;
    return a.nextSIPDateObj.getTime() - b.nextSIPDateObj.getTime();
  });

  let answer = `### 📅 Upcoming Mutual Fund SIP Schedule\n\n`;
  const matched: AssistantResponse['matchedAssets'] = [];

  sortedSips.forEach(sip => {
    const dateStr = sip.nextSIPDate ? `on **${sip.nextSIPDate}**` : 'date not specified';
    answer += `- **${sip.fundName}** (${sip.owner}): Monthly payment of **${formatINR(sip.monthlySIP)}** due ${dateStr}.\n`;

    matched.push({
      name: sip.fundName,
      type: 'SIP Due Date',
      details: `Owner: ${sip.owner}, Monthly: ${formatINR(sip.monthlySIP)}, Next Date: ${sip.nextSIPDate || 'N/A'}`
    });
  });

  return { answer, matchedAssets: matched };
}

export function handleExpiredDocuments(portfolios: Portfolio[]): AssistantResponse {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  interface DocItem {
    name: string;
    owner: string;
    assetType: string;
    expiryDate: string;
    expiryObj: Date;
    daysRemaining: number;
  }

  const docs: DocItem[] = [];
  for (const p of portfolios) {
    for (const doc of p.documents) {
      if (doc.expiry_date) {
        const eDate = new Date(doc.expiry_date);
        if (!isNaN(eDate.getTime())) {
          const diffTime = eDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 90) {
            docs.push({
              name: doc.name,
              owner: p.label,
              assetType: doc.asset_type,
              expiryDate: doc.expiry_date,
              expiryObj: eDate,
              daysRemaining
            });
          }
        }
      }
    }
  }

  if (docs.length === 0) {
    return {
      answer: "✓ **Great!** All registered documents are active and no renewals are due in the next 90 days.",
      matchedAssets: []
    };
  }

  const sortedDocs = [...docs].sort((a, b) => a.daysRemaining - b.daysRemaining);

  let answer = `### 📄 Document Vault Expiries & Renewals\n`;
  answer += `Below are documents that have already expired or are due for renewal in the next 90 days:\n\n`;

  answer += `| Document Name | Owner | Asset Class | Expiry Date | Status |\n`;
  answer += `| :--- | :--- | :--- | :---: | :--- |\n`;

  const matched: AssistantResponse['matchedAssets'] = [];

  sortedDocs.forEach(d => {
    const statusStr = d.daysRemaining < 0
      ? `🔴 Expired (${Math.abs(d.daysRemaining)} days ago)`
      : d.daysRemaining === 0
      ? `🚨 Expires TODAY`
      : `🔔 Expires in ${d.daysRemaining} days`;

    answer += `| **${d.name}** | ${d.owner} | ${d.assetType.toUpperCase()} | ${d.expiryDate} | ${statusStr} |\n`;

    matched.push({
      name: d.name,
      type: 'Vault Document',
      details: `Expiry: ${d.expiryDate} (${statusStr})`
    });
  });

  return {
    answer,
    matchedAssets: matched
  };
}
