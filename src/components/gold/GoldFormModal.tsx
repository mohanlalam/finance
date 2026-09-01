import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoldHolding, DocumentMetadata } from '../../types/portfolio';
import Modal from '../Modal';
import { DocumentAttachmentField, PendingDocument } from '../ui/DocumentAttachmentField';
import { uploadDocumentFile, generateDocumentStoragePath } from '../../utils/supabaseStorage';
import { normalizeToIsoDate } from '../../utils/aiDocumentExtractor';
import { deriveGoldRates } from '../../utils/goldPricing';
import { formatINR } from '../../utils/formatters';

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
  const [ratePerGram, setRatePerGram] = useState('');
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

  // Derive live market rates for purity (memoized to prevent re-render loops)
  const liveRates = useMemo(() => deriveGoldRates(), []);
  const getRateForPurity = useCallback((p: string) => {
    if (p === '22K') return liveRates.rate22kPerGram;
    if (p === '18K') return liveRates.rate18kPerGram;
    if (p === '14K') return Math.round(liveRates.rate24kPerGram * 0.585);
    return liveRates.rate24kPerGram;
  }, [liveRates]);

  const liveRatePerGram = getRateForPurity(purity);

  useEffect(() => {
    if (!isOpen) return;
    createdAssetIdRef.current = null;
    if (editingHolding) {
      const g = Number(editingHolding.weight_grams) || 0;
      const rawBuy = Number(editingHolding.purchase_price) || 0;
      // If previously stored as per-gram rate (e.g. 5200) instead of total cost
      if (rawBuy > 1000 && rawBuy <= 40000 && g > 1 && (rawBuy / g) < 500) {
        setRatePerGram(String(rawBuy));
        setPurchasePrice(String(Math.round(rawBuy * g)));
      } else {
        setPurchasePrice(rawBuy ? String(rawBuy) : '');
        setRatePerGram(rawBuy && g > 0 ? String(Math.round(rawBuy / g)) : '');
      }

      setItemName(editingHolding.item_name || '');
      const hPurity = editingHolding.purity || '24K';
      setPurity(hPurity);
      setWeightGrams(editingHolding.weight_grams ? String(editingHolding.weight_grams) : '');
      
      const holdingRate = getRateForPurity(hPurity);
      const rawVal = Number(editingHolding.current_valuation) || 0;
      // If stored valuation was raw buy rate / outdated or user opening to edit, sync to live valuation
      if (rawVal > 1000 && rawVal <= 40000 && g > 1 && (rawVal / g) < 500) {
        const estVal = Math.round(g * holdingRate);
        setCurrentValuation(String(estVal));
      } else if (g > 0) {
        const liveVal = Math.round(g * holdingRate);
        setCurrentValuation(String(liveVal || rawVal));
      } else {
        setCurrentValuation(rawVal ? String(rawVal) : '');
      }

      setPurchaseDate(editingHolding.purchase_date || '');
      setNotes(editingHolding.notes || '');
      setTargetPortfolio(portfolioName);
    } else {
      setItemName('');
      setPurity('24K');
      setWeightGrams('');
      setRatePerGram('');
      setPurchasePrice('');
      setCurrentValuation('');
      setPurchaseDate('');
      setNotes('');
      setTargetPortfolio(portfolioName);
    }
    setPendingFiles([]);
    setError(null);
  }, [isOpen, editingHolding, portfolioName, getRateForPurity]);

  // Handle purity change and automatically recompute live market valuation
  const handlePurityChange = (newPurity: GoldHolding['purity']) => {
    setPurity(newPurity);
    const newRate = getRateForPurity(newPurity);
    const grams = parseFloat(weightGrams);
    if (!isNaN(grams) && grams > 0) {
      setCurrentValuation(String(Math.round(grams * newRate)));
    }
  };

  // Handle weight change and automatically recompute prices and market valuation
  const handleWeightChange = (val: string) => {
    setWeightGrams(val);
    const grams = parseFloat(val);
    if (!isNaN(grams) && grams > 0) {
      const rate = parseFloat(ratePerGram);
      if (!isNaN(rate) && rate > 0) {
        setPurchasePrice(String(Math.round(grams * rate)));
      }
      // Always auto-compute market valuation from live rate
      setCurrentValuation(String(Math.round(grams * liveRatePerGram)));
    }
  };

  // Handle rate per gram change
  const handleRatePerGramChange = (val: string) => {
    setRatePerGram(val);
    const rate = parseFloat(val);
    const grams = parseFloat(weightGrams);
    if (!isNaN(rate) && !isNaN(grams) && grams > 0) {
      setPurchasePrice(String(Math.round(grams * rate)));
    }
  };

  // Handle total purchase price change
  const handlePurchasePriceChange = (val: string) => {
    setPurchasePrice(val);
    const total = parseFloat(val);
    const grams = parseFloat(weightGrams);
    if (!isNaN(total) && !isNaN(grams) && grams > 0) {
      setRatePerGram(String(Math.round(total / grams)));
    }
  };

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

    const rateGram = parseFloat(ratePerGram);
    let buyPrice = purchasePrice ? parseFloat(purchasePrice) : (!isNaN(rateGram) && rateGram > 0 ? Math.round(rateGram * grams) : undefined);
    if (buyPrice !== undefined && (isNaN(buyPrice) || buyPrice < 0 || buyPrice > 1_000_000_000)) {
      setError('Purchase price must be up to ₹100 Crore');
      return;
    }

    // Heuristic correction: if user entered per-gram rate into purchase price (e.g. 5200)
    if (buyPrice !== undefined && buyPrice > 1000 && buyPrice <= 40000 && grams > 1 && (buyPrice / grams) < 500) {
      buyPrice = Math.round(buyPrice * grams);
    }

    let currVal = currentValuation ? parseFloat(currentValuation) : undefined;
    if (currVal !== undefined && (isNaN(currVal) || currVal < 0 || currVal > 1_000_000_000)) {
      setError('Current valuation must be up to ₹100 Crore');
      return;
    }

    // If currentValuation is empty or was entered as per-gram rate
    if (currVal === undefined || currVal === 0 || (currVal > 1000 && currVal <= 40000 && grams > 1 && (currVal / grams) < 500)) {
      currVal = Math.round(grams * liveRatePerGram);
    }

    setLoading(true);
    setError(null);
    try {
      let assetId: string | undefined;
      const cleanDate = normalizeToIsoDate(purchaseDate) || undefined;
      const payload = {
        item_name: itemName.trim(),
        itemName: itemName.trim(),
        purity,
        weight_grams: grams,
        weightGrams: grams,
        purchase_price: buyPrice,
        purchasePrice: buyPrice,
        current_valuation: currVal,
        currentValuation: currVal,
        purchase_date: cleanDate,
        purchaseDate: cleanDate,
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Purity
            </label>
            <select
              value={purity}
              onChange={(e) => handlePurityChange(e.target.value as GoldHolding['purity'])}
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
              placeholder="e.g. 55.33"
              value={weightGrams}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Buy Rate / Gram (₹/g)
              </label>
              {ratePerGram && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  {formatINR(Number(ratePerGram))}/g
                </span>
              )}
            </div>
            <input
              type="number"
              inputMode="decimal"
              step="1"
              placeholder="e.g. 5200"
              value={ratePerGram}
              onChange={(e) => handleRatePerGramChange(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Total Purchase Cost (₹)
              </label>
              {purchasePrice && Number(purchasePrice) > 0 && (
                <span className="text-[10px] text-slate-500 font-semibold">
                  {formatINR(Number(purchasePrice))}
                </span>
              )}
            </div>
            <input
              type="number"
              inputMode="decimal"
              step="1"
              placeholder="e.g. 287716"
              value={purchasePrice}
              onChange={(e) => handlePurchasePriceChange(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Current Market Valuation (₹)
            </label>
            {weightGrams && parseFloat(weightGrams) > 0 && (
              <button
                type="button"
                onClick={() => {
                  const grams = parseFloat(weightGrams) || 0;
                  const autoVal = Math.round(grams * liveRatePerGram);
                  setCurrentValuation(String(autoVal));
                }}
                className="text-[10.5px] text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>⚡ Auto-compute (Live: {formatINR(liveRatePerGram)}/g ➔ {formatINR(Math.round(parseFloat(weightGrams) * liveRatePerGram))})</span>
              </button>
            )}
          </div>
          <input
            type="number"
            inputMode="decimal"
            step="1"
            placeholder="e.g. 781148"
            value={currentValuation}
            onChange={(e) => setCurrentValuation(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold"
          />
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
            className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-[14px] h-11 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs ios-press transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-amber-600 text-white font-semibold text-sm rounded-[14px] h-11 py-2.5 hover:bg-amber-700 transition-colors disabled:opacity-50 ios-press shadow-xs cursor-pointer"
          >
            {loading ? 'Saving...' : editingHolding ? 'Save Changes' : 'Add Gold'}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default GoldFormModal;
