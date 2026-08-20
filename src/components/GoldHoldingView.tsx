import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { RotateCw, TrendingUp, TrendingDown, Scale, Coins, Check } from './icons/AppIcons';
import { 
  deriveGoldRates, 
  getStoredGoldRate, 
  saveStoredGoldRate, 
  fetchLiveGoldRates, 
  clearCustomGoldRate 
} from '../utils/goldPricing';
import { formatINR, formatPercent, pnlColor } from '../utils/formatters';

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
  const [isSyncing, setIsSyncing] = useState(false);

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

  const syncRates = useCallback(async (force = false) => {
    setIsSyncing(true);
    try {
      const fetched = await fetchLiveGoldRates(force);
      setCustomRate(fetched.rate24kPerGram);
      if (force) {
        addToast(`Updated 24K Gold spot rate to ${formatINR(fetched.rate24kPerGram)}/g`, 'success');
      }
    } catch {
      if (force) {
        addToast('Failed to refresh live gold rates', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [addToast]);

  // Automatic gold rate sync on mount
  useEffect(() => {
    syncRates(false);
  }, [syncRates]);

  const rates = deriveGoldRates(customRate);

  const handleSaveRate = () => {
    const val = parseFloat(tempRateInput);
    if (!isNaN(val) && val > 1000) {
      setCustomRate(val);
      saveStoredGoldRate(val);
      addToast(`Custom 24K Gold rate set to ${formatINR(val)}/g`, 'success');
      setIsEditingRate(false);
    } else {
      addToast('Please enter a valid rate greater than ₹1,000/g', 'error');
    }
  };

  const handleResetToLive = async () => {
    clearCustomGoldRate();
    await syncRates(true);
    addToast('Reverted to Live MCX Bullion rate', 'success');
    setIsEditingRate(false);
  };

  // Compute aggregate gold portfolio totals
  const totals = useMemo(() => {
    let totalGrams = 0;
    let totalInvested = 0;
    let totalCurrent = 0;

    for (const h of goldHoldings) {
      totalGrams += Number(h.weight_grams) || 0;
      totalInvested += Number(h.purchase_price) || 0;
      totalCurrent += Number(h.current_valuation) || 0;
    }

    const totalGain = totalCurrent - totalInvested;
    const gainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return { totalGrams, totalInvested, totalCurrent, totalGain, gainPct };
  }, [goldHoldings]);

  return (
    <div className="space-y-4">
      {/* Live MCX & NSE Bullion Benchmark Ribbon */}
      <div className="apple-card p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/10 via-[var(--surface)] to-transparent border border-amber-500/25">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Header & Market Status Badge */}
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[var(--radius-medium)] bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm shrink-0">
                Au
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    MCX & NSE Live Bullion Rates
                  </h3>
                  <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-[var(--radius-small)] flex items-center gap-1 border ${
                    rates.isCustom
                      ? 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30'
                      : 'bg-[var(--positive-soft)] text-[var(--positive)] border-[var(--positive)]/30'
                  }`}>
                    {!rates.isCustom && <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] animate-pulse" />}
                    {rates.isCustom ? 'Custom Override' : '🟢 MCX Live'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 flex items-center gap-2">
                  <span>{rates.source}</span>
                  {rates.changeINR !== 0 && !rates.isCustom && (
                    <span className={`font-semibold flex items-center gap-0.5 ${rates.changeINR >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {rates.changeINR >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {rates.changeINR >= 0 ? '+' : ''}{formatINR(rates.changeINR)}/g ({formatPercent(rates.changePercent)}) today
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Action Refresh Button (Mobile) */}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => syncRates(true)}
                disabled={isSyncing}
                className="p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ios-press cursor-pointer"
                title="Refresh Live Bullion Rates"
                aria-label="Refresh Live Rates"
              >
                <RotateCw size={14} className={isSyncing ? 'animate-spin text-amber-500' : ''} />
              </button>
            </div>
          </div>

          {/* Rate Pills (24K, 22K, 18K) & Desktop Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5">
            
            {/* 24K Pure Gold */}
            <button
              type="button"
              onClick={() => {
                setTempRateInput(String(rates.rate24kPerGram));
                setIsEditingRate(true);
              }}
              title="Click to calibrate 24K spot rate"
              className="flex-1 sm:flex-initial flex flex-col justify-center px-3 py-1.5 rounded-[var(--radius-small)] bg-[var(--surface)] border border-amber-500/30 hover:border-amber-500/60 transition-colors cursor-pointer text-left ios-press"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">24K (99.9%)</span>
                <span className="text-[9px] text-[var(--text-tertiary)]">✎</span>
              </div>
              <p className="text-xs font-bold text-[var(--text-primary)] tnum mt-0.5">
                {formatINR(rates.rate24kPerGram)}<span className="text-[10px] font-normal text-[var(--text-tertiary)]">/g</span>
              </p>
              <p className="text-[9.5px] text-[var(--text-tertiary)] tnum">
                {formatINR(rates.rate24kPer10g)}/10g
              </p>
            </button>

            {/* 22K Hallmark Gold */}
            <div className="flex-1 sm:flex-initial flex flex-col justify-center px-3 py-1.5 rounded-[var(--radius-small)] bg-[var(--surface)] border border-[var(--border-subtle)] text-left">
              <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">22K (91.6%)</span>
              <p className="text-xs font-bold text-[var(--text-primary)] tnum mt-0.5">
                {formatINR(rates.rate22kPerGram)}<span className="text-[10px] font-normal text-[var(--text-tertiary)]">/g</span>
              </p>
              <p className="text-[9.5px] text-[var(--text-tertiary)] tnum">
                {formatINR(rates.rate22kPer10g)}/10g
              </p>
            </div>

            {/* 18K Fine Gold */}
            <div className="flex-1 sm:flex-initial flex flex-col justify-center px-3 py-1.5 rounded-[var(--radius-small)] bg-[var(--surface)] border border-[var(--border-subtle)] text-left">
              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">18K (75.0%)</span>
              <p className="text-xs font-bold text-[var(--text-primary)] tnum mt-0.5">
                {formatINR(rates.rate18kPerGram)}<span className="text-[10px] font-normal text-[var(--text-tertiary)]">/g</span>
              </p>
              <p className="text-[9.5px] text-[var(--text-tertiary)] tnum">
                {formatINR(rates.rate18kPer10g)}/10g
              </p>
            </div>

            {/* Sync Now Button (Desktop) */}
            <button
              type="button"
              onClick={() => syncRates(true)}
              disabled={isSyncing}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-small)] bg-[var(--surface)] border border-[var(--border-subtle)] hover:bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ios-press cursor-pointer shrink-0"
              title="Refresh Live Bullion Rates"
            >
              <RotateCw size={13} className={isSyncing ? 'animate-spin text-amber-500' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* Gold Portfolio Aggregate Summary Ribbon */}
      {goldHoldings.length > 0 && (
        <div className="apple-card p-3.5 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--surface)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--warning-soft)] text-[var(--warning)] flex items-center justify-center shrink-0">
              <Scale size={16} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Total Gold Weight</p>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5">
                {totals.totalGrams.toFixed(2)} <span className="text-[10px] font-normal">grams</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0">
              <Coins size={16} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Current Valuation</p>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5">
                {formatINR(totals.totalCurrent)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Invested Capital</p>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] tnum mt-0.5">
              {formatINR(totals.totalInvested)}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Total Return</p>
            <p className={`text-xs sm:text-sm font-bold tnum mt-0.5 ${pnlColor(totals.totalGain)}`}>
              {totals.totalGain >= 0 ? '+' : ''}{formatINR(totals.totalGain)} ({formatPercent(totals.gainPct)})
            </p>
          </div>
        </div>
      )}

      {/* Spot Rate Calibration Modal */}
      {isEditingRate && (
        <Modal
          isOpen={isEditingRate}
          onClose={() => setIsEditingRate(false)}
          ariaLabel="Calibrate 24K Gold Spot Rate"
          maxWidth="max-w-sm"
        >
          <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-secondary)]">
            <div>
              <h3 className="text-card-title font-semibold text-[var(--text-primary)]">Calibrate 24K Gold Rate</h3>
              <p className="text-supporting mt-0.5">Custom jeweler or local bullion rate</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Enter the rate per gram for 24K pure gold in ₹ INR (e.g. 8850). 22K (91.6%) and 18K (75%) valuations will automatically derive based on hallmark standards.
            </p>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                24K Rate per gram (₹) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="1"
                value={tempRateInput}
                onChange={(e) => setTempRateInput(e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)]"
                placeholder="e.g. 8850"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
              {rates.isCustom ? (
                <button
                  type="button"
                  onClick={handleResetToLive}
                  className="px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-small)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors"
                >
                  Reset to MCX Live
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingRate(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-small)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  Cancel
                </button>
              )}
              <div className="flex gap-2">
                {rates.isCustom && (
                  <button
                    type="button"
                    onClick={() => setIsEditingRate(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-small)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveRate}
                  className="px-4 py-1.5 text-xs font-bold rounded-[var(--radius-small)] bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save Rate</span>
                </button>
              </div>
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
          <div className="divide-y divide-[var(--border-subtle)]">
            {goldHoldings.map((holding) => (
              <GoldHoldingCard
                key={holding.id}
                holding={holding}
                documents={documents}
                onOpenEdit={openEdit}
                onConfirmDelete={setConfirmDeleteItem}
              />
            ))}
          </div>
        )}
      </AssetRegistryContainer>

      {/* Add / Edit Form Modal */}
      {showModal && (
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
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteItem && (
        <ConfirmModal
          isOpen={!!confirmDeleteItem}
          title="Delete Gold Holding"
          message={`Are you sure you want to delete "${confirmDeleteItem.item_name}" (${confirmDeleteItem.weight_grams}g ${confirmDeleteItem.purity})? This action cannot be undone.`}
          confirmLabel="Delete Holding"
          isDestructive={true}
          isLoading={deleting}
          onConfirm={() => handleDelete(confirmDeleteItem.id)}
          onCancel={() => setConfirmDeleteItem(null)}
        />
      )}
    </div>
  );
}

export default React.memo(GoldHoldingView);
