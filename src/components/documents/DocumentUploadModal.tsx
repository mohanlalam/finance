import React from 'react';
import Modal from '../Modal';
import { X, Upload, Loader2 } from '../icons/AppIcons';

export type AssetType = 'general' | 'stock' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance';

export interface PortfolioOption {
  name: string;
  label: string;
}

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderLabel: string;
  activeFolder: AssetType;
  pendingFile: File | null;
  portfolioOptions: PortfolioOption[];
  assetOptions: { id: string; label: string }[];
  formPortfolio: string;
  setFormPortfolio: (val: string) => void;
  documentName: string;
  setDocumentName: (val: string) => void;
  expiryDate: string;
  setExpiryDate: (val: string) => void;
  linkedAssetId: string;
  setLinkedAssetId: (val: string) => void;
  uploadError: string;
  uploading: boolean;
  onUpload: (e: React.FormEvent) => Promise<void>;
}

export const DocumentUploadModal = React.memo(function DocumentUploadModal({
  isOpen,
  onClose,
  folderLabel,
  activeFolder,
  pendingFile,
  portfolioOptions,
  assetOptions,
  formPortfolio,
  setFormPortfolio,
  documentName,
  setDocumentName,
  expiryDate,
  setExpiryDate,
  linkedAssetId,
  setLinkedAssetId,
  uploadError,
  uploading,
  onUpload,
}: DocumentUploadModalProps) {
  if (!pendingFile) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !uploading && onClose()}
      ariaLabel={`Upload to ${folderLabel}`}
      preventClose={uploading}
    >
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center modal-drag-handle cursor-grab active:cursor-grabbing" data-drag-handle>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Upload to {folderLabel}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">File: {pendingFile.name}</p>
        </div>
        <button
          onClick={() => !uploading && onClose()}
          className="w-8 h-8 rounded-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={onUpload} className="px-6 py-5 space-y-4">
        <div>
          <label htmlFor="doc-vault-portfolio" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Portfolio</label>
          <select
            id="doc-vault-portfolio"
            value={formPortfolio}
            onChange={(e) => setFormPortfolio(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-colors"
          >
            {portfolioOptions.map((o) => (
              <option key={o.name} value={o.name}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="doc-vault-name" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Document Name</label>
          <input
            id="doc-vault-name"
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="doc-vault-expiry" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Expiry / Renewal Date (optional)</label>
          <input
            id="doc-vault-expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-colors bg-[var(--surface)]"
          />
        </div>

        {activeFolder !== 'general' && assetOptions.length > 0 && (
          <div>
            <label htmlFor="doc-vault-link" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Link to Asset (optional)</label>
            <select
              id="doc-vault-link"
              value={linkedAssetId}
              onChange={(e) => setLinkedAssetId(e.target.value)}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-colors"
            >
              <option value="">— Not linked —</option>
              {assetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-[14px] px-3 py-2" role="alert">{uploadError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-[14px] h-11 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs ios-press transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold text-sm rounded-[14px] py-2.5 hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </Modal>
  );
});
