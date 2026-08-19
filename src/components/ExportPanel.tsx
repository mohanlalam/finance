import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Database,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Landmark,
  FolderOpen,
  ShieldCheck
} from './icons/AppIcons';
import { Portfolio } from '../types/portfolio';
import { getFDEffectiveValue } from '../utils/formatters';
import { getRDEffectiveValue } from '../utils/rdUtils';
import { getSIPEffectiveValue } from '../utils/sipUtils';
import { openPDFReportInNewTab } from '../utils/pdfReport';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { validateBackupJSON, BackupValidationReport, RestoreExecutionReport } from '../utils/backupValidation';
import { usePortfolioActions } from '../contexts/PortfolioContext';

interface ExportPanelProps {
  portfolios: Portfolio[];
  onImportCSV: (rows: ImportRow[], portfolioName: string) => Promise<void>;
  portfolioOptions: { name: string; label: string }[];
}

export interface ImportRow {
  stock_name: string;
  ticker: string;
  yahoo_symbol: string;
  qty: number;
  avg_price: number;
}

export interface ParseResult {
  parsed: ImportRow[];
  errors: string[];
  detectedFormat: string;
}

/* ── Export helpers ── */

function portfoliosToJSON(portfolios: Portfolio[]): string {
  return JSON.stringify({ portfolios, exportedAt: new Date().toISOString() }, null, 2);
}

function downloadFile(content: string, filename: string, mime: string) {
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

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(',');
}

function allAssetsToCSV(portfolios: Portfolio[]): string {
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

function stocksToCSV(portfolios: Portfolio[]): string {
  const lines: string[] = [];
  lines.push(csvRow(['Portfolio', 'Ticker', 'Stock Name', 'Qty', 'Avg Price', 'LTP', 'Current Value', 'P&L', 'P&L %']));
  for (const p of portfolios) {
    for (const h of p.holdings) {
      lines.push(csvRow([p.label, h.ticker, h.stockName, h.qty, h.avgPrice, h.ltp, h.currentValue, h.unrealizedPnL, h.pnlPercent.toFixed(2)]));
    }
  }
  return lines.join('\n');
}

function fdsToCSV(portfolios: Portfolio[]): string {
  const lines: string[] = [];
  lines.push(csvRow(['Portfolio', 'Bank', 'Principal', 'Rate %', 'Start Date', 'Maturity Date', 'Current Value', 'Status']));
  for (const p of portfolios) {
    for (const f of p.fixedDeposits) {
      lines.push(csvRow([p.label, f.bank_name, f.principal_amount, f.interest_rate, f.start_date, f.maturity_date || 'N/A', getFDEffectiveValue(f).toFixed(2), f.status]));
    }
  }
  return lines.join('\n');
}

function documentsToCSV(portfolios: Portfolio[]): string {
  const lines: string[] = [];
  lines.push(csvRow(['Portfolio', 'Document Name', 'Asset Type', 'File Type', 'Expiry Date', 'File Path']));
  for (const p of portfolios) {
    for (const d of p.documents) {
      lines.push(csvRow([p.label, d.name, d.asset_type, d.file_type || '', d.expiry_date || '', d.file_path]));
    }
  }
  return lines.join('\n');
}

/* ── CSV Import Parser ── */

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function csvToImportRows(rows: string[][]): ParseResult {
  if (rows.length < 2) return { parsed: [], errors: ['File is empty or has no data rows'], detectedFormat: 'Unknown' };

  const MAX_IMPORT_ROWS = 500;
  if (rows.length - 1 > MAX_IMPORT_ROWS) {
    return { parsed: [], errors: [`CSV import exceeds maximum limit of ${MAX_IMPORT_ROWS} rows.`], detectedFormat: 'Unknown' };
  }

  // Normalize header names
  const rawHeaders = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''));

  // Detect broker format
  let format = 'Standard CSV Format';
  if (rawHeaders.some(h => h === 'instrument' || h.includes('avgcost'))) {
    format = 'Zerodha Holdings';
  } else if (rawHeaders.some(h => h.includes('groww') || (rawHeaders.includes('stockname') && rawHeaders.includes('symbol')))) {
    format = 'Groww Holdings';
  } else if (rawHeaders.includes('isin') && rawHeaders.includes('symbol')) {
    format = 'CAS / Demat Statement';
  } else if (rawHeaders.includes('symbol') && rawHeaders.includes('trade_type')) {
    format = 'Zerodha Tradebook';
  } else if (rawHeaders.includes('symbol') && (rawHeaders.includes('avgcost') || rawHeaders.includes('avgprice'))) {
    format = 'AngelOne / Upstox';
  }

  // Dynamic column matching with fallback lookup
  const tickerIdx = rawHeaders.findIndex(h =>
    h === 'symbol' || h === 'ticker' || h === 'instrument' || h === 'tradingsymbol' || h.includes('symbol') || h.includes('ticker')
  );

  const nameIdx = rawHeaders.findIndex(h =>
    h.includes('stockname') || h.includes('companyname') || h.includes('name') || h === 'instrument'
  );

  const qtyIdx = rawHeaders.findIndex(h =>
    h === 'qty.' || h === 'qty' || h === 'quantity' || h === 'units' || h.includes('qty') || h.includes('quantity')
  );

  let priceIdx = rawHeaders.findIndex(h =>
    h === 'avg.cost' || h === 'avgcost' || h === 'averageprice' || h === 'avgprice' || h === 'buyprice' || h === 'costprice' || h === 'purchaseprice'
  );
  if (priceIdx === -1) {
    priceIdx = rawHeaders.findIndex(h =>
      (h.includes('avg') && h.includes('price')) ||
      (h.includes('buy') && h.includes('price')) ||
      (h.includes('cost') && !h.includes('total'))
    );
  }
  if (priceIdx === -1) {
    priceIdx = rawHeaders.findIndex(h =>
      (h.includes('price') || h.includes('cost')) && !h.includes('market') && !h.includes('ltp') && !h.includes('current') && !h.includes('cmp') && !h.includes('total')
    );
  }

  const yahooIdx = rawHeaders.findIndex(h => h.includes('yahoo'));

  if (tickerIdx === -1 || qtyIdx === -1 || priceIdx === -1) {
    return {
      parsed: [],
      errors: ['CSV must contain Ticker/Symbol, Quantity, and Avg Price/Cost columns.'],
      detectedFormat: format
    };
  }

  const parsed: ImportRow[] = [];
  const errors: string[] = [];
  const seenTickers = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every((c) => !c.trim())) continue;

    // Ticker cleaning: remove exchange suffixes (-EQ, -BE)
    let rawTicker = (row[tickerIdx] || '').trim().toUpperCase();
    rawTicker = rawTicker.replace(/-EQ$/, '').replace(/-BE$/, '').replace(/[^\w.-]/g, '').slice(0, 20);

    const rawName = nameIdx >= 0 ? (row[nameIdx] || '').trim().replace(/<[^>]*>/g, '').slice(0, 100) : rawTicker;
    const rawYahoo = yahooIdx >= 0 ? (row[yahooIdx] || '').trim().replace(/<[^>]*>/g, '').slice(0, 50) : `${rawTicker}.NS`;

    // Clean numeric strings (remove commas, currency symbols like ₹ or $)
    const cleanQty = (row[qtyIdx] || '0').replace(/[^0-9.]/g, '');
    const cleanPrice = (row[priceIdx] || '0').replace(/[^0-9.]/g, '');

    const qty = parseFloat(cleanQty);
    const avg_price = parseFloat(cleanPrice);

    if (!rawTicker) continue;
    if (isNaN(qty) || qty <= 0 || !isFinite(qty) || qty > 10_000_000) {
      errors.push(`Row ${i + 1} (${rawTicker}): Invalid quantity '${row[qtyIdx]}'.`);
      continue;
    }
    if (isNaN(avg_price) || avg_price < 0 || !isFinite(avg_price) || avg_price > 100_000_000) {
      errors.push(`Row ${i + 1} (${rawTicker}): Invalid price '${row[priceIdx]}'.`);
      continue;
    }

    if (seenTickers.has(rawTicker)) {
      // Aggregate quantity & weighted average price if same stock appears multiple times
      const existing = parsed.find(p => p.ticker === rawTicker);
      if (existing) {
        const totalQty = existing.qty + qty;
        const weightedAvgPrice = ((existing.qty * existing.avg_price) + (qty * avg_price)) / totalQty;
        existing.qty = totalQty;
        existing.avg_price = weightedAvgPrice;
      }
      continue;
    }
    seenTickers.add(rawTicker);

    parsed.push({
      stock_name: rawName || rawTicker,
      ticker: rawTicker,
      yahoo_symbol: rawYahoo || `${rawTicker}.NS`,
      qty,
      avg_price,
    });
  }

  return { parsed, errors, detectedFormat: format };
}

/* ── Component ── */

export default React.memo(function ExportPanel({ portfolios, onImportCSV, portfolioOptions }: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importTarget, setImportTarget] = useState(portfolioOptions[0]?.name || '');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleExportCSV() {
    downloadFile(allAssetsToCSV(portfolios), `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    setOpen(false);
  }

  function handleExportJSON() {
    downloadFile(portfoliosToJSON(portfolios), `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    setOpen(false);
  }

  async function handleExportPDF() {
    setIsGeneratingPDF(true);
    // Yield to let the UI update the spinner
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      openPDFReportInNewTab(portfolios);
    } finally {
      setIsGeneratingPDF(false);
      setOpen(false);
    }
  }

  const [detectedFormat, setDetectedFormat] = useState('');

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCSV(text);
      const { parsed, errors, detectedFormat } = csvToImportRows(rows);
      setImportRows(parsed);
      setImportErrors(errors);
      setDetectedFormat(detectedFormat);
      setImportDone(false);
      setImportError('');
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (importRows.length === 0) return;
    setImporting(true);
    setImportError('');
    try {
      await onImportCSV(importRows, importTarget);
      setImportDone(true);
      setTimeout(() => { setShowImport(false); setImportDone(false); setImportRows([]); }, 1500);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupJSONText, setBackupJSONText] = useState('');
  const [validationReport, setValidationReport] = useState<BackupValidationReport | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreReport, setRestoreReport] = useState<RestoreExecutionReport | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const { addAsset, addPortfolio } = usePortfolioActions();

  function handleRestoreJSONFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setBackupJSONText(text);
      const report = validateBackupJSON(text, portfolios);
      setValidationReport(report);
      setRestoreReport(null);
      setShowRestoreModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleExecuteRestore() {
    if (!backupJSONText || !validationReport?.isValid) return;
    setIsRestoring(true);

    try {
      const parsedData = JSON.parse(backupJSONText);
      const portfoliosToRestore: Portfolio[] = Array.isArray(parsedData)
        ? parsedData
        : Array.isArray(parsedData.portfolios)
        ? parsedData.portfolios
        : [];

      let createdAssets = 0;
      const errors: string[] = [];
      const restoredPortfolios: string[] = [];

      for (const p of portfoliosToRestore) {
        const pName = p.name || p.id;
        restoredPortfolios.push(pName);

        // 1. Ensure Portfolio exists or create it
        const exists = portfolios.some(ep => ep.name === pName);
        if (!exists && pName) {
          try {
            await addPortfolio(pName, p.label || pName);
          } catch {
            // may already exist
          }
        }

        // 2. Restore Stocks
        if (Array.isArray(p.holdings)) {
          for (const h of p.holdings) {
            try {
              const qty = Number(h.qty) || 0;
              const avgPrice = Number(h.avgPrice) || 0;
              await addAsset('stock', pName, {
                stockName: h.stockName || h.ticker,
                ticker: h.ticker,
                yahooSymbol: h.yahooSymbol || `${h.ticker}.NS`,
                qty,
                avgPrice,
                amountInvested: qty * avgPrice,
                weekLow52: 0,
                weekHigh52: 0,
              });
              createdAssets++;
            } catch (err: any) {
              errors.push(`Stock ${h.ticker}: ${err.message || 'Failed'}`);
            }
          }
        }

        // 3. Restore Fixed Deposits
        if (Array.isArray(p.fixedDeposits)) {
          for (const fd of p.fixedDeposits) {
            try {
              await addAsset('fd', pName, {
                bank_name: fd.bank_name,
                principal_amount: Number(fd.principal_amount),
                interest_rate: Number(fd.interest_rate),
                start_date: fd.start_date,
                maturity_date: fd.maturity_date || null,
                maturity_amount: Number(fd.maturity_amount) || Number(fd.principal_amount),
                status: fd.status || 'active',
                notes: fd.notes,
              });
              createdAssets++;
            } catch (err: any) {
              errors.push(`FD ${fd.bank_name}: ${err.message || 'Failed'}`);
            }
          }
        }

        // 4. Restore Gold Holdings
        if (Array.isArray(p.goldHoldings)) {
          for (const g of p.goldHoldings) {
            try {
              await addAsset('gold', pName, {
                item_name: g.item_name,
                purity: g.purity || '24K',
                weight_grams: Number(g.weight_grams),
                purchase_price: Number(g.purchase_price),
                current_valuation: Number(g.current_valuation) || Number(g.purchase_price),
                purchase_date: g.purchase_date,
                notes: g.notes,
              });
              createdAssets++;
            } catch (err: any) {
              errors.push(`Gold ${g.item_name}: ${err.message || 'Failed'}`);
            }
          }
        }

        // 5. Restore Real Estate
        if (Array.isArray(p.realEstate)) {
          for (const re of p.realEstate) {
            try {
              await addAsset('real_estate', pName, {
                property_name: re.property_name,
                property_type: re.property_type || 'apartment',
                location: re.location,
                purchase_price: Number(re.purchase_price),
                current_valuation: Number(re.current_valuation) || Number(re.purchase_price),
                purchase_date: re.purchase_date,
                monthly_rent: Number(re.monthly_rent) || 0,
                notes: re.notes,
              });
              createdAssets++;
            } catch (err: any) {
              errors.push(`Property ${re.property_name}: ${err.message || 'Failed'}`);
            }
          }
        }

        // 6. Restore Insurance
        if (Array.isArray(p.insurances)) {
          for (const ins of p.insurances) {
            try {
              await addAsset('insurance', pName, {
                policy_name: ins.policy_name,
                insurance_type: ins.insurance_type || 'life',
                provider: ins.provider || 'Provider',
                policy_number: ins.policy_number,
                sum_assured: Number(ins.sum_assured),
                premium_amount: Number(ins.premium_amount),
                renewal_date: ins.renewal_date,
                notes: ins.notes,
              });
              createdAssets++;
            } catch (err: any) {
              errors.push(`Insurance ${ins.policy_name}: ${err.message || 'Failed'}`);
            }
          }
        }

        // 7. Restore Recurring Deposits
        if (Array.isArray(p.rdAccounts)) {
          for (const rd of p.rdAccounts) {
            try {
              await addAsset('rd', pName, {
                bank_name: rd.bank_name,
                monthly_deposit: Number(rd.monthly_deposit),
                interest_rate: Number(rd.interest_rate),
                start_date: rd.start_date,
                tenure_months: Number(rd.tenure_months),
                maturity_amount: Number(rd.maturity_amount) || 0,
                status: rd.status || 'active',
                notes: rd.notes,
                installment_dates: Array.isArray(rd.installment_dates) ? rd.installment_dates : undefined,
              });
              createdAssets++;
            } catch (err: any) {
              errors.push(`RD ${rd.bank_name}: ${err.message || 'Failed'}`);
            }
          }
        }

        // 8. Restore SIP Accounts
        if (Array.isArray(p.sipAccounts)) {
          for (const sip of p.sipAccounts) {
            try {
              await addAsset('sip', pName, {
                fund_name: sip.fund_name,
                monthly_investment: Number(sip.monthly_investment || (sip as any).monthly_sip),
                units: Number(sip.units || (sip as any).qty) || 0,
                sip_day: Number(sip.sip_day) || 1,
                start_date: sip.start_date,
                status: sip.status || 'active',
                scheme_code: sip.scheme_code,
                amfi_code: sip.amfi_code,
                expected_cagr: Number(sip.expected_cagr) || 12,
                notes: sip.notes,
              });
              createdAssets++;
            } catch (err: any) {
              errors.push(`SIP ${sip.fund_name}: ${err.message || 'Failed'}`);
            }
          }
        }

        // 9. Restore Document Vault Metadata
        if (Array.isArray(p.documents)) {
          for (const doc of p.documents) {
            try {
              await addAsset('document', pName, {
                name: doc.name,
                file_path: doc.file_path,
                file_type: doc.file_type,
                file_size: Number(doc.file_size) || 0,
                expiry_date: doc.expiry_date || null,
                document_type: doc.document_type || 'general',
                asset_type: doc.asset_type || null,
                asset_id: doc.asset_id || null,
                notes: doc.notes,
              });
              createdAssets++;
            } catch (err: any) {
              errors.push(`Document ${doc.name}: ${err.message || 'Failed'}`);
            }
          }
        }
      }

      setRestoreReport({
        timestamp: new Date().toISOString(),
        createdAssets,
        updatedAssets: 0,
        skippedDuplicates: 0,
        errors,
        restoredPortfolios,
      });
    } catch (err: any) {
      setValidationReport(prev => prev ? { ...prev, schemaErrors: [err.message || 'Restore failed'] } : null);
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-blue)] border border-[var(--border-subtle)] rounded-[var(--radius-small)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] transition-colors ios-press cursor-pointer"
          title="Import/Export Options"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Database size={12} />
          <span className="hidden sm:inline sm:ml-1.5 font-semibold">Import/Export</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] shadow-[var(--shadow-modal)] z-50 w-64 max-w-[calc(100vw-24px)] py-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Export &amp; Backup</div>
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors text-left cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-[var(--positive)]" />
              Full Export (CSV)
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors text-left disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPDF ? (
                <svg className="animate-spin h-3.5 w-3.5 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <FileText size={14} className="text-rose-500" />
              )}
              {isGeneratingPDF ? 'Generating...' : 'PDF Report (Print)'}
            </button>
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors text-left cursor-pointer"
            >
              <Database size={14} className="text-[var(--accent-blue)]" />
              Full Backup (JSON)
            </button>

            <div className="border-t border-[var(--border-subtle)] my-1" />
            <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Restore &amp; Import</div>
            <button
              onClick={() => { jsonFileInputRef.current?.click(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors text-left cursor-pointer"
            >
              <ShieldCheck size={14} className="text-[var(--accent-blue)]" />
              Restore Backup (JSON with Preview)
            </button>
            <button
              onClick={() => { setShowImport(true); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors text-left cursor-pointer"
            >
              <Upload size={14} className="text-[var(--accent-blue)]" />
              Import Zerodha / Groww / CAS
            </button>

            <div className="border-t border-[var(--border-subtle)] my-1" />
            <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Export Specific</div>
            <button
              onClick={() => { downloadFile(stocksToCSV(portfolios), `stocks-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors text-left cursor-pointer"
            >
              <TrendingUp size={14} className="text-[var(--accent-blue)]" />
              Stocks Only (CSV)
            </button>
            <button
              onClick={() => { downloadFile(fdsToCSV(portfolios), `fds-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors text-left cursor-pointer"
            >
              <Landmark size={14} className="text-[var(--accent-blue)]" />
              FDs Only (CSV)
            </button>
            <button
              onClick={() => { downloadFile(documentsToCSV(portfolios), `documents-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors text-left cursor-pointer"
            >
              <FolderOpen size={14} className="text-[var(--text-tertiary)]" />
              Documents Only (CSV)
            </button>
          </div>
        )}
      </div>

      {/* Hidden JSON file input for backup restore */}
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        onChange={handleRestoreJSONFileSelect}
        className="hidden"
      />

      {/* Backup Restore Preview Modal */}
      {showRestoreModal && validationReport && (
        <Modal
          isOpen={showRestoreModal}
          onClose={() => !isRestoring && setShowRestoreModal(false)}
          title="🛡️ Backup Restore & Schema Validation Preview"
          maxWidth="max-w-xl"
          preventClose={isRestoring}
        >
          <div className="p-5 space-y-4">
            {/* Status Header */}
            <div className={`p-3.5 rounded-[var(--radius-medium)] border flex items-start gap-3 ${
              validationReport.isValid
                ? 'bg-[var(--positive-soft)] border-[var(--positive)]/30 text-[var(--positive)]'
                : 'bg-[var(--negative-soft)] border-[var(--negative)]/30 text-[var(--negative)]'
            }`}>
              {validationReport.isValid ? <ShieldCheck size={20} className="shrink-0 text-[var(--positive)] mt-0.5" /> : <AlertCircle size={20} className="shrink-0 text-[var(--negative)] mt-0.5" />}
              <div className="min-w-0">
                <h4 className="font-bold text-xs">
                  {validationReport.isValid ? 'Valid Backup Schema Verified' : 'Invalid Backup File'}
                </h4>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {validationReport.isValid
                    ? `Contains ${validationReport.counts.totalAssets} records across ${validationReport.portfolioCount} family portfolios (${validationReport.portfolioNames.join(', ')}).`
                    : 'The selected file contains errors and cannot be safely restored.'}
                </p>
                {validationReport.exportedAt && (
                  <p className="text-[10px] mt-1 font-semibold opacity-75">
                    Exported timestamp: {new Date(validationReport.exportedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Counts by Category */}
            {validationReport.isValid && (
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Asset Breakdown in Backup
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.stocks}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">Stocks</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.fixedDeposits}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">FDs</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.goldHoldings}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">Gold</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.realEstate}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">Real Estate</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.insurances}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">Insurance</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.sipAccounts}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">SIPs</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.rdAccounts}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">RDs</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.documents}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">Documents</span>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings / Duplicates */}
            {validationReport.warnings.length > 0 && (
              <div className="p-3 bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-[var(--radius-medium)] text-xs text-[var(--warning)] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle size={14} className="text-[var(--warning)]" />
                  <span>Dry-run Diagnostics:</span>
                </div>
                {validationReport.warnings.map((w, idx) => (
                  <p key={idx} className="text-[11px] leading-relaxed pl-4">• {w}</p>
                ))}
              </div>
            )}

            {/* Post-Restore Report */}
            {restoreReport && (
              <div className="p-3.5 bg-[var(--positive-soft)] border border-[var(--positive)]/30 rounded-[var(--radius-medium)] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[var(--positive)]">
                  <CheckCircle size={16} />
                  <span>Restore Completed Successfully</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Restored {restoreReport.createdAssets} asset records into {restoreReport.restoredPortfolios.join(', ')}.
                </p>
                {restoreReport.errors.length > 0 && (
                  <div className="text-[var(--negative)] text-[10px]">
                    {restoreReport.errors.length} items encountered issues: {restoreReport.errors.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button
                variant="secondary"
                disabled={isRestoring}
                onClick={() => setShowRestoreModal(false)}
                className="flex-1 text-xs py-2"
              >
                {restoreReport ? 'Close' : 'Cancel'}
              </Button>
              {!restoreReport && (
                <Button
                  variant="primary"
                  disabled={isRestoring || !validationReport.isValid}
                  onClick={handleExecuteRestore}
                  className="flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  {isRestoring ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>{isRestoring ? 'Restoring Data...' : 'Confirm & Restore'}</span>
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Existing CSV Import Modal */}
      <Modal
        isOpen={showImport}
        onClose={() => !importing && setShowImport(false)}
        ariaLabel="Import Holdings from Broker or CAS CSV"
        preventClose={importing}
        maxWidth="max-w-lg"
      >
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface-secondary)]">
          <div>
            <h3 className="text-card-title font-semibold text-[var(--text-primary)]">Import Holdings (Zerodha, Groww, CAS)</h3>
            <p className="text-supporting mt-0.5">Supports Zerodha, Groww, AngelOne, Upstox &amp; CAS CSV formats</p>
          </div>
          <IconButton
            icon={<X size={15} />}
            title="Close dialog"
            onClick={() => !importing && setShowImport(false)}
            disabled={importing}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Target Family Member Portfolio</label>
            <select
              value={importTarget}
              onChange={(e) => setImportTarget(e.target.value)}
              className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-small)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--accent-blue)]/20 transition-all duration-150 outline-none"
            >
              {portfolioOptions.map((o) => (
                <option key={o.name} value={o.name}>{o.label} Portfolio</option>
              ))}
            </select>
            <p className="text-[10.5px] text-[var(--text-tertiary)] mt-1">
              Select which family member's portfolio to add these imported holdings to.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Broker Holdings CSV File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-small)] px-3 py-2 text-xs text-[var(--text-primary)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--accent-blue)]/20 transition-all duration-150 outline-none file:mr-3 file:border-0 file:bg-[var(--accent-blue-soft)] file:text-[var(--accent-blue)] file:text-xs file:font-bold file:rounded-[6px] file:px-2.5 file:py-1 cursor-pointer"
            />
          </div>

          {detectedFormat && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
              <span>Format Detected: {detectedFormat}</span>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-[var(--radius-small)] px-3 py-2 text-xs text-[var(--warning)] max-h-24 overflow-y-auto">
              {importErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {importRows.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] overflow-hidden">
              <div className="px-3 py-2 bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                <span>Holdings Preview ({importRows.length} stocks)</span>
                <span className="text-[var(--accent-blue)] font-extrabold">Total: ₹{importRows.reduce((sum, r) => sum + (r.qty * r.avg_price), 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                {importRows.slice(0, 20).map((r, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between text-xs text-[var(--text-primary)]">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-bold text-[var(--text-primary)] mr-2">{r.ticker}</span>
                      <span className="text-[var(--text-tertiary)] text-[11px] truncate">{r.stock_name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[var(--text-secondary)] font-semibold mr-2">{r.qty} Qty</span>
                      <span className="font-bold text-[var(--text-primary)] tnum">₹{r.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
                {importRows.length > 20 && (
                  <div className="px-3 py-1.5 text-[10px] text-[var(--text-tertiary)] text-center">
                    +{importRows.length - 20} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {importDone && (
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--positive)] bg-[var(--positive-soft)] border border-[var(--positive)]/30 rounded-[var(--radius-small)] px-3.5 py-2.5">
              <CheckCircle size={15} /> Successfully imported {importRows.length} holdings into {portfolioOptions.find(p => p.name === importTarget)?.label || importTarget}!
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 text-xs text-[var(--negative)] bg-[var(--negative-soft)] border border-[var(--negative)]/30 rounded-[var(--radius-small)] px-3 py-2">
              <AlertCircle size={14} /> {importError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={importing}
              onClick={() => setShowImport(false)}
              className="flex-1 text-xs py-2 truncate"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={importing || importRows.length === 0}
              className="flex-1 text-xs py-2 truncate"
            >
              {importing ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5 shrink-0" />}
              <span className="truncate">{importing ? 'Importing...' : `Import into ${portfolioOptions.find(p => p.name === importTarget)?.label || 'Portfolio'}`}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
});
