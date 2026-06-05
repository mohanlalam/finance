import React, { useState, useCallback } from 'react';
import { GoldHolding, DocumentMetadata, PortfolioName } from '../types/portfolio';
import { formatINR, formatPercent, pnlColor, getDocumentUrl } from '../utils/formatters';
import { Plus, Trash2, Edit2, Coins, TrendingUp, Scale, FileText, X, StickyNote } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { usePortfolioState } from '../contexts/PortfolioContext';
import AssetCardSkeleton from './AssetCardSkeleton';

interface PortfolioOption {
  name: string;
  label: string;
}

interface GoldHoldingViewProps {
  goldHoldings: GoldHolding[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

const PURITY_OPTIONS = ['24K', '22K', '20K', '18K', '14K'];

export default React.memo(function GoldHoldingView({
  goldHoldings,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: GoldHoldingViewProps) {
  const { isMutating } = usePortfolioState();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GoldHolding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formPortfolio, setFormPortfolio] = useState(() => portfolioName);
  const [itemName, setItemName] = useState('');
  const [purity, setPurity] = useState('22K');
  const [weightGrams, setWeightGrams] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValuation, setCurrentValuation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');

  // Confirm-delete state
  const [confirmDelete, setConfirmDelete] = useState<GoldHolding | null>(null);

  const totalWeight = goldHoldings.reduce((s, g) => s + Number(g.weight_grams), 0);
  const totalPurchase = goldHoldings.reduce((s, g) => s + Number(g.purchase_price), 0);
  const totalCurrent = goldHoldings.reduce((s, g) => s + Number(g.current_valuation), 0);
  const totalGain = totalCurrent - totalPurchase;
  const gainPct = totalPurchase > 0 ? (totalGain / totalPurchase) * 100 : 0;

  const handleOpenAdd = useCallback(() => {
    setEditing(null);
    setFormPortfolio(portfolioName);
    setItemName('');
    setPurity('22K');
    setWeightGrams('');
    setPurchasePrice('');
    setCurrentValuation('');
    setPurchaseDate('');
    setNotes('');
    setError('');
    setShowModal(true);
  }, [portfolioName]);

  React.useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAdd();
    }
  }, [autoOpenAddModal, handleOpenAdd]);

  function handleOpenEdit(g: GoldHolding) {
    setEditing(g);
    setFormPortfolio(portfolioName);
    setItemName(g.item_name);
    setPurity(g.purity);
    setWeightGrams(String(g.weight_grams));
    setPurchasePrice(String(g.purchase_price));
    setCurrentValuation(String(g.current_valuation));
    setPurchaseDate(g.purchase_date ?? '');
    setNotes(g.notes ?? '');
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName || !weightGrams || !purchasePrice) {
      setError('Item name, weight, and purchase price are required.');
      return;
    }
    setLoading(true);
    setError('');
    const payload = {
      itemName,
      purity,
      weightGrams: parseFloat(weightGrams),
      purchasePrice: parseFloat(purchasePrice),
      currentValuation: currentValuation ? parseFloat(currentValuation) : parseFloat(purchasePrice),
      purchaseDate: purchaseDate || null,
      notes: notes || null,
    };
    try {
      if (editing) {
        await onUpdate('gold', editing.id, payload);
      } else {
        await onAdd('gold', formPortfolio, payload);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete('gold', id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-100 font-semibold uppercase tracking-wider">Total Gold Value</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalCurrent)}</p>
            <p className="text-xs text-amber-200 mt-2">{totalWeight.toFixed(2)} grams</p>
          </div>
          <Coins size={40} className="opacity-20 shrink-0" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Cost Basis</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalPurchase)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Purchase price total</p>
          </div>
          <Scale size={40} className="text-amber-500/20 shrink-0" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Appreciation</p>
            <p className={`text-2xl font-bold mt-1 ${pnlColor(totalGain)}`}>{formatINR(totalGain)}</p>
            <p className={`text-xs font-semibold mt-2 ${pnlColor(totalGain)}`}>{formatPercent(gainPct)}</p>
          </div>
          <TrendingUp size={40} className="text-emerald-500/20 shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Gold Holdings</h3>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} />
            Add Gold Item
          </button>
        </div>

        {isMutating ? (
          <div className="p-6">
            <AssetCardSkeleton count={Math.max(1, goldHoldings.length || 3)} />
          </div>
        ) : goldHoldings.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-950/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Coins size={36} className="text-amber-400 dark:text-amber-500" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1.5">No Gold Holdings Yet</h4>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs mx-auto">
              Track coins, jewelry, or bars by weight and purity to monitor appreciation over time.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-amber-500/20"
            >
              <Plus size={15} />
              Add Your First Gold Item
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {goldHoldings.map((g) => {
              const gain = Number(g.current_valuation) - Number(g.purchase_price);
              const pct = Number(g.purchase_price) > 0 ? (gain / Number(g.purchase_price)) * 100 : 0;
              const docs = documents.filter((d) => d.asset_type === 'gold' && d.asset_id === g.id);
              return (
                <div key={g.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Coins size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{g.item_name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                            {g.purity}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {Number(g.weight_grams).toFixed(2)} g
                          </span>
                        </div>
                        {g.purchase_date && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Purchased: {g.purchase_date}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:text-right">
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Purchase</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatINR(Number(g.purchase_price))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Current Value</p>
                        <p className={`text-sm font-bold ${pnlColor(gain)}`}>{formatINR(Number(g.current_valuation))}</p>
                        <p className={`text-[10px] ${pnlColor(gain)}`}>{formatPercent(pct)}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-start md:justify-end gap-2">
                        {docs.map((doc) => (
                          <a
                            key={doc.id}
                            href={getDocumentUrl(doc.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-800 transition-colors"
                            title={doc.name}
                          >
                            <FileText size={14} />
                          </a>
                        ))}
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(g)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {g.notes && (
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1.5 px-0">
                      <StickyNote size={11} className="shrink-0 mt-0.5" />
                      <span className="italic">{g.notes}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => !loading && setShowModal(false)}
        ariaLabel={editing ? 'Edit Gold Holding' : 'Add Gold Item'}
        preventClose={loading}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {editing ? 'Edit Gold Holding' : 'Add Gold Item'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Track coins, jewelry, or bars by weight and purity</p>
          </div>
          <button
            onClick={() => !loading && setShowModal(false)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Portfolio</label>
            <select
              value={formPortfolio}
              onChange={(e) => setFormPortfolio(e.target.value)}
              disabled={!!editing}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors disabled:opacity-50"
            >
              {portfolioOptions.map((o) => (
                <option key={o.name} value={o.name}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Item Name</label>
            <input
              type="text"
              placeholder="e.g. 24K Gold Coins, Bridal Necklace"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Purity</label>
              <select
                value={purity}
                onChange={(e) => setPurity(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors"
              >
                {PURITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Weight (grams)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Purchase Price (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Current Valuation (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={currentValuation}
                onChange={(e) => setCurrentValuation(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="e.g. Inherited from grandfather, stored in locker"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2" role="alert">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editing ? 'Save Changes' : 'Add Gold'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete dialog */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void handleDelete(confirmDelete.id); }}
        title="Delete Gold Holding"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.item_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
});
