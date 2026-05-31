import { useState, useRef, useMemo } from 'react';
import {
  DocumentMetadata,
  Portfolio,
  PortfolioName,
  FixedDeposit,
  GoldHolding,
  RealEstate,
  Insurance,
  Holding,
} from '../types/portfolio';
import { supabase } from '../utils/supabaseClient';
import { Upload, Trash2, FileText, Folder, FolderOpen, ExternalLink, Loader2, Paperclip } from 'lucide-react';
import { getDocumentUrl } from '../utils/formatters';

type AssetType = 'general' | 'stock' | 'fd' | 'gold' | 'real_estate' | 'insurance';

interface DocumentVaultViewProps {
  portfolio: Portfolio;
  portfolioName: PortfolioName;
  onAdd: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
}

const FOLDERS: { key: AssetType; label: string; color: string }[] = [
  { key: 'general', label: 'General', color: 'bg-slate-100 text-slate-600' },
  { key: 'stock', label: 'Stocks', color: 'bg-blue-100 text-blue-700' },
  { key: 'fd', label: 'Fixed Deposits', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'gold', label: 'Gold', color: 'bg-amber-100 text-amber-700' },
  { key: 'real_estate', label: 'Real Estate', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'insurance', label: 'Insurance', color: 'bg-rose-100 text-rose-700' },
];

export default function DocumentVaultView({
  portfolio,
  portfolioName,
  onAdd,
  onDelete,
}: DocumentVaultViewProps) {
  const [activeFolder, setActiveFolder] = useState<AssetType>('general');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [linkedAssetId, setLinkedAssetId] = useState<string>('');
  const [documentName, setDocumentName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function renderExpiryBadge(expiryDateStr?: string) {
    if (!expiryDateStr) return null;
    const daysLeft = Math.ceil((new Date(expiryDateStr).getTime() - Date.now()) / (1000 * 3600 * 24));
    const isExpired = daysLeft < 0;
    const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;

    let badgeColor = "bg-slate-100 text-slate-600";
    let text = `Expires ${new Date(expiryDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    if (isExpired) {
      badgeColor = "bg-rose-50 text-rose-700 border border-rose-100";
      text += " (Expired)";
    } else if (isExpiringSoon) {
      badgeColor = "bg-amber-50 text-amber-700 border border-amber-100";
      text += ` (${daysLeft}d left)`;
    } else {
      badgeColor = "bg-slate-50 text-slate-500 border border-slate-200";
    }

    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${badgeColor}`}>
        {text}
      </span>
    );
  }

  const assetOptions = useMemo<{ id: string; label: string }[]>(() => {
    if (activeFolder === 'stock') {
      return portfolio.holdings.filter((h): h is Holding & { id: string } => !!h.id).map((h) => ({ id: h.id, label: `${h.ticker} — ${h.stockName}` }));
    }
    if (activeFolder === 'fd') {
      return portfolio.fixedDeposits.map((f: FixedDeposit) => ({ id: f.id, label: f.bank_name }));
    }
    if (activeFolder === 'gold') {
      return portfolio.goldHoldings.map((g: GoldHolding) => ({ id: g.id, label: g.item_name }));
    }
    if (activeFolder === 'real_estate') {
      return portfolio.realEstate.map((r: RealEstate) => ({ id: r.id, label: r.property_name }));
    }
    if (activeFolder === 'insurance') {
      return portfolio.insurances.map((i: Insurance) => ({ id: i.id, label: `${i.provider} — ${i.policy_name}` }));
    }
    return [];
  }, [activeFolder, portfolio]);

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
    setPendingFile(file);
    setDocumentName(file.name);
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
      const ts = Date.now();
      const safeName = pendingFile.name.replace(/[^\w.-]/g, '_');
      const storagePath = `${portfolio.name}/${activeFolder}/${ts}_${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from('investment-documents')
        .upload(storagePath, pendingFile);

      if (uploadErr) {
        throw uploadErr;
      }

      await onAdd('document', portfolioName === 'all' ? portfolio.name : portfolioName, {
        name: documentName || pendingFile.name,
        filePath: storagePath,
        fileType: pendingFile.type,
        linkedAssetType: activeFolder,
        linkedAssetId: activeFolder === 'general' ? null : linkedAssetId || null,
        expiryDate: expiryDate || null,
      });

      setShowLinkModal(false);
      setPendingFile(null);
      setDocumentName('');
      setLinkedAssetId('');
      setExpiryDate('');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: DocumentMetadata) {
    if (!confirm(`Delete "${doc.name}"? This removes the storage file and the record.`)) return;
    try {
      if (!doc.file_path.startsWith('http')) {
        const { error: deleteErr } = await supabase.storage
          .from('investment-documents')
          .remove([doc.file_path]);
        if (deleteErr) {
          console.error('Failed to delete storage object:', deleteErr);
        }
      }
      await onDelete('document', doc.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function getAssetLabel(doc: DocumentMetadata): string | null {
    if (!doc.asset_id) return null;
    if (doc.asset_type === 'stock') {
      const h = portfolio.holdings.find((x) => x.id === doc.asset_id);
      return h ? `${h.ticker} · ${h.stockName}` : null;
    }
    if (doc.asset_type === 'fd') {
      const f = portfolio.fixedDeposits.find((x) => x.id === doc.asset_id);
      return f ? f.bank_name : null;
    }
    if (doc.asset_type === 'gold') {
      const g = portfolio.goldHoldings.find((x) => x.id === doc.asset_id);
      return g ? g.item_name : null;
    }
    if (doc.asset_type === 'real_estate') {
      const r = portfolio.realEstate.find((x) => x.id === doc.asset_id);
      return r ? r.property_name : null;
    }
    if (doc.asset_type === 'insurance') {
      const i = portfolio.insurances.find((x) => x.id === doc.asset_id);
      return i ? `${i.provider} · ${i.policy_name}` : null;
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-tr from-slate-700 to-slate-900 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Document Vault</p>
            <p className="text-2xl font-bold mt-1">{portfolio.documents.length}</p>
            <p className="text-xs text-slate-300 mt-2">Files stored securely</p>
          </div>
          <FileText size={40} className="opacity-20 shrink-0" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Linked Documents</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {portfolio.documents.filter((d) => d.asset_type !== 'general').length}
            </p>
            <p className="text-xs text-slate-400 mt-2">Attached to assets</p>
          </div>
          <Paperclip size={40} className="text-blue-500/20 shrink-0" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">General Files</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {portfolio.documents.filter((d) => d.asset_type === 'general').length}
            </p>
            <p className="text-xs text-slate-400 mt-2">Unfiled / reference</p>
          </div>
          <Folder size={40} className="text-amber-500/20 shrink-0" />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {FOLDERS.map((f) => {
              const count = portfolio.documents.filter((d) => d.asset_type === f.key).length;
              const isActive = activeFolder === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFolder(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive
                    ? f.color + ' ring-1 ring-current/20'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                    }`}
                >
                  {isActive ? <FolderOpen size={13} /> : <Folder size={13} />}
                  {f.label}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/60' : 'bg-slate-100'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFilePick}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Upload size={13} />
              Upload to {FOLDERS.find((f) => f.key === activeFolder)?.label}
            </button>
          </div>
        </div>

        {folderDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Folder size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold">No documents in this folder</p>
            <p className="text-xs mt-1">Upload PDF, image, or other files to keep records here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {folderDocs.map((doc) => {
              const linkedLabel = getAssetLabel(doc);
              return (
                <div key={doc.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {doc.file_type && (
                          <span className="text-[10px] text-slate-400 font-mono">{doc.file_type}</span>
                        )}
                        {linkedLabel && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1">
                            <Paperclip size={9} />
                            {linkedLabel}
                          </span>
                        )}
                        {renderExpiryBadge(doc.expiry_date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={getDocumentUrl(doc.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      title="Open"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
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

      {showLinkModal && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !uploading && setShowLinkModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Upload to {FOLDERS.find((f) => f.key === activeFolder)?.label}</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">File: {pendingFile.name}</p>
            </div>

            <form onSubmit={handleUpload} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Document Name</label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Expiry / Renewal Date (optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors bg-white"
                />
              </div>

              {activeFolder !== 'general' && assetOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Link to Asset (optional)</label>
                  <select
                    value={linkedAssetId}
                    onChange={(e) => setLinkedAssetId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                  >
                    <option value="">— Not linked —</option>
                    {assetOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{uploadError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
