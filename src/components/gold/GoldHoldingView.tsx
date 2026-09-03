import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoldHolding, DocumentMetadata, PortfolioName } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import Modal from '../Modal';
import GoldHoldingCard from './GoldHoldingCard';
import GoldFormModal from './GoldFormModal';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption } from '../ui/RegistryToolbar';
import { useIsMutating, usePortfolioEntities } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { RotateCw, Scale, Coins, Check, User, Users } from '../icons/AppIcons';
import { 
  deriveGoldRates, 
  saveStoredGoldRate, 
  fetchLiveGoldRates, 
  clearCustomGoldRate 
} from '../../utils/goldPricing';
import { formatINR, formatPercent, pnlColor } from '../../utils/formatters';
import { sortPortfolios } from '../../domains/portfolio/calculations/portfolioOrdering';

const familyMemberConfigs: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  rammohan: {
    icon: <User size={12} />,
    bg: 'bg-blue-500/15 dark:bg-blue-400/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  padmavathi: {
    icon: <User size={12} />,
    bg: 'bg-emerald-500/15 dark:bg-emerald-400/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  sai_laxmi: {
    icon: <Users size={12} />,
    bg: 'bg-purple-500/15 dark:bg-purple-400/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
  sailaxmi: {
    icon: <Users size={12} />,
    bg: 'bg-purple-500/15 dark:bg-purple-400/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

function getFamilyMemberConfig(name: string) {
  const normalized = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('rammohan') || normalized.includes('ram')) {
    return familyMemberConfigs.rammohan;
  }
  if (normalized.includes('padmavathi')) {
    return familyMemberConfigs.padmavathi;
  }
  if (normalized.includes('sailaxmi') || normalized.includes('sai')) {
    return familyMemberConfigs.sai_laxmi;
  }
  return familyMemberConfigs[normalized] ?? {
    icon: <User size={12} />,
    bg: 'bg-amber-500/15 dark:bg-amber-400/20',
    text: 'text-amber-600 dark:text-amber-400',
  };
}

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

type GoldSortField = 'current_valuation' | 'weight_grams' | 'purchase_price' | 'item_name';

const GOLD_SORT_OPTIONS: SortOption<GoldSortField>[] = [
  { field: 'current_valuation', label: 'Value' },
  { field: 'weight_grams', label: 'Weight' },
  { field: 'purchase_price', label: 'Cost' },
  { field: 'item_name', label: 'Name' },
];

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
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
  const { portfolios } = usePortfolioEntities();

  // Aggregate Family Gold totals across all family members
  const familyGoldSummary = useMemo(() => {
    let totalGrams = 0;
    let totalInvested = 0;
    let totalValue = 0;

    const ordered = sortPortfolios(portfolios || []);
    const memberBreakdown = ordered.map((p) => {
      let memberGrams = 0;
      let memberInvested = 0;
      let memberValue = 0;

      for (const h of p.goldHoldings || []) {
        memberGrams += Number(h.weight_grams) || 0;
        memberInvested += Number(h.purchase_price) || 0;
        memberValue += Number(h.current_valuation) || 0;
      }

      totalGrams += memberGrams;
      totalInvested += memberInvested;
      totalValue += memberValue;

      return {
        name: p.name,
        label: p.label || p.name,
        grams: memberGrams,
        tola: memberGrams / 11.6638,
        value: memberValue,
        invested: memberInvested,
        count: (p.goldHoldings || []).length,
      };
    });

    const totalGain = totalValue - totalInvested;
    const gainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
    const totalTola = totalGrams / 11.6638;

    return {
      totalGrams,
      totalTola,
      totalValue,
      totalInvested,
      totalGain,
      gainPct,
      memberBreakdown,
    };
  }, [portfolios]);

  const [selectedMember, setSelectedMember] = useState<string>(portfolioName || 'all');

  useEffect(() => {
    setSelectedMember(portfolioName || 'all');
  }, [portfolioName]);

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

  // Search & Sorting Hook
  const {
    items: filteredHoldings,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    toggleSort,
    filteredCount,
    totalCount,
  } = useAssetFilterSort<GoldHolding, GoldSortField>(goldHoldings, {
    searchFields: ['item_name', 'purity'],
    initialSortField: 'current_valuation',
    initialSortOrder: 'desc',
    sortComparators: {
      current_valuation: (a, b) => (Number(a.current_valuation) || 0) - (Number(b.current_valuation) || 0),
      weight_grams: (a, b) => (Number(a.weight_grams) || 0) - (Number(b.weight_grams) || 0),
      purchase_price: (a, b) => (Number(a.purchase_price) || 0) - (Number(b.purchase_price) || 0),
      item_name: (a, b) => (a.item_name || '').localeCompare(b.item_name || ''),
    },
    debounceMs: 150,
  });

  const displayHoldingsByMember = useMemo(() => {
    const ordered = sortPortfolios(portfolios || []);
    return ordered.map((p) => {
      const pId = p.id;
      const memberHoldings = filteredHoldings.filter(
        (h) => h.portfolio_id === pId || (!h.portfolio_id && p.name === (portfolioName === 'all' ? p.name : portfolioName))
      );
      const memberGrams = memberHoldings.reduce((sum, h) => sum + (Number(h.weight_grams) || 0), 0);
      const memberVal = memberHoldings.reduce((sum, h) => sum + (Number(h.current_valuation) || 0), 0);
      return {
        portfolio: p,
        holdings: memberHoldings,
        grams: memberGrams,
        val: memberVal,
      };
    });
  }, [portfolios, filteredHoldings, portfolioName]);

  const activeHoldingsForMember = useMemo(() => {
    if (selectedMember === 'all') return filteredHoldings;
    const found = displayHoldingsByMember.find((item) => item.portfolio.name === selectedMember);
    return found ? found.holdings : filteredHoldings;
  }, [selectedMember, filteredHoldings, displayHoldingsByMember]);

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

  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRateInput, setTempRateInput] = useState('');
  const [rateTick, setRateTick] = useState(0);

  const syncRates = useCallback(async (force = false) => {
    setIsSyncing(true);
    try {
      const fetched = await fetchLiveGoldRates(force);
      setRateTick((t) => t + 1);
      if (force) {
        addToast(`Updated 24K Gold rate to ${formatINR(fetched.rate24kPerGram)}/g`, 'success');
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

  // Auto-sync gold rates every 1 hour in the background
  useEffect(() => {
    const timer = setInterval(() => {
      syncRates(false);
    }, 3_600_000); // 1 hour
    return () => clearInterval(timer);
  }, [syncRates]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rates = useMemo(() => deriveGoldRates(), [rateTick]);

  const handleSaveRate = () => {
    const val = parseFloat(tempRateInput);
    if (!isNaN(val) && val >= 5000) {
      saveStoredGoldRate(val);
      setRateTick((t) => t + 1);
      addToast(`Custom 24K Gold rate set to ${formatINR(val)}/g`, 'success');
      setIsEditingRate(false);
    } else {
      addToast('Please enter a valid rate greater than ₹5,000/g', 'error');
    }
  };

  const handleResetToLive = async () => {
    clearCustomGoldRate();
    setRateTick((t) => t + 1);
    await syncRates(true);
    addToast('Reverted to Live MCX & IBJA Bullion rates', 'success');
    setIsEditingRate(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unified Family Gold & Live Bullion Banner */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Users size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Total Family Gold Holdings
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0">
                  Combined
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                Aggregated bullion weight &amp; value across all family vaults
              </p>
            </div>
          </div>

          {/* Center: Live Bullion Rates + Sync + Right Badges */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
            {/* 24K Pure Gold */}
            <button
              type="button"
              onClick={() => {
                setTempRateInput(String(rates.rate24kPerGram));
                setIsEditingRate(true);
              }}
              title="Click to calibrate 24K spot rate"
              className="flex-1 sm:flex-initial flex flex-col justify-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-amber-500/30 hover:border-amber-500/60 transition-colors cursor-pointer text-left ios-press"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[8.5px] sm:text-[9.5px] uppercase font-bold text-amber-600 dark:text-amber-400">24K (99.9%)</span>
                <span className="text-[8px] text-[var(--text-tertiary)]">✎</span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-[var(--text-primary)] tnum mt-0.2 sm:mt-0.5">
                {formatINR(rates.rate24kPerGram)}<span className="text-[8.5px] sm:text-[9.5px] font-normal text-[var(--text-tertiary)]">/g</span>
              </p>
            </button>

            {/* 22K Hallmark Gold */}
            <div className="flex-1 sm:flex-initial flex flex-col justify-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-left">
              <span className="text-[8.5px] sm:text-[9.5px] uppercase font-bold text-[var(--text-secondary)]">22K (91.6%)</span>
              <p className="text-[11px] sm:text-xs font-bold text-[var(--text-primary)] tnum mt-0.2 sm:mt-0.5">
                {formatINR(rates.rate22kPerGram)}<span className="text-[8.5px] sm:text-[9.5px] font-normal text-[var(--text-tertiary)]">/g</span>
              </p>
            </div>

            {/* Sync Now Button */}
            <button
              type="button"
              onClick={() => syncRates(true)}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--surface)] text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ios-press cursor-pointer shrink-0"
              title="Refresh Live Bullion Rates"
              aria-label="Refresh Live Rates"
            >
              <RotateCw size={11} className={isSyncing ? 'animate-spin text-amber-500' : ''} />
              <span className="hidden xs:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Family Invested</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] tnum mt-0.5 block truncate">
              {formatINR(familyGoldSummary.totalInvested)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)] flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0">
              <Coins size={11} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Current Value</span>
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
                {formatINR(familyGoldSummary.totalValue)}
              </span>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-amber-500/25 flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-[var(--radius-small)] bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Scale size={11} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block truncate">Family Weight</span>
              <span className="text-xs sm:text-sm font-bold text-amber-500 tnum mt-0.5 block truncate">
                {familyGoldSummary.totalGrams.toFixed(1)} <span className="text-[9px] font-normal text-[var(--text-tertiary)]">g</span>
              </span>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-amber-500/25 flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-[var(--radius-small)] bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Scale size={11} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block truncate">Weight in Tola</span>
              <span className="text-xs sm:text-sm font-bold text-amber-500 tnum mt-0.5 block truncate">
                {familyGoldSummary.totalTola.toFixed(2)} <span className="text-[9px] font-normal text-[var(--text-tertiary)]">tola</span>
              </span>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)] col-span-2 sm:col-span-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Overall Return</span>
            <span className={`text-xs sm:text-sm font-bold tnum mt-0.5 block truncate ${pnlColor(familyGoldSummary.totalGain)}`}>
              {familyGoldSummary.totalGain >= 0 ? '+' : ''}{formatINR(familyGoldSummary.totalGain)} ({formatPercent(familyGoldSummary.gainPct)})
            </span>
          </div>
        </div>

        {/* Member-by-Member Distribution Cards: 3 compact columns on mobile */}
        {familyGoldSummary.memberBreakdown.length > 0 && (
          <div className="pt-1.5 sm:pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                Family Members Breakdown
              </span>
              <div className="flex items-center gap-1.5">
                {selectedMember !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedMember('all')}
                    className="text-[9.5px] sm:text-[10px] font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
                <span className="text-[9px] sm:text-[10px] text-[var(--text-tertiary)]">
                  {familyGoldSummary.memberBreakdown.reduce((acc, m) => acc + m.count, 0)} Holdings
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {familyGoldSummary.memberBreakdown.map((m) => {
                const config = getFamilyMemberConfig(m.name);
                const isSelected = selectedMember === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMember((prev) => (prev === m.name ? 'all' : m.name))}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 rounded-[var(--radius-small)] border transition-all cursor-pointer text-left ios-press min-w-0 ${
                      isSelected
                        ? 'bg-[var(--surface-secondary)] border-amber-500 ring-1 ring-amber-500/30 shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-amber-500/40'
                    }`}
                    title={`Click to filter ${m.label}'s gold holdings`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-[10.5px] sm:text-xs font-bold text-[var(--text-primary)] truncate">
                            {m.label}
                          </p>
                          {isSelected && (
                            <span className="hidden xs:inline text-[8px] font-bold px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[8.5px] sm:text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {m.count} holding{m.count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      <p className="text-[10.5px] sm:text-xs font-bold text-amber-500 tnum truncate">
                        {m.grams.toFixed(1)}g <span className="text-[8.5px] font-normal text-[var(--text-tertiary)]">({m.tola.toFixed(1)}T)</span>
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-semibold text-[var(--text-secondary)] tnum truncate">
                        {formatINR(m.value)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
              Enter the rate per gram for 24K pure gold in ₹ INR (e.g. 15840). 22K (91.6%) standard hallmark rate will automatically derive.
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
                placeholder="e.g. 15840"
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
        toolbar={
          goldHoldings.length > 0 ? (
            <RegistryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search gold holdings by name, purity, location..."
              sortOptions={GOLD_SORT_OPTIONS}
              currentSortField={sortField}
              currentSortOrder={sortOrder}
              onToggleSort={toggleSort}
              filteredCount={filteredCount}
              totalCount={totalCount}
            />
          ) : undefined
        }
      >
        {selectedMember !== 'all' ? (
          <div>
            <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {portfolioOptions.find((p) => p.name === selectedMember)?.label || selectedMember}&apos;s Holdings
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {activeHoldingsForMember.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember('all')}
                className="text-xs text-[var(--accent-blue)] hover:underline font-semibold cursor-pointer"
              >
                Show All Family
              </button>
            </div>
            {activeHoldingsForMember.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)] italic">
                No gold holdings recorded for this member.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {activeHoldingsForMember.map((holding) => (
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
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {displayHoldingsByMember.map((item) => {
              const config = getFamilyMemberConfig(item.portfolio.name);
              return (
                <div key={item.portfolio.name} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{item.portfolio.label}&apos;s Gold Holdings</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {item.holdings.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-500 tnum">
                      {item.grams.toFixed(2)} g <span className="text-[10px] font-normal text-[var(--text-tertiary)]">({(item.grams / 11.6638).toFixed(2)} tola)</span> {item.val > 0 ? `• ${formatINR(item.val)}` : ''}
                    </span>
                  </div>

                  {item.holdings.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-tertiary)] italic">
                      No gold holdings recorded for {item.portfolio.label}
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {item.holdings.map((holding) => (
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
                </div>
              );
            })}
          </div>
        )}
      </AssetRegistryContainer>

      {/* Add / Edit Form Modal */}
      {showModal && (
        <GoldFormModal
          isOpen={showModal}
          onClose={closeModal}
          editingHolding={editingItem}
          portfolioName={selectedMember !== 'all' ? selectedMember : (portfolioName !== 'all' ? portfolioName : (portfolios?.[0]?.name || 'personal'))}
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
          variant="danger"
          isLoading={deleting}
          onConfirm={() => handleDelete(confirmDeleteItem.id)}
          onClose={() => setConfirmDeleteItem(null)}
        />
      )}
    </div>
  );
}

export default React.memo(GoldHoldingView);
