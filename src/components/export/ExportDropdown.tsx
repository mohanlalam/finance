import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Database,
  TrendingUp,
  Landmark,
  FolderOpen,
  ShieldCheck,
  Upload,
} from '../icons/AppIcons';
import { Portfolio } from '../../types/portfolio';
import { openPDFReportInNewTab } from '../../utils/pdfReport';
import { downloadFile } from '../../utils/downloadHelper';
import {
  portfoliosToJSON,
  allAssetsToCSV,
  stocksToCSV,
  fdsToCSV,
  documentsToCSV,
} from '../../domains/portfolio/export/exportSerializers';

interface ExportDropdownProps {
  portfolios: Portfolio[];
  onOpenRestore: () => void;
  onOpenImport: () => void;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = React.memo(({
  portfolios,
  onOpenRestore,
  onOpenImport,
}) => {
  const [open, setOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleExportCSV() {
    downloadFile(allAssetsToCSV(portfolios), `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    setOpen(false);
  }

  function handleExportJSON() {
    downloadFile(portfoliosToJSON(portfolios), `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    setOpen(false);
  }

  function handleExportPDF() {
    setIsGeneratingPDF(true);
    try {
      openPDFReportInNewTab(portfolios);
    } finally {
      setIsGeneratingPDF(false);
      setOpen(false);
    }
  }

  return (
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
            onClick={() => { onOpenRestore(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors text-left cursor-pointer"
          >
            <ShieldCheck size={14} className="text-[var(--accent-blue)]" />
            Restore Backup (JSON with Preview)
          </button>
          <button
            onClick={() => { onOpenImport(); setOpen(false); }}
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
  );
});

ExportDropdown.displayName = 'ExportDropdown';
