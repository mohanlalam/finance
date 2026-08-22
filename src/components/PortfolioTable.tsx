import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Trash2, Pencil, Loader2, Check, X, SlidersHorizontal, Share2 } from './icons/AppIcons';
import { Holding } from '../types/portfolio';
import { formatINR, formatNumber, formatPercent } from '../utils/formatters';
import { usePrivacy } from '../contexts/PrivacyContext';
import { shareHolding } from '../utils/shareUtils';
import { useToastActions } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';
import EmptyState from './EmptyState';
import EditStockModal from './EditStockModal';
import { useIsMobile } from '../hooks/useIsMobile';
import HoldingDetailDrawer from './HoldingDetailDrawer';
import { calcHoldingTodayPnL } from '../utils/portfolioCalcs';

type SortPreset = 'value' | 'pnl' | 'pnlPct' | 'todayPct' | 'allocation';

const SORT_PRESETS: { id: SortPreset; label: string; key: string; asc: boolean }[] = [
  { id: 'value', label: 'Current Value', key: 'currentValue', asc: false },
  { id: 'pnl', label: 'P&L Amount', key: 'unrealizedPnL', asc: false },
  { id: 'pnlPct', label: 'P&L %', key: 'pnlPercent', asc: false },
  { id: 'todayPct', label: 'Today %', key: 'todayPnLPercent', asc: false },
  { id: 'allocation', label: 'Allocation %', key: '_allocation', asc: false },
];

interface PortfolioTableProps {
  holdings: Holding[];
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  onDelete?: (holdingId: string) => Promise<void>;
  onUpdate?: (holdingId: string, qty: number, avgPrice: number) => Promise<void>;
}

type SortKey = keyof Holding | '_allocation';

const Th = React.memo(({
  label,
  k,
  sortKey,
  sortAsc,
  handleSort,
  hideArrow = false,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortAsc: boolean;
  handleSort: (key: SortKey) => void;
  hideArrow?: boolean;
}) => {
  const getSortAria = (k: SortKey) => {
    if (sortKey !== k) return 'none';
    return sortAsc ? 'ascending' : 'descending';
  };

  return (
    <th
      role="columnheader"
      aria-sort={getSortAria(k)}
      className="px-2 py-3 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider select-none whitespace-nowrap"
    >
      <button
        type="button"
        disabled={hideArrow}
        onClick={() => !hideArrow && handleSort(k)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!hideArrow) handleSort(k);
          }
        }}
        className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-blue)] rounded px-1 -ml-1"
        aria-label={`Sort by ${label}`}
      >
        <span>{label}</span>
        {!hideArrow && (
          <span 
            className={`text-xs inline-block transition-transform duration-150 ${sortKey === k ? 'text-[var(--accent-blue)] font-extrabold' : 'text-[var(--text-tertiary)]'}`}
            aria-hidden="true"
          >
            {sortKey === k ? (sortAsc ? '▲' : '▼') : '⇅'}
          </span>
        )}
      </button>
    </th>
  );
});

type FilterType = 'all' | 'gainers' | 'losers' | 'etfs';

interface MobileStockRowProps {
  h: Holding & { _allocation: number; todayPnLPercent?: number; todayPnL?: number };
  isDeleting: boolean;
  isEditing: boolean;
  updatingId: string | null;
  editQty: string;
  editAvgPrice: string;
  editError: string;
  isBalancesHidden: boolean;
  editInputRef: React.RefObject<HTMLInputElement>;
  onSelectDetail: (h: Holding) => void;
  onStartEdit: (h: Holding) => void;
  onSaveEdit: (h: Holding) => void;
  onCancelEdit: () => void;
  onDelete: (h: Holding) => void;
  onShare: (h: Holding) => void;
  onEditQtyChange: (val: string) => void;
  onEditAvgPriceChange: (val: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
  renderValue: (val: number) => React.ReactNode;
}

const MobileStockRow = React.memo(function MobileStockRow({
  h,
  isDeleting,
  isEditing,
  updatingId,
  editQty,
  editAvgPrice,
  editError,
  isBalancesHidden,
  editInputRef,
  onSelectDetail,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onShare,
  onEditQtyChange,
  onEditAvgPriceChange,
  canUpdate,
  canDelete,
  renderValue,
}: MobileStockRowProps) {
  return (
    <div
      className={`py-3 flex flex-col gap-2 transition-opacity mobile-asset-card ${isDeleting ? 'opacity-40' : ''}`}
    >
      <div className="flex justify-between items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] font-extrabold text-xs flex items-center justify-center shrink-0 border border-[var(--border-subtle)] uppercase">
              {h.ticker.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <button
                onClick={() => onSelectDetail(h)}
                className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight block text-left hover:text-[var(--accent-blue)] transition-colors ios-press truncate max-w-full"
                title={h.stockName}
              >
                {h.ticker}
              </button>
              <span className="text-[10px] text-[var(--text-tertiary)] block -mt-0.5 truncate max-w-full">
                {h.stockName}
              </span>
            </div>
          </div>
          {isEditing ? (
            <div className="mt-2 space-y-2 border border-[var(--border-subtle)] bg-[var(--surface-secondary)] rounded-[var(--radius-small)] p-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Qty</label>
                  <input
                    ref={editInputRef}
                    type="number"
                    min="1"
                    step="any"
                    value={editQty}
                    onChange={(e) => onEditQtyChange(e.target.value)}
                    disabled={updatingId === h.id}
                    className="w-full border border-[var(--border-subtle)] rounded px-1.5 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase">Avg Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editAvgPrice}
                    onChange={(e) => onEditAvgPriceChange(e.target.value)}
                    disabled={updatingId === h.id}
                    className="w-full border border-[var(--border-subtle)] rounded px-1.5 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none"
                  />
                </div>
              </div>
              {editError && <p className="text-[10px] text-[var(--negative)]">{editError}</p>}
              <div className="flex gap-2 justify-end">
                {updatingId === h.id ? (
                  <Loader2 size={12} className="animate-spin text-[var(--accent-blue)]" aria-hidden="true" />
                ) : (
                  <>
                    <button
                      onClick={() => onSaveEdit(h)}
                      className="px-2.5 py-1 bg-[var(--positive)] text-white rounded-[var(--radius-small)] text-xs font-semibold ios-press"
                    >
                      Save
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="px-2.5 py-1 bg-[var(--surface-tertiary)] text-[var(--text-primary)] rounded-[var(--radius-small)] text-xs font-semibold ios-press"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 truncate">
              {isBalancesHidden ? '••••••' : <>{formatNumber(h.qty, 0)} shares @ ₹{formatNumber(h.avgPrice)}</>} · LTP: ₹{formatNumber(h.ltp)}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 flex flex-col items-end">
          <p className="text-xs font-extrabold text-[var(--text-primary)] tnum">
            {renderValue(h.currentValue)}
          </p>
          <div className="flex items-center gap-1 justify-end mt-0.5 flex-wrap">
            <span className={`text-[10px] font-bold whitespace-nowrap tnum ${h.unrealizedPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {isBalancesHidden ? '••••••' : <>{h.unrealizedPnL >= 0 ? '+' : ''}{formatINR(h.unrealizedPnL)}</>}
            </span>
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-[var(--radius-pill)] whitespace-nowrap tnum ${h.pnlPercent >= 0 ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'}`}>
              <span className="text-[9px] font-extrabold" aria-hidden="true">{h.pnlPercent >= 0 ? '↗' : '↘'}</span>
              {isBalancesHidden ? '••••••' : formatPercent(h.pnlPercent)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] pt-1.5 border-t border-[var(--border-subtle)] gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span>Alloc: <span className="font-semibold text-[var(--text-primary)] tnum">{h._allocation.toFixed(1)}%</span></span>
          <span>Today: <span className={`font-semibold tnum ${(h.todayPnLPercent ?? 0) >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>{formatPercent(h.todayPnLPercent ?? 0)}</span></span>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onShare(h)}
              className="w-11 h-11 sm:w-8 sm:h-8 rounded-[var(--radius-small)] flex items-center justify-center bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] border border-[var(--border-subtle)] shadow-xs ios-press"
              title="Share holding"
              aria-label="Share holding summary"
            >
              <Share2 size={12} aria-hidden="true" />
            </button>
            {canUpdate && (
              <button
                onClick={() => onStartEdit(h)}
                className="w-11 h-11 sm:w-8 sm:h-8 rounded-[var(--radius-small)] flex items-center justify-center bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] border border-[var(--border-subtle)] shadow-xs ios-press"
                aria-label="Edit holding quantity and price"
                title="Edit holding"
              >
                <Pencil size={12} aria-hidden="true" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(h)}
                className="w-11 h-11 sm:w-8 sm:h-8 rounded-[var(--radius-small)] flex items-center justify-center bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--negative)] border border-[var(--border-subtle)] shadow-xs ios-press"
                aria-label="Delete holding"
                title="Delete holding"
              >
                <Trash2 size={12} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default React.memo(function PortfolioTable({
  holdings,
  totalInvested,
  totalCurrentValue,
  totalPnL,
  totalPnLPercent,
  onDelete,
  onUpdate,
}: PortfolioTableProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('currentValue');
  const [sortAsc, setSortAsc] = useState(false);
  const [activePreset, setActivePreset] = useState<SortPreset | null>('value');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Holding | null>(null);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [selectedDetailHolding, setSelectedDetailHolding] = useState<Holding | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editAvgPrice, setEditAvgPrice] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editError, setEditError] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const { isBalancesHidden } = usePrivacy();
  const { addToast } = useToastActions();
  const isMobile = useIsMobile();

  const renderValue = useCallback((val: number, formatter = formatINR) => {
    if (isBalancesHidden) return '••••••';
    return formatter(val);
  }, [isBalancesHidden]);

  const holdingsWithAlloc = useMemo(() => {
    return holdings.map((h) => ({
      ...h,
      _allocation: totalCurrentValue > 0 ? (h.currentValue / totalCurrentValue) * 100 : 0,
    }));
  }, [holdings, totalCurrentValue]);

  const counts = useMemo(() => {
    let gainers = 0;
    let losers = 0;
    let etfs = 0;
    holdingsWithAlloc.forEach(h => {
      if (h.unrealizedPnL > 0) gainers++;
      if (h.unrealizedPnL < 0) losers++;
      
      const typeStr = (h as Holding & { type?: string }).type?.toLowerCase();
      const nameStr = (h.stockName || '').toLowerCase();
      const tickerStr = (h.ticker || '').toLowerCase();
      if (typeStr === 'etf' || nameStr.includes('etf') || tickerStr.includes('etf')) {
        etfs++;
      }
    });
    return { all: holdingsWithAlloc.length, gainers, losers, etfs };
  }, [holdingsWithAlloc]);

  const filteredHoldings = useMemo(() => {
    return holdingsWithAlloc.filter(h => {
      if (activeFilter === 'gainers') return h.unrealizedPnL > 0;
      if (activeFilter === 'losers') return h.unrealizedPnL < 0;
      if (activeFilter === 'etfs') {
        const typeStr = (h as Holding & { type?: string }).type?.toLowerCase();
        const nameStr = (h.stockName || '').toLowerCase();
        const tickerStr = (h.ticker || '').toLowerCase();
        return typeStr === 'etf' || nameStr.includes('etf') || tickerStr.includes('etf');
      }
      return true;
    });
  }, [holdingsWithAlloc, activeFilter]);

  const sorted = useMemo(() => {
    return [...filteredHoldings].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];

      if (typeof av === 'string' || typeof bv === 'string') {
        const result = String(av ?? '').localeCompare(String(bv ?? ''), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        return sortAsc ? result : -result;
      }

      const aNum = Number(av ?? 0);
      const bNum = Number(bv ?? 0);
      return sortAsc ? aNum - bNum : bNum - aNum;
    });
  }, [filteredHoldings, sortKey, sortAsc]);

  const handleSort = useCallback((key: SortKey) => {
    setActivePreset(null);
    setSortKey((prevSortKey) => {
      if (prevSortKey === key) {
        setSortAsc((prevAsc) => !prevAsc);
        return prevSortKey;
      } else {
        setSortAsc(false);
        return key;
      }
    });
  }, []);

  function handlePreset(preset: SortPreset) {
    const p = SORT_PRESETS.find((s) => s.id === preset);
    if (!p) return;
    setActivePreset(preset);
    setSortKey(p.key as SortKey);
    setSortAsc(p.asc);
  }

  function getHoldingId(h: Holding): string {
    return h.id || h.ticker || String(h.sno);
  }

  function handleDelete(h: Holding) {
    if (!onDelete) return;
    setConfirmDelete(h);
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete || !onDelete) return;
    const targetId = getHoldingId(confirmDelete);
    setDeletingId(targetId);
    try {
      await onDelete(targetId);
      setConfirmDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  function startEdit(h: Holding) {
    if (!onUpdate) return;
    setEditingHolding(h);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditQty('');
    setEditAvgPrice('');
    setEditError('');
  }

  async function saveEdit(h: Holding) {
    if (!onUpdate) return;
    const targetId = getHoldingId(h);
    const newQty = parseFloat(editQty);
    const newAvgPrice = parseFloat(editAvgPrice);
    if (isNaN(newQty) || newQty <= 0) {
      setEditError('Enter a valid quantity');
      return;
    }
    if (isNaN(newAvgPrice) || newAvgPrice < 0) {
      setEditError('Enter a valid price');
      return;
    }
    if (newQty === h.qty && newAvgPrice === h.avgPrice) {
      cancelEdit();
      return;
    }
    setUpdatingId(targetId);
    setEditError('');
    try {
      await onUpdate(targetId, newQty, newAvgPrice);
      setEditingId(null);
      setEditQty('');
      setEditAvgPrice('');
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const todayTotalPnL = useMemo(() => {
    return holdings.reduce((sum, h) => sum + calcHoldingTodayPnL(h), 0);
  }, [holdings]);

  const todayTotalPnLPercent = useMemo(() => {
    const prevVal = totalCurrentValue - todayTotalPnL;
    return prevVal > 0 ? (todayTotalPnL / prevVal) * 100 : 0;
  }, [todayTotalPnL, totalCurrentValue]);

  return (
    <div className="apple-card overflow-hidden">
      {/* Zerodha Kite Holdings Overview Ribbon */}
      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs">
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-[var(--text-primary)]">Holdings</span>
            <span className="px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] text-[11px] font-extrabold tnum">
              {holdings.length}
            </span>
          </div>
          <div className="hidden sm:block h-3.5 w-px bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="text-[var(--text-tertiary)]">Invested:</span>
            <span className="font-bold text-[var(--text-primary)] tnum">{renderValue(totalInvested)}</span>
          </div>
          <div className="hidden sm:block h-3.5 w-px bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="text-[var(--text-tertiary)]">Current:</span>
            <span className="font-bold text-[var(--text-primary)] tnum">{renderValue(totalCurrentValue)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 pt-1 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]/60">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="text-[var(--text-tertiary)]">Stock P&amp;L:</span>
            <span className={`font-extrabold tnum ${totalPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {isBalancesHidden ? '••••••' : <>{totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)} ({formatPercent(totalPnLPercent)})</>}
            </span>
          </div>
          {todayTotalPnL !== 0 && (
            <>
              <div className="hidden sm:block h-3.5 w-px bg-[var(--border-subtle)]" />
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <span className="text-[var(--text-tertiary)]">Day:</span>
                <span className={`font-bold tnum ${todayTotalPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {isBalancesHidden ? '••••••' : <>{todayTotalPnL >= 0 ? '+' : ''}{formatINR(todayTotalPnL)} ({formatPercent(todayTotalPnLPercent)})</>}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'gainers', label: 'Gainers', count: counts.gainers },
            { id: 'losers', label: 'Losers', count: counts.losers },
            { id: 'etfs', label: 'ETFs', count: counts.etfs },
          ].map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as FilterType)}
                className={`px-2.5 py-1 rounded-[var(--radius-small)] text-xs font-semibold transition-all whitespace-nowrap ios-press ${
                  isActive
                    ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                {filter.label} <span className="opacity-75 text-[10px] ml-0.5">({filter.count})</span>
              </button>
            );
          })}
        </div>

        {/* Sorting presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <SlidersHorizontal size={12} className="text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider shrink-0 hidden sm:inline">Sort:</span>
          {SORT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePreset(preset.id)}
              className={`px-2 py-0.5 rounded-[var(--radius-small)] text-[10.5px] font-semibold transition-all whitespace-nowrap ios-press ${
                activePreset === preset.id
                  ? 'bg-[var(--text-primary)] text-[var(--surface)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Single-pass responsive layout selection */}
      {isMobile ? (
        <div className="block">
          <div className="divide-y divide-[var(--border-subtle)] p-3 space-y-3">
            {sorted.length === 0 ? (
              <div className="py-4">
                <EmptyState 
                  type="stocks" 
                  title="No stock holdings yet" 
                  description="Add your first stock or ETF to start tracking" 
                />
              </div>
            ) : (
              sorted.map((h) => (
                <MobileStockRow
                  key={`${h.ticker}-${h.sno}`}
                  h={h}
                  isDeleting={deletingId === h.id}
                  isEditing={editingId === h.id}
                  updatingId={updatingId}
                  editQty={editQty}
                  editAvgPrice={editAvgPrice}
                  editError={editError}
                  isBalancesHidden={isBalancesHidden}
                  editInputRef={editInputRef}
                  onSelectDetail={setSelectedDetailHolding}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onDelete={handleDelete}
                  onShare={(h) => shareHolding(h, addToast)}
                  onEditQtyChange={setEditQty}
                  onEditAvgPriceChange={setEditAvgPrice}
                  canUpdate={!!onUpdate}
                  canDelete={!!onDelete}
                  renderValue={renderValue}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="block overflow-x-auto">
          <table role="table" className="w-full text-left border-collapse">
            <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)]">
              <tr role="row">
                <Th label="Instrument" k="ticker" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="Qty." k="qty" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="Avg. cost" k="avgPrice" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="LTP" k="ltp" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="Cur. val" k="currentValue" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="Invested" k="amountInvested" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="P&L" k="unrealizedPnL" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="Net chg." k="pnlPercent" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="Day's chg." k="todayPnLPercent" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
                <Th label="Allocation" k={"_allocation" as SortKey} sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} hideArrow={true} />
                {(onDelete || onUpdate) && (
                  <th role="columnheader" className="px-2 py-3 text-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs" role="rowgroup">
              {sorted.length === 0 ? (
                <tr role="row">
                  <td role="cell" colSpan={(onDelete || onUpdate) ? 11 : 10} className="p-4">
                    <EmptyState 
                      type="stocks" 
                      title="No stock holdings yet" 
                      description="Add your first stock or ETF to start tracking" 
                    />
                  </td>
                </tr>
              ) : sorted.map((h) => {
                const isDeleting = deletingId === h.id;
                return (
                  <tr
                    role="row"
                    key={`${h.ticker}-${h.sno}`}
                    className={`group hover:bg-[var(--surface-secondary)]/60 transition-colors ${isDeleting ? 'opacity-40' : ''}`}
                  >
                    <td role="cell" className="px-3 py-2.5 font-bold text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-[var(--border-subtle)] uppercase">
                          {h.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedDetailHolding(h)}
                            className="font-bold text-[var(--text-primary)] block leading-tight text-left hover:text-[var(--accent-blue)] transition-colors ios-press"
                            title={h.stockName}
                          >
                            {h.ticker}
                          </button>
                          <span className="text-[10px] text-[var(--text-tertiary)] block truncate max-w-[130px] font-normal">
                            {h.stockName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td role="cell" className="px-3 py-2.5 text-[var(--text-primary)] text-right tnum">
                      {editingId === h.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            ref={editInputRef}
                            type="number"
                            min="1"
                            step="any"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(h);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            disabled={updatingId === h.id}
                            className="w-16 border border-[var(--accent-blue)] rounded px-1.5 py-0.5 text-xs text-right bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
                          />
                          {updatingId === h.id ? (
                            <Loader2 size={12} className="animate-spin text-[var(--accent-blue)]" aria-hidden="true" />
                          ) : (
                            <>
                              <button onClick={() => saveEdit(h)} className="text-[var(--positive)] p-0.5 ios-press" title="Save" aria-label="Save changes">
                                <Check size={13} />
                              </button>
                              <button onClick={cancelEdit} className="text-[var(--text-tertiary)] p-0.5 ios-press" title="Cancel" aria-label="Cancel edit">
                                <X size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        renderValue(h.qty, (v) => formatNumber(v, 0))
                      )}
                      {editError && editingId === getHoldingId(h) && (
                        <p className="text-[9px] text-[var(--negative)] mt-0.5">{editError}</p>
                      )}
                    </td>

                    <td role="cell" className="px-3 py-2.5 text-[var(--text-secondary)] text-right tnum">
                      {editingId === getHoldingId(h) ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={editAvgPrice}
                          onChange={(e) => setEditAvgPrice(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(h);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          disabled={updatingId === getHoldingId(h)}
                          className="w-20 border border-[var(--accent-blue)] rounded px-1.5 py-0.5 text-xs text-right bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
                        />
                      ) : (
                        isBalancesHidden ? '••••••' : `₹${formatNumber(h.avgPrice)}`
                      )}
                    </td>

                    <td role="cell" className="px-3 py-2.5 font-bold text-[var(--text-primary)] text-right tnum">₹{formatNumber(h.ltp)}</td>
                    <td role="cell" className="px-3 py-2.5 font-extrabold text-[var(--text-primary)] text-right tnum">{renderValue(h.currentValue)}</td>
                    <td role="cell" className="px-3 py-2.5 text-[var(--text-secondary)] text-right tnum">{renderValue(h.amountInvested)}</td>
                    
                    <td role="cell" className={`px-3 py-2.5 font-bold text-right tnum ${h.unrealizedPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {isBalancesHidden ? '••••••' : <>{h.unrealizedPnL >= 0 ? '+' : ''}{formatINR(h.unrealizedPnL)}</>}
                    </td>

                    <td role="cell" className="px-3 py-2.5 text-right">
                      <span className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold px-1.5 py-0.5 rounded-[var(--radius-small)] tnum ${h.pnlPercent >= 0 ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'}`}>
                        <span className="text-[9px]" aria-hidden="true">{h.pnlPercent >= 0 ? '↗' : '↘'}</span>
                        {isBalancesHidden ? '••••••' : formatPercent(h.pnlPercent)}
                      </span>
                    </td>

                    <td role="cell" className={`px-3 py-2.5 font-bold text-right tnum ${h.todayPnLPercent >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {isBalancesHidden ? '••••••' : formatPercent(h.todayPnLPercent)}
                    </td>

                    <td role="cell" className="px-3 py-2.5 text-[var(--text-tertiary)] text-right tnum">
                      {((h as Record<string, unknown>)._allocation as number).toFixed(1)}%
                    </td>

                    {(onDelete || onUpdate) && (
                      <td role="cell" className="px-2 py-2 text-center">
                        {/* Hover Action Dock (Zerodha Style - Accessible on Hover & Keyboard Focus) */}
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => shareHolding(h, addToast)}
                            className="w-6 h-6 rounded-[var(--radius-small)] flex items-center justify-center bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] border border-[var(--border-subtle)] shadow-xs ios-press focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
                            title="Share holding"
                            aria-label="Share holding summary"
                          >
                            <Share2 size={11} aria-hidden="true" />
                          </button>
                          {onUpdate && (
                            <button
                              onClick={() => startEdit(h)}
                              className="w-6 h-6 rounded-[var(--radius-small)] flex items-center justify-center bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] border border-[var(--border-subtle)] shadow-xs ios-press focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
                              title="Edit holding"
                              aria-label="Edit holding quantity and price"
                            >
                              <Pencil size={11} aria-hidden="true" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => handleDelete(h)}
                              disabled={isDeleting}
                              className="w-6 h-6 rounded-[var(--radius-small)] flex items-center justify-center bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--negative)] hover:bg-[var(--negative-soft)] border border-[var(--border-subtle)] shadow-xs ios-press focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--negative)]"
                              title="Delete holding"
                              aria-label="Delete holding"
                            >
                              <Trash2 size={11} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[var(--surface-secondary)] border-t-2 border-[var(--border-subtle)] text-[var(--text-primary)]">
              <tr role="row">
                <td role="cell" colSpan={4} className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider">Total</td>
                <td role="cell" className="px-3 py-2.5 text-xs font-extrabold text-right tnum">{renderValue(totalCurrentValue)}</td>
                <td role="cell" className="px-3 py-2.5 text-xs font-bold text-right text-[var(--text-secondary)] tnum">{renderValue(totalInvested)}</td>
                <td role="cell" className={`px-3 py-2.5 text-xs font-extrabold text-right tnum ${totalPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {isBalancesHidden ? '••••••' : <>{totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}</>}
                </td>
                <td role="cell" colSpan={(onDelete || onUpdate) ? 4 : 3} className={`px-3 py-2.5 text-xs font-extrabold text-right tnum ${totalPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {isBalancesHidden ? '••••••' : formatPercent(totalPnLPercent)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Holding"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.stockName || confirmDelete.ticker}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletingId === confirmDelete?.id}
      />

      {editingHolding && onUpdate && (
        <EditStockModal
          holding={editingHolding}
          isOpen={!!editingHolding}
          onClose={() => setEditingHolding(null)}
          onSave={async (id, qty, avgPrice) => {
            await onUpdate(id, qty, avgPrice);
            addToast(`Updated ${editingHolding.ticker} holding`, 'success');
            setEditingHolding(null);
          }}
        />
      )}

      <HoldingDetailDrawer
        holding={selectedDetailHolding}
        isOpen={!!selectedDetailHolding}
        onClose={() => setSelectedDetailHolding(null)}
        onEdit={startEdit}
        onDelete={handleDelete}
        onShare={(item) => shareHolding(item, addToast)}
      />
    </div>
  );
});
