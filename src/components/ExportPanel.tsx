import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, Database, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Portfolio } from '../types/portfolio';
import { getFDEffectiveValue } from '../utils/formatters';

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

function allAssetsToCSV(portfolios: Portfolio[]): string {
  const sections: string[] = [];

  // Stocks
  sections.push('=== STOCKS ===');
  sections.push('Portfolio,Ticker,Stock Name,Qty,Avg Price,LTP,Current Value,P&L,P&L %');
  for (const p of portfolios) {
    for (const h of p.holdings) {
      sections.push(`${p.label},${h.ticker},"${h.stockName}",${h.qty},${h.avgPrice},${h.ltp},${h.currentValue},${h.unrealizedPnL},${h.pnlPercent.toFixed(2)}`);
    }
  }

  // FDs
  sections.push('\n=== FIXED DEPOSITS ===');
  sections.push('Portfolio,Bank,Principal,Rate %,Start Date,Maturity Date,Current Value,Status');
  for (const p of portfolios) {
    for (const f of p.fixedDeposits) {
      sections.push(`${p.label},"${f.bank_name}",${f.principal_amount},${f.interest_rate},${f.start_date},${f.maturity_date || 'N/A'},${getFDEffectiveValue(f).toFixed(2)},${f.status}`);
    }
  }

  // Gold
  sections.push('\n=== GOLD ===');
  sections.push('Portfolio,Item,Purity,Weight(g),Purchase Price,Current Valuation');
  for (const p of portfolios) {
    for (const g of p.goldHoldings) {
      sections.push(`${p.label},"${g.item_name}",${g.purity},${g.weight_grams},${g.purchase_price},${g.current_valuation}`);
    }
  }

  // Real Estate
  sections.push('\n=== REAL ESTATE ===');
  sections.push('Portfolio,Property,Type,Location,Purchase Price,Current Valuation,Monthly Rent');
  for (const p of portfolios) {
    for (const r of p.realEstate) {
      sections.push(`${p.label},"${r.property_name}",${r.property_type},"${r.location || ''}",${r.purchase_price},${r.current_valuation},${r.monthly_rent}`);
    }
  }

  // Insurance
  sections.push('\n=== INSURANCE ===');
  sections.push('Portfolio,Policy Name,Provider,Type,Sum Assured,Premium,Renewal Date');
  for (const p of portfolios) {
    for (const i of p.insurances) {
      sections.push(`${p.label},"${i.policy_name}","${i.provider}",${i.insurance_type},${i.sum_assured},${i.premium_amount},${i.renewal_date || 'N/A'}`);
    }
  }

  return sections.join('\n');
}

/* ── CSV Parser ── */

function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += char;
    }
    result.push(current.trim());
    return result;
  });
}

function csvToImportRows(rows: string[][]): { parsed: ImportRow[]; errors: string[] } {
  if (rows.length < 2) return { parsed: [], errors: ['File is empty or has no data rows'] };

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z_]/g, ''));
  const nameIdx = headers.findIndex((h) => h.includes('stock_name') || h.includes('stockname') || h.includes('name'));
  const tickerIdx = headers.findIndex((h) => h.includes('ticker') || h.includes('symbol'));
  const yahooIdx = headers.findIndex((h) => h.includes('yahoo'));
  const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('quantity'));
  const priceIdx = headers.findIndex((h) => h.includes('avg') || h.includes('price'));

  if (tickerIdx === -1 || qtyIdx === -1 || priceIdx === -1) {
    return { parsed: [], errors: ['CSV must have columns: ticker, qty, avg_price (at minimum)'] };
  }

  const parsed: ImportRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const ticker = row[tickerIdx] || '';
    const qty = parseFloat(row[qtyIdx] || '0');
    const avg_price = parseFloat(row[priceIdx] || '0');

    if (!ticker) { errors.push(`Row ${i + 1}: Missing ticker`); continue; }
    if (isNaN(qty) || qty <= 0) { errors.push(`Row ${i + 1}: Invalid qty`); continue; }
    if (isNaN(avg_price) || avg_price < 0) { errors.push(`Row ${i + 1}: Invalid price`); continue; }

    parsed.push({
      stock_name: nameIdx >= 0 ? (row[nameIdx] || ticker) : ticker,
      ticker,
      yahoo_symbol: yahooIdx >= 0 ? (row[yahooIdx] || `${ticker}.NS`) : `${ticker}.NS`,
      qty,
      avg_price,
    });
  }

  return { parsed, errors };
}

/* ── Component ── */

export default function ExportPanel({ portfolios, onImportCSV, portfolioOptions }: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importTarget, setImportTarget] = useState(portfolioOptions[0]?.name || '');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExportCSV() {
    downloadFile(allAssetsToCSV(portfolios), `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    setOpen(false);
  }

  function handleExportJSON() {
    downloadFile(portfoliosToJSON(portfolios), `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    setOpen(false);
  }

  function handleExportPDF() {
    window.print();
    setOpen(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCSV(text);
      const { parsed, errors } = csvToImportRows(rows);
      setImportRows(parsed);
      setImportErrors(errors);
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
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors border border-slate-700 rounded-lg px-3 py-1.5"
        >
          <Database size={12} />
          Import/Export
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-56 py-1">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet size={14} className="text-emerald-500" />
              Export to Excel (CSV)
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <FileText size={14} className="text-red-500" />
              Export to PDF (Print)
            </button>
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Database size={14} className="text-blue-500" />
              Backup JSON
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => { setShowImport(true); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Upload size={14} className="text-violet-500" />
              Import from CSV
            </button>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !importing && setShowImport(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800">Import Holdings from CSV</h3>
                <p className="text-xs text-slate-400 mt-0.5">Columns: stock_name, ticker, yahoo_symbol, qty, avg_price</p>
              </div>
              <button
                onClick={() => !importing && setShowImport(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Target Portfolio</label>
                <select
                  value={importTarget}
                  onChange={(e) => setImportTarget(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                >
                  {portfolioOptions.map((o) => (
                    <option key={o.name} value={o.name}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">CSV File</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 file:mr-3 file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-semibold file:rounded-lg file:px-3 file:py-1 cursor-pointer"
                />
              </div>

              {importErrors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 max-h-24 overflow-y-auto">
                  {importErrors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}

              {importRows.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Preview — {importRows.length} holdings
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {importRows.slice(0, 20).map((r, i) => (
                      <div key={i} className="px-3 py-1.5 flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-700 w-16 truncate">{r.ticker}</span>
                        <span className="text-slate-500 flex-1 truncate">{r.stock_name}</span>
                        <span className="text-slate-400">×{r.qty}</span>
                        <span className="text-slate-400">₹{r.avg_price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    {importRows.length > 20 && (
                      <div className="px-3 py-1.5 text-[10px] text-slate-400 text-center">
                        +{importRows.length - 20} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importDone && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <CheckCircle size={14} /> Import successful!
                </div>
              )}

              {importError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle size={14} /> {importError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => setShowImport(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || importRows.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {importing ? 'Importing...' : `Import ${importRows.length} holdings`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
