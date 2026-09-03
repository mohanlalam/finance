import React, { useState, useRef, useMemo } from 'react';
import {
  DocumentMetadata,
  Portfolio,
  PortfolioName,
  FixedDeposit,
  GoldHolding,
  RealEstate,
  Insurance,
  Holding,
} from '../../types/portfolio';
import { useDocumentStorage } from '../../hooks/useDocumentStorage';
import { Upload, Trash2, FileText, Folder, FolderOpen, ExternalLink, Loader2, Paperclip, X } from '../icons/AppIcons';
import Modal from '../Modal';
import ConfirmModal from '../ConfirmModal';
import { useIsMutating } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';
import AssetCardSkeleton from '../AssetCardSkeleton';
import EmptyState from '../EmptyState';

type AssetType = 'general' | 'stock' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance';

interface PortfolioOption {
  name: string;
  label: string;
}

interface DocumentVaultViewProps {
  portfolio: Portfolio;
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  portfolios: Portfolio[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<any>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

const FOLDERS: { key: AssetType; label: string; color: string }[] = [
  { key: 'general', label: 'General', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  { key: 'stock', label: 'Stocks', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' },
  { key: 'fd', label: 'Fixed Deposits', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' },
  { key: 'rd', label: 'Recurring Deposits', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' },
  { key: 'sip', label: 'Mutual Funds / SIP', color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400' },
  { key: 'gold', label: 'Gold', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' },
  { key: 'real_estate', label: 'Real Estate', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' },
  { key: 'insurance', label: 'Insurance', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-500' },
];

export default React.memo(function DocumentVaultView({
  portfolio,
  portfolioName,
  portfolioOptions,
  portfolios,
  onAdd,
  onDelete,
  autoOpenAddModal,
}: DocumentVaultViewProps) {
  const isMobile = useIsMobile();
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
  const {
    uploadFile: uploadDocumentFile,
    removeFiles: removeDocumentFiles,
    openDocument: openSecureDocument,
    generateStoragePath: generateDocumentStoragePath,
  } = useDocumentStorage();

  const assetLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    portfolio.holdings.forEach((h) => {
      if (h.id) map.set(h.id, `${h.ticker} · ${h.stockName}`);
    });
    portfolio.fixedDeposits.forEach((f) => {
      if (f.id) map.set(f.id, f.bank_name);
    });
    portfolio.goldHoldings.forEach((g) => {
      if (g.id) map.set(g.id, g.item_name);
    });
    portfolio.realEstate.forEach((r) => {
      if (r.id) map.set(r.id, r.property_name);
    });
    portfolio.insurances.forEach((i) => {
      if (i.id) map.set(i.id, `${i.provider} · ${i.policy_name}`);
    });
    return map;
  }, [portfolio]);
  const [activeFolder, setActiveFolder] = useState<AssetType>('general');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [formPortfolio, setFormPortfolio] = useState(() => portfolioName);
  const [linkedAssetId, setLinkedAssetId] = useState<string>('');
  const [documentName, setDocumentName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DocumentMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoOpenAddModal) {
      fileInputRef.current?.click();
    }
  }, [autoOpenAddModal]);

  const selectedPortfolioObj = useMemo(() => {
    return portfolios.find((p) => p.name === formPortfolio) || portfolio;
  }, [portfolios, formPortfolio, portfolio]);

  function renderExpiryBadge(expiryDateStr?: string) {
    if (!expiryDateStr) return null;
    const daysLeft = Math.ceil((new Date(expiryDateStr).getTime() - Date.now()) / (1000 * 3600 * 24));
    const isExpired = daysLeft < 0;
    const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;

    let badgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
    let text = `Expires ${new Date(expiryDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    if (isExpired) {
      badgeColor = "bg-[var(--negative-soft)] text-[var(--negative)] border border-[var(--negative)]/30";
      text += " (Expired)";
    } else if (isExpiringSoon) {
      badgeColor = "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30";
      text += ` (${daysLeft}d left)`;
    } else {
      badgeColor = "bg-[var(--surface-secondary)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]";
    }

    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[var(--radius-small)] flex items-center gap-1 ${badgeColor}`}>
        {text}
      </span>
    );
  }

  const assetOptions = useMemo<{ id: string; label: string }[]>(() => {
    if (activeFolder === 'stock') {
      return selectedPortfolioObj.holdings.filter((h): h is Holding & { id: string } => !!h.id).map((h) => ({ id: h.id, label: `${h.ticker} — ${h.stockName}` }));
    }
    if (activeFolder === 'fd') {
      return selectedPortfolioObj.fixedDeposits.map((f: FixedDeposit) => ({ id: f.id, label: f.bank_name }));
    }
    if (activeFolder === 'rd') {
      return (selectedPortfolioObj.rdAccounts || []).map((r) => ({ id: r.id, label: `${r.bank_name} (₹${r.monthly_deposit}/mo)` }));
    }
    if (activeFolder === 'sip') {
      return (selectedPortfolioObj.sipAccounts || []).map((s) => ({ id: s.id, label: s.fund_name }));
    }
    if (activeFolder === 'gold') {
      return selectedPortfolioObj.goldHoldings.map((g: GoldHolding) => ({ id: g.id, label: g.item_name }));
    }
    if (activeFolder === 'real_estate') {
      return selectedPortfolioObj.realEstate.map((r: RealEstate) => ({ id: r.id, label: r.property_name }));
    }
    if (activeFolder === 'insurance') {
      return selectedPortfolioObj.insurances.map((i: Insurance) => ({ id: i.id, label: `${i.provider} — ${i.policy_name}` }));
    }
    return [];
  }, [activeFolder, selectedPortfolioObj]);

  const folderDocs = useMemo(() => {
    const docs = portfolio.documents.filter((d) => d.asset_type === activeFolder);
    return [...docs].sort((a, b) => {
      if (a.expiry_date && b.expiry_date) {
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      }
      if (a.expiry_date) return -1;
      if (b.expiry_date) return 1;
      return 0;
    });
  }, [portfolio.documents, activeFolder]);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds 10MB limit.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPendingFile(file);
    setDocumentName(file.name);
    setFormPortfolio(portfolioName);
    setLinkedAssetId('');
    setExpiryDate('');
    setUploadError('');
    setShowLinkModal(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const storagePath = generateDocumentStoragePath(formPortfolio, activeFolder, pendingFile.name);

      await uploadDocumentFile('investment-documents', storagePath, pendingFile);

      await onAdd('document', formPortfolio, {
        name: documentName || pendingFile.name,
        filePath: storagePath,
        fileType: pendingFile.type,
        linkedAssetType: activeFolder,
        linkedAssetId: activeFolder === 'general' ? null : linkedAssetId || null,
        expiryDate: expiryDate || null,
      });

      addToast('Document uploaded successfully', 'success');
      setShowLinkModal(false);
      setPendingFile(null);
      setDocumentName('');
      setLinkedAssetId('');
      setExpiryDate('');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      addToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: DocumentMetadata) {
    setDeleteTarget(doc);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (!deleteTarget.file_path.startsWith('http')) {
        await removeDocumentFiles('investment-documents', [deleteTarget.file_path]);
      }
      await onDelete('document', deleteTarget.id);
      addToast('Document deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  }



  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-tr from-slate-700 to-slate-900 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Document Vault</p>
            <p className="text-2xl font-bold mt-1">{portfolio.documents.length}</p>
            <p className="text-xs text-slate-300 mt-2">Files stored securely</p>
          </div>
          <FileText size={40} className="opacity-20 shrink-0" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Linked Documents</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {portfolio.documents.filter((d) => d.asset_type !== 'general').length}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Attached to assets</p>
          </div>
          <Paperclip size={40} className="text-blue-500/20 shrink-0" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">General Files</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {portfolio.documents.filter((d) => d.asset_type === 'general').length}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Unfiled / reference</p>
          </div>
          <Folder size={40} className="text-amber-500/20 shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {FOLDERS.map((f) => {
              const count = portfolio.documents.filter((d) => d.asset_type === f.key).length;
              const isActive = activeFolder === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFolder(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all ${isActive
                    ? f.color + ' ring-1 ring-current/20'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                >
                  {isActive ? <FolderOpen size={13} /> : <Folder size={13} />}
                  {f.label}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/60 dark:bg-slate-800/80' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div>
            <input
              id="vault-file-upload-input"
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={handleFilePick}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.csv"
            />
            <label
              htmlFor="vault-file-upload-input"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-[10px] transition-colors shadow-sm cursor-pointer select-none active:scale-[0.98]"
            >
              <Upload size={13} />
              <span>Upload to {FOLDERS.find((f) => f.key === activeFolder)?.label}</span>
            </label>
          </div>
        </div>

        {isMutating ? (
          <div className="p-4">
            <AssetCardSkeleton count={Math.max(1, folderDocs.length || 3)} />
          </div>
        ) : folderDocs.length === 0 ? (
          <EmptyState
            type="documents"
            title="No Documents in This Folder"
            description="Upload PDFs, receipts, or policy documents to keep a secure digital record of your assets."
            actionButton={
              <label
                htmlFor="vault-file-upload-input"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-xs font-bold px-5 py-2.5 rounded-[14px] transition-colors shadow-sm cursor-pointer select-none active:scale-[0.98]"
              >
                <Upload size={15} />
                <span>Upload Your First Document</span>
              </label>
            }
          />
        ) : folderDocs.length > 10 ? (
          <List
            height={Math.min(folderDocs.length * (isMobile ? 80 : 72), isMobile ? 420 : 540)}
            itemCount={folderDocs.length}
            itemSize={isMobile ? 80 : 72}
            width="100%"
          >
            {({ index, style }) => {
              const doc = folderDocs[index];
              const linkedLabel = doc.asset_id ? assetLabelMap.get(doc.asset_id) || null : null;
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <div className="mobile-asset-card px-6 py-4 hover:bg-[var(--surface-secondary)]/50 transition-colors flex items-center justify-between gap-4 h-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate" title={doc.name}>{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {doc.file_type && (
                            <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{doc.file_type}</span>
                          )}
                          {linkedLabel && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 flex items-center gap-1">
                              <Paperclip size={9} />
                              {linkedLabel}
                            </span>
                          )}
                          {renderExpiryBadge(doc.expiry_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openSecureDocument(doc.file_path)}
                        className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] rounded-[var(--radius-small)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--surface-secondary)] transition-colors ios-press cursor-pointer"
                        title="Open document"
                        aria-label={`Open document: ${doc.name}`}
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] rounded-[var(--radius-small)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--negative-soft)] transition-colors ios-press"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }}
          </List>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {folderDocs.map((doc) => {
              const linkedLabel = doc.asset_id ? assetLabelMap.get(doc.asset_id) || null : null;
              return (
                <div key={doc.id} className="mobile-asset-card px-6 py-4 hover:bg-[var(--surface-secondary)]/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate" title={doc.name}>{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {doc.file_type && (
                          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{doc.file_type}</span>
                        )}
                        {linkedLabel && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 flex items-center gap-1">
                            <Paperclip size={9} />
                            {linkedLabel}
                          </span>
                        )}
                        {renderExpiryBadge(doc.expiry_date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openSecureDocument(doc.file_path)}
                      className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] rounded-[var(--radius-small)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--surface-secondary)] transition-colors ios-press cursor-pointer"
                      title="Open document"
                      aria-label={`Open document: ${doc.name}`}
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] rounded-[var(--radius-small)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--negative-soft)] transition-colors ios-press"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showLinkModal && !!pendingFile}
        onClose={() => !uploading && setShowLinkModal(false)}
        ariaLabel={`Upload to ${FOLDERS.find((f) => f.key === activeFolder)?.label || 'Folder'}`}
        preventClose={uploading}
      >
        {pendingFile && (
          <>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center modal-drag-handle cursor-grab active:cursor-grabbing" data-drag-handle>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Upload to {FOLDERS.find((f) => f.key === activeFolder)?.label || 'Folder'}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">File: {pendingFile.name}</p>
              </div>
              <button
                onClick={() => !uploading && setShowLinkModal(false)}
                className="w-8 h-8 rounded-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="px-6 py-5 space-y-4">
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
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-[14px] h-11 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs ios-press transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold text-sm rounded-[14px] py-2.5 hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message={`Delete "${deleteTarget?.name}"? This removes the storage file and the record.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
});
