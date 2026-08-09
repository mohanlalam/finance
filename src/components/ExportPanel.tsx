import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, FileText, Database, X, Loader2, CheckCircle, AlertCircle, TrendingUp, Landmark, FolderOpen } from './icons/AppIcons';
import { Portfolio } from '../types/portfolio';
import { getFDEffectiveValue } from '../utils/formatters';
import { getRDEffectiveValue } from '../utils/rdUtils';
import { getSIPEffectiveValue } from '../utils/sipUtils';
import { openPDFReportInNewTab } from '../utils/pdfReport';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

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

/* ── CSV Parser ── */

function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += char;
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

  const priceIdx = rawHeaders.findIndex(h =>
    h === 'avg.cost' || h === 'avgcost' || h === 'averageprice' || h === 'avgprice' || h === 'buyprice' || h === 'costprice' || h.includes('price') || h.includes('cost')
  );

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

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 text-xs text-slate-400 dark:text-slate-300 hover:text-blue-500 border border-slate-700 dark:border-slate-600 rounded-[10px] hover:border-slate-500 transition-colors"
          title="Import/Export Options"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Database size={12} />
          <span className="hidden sm:inline sm:ml-1.5 font-semibold">Import/Export</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[14px] shadow-xl z-50 w-60 py-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Export All</div>
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <FileSpreadsheet size={14} className="text-emerald-500" />
              Full Export (CSV)
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <svg className="animate-spin h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <FileText size={14} className="text-red-500" />
              )}
              {isGeneratingPDF ? 'Generating...' : 'PDF Report (Print)'}
            </button>
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <Database size={14} className="text-blue-500" />
              Full Backup (JSON)
            </button>

            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Export Specific</div>
            <button
              onClick={() => { downloadFile(stocksToCSV(portfolios), `stocks-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <TrendingUp size={14} className="text-blue-500" />
              Stocks Only (CSV)
            </button>
            <button
              onClick={() => { downloadFile(fdsToCSV(portfolios), `fds-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <Landmark size={14} className="text-indigo-500" />
              FDs Only (CSV)
            </button>
            <button
              onClick={() => { downloadFile(documentsToCSV(portfolios), `documents-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv'); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <FolderOpen size={14} className="text-slate-500" />
              Documents Only (CSV)
            </button>

            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Import Broker Data</div>
            <button
              onClick={() => { setShowImport(true); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-left"
            >
              <Upload size={14} className="text-violet-500" />
              Import Zerodha / Groww / CAS
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showImport}
        onClose={() => !importing && setShowImport(false)}
        ariaLabel="Import Holdings from Broker or CAS CSV"
        preventClose={importing}
        maxWidth="max-w-lg"
      >
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-zinc-800/10">
          <div>
            <h3 className="text-card-title font-semibold text-slate-800 dark:text-slate-200">Import Holdings (Zerodha, Groww, CAS)</h3>
            <p className="text-supporting mt-0.5">Supports Zerodha, Groww, AngelOne, Upstox & CAS CSV formats</p>
          </div>
          <IconButton
            icon={<X size={15} />}
            title="Close dialog"
            onClick={() => !importing && setShowImport(false)}
            disabled={importing}
          />
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Target Family Member Portfolio</label>
            <select
              value={importTarget}
              onChange={(e) => setImportTarget(e.target.value)}
              className="w-full bg-[#f2f2f7] dark:bg-zinc-800 border border-transparent rounded-[14px] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:bg-white dark:focus:bg-zinc-700/80 focus:ring-2 focus:ring-[#007aff] transition-all duration-150 outline-none"
            >
              {portfolioOptions.map((o) => (
                <option key={o.name} value={o.name}>{o.label} Portfolio</option>
              ))}
            </select>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1">
              Select which family member's portfolio to add these imported holdings to.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Broker Holdings CSV File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="w-full bg-[#f2f2f7] dark:bg-zinc-800 border border-transparent rounded-[14px] px-3 py-2 text-sm text-[var(--text-primary)] focus:bg-white dark:focus:bg-zinc-700/80 focus:ring-2 focus:ring-[#007aff] transition-all duration-150 outline-none file:mr-3 file:border-0 file:bg-violet-100 dark:file:bg-violet-950/50 file:text-violet-700 dark:file:text-violet-300 file:text-xs file:font-bold file:rounded-[10px] file:px-3 file:py-1 cursor-pointer"
            />
          </div>

          {detectedFormat && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span>Format Detected: {detectedFormat}</span>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/50 rounded-[14px] px-3 py-2 text-xs text-amber-700 dark:text-amber-400 max-h-24 overflow-y-auto">
              {importErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {importRows.length > 0 && (
            <div className="bg-slate-50 dark:bg-zinc-800/10 border border-[var(--border-subtle)] rounded-[14px] overflow-hidden">
              <div className="px-3 py-2 bg-slate-100 dark:bg-zinc-850 flex items-center justify-between text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                <span>Holdings Preview ({importRows.length} stocks)</span>
                <span className="text-blue-600 dark:text-blue-400 font-extrabold">Total: ₹{importRows.reduce((sum, r) => sum + (r.qty * r.avg_price), 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                {importRows.slice(0, 20).map((r, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between text-xs dark:text-slate-350">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-bold text-slate-700 dark:text-slate-200 mr-2">{r.ticker}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{r.stock_name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold mr-2">{r.qty} Qty</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 tnum">₹{r.avg_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
                {importRows.length > 20 && (
                  <div className="px-3 py-1.5 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                    +{importRows.length - 20} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {importDone && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-650 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-[14px] px-3.5 py-2.5">
              <CheckCircle size={15} /> Successfully imported {importRows.length} holdings into {portfolioOptions.find(p => p.name === importTarget)?.label || importTarget}!
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 text-xs text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-[14px] px-3 py-2">
              <AlertCircle size={14} /> {importError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={importing}
              onClick={() => setShowImport(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={importing || importRows.length === 0}
              className="flex-1"
            >
              {importing ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5" />}
              {importing ? 'Importing...' : `Import into ${portfolioOptions.find(p => p.name === importTarget)?.label || 'Portfolio'}`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
});
