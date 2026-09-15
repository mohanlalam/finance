import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from '../icons/AppIcons';
import Modal from '../Modal';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { ImportRow, parseCSV, csvToImportRows } from '../../domains/portfolio/export/csvImportParser';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioOptions: { name: string; label: string }[];
  onImportCSV: (rows: ImportRow[], portfolioName: string) => Promise<void>;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = React.memo(({
  isOpen,
  onClose,
  portfolioOptions,
  onImportCSV,
}) => {
  const [importTarget, setImportTarget] = useState(portfolioOptions[0]?.name || '');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [detectedFormat, setDetectedFormat] = useState('');
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCSV(text);
      const { parsed, errors, detectedFormat: detected } = csvToImportRows(rows);
      setImportRows(parsed);
      setImportErrors(errors);
      setDetectedFormat(detected);
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
      setTimeout(() => {
        onClose();
        setImportDone(false);
        setImportRows([]);
      }, 1500);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !importing && onClose()}
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
          onClick={() => !importing && onClose()}
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
              <span className="text-[var(--accent-blue)] font-bold tnum">Total: ₹{importRows.reduce((sum, r) => sum + (r.qty * r.avg_price), 0).toLocaleString('en-IN')}</span>
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
            onClick={onClose}
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
  );
});

CSVImportModal.displayName = 'CSVImportModal';
