import React, { useState, useEffect, useRef } from 'react';
import { GoldHolding, DocumentMetadata } from '../../types/portfolio';
import Modal from '../Modal';
import { DocumentAttachmentField, PendingDocument } from '../ui/DocumentAttachmentField';
import { uploadDocumentFile, generateDocumentStoragePath } from '../../utils/supabaseStorage';

interface PortfolioOption {
  name: string;
  label: string;
}

interface GoldFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingHolding: GoldHolding | null;
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  documents?: DocumentMetadata[];
  onAdd: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<{ id?: string; data?: { id?: string } } | void>;
  onUpdate: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
  onDeleteDoc?: (assetType: string, id: string) => Promise<void>;
}

const PURITY_OPTIONS: Array<GoldHolding['purity']> = ['24K', '22K', '18K', '14K', 'other'];

export const GoldFormModal = React.memo(function GoldFormModal({
  isOpen,
  onClose,
  editingHolding,
  portfolioName,
  portfolioOptions,
  documents = [],
  onAdd,
  onUpdate,
  onDeleteDoc,
}: GoldFormModalProps) {
  const [itemName, setItemName] = useState('');
  const [purity, setPurity] = useState<GoldHolding['purity']>('24K');
  const [weightGrams, setWeightGrams] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValuation, setCurrentValuation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [targetPortfolio, setTargetPortfolio] = useState(portfolioName);
  const [pendingFiles, setPendingFiles] = useState<PendingDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const existingDocs = editingHolding
    ? documents.filter((d) => d.asset_type === 'gold' && d.asset_id === editingHolding.id)
    : [];

  const createdAssetIdRef = useRef<string | null>(null);

  useEffect(() => {
    createdAssetIdRef.current = null;
    if (editingHolding) {
      setItemName(editingHolding.item_name || '');
      setPurity(editingHolding.purity || '24K');
      setWeightGrams(editingHolding.weight_grams ? String(editingHolding.weight_grams) : '');
      setPurchasePrice(editingHolding.purchase_price ? String(editingHolding.purchase_price) : '');
      setCurrentValuation(editingHolding.current_valuation ? String(editingHolding.current_valuation) : '');
      setPurchaseDate(editingHolding.purchase_date || '');
      setNotes(editingHolding.notes || '');
      setTargetPortfolio(portfolioName);
    } else {
      setItemName('');
      setPurity('24K');
      setWeightGrams('');
      setPurchasePrice('');
      setCurrentValuation('');
      setPurchaseDate('');
      setNotes('');
      setTargetPortfolio(portfolioName);
    }
    setPendingFiles([]);
    setError(null);
  }, [editingHolding, portfolioName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('Item name is required');
      return;
    }
    const grams = parseFloat(weightGrams);
    if (isNaN(grams) || grams <= 0 || grams > 100_000) {
      setError('Please enter a valid weight in grams up to 100,000g');
      return;
    }

    const buyPrice = purchasePrice ? parseFloat(purchasePrice) : undefined;
    if (buyPrice !== undefined && (isNaN(buyPrice) || buyPrice < 0 || buyPrice > 1_000_000_000)) {
      setError('Purchase price must be up to ₹100 Crore');
      return;
    }

    const currVal = currentValuation ? parseFloat(currentValuation) : undefined;
    if (currVal !== undefined && (isNaN(currVal) || currVal < 0 || currVal > 1_000_000_000)) {
      setError('Current valuation must be up to ₹100 Crore');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let assetId: string | undefined;
      const payload = {
        item_name: itemName.trim(),
        purity,
        weight_grams: grams,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        current_valuation: currentValuation ? parseFloat(currentValuation) : undefined,
        purchase_date: purchaseDate || undefined,
        notes: notes.trim() || undefined,
      };

      const createdId = createdAssetIdRef.current || editingHolding?.id;

      if (createdId) {
        await onUpdate('gold', createdId, payload);
        assetId = createdId;
      } else {
        const res = await onAdd('gold', targetPortfolio, payload);
        assetId = res?.id || res?.data?.id;
        if (assetId) {
          createdAssetIdRef.current = assetId;
        }
      }

      // Upload and link all supporting documents
      if (pendingFiles.length > 0) {
        for (const doc of pendingFiles) {
          const storagePath = generateDocumentStoragePath(targetPortfolio, 'gold', doc.file.name);
          await uploadDocumentFile('investment-documents', storagePath, doc.file);
          await onAdd('document', targetPortfolio, {
            name: doc.name.trim() || doc.file.name,
            filePath: storagePath,
            fileType: doc.file.type,
            linkedAssetType: 'gold',
            linkedAssetId: assetId || null,
            expiryDate: doc.expiryDate || null,
          });
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save gold holding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingHolding ? 'Edit Gold Holding' : 'Add Gold Holding'}
      preventClose={loading}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {portfolioOptions.length > 1 && !editingHolding && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Portfolio
            </label>
            <select
              value={targetPortfolio}
              onChange={(e) => setTargetPortfolio(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {portfolioOptions.map((p) => (
                <option key={p.name} value={p.name}>{p.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Item Name / Description *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 24K Gold Coin, Gold Necklace"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Purity
            </label>
            <select
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {PURITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Weight (grams) *
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              required
              placeholder="e.g. 10.5"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Purchase Price (₹)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="e.g. 60000"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Current Valuation (₹)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="e.g. 72000"
              value={currentValuation}
              onChange={(e) => setCurrentValuation(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Purchase Date
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Stored in bank locker #42"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
          />
        </div>

        {/* Supporting Document Attachment */}
        <DocumentAttachmentField
          files={pendingFiles}
          onFilesChange={setPendingFiles}
          showExpiryDate={false}
          existingDocuments={existingDocs}
          onDeleteExistingDoc={onDeleteDoc ? (docId) => onDeleteDoc('document', docId) : undefined}
          assetTypeLabel="gold holding"
          hintText="Upload purchase receipts, invoices, or hallmark certificates"
        />

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-[14px] px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-[14px] py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-amber-600 text-white font-semibold text-sm rounded-[14px] py-2.5 hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingHolding ? 'Save Changes' : 'Add Gold'}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default GoldFormModal;
