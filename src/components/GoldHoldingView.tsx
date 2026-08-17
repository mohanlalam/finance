import React, { useState, useEffect, useCallback } from 'react';
import { GoldHolding, DocumentMetadata, PortfolioName } from '../types/portfolio';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import GoldHoldingCard from './gold/GoldHoldingCard';
import GoldFormModal from './gold/GoldFormModal';
import AssetRegistryContainer from './ui/AssetRegistryContainer';
import { usePortfolioState } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useAssetModal } from '../hooks/useAssetModal';
import { useIsMobile } from '../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';

import { deriveGoldRates, getStoredGoldRate, saveStoredGoldRate, syncDailyGoldRateIfNeeded } from '../utils/goldPricing';
import { formatINR } from '../utils/formatters';

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
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

export function GoldHoldingView({
  goldHoldings,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: GoldHoldingViewProps) {
  const isMobile = useIsMobile();
  const { isMutating } = usePortfolioState();
  const { addToast } = useToastActions();
  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<GoldHolding>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await onDelete('gold', id);
      addToast('Gold holding deleted successfully', 'success');
      setConfirmDeleteItem(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete gold holding', 'error');
    } finally {
      setDeleting(false);
    }
  }, [onDelete, addToast, setConfirmDeleteItem]);

  const [customRate, setCustomRate] = useState<number>(() => {
    return getStoredGoldRate();
  });
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRateInput, setTempRateInput] = useState('');

  // Daily automatic gold rate sync (only executes once every 24 hours)
  useEffect(() => {
    let isMounted = true;
    syncDailyGoldRateIfNeeded().then((rate) => {
      if (isMounted && rate) {
        setCustomRate(rate);
      }
    }).catch((err) => {
      console.warn('[GoldHoldingView] Daily gold sync skipped:', err);
    });
    return () => { isMounted = false; };
  }, []);

  const rates = deriveGoldRates(customRate);

  const handleSaveRate = () => {
    const val = parseFloat(tempRateInput);
    if (!isNaN(val) && val > 1000) {
      setCustomRate(val);
      saveStoredGoldRate(val);
      addToast(`24K Gold spot rate updated to ${formatINR(val)}/g`, 'success');
    }
    setIsEditingRate(false);
  };

  return (
    <div className="space-y-4">
      {/* Live Market Rate Strip */}
      <div className="apple-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
            Au
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">Indicative Bullion Spot Rates</span>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Live Market
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)]">Standard IBJA/MCX rates per gram</p>
          </div>
        </div>

        <div className="flex items-stretch gap-2 sm:gap-3 text-xs font-bold tnum flex-wrap w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-amber-500/10">
          <button
            type="button"
            onClick={() => {
              setTempRateInput(String(rates.rate24kPerGram));
              setIsEditingRate(true);
            }}
            title="Click to calibrate market spot rate"
            className="flex-1 sm:flex-initial flex flex-col justify-center min-w-[125px] px-3 py-1.5 rounded-[var(--radius-small)] bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-amber-500/50 transition-colors cursor-pointer text-left ios-press"
          >
            <span className="text-[var(--text-tertiary)] text-[10px] uppercase font-semibold">24K (99.9%):</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">{formatINR(rates.rate24kPerGram)}/g</span>
              <span className="text-[10px] text-slate-400">✎</span>
            </div>
          </button>
          <div className="flex-1 sm:flex-initial flex flex-col justify-center min-w-[125px] px-3 py-1.5 rounded-[var(--radius-small)] bg-[var(--surface)] border border-[var(--border-subtle)] text-left">
            <span className="text-[var(--text-tertiary)] text-[10px] uppercase font-semibold">22K (91.6%):</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[var(--text-primary)] font-bold text-xs">{formatINR(rates.rate22kPerGram)}/g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spot Rate Calibration Modal */}
      {isEditingRate && (
        <Modal
          isOpen={isEditingRate}
          onClose={() => setIsEditingRate(false)}
          title="Calibrate 24K Gold Spot Rate"
        >
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Enter the current market rate per gram for 24K pure gold in ₹ INR (e.g. 15200). 22K (91.6%) and 18K (75%) valuations will automatically derive from this rate.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                24K Rate per gram (₹) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="1"
                value={tempRateInput}
                onChange={(e) => setTempRateInput(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-[10px] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="e.g. 15200"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setIsEditingRate(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[8px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRate}
                className="px-4 py-1.5 text-xs font-bold rounded-[8px] bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                Update Rate
              </button>
            </div>
          </div>
        </Modal>
      )}

      <AssetRegistryContainer
        title="Gold &amp; Precious Metals"
        createBtnLabel="Add Gold"
        themeColor="bg-amber-600 hover:bg-amber-700"
        emptyType="gold"
        emptyTitle="No Gold Holdings Added"
        emptyDescription="Track physical gold coins, bars, jewelry, or Sovereign Gold Bonds in your portfolio."
        isLoading={isMutating}
        itemCount={goldHoldings.length}
        onOpenAdd={openAdd}
      >
        {goldHoldings.length > 10 ? (
          <List
            height={Math.min(goldHoldings.length * (isMobile ? 165 : 130), isMobile ? 420 : 540)}
            itemCount={goldHoldings.length}
            itemSize={isMobile ? 165 : 130}
            width="100%"
          >
            {({ index, style }) => {
              const holding = goldHoldings[index];
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <GoldHoldingCard
                    holding={holding}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          goldHoldings.map((holding) => (
            <GoldHoldingCard
              key={holding.id}
              holding={holding}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <GoldFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingHolding={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        documents={documents}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDeleteDoc={onDelete}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
        title="Delete Gold Holding"
        message={confirmDeleteItem ? `Are you sure you want to delete "${confirmDeleteItem.item_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(GoldHoldingView);
