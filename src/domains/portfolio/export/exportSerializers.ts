import { Portfolio } from '../../../types/portfolio';
import { getFDEffectiveValue } from '../../../utils/formatters';
import { getRDEffectiveValue } from '../../assets/rd/calculations/rdCompounding';
import { getSIPEffectiveValue } from '../../assets/sip/calculations/sipValuation';

export function portfoliosToJSON(portfolios: Portfolio[]): string {
  const sanitizedPortfolios = portfolios.map((p) => ({
    id: p.id,
    name: p.name,
    label: p.label,
    holdings: (p.holdings || []).map((h) => ({
      id: h.id,
      stockName: h.stockName,
      ticker: h.ticker,
      yahooSymbol: h.yahooSymbol,
      qty: h.qty,
      avgPrice: h.avgPrice,
      amountInvested: h.amountInvested,
      weekLow52: h.weekLow52,
      weekHigh52: h.weekHigh52,
    })),
    fixedDeposits: p.fixedDeposits || [],
    goldHoldings: p.goldHoldings || [],
    realEstate: p.realEstate || [],
    insurances: p.insurances || [],
    rdAccounts: p.rdAccounts || [],
    sipAccounts: p.sipAccounts || [],
    documents: (p.documents || []).map((d) => ({
      id: d.id,
      name: d.name,
      asset_type: d.asset_type,
      asset_id: d.asset_id,
      file_type: d.file_type,
      expiry_date: d.expiry_date,
      file_path: d.file_path,
    })),
  }));

  return JSON.stringify({ schema_version: 2, version: 2, portfolios: sanitizedPortfolios, exportedAt: new Date().toISOString() }, null, 2);
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(',');
}

export function allAssetsToCSV(portfolios: Portfolio[]): string {
  const sections: string[] = [];

  // Stocks
  sections.push('=== STOCKS ===');
  sections.push(csvRow(['Portfolio', 'Ticker', 'Stock Name', 'Qty', 'Avg Price', 'LTP', 'Current Value', 'P&L', 'P&L %']));
  for (const p of portfolios) {
    for (const h of p.holdings) {
      sections.push(csvRow([p.label, h.ticker, h.stockName, h.qty, h.avgPrice, h.ltp, h.currentValue, h.unrealizedPnL, h.pnlPercent.toFixed(2)]));
    }
  }

  // FDs
  sections.push('\n=== FIXED DEPOSITS ===');
  sections.push(csvRow(['Portfolio', 'Bank', 'Principal', 'Rate %', 'Start Date', 'Maturity Date', 'Current Value', 'Status']));
  for (const p of portfolios) {
    for (const f of p.fixedDeposits) {
      sections.push(csvRow([p.label, f.bank_name, f.principal_amount, f.interest_rate, f.start_date, f.maturity_date || 'N/A', getFDEffectiveValue(f).toFixed(2), f.status]));
    }
  }

  // Recurring Deposits
  sections.push('\n=== RECURRING DEPOSITS ===');
  sections.push(csvRow(['Portfolio', 'Bank', 'Monthly Deposit', 'Rate %', 'Start Date', 'Maturity Date', 'Current Value', 'Status']));
  for (const p of portfolios) {
    for (const r of p.rdAccounts || []) {
      sections.push(csvRow([p.label, r.bank_name, r.monthly_deposit, r.interest_rate, r.start_date, r.maturity_date || 'N/A', getRDEffectiveValue(r).toFixed(2), r.status]));
    }
  }

  // Mutual Fund SIPs
  sections.push('\n=== MUTUAL FUND SIPS ===');
  sections.push(csvRow(['Portfolio', 'Scheme Name', 'Monthly Investment', 'Units', 'Live NAV', 'Current Value', 'Status']));
  for (const p of portfolios) {
    for (const s of p.sipAccounts || []) {
      sections.push(csvRow([p.label, s.fund_name, s.monthly_sip, s.units || 0, s.liveNav || 'N/A', getSIPEffectiveValue(s).toFixed(2), 'Active']));
    }
  }

  // Gold
  sections.push('\n=== GOLD ===');
  sections.push(csvRow(['Portfolio', 'Item', 'Purity', 'Weight(g)', 'Purchase Price', 'Current Valuation']));
  for (const p of portfolios) {
    for (const g of p.goldHoldings) {
      sections.push(csvRow([p.label, g.item_name, g.purity, g.weight_grams, g.purchase_price, g.current_valuation]));
    }
  }

  // Real Estate
  sections.push('\n=== REAL ESTATE ===');
  sections.push(csvRow(['Portfolio', 'Property', 'Type', 'Location', 'Purchase Price', 'Current Valuation', 'Monthly Rent']));
  for (const p of portfolios) {
    for (const r of p.realEstate) {
      sections.push(csvRow([p.label, r.property_name, r.property_type, r.location || '', r.purchase_price, r.current_valuation, r.monthly_rent]));
    }
  }

  // Insurance
  sections.push('\n=== INSURANCE ===');
  sections.push(csvRow(['Portfolio', 'Policy Name', 'Provider', 'Type', 'Sum Assured', 'Premium', 'Renewal Date']));
  for (const p of portfolios) {
    for (const i of p.insurances) {
      sections.push(csvRow([p.label, i.policy_name, i.provider, i.insurance_type, i.sum_assured, i.premium_amount, i.renewal_date || 'N/A']));
    }
  }

  return sections.join('\n');
}

export function stocksToCSV(portfolios: Portfolio[]): string {
  const lines: string[] = [];
  lines.push(csvRow(['Portfolio', 'Ticker', 'Stock Name', 'Qty', 'Avg Price', 'LTP', 'Current Value', 'P&L', 'P&L %']));
  for (const p of portfolios) {
    for (const h of p.holdings) {
      lines.push(csvRow([p.label, h.ticker, h.stockName, h.qty, h.avgPrice, h.ltp, h.currentValue, h.unrealizedPnL, h.pnlPercent.toFixed(2)]));
    }
  }
  return lines.join('\n');
}

export function fdsToCSV(portfolios: Portfolio[]): string {
  const lines: string[] = [];
  lines.push(csvRow(['Portfolio', 'Bank', 'Principal', 'Rate %', 'Start Date', 'Maturity Date', 'Current Value', 'Status']));
  for (const p of portfolios) {
    for (const f of p.fixedDeposits) {
      lines.push(csvRow([p.label, f.bank_name, f.principal_amount, f.interest_rate, f.start_date, f.maturity_date || 'N/A', getFDEffectiveValue(f).toFixed(2), f.status]));
    }
  }
  return lines.join('\n');
}

export function documentsToCSV(portfolios: Portfolio[]): string {
  const lines: string[] = [];
  lines.push(csvRow(['Portfolio', 'Document Name', 'Asset Type', 'File Type', 'Expiry Date', 'Attachment Status']));
  for (const p of portfolios) {
    for (const d of p.documents) {
      lines.push(csvRow([p.label, d.name, d.asset_type, d.file_type || '', d.expiry_date || '', d.file_path ? 'Attached' : 'None']));
    }
  }
  return lines.join('\n');
}
