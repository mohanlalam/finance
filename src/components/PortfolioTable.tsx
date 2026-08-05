import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Trash2, Pencil, Loader2, Check, X, SlidersHorizontal } from './icons/AppIcons';
import { Holding } from '../types/portfolio';
import { formatINR, formatNumber, formatPercent, pnlColor } from '../utils/formatters';
import { usePrivacy } from '../contexts/PrivacyContext';
import ConfirmModal from './ConfirmModal';
import EmptyState from './EmptyState';

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
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
      onClick={() => !hideArrow && handleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        {!hideArrow && (
          <span className={`text-[10px] ${sortKey === k ? 'text-[#007aff] dark:text-[#60a5fa] font-bold' : 'text-slate-300 dark:text-zinc-600'}`}>
            {sortKey === k ? (sortAsc ? '▲' : '▼') : '⇅'}
          </span>
        )}
      </span>
    </th>
  );
});

type FilterType = 'all' | 'gainers' | 'losers' | 'etfs';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editAvgPrice, setEditAvgPrice] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editError, setEditError] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const { isBalancesHidden } = usePrivacy();

  const renderValue = (val: number, formatter = formatINR) => {
    if (isBalancesHidden) return '••••••';
    return formatter(val);
  };

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
      const nameStr = h.stockName.toLowerCase();
      const tickerStr = h.ticker.toLowerCase();
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
        const nameStr = h.stockName.toLowerCase();
        const tickerStr = h.ticker.toLowerCase();
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
    const targetId = getHoldingId(h);
    setEditingId(targetId);
    setEditQty(String(h.qty));
    setEditAvgPrice(String(h.avgPrice));
    setEditError('');
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Quick Filters */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 overflow-x-auto">
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
              className={`px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border-indigo-200 dark:border-indigo-800/50'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {filter.label} <span className="opacity-70 ml-1">({filter.count})</span>
            </button>
          );
        })}
      </div>

      {/* Sorting presets */}
      <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-700/60 flex items-center gap-2 overflow-x-auto">
        <SlidersHorizontal size={12} className="text-slate-400 dark:text-slate-550 shrink-0" />
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider shrink-0">Sort:</span>
        {SORT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePreset(preset.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              activePreset === preset.id
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {sorted.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Total Value</p>
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 whitespace-nowrap">{renderValue(totalCurrentValue)}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">Invested: {renderValue(totalInvested)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Total P&amp;L</p>
              <div className="flex flex-wrap items-baseline gap-x-1 mt-0.5">
                <span className={`text-base font-extrabold whitespace-nowrap ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isBalancesHidden ? '••••••' : <>{totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}</>}
                </span>
                <span className={`text-xs font-semibold whitespace-nowrap opacity-90 ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  ({isBalancesHidden ? '••••••' : formatPercent(totalPnLPercent)})
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 p-3 space-y-3">
          {sorted.length === 0 ? (
            <div className="py-4">
              <EmptyState 
                type="stocks" 
                title="No stock holdings yet" 
                description="Add your first stock or ETF to start tracking" 
              />
            </div>
          ) : (
            sorted.map((h) => {
            const isDeleting = deletingId === h.id;
            const isEditing = editingId === h.id;

            return (
              <div
                key={`${h.ticker}-${h.sno}`}
                className={`py-3 flex flex-col gap-2 transition-opacity ${isDeleting ? 'opacity-40' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-block bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        {h.ticker}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {h.stockName}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="mt-2 space-y-2 border border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20 rounded-lg p-2">
                        <div className="flex gap-2">
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-400 uppercase">Qty</label>
                            <input
                              ref={editInputRef}
                              type="number"
                              min="1"
                              step="any"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              disabled={updatingId === h.id}
                              className="w-full border border-blue-300 dark:border-blue-800 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-400 uppercase">Avg Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={editAvgPrice}
                              onChange={(e) => setEditAvgPrice(e.target.value)}
                              disabled={updatingId === h.id}
                              className="w-full border border-blue-300 dark:border-blue-800 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none"
                            />
                          </div>
                        </div>
                        {editError && <p className="text-[9px] text-red-500">{editError}</p>}
                        <div className="flex gap-2 justify-end">
                          {updatingId === h.id ? (
                            <Loader2 size={12} className="animate-spin text-blue-500" />
                          ) : (
                            <>
                              <button
                                onClick={() => saveEdit(h)}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold hover:bg-slate-300"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5">
                        {isBalancesHidden ? '••••••' : <>{formatNumber(h.qty, 0)} shares @ ₹{formatNumber(h.avgPrice)}</>} (LTP: ₹{formatNumber(h.ltp)})
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {renderValue(h.currentValue)}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold whitespace-nowrap ${pnlColor(h.unrealizedPnL)}`}>
                        {isBalancesHidden ? '••••••' : <>{h.unrealizedPnL >= 0 ? '+' : ''}{formatINR(h.unrealizedPnL)}</>}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.2 rounded-full whitespace-nowrap ${h.pnlPercent >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
                        {isBalancesHidden ? '••••••' : formatPercent(h.pnlPercent)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-550 pt-1 border-t border-slate-50 dark:border-slate-700/30">
                  <div className="flex gap-2">
                    <span>Alloc: <span className="font-semibold text-slate-600 dark:text-slate-400">{h._allocation.toFixed(1)}%</span></span>
                    <span>Today: <span className={`font-semibold ${pnlColor(h.todayPnLPercent)}`}>{formatPercent(h.todayPnLPercent)}</span></span>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1.5">
                      {onUpdate && (
                        <button
                          onClick={() => startEdit(h)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/50 dark:border-blue-800/50 shadow-sm"
                          aria-label="Edit holding quantity and price"
                          title="Edit holding"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => handleDelete(h)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200/50 dark:border-red-800/50 shadow-sm"
                          aria-label="Delete holding"
                          title="Delete holding"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table role="table" className="min-w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <tr role="row">
              <Th label="Stock" k="stockName" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="Ticker" k="ticker" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="Qty" k="qty" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="Avg Price" k="avgPrice" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="LTP" k="ltp" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="Current Value" k="currentValue" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="Invested" k="amountInvested" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="P&L" k="unrealizedPnL" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="% P&L" k="pnlPercent" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="Today %" k="todayPnLPercent" sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              <Th label="Allocation %" k={"_allocation" as SortKey} sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} hideArrow={true} />
              {(onDelete || onUpdate) && <th role="columnheader" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40" role="rowgroup">
            {sorted.length === 0 ? (
              <tr role="row">
                <td role="cell" colSpan={(onDelete || onUpdate) ? 12 : 11} className="p-4">
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
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${isDeleting ? 'opacity-40' : ''}`}
                >
                  <td role="cell" className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 max-w-[180px]">
                    <span className="truncate block" title={h.stockName}>{h.stockName}</span>
                  </td>
                  <td role="cell" className="px-4 py-3">
                    <span className="inline-block bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-md">{h.ticker}</span>
                  </td>
                  <td role="cell" className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 text-right">
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
                          className="w-20 border border-blue-300 dark:border-blue-800 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-slate-800 dark:text-slate-100"
                        />
                        {updatingId === h.id ? (
                          <Loader2 size={14} className="animate-spin text-blue-500" />
                        ) : (
                          <>
                            <button onClick={() => saveEdit(h)} className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors" title="Save" aria-label="Save changes">
                              <Check size={13} />
                            </button>
                            <button onClick={cancelEdit} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Cancel" aria-label="Cancel edit">
                              <X size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 ${onUpdate ? 'cursor-pointer hover:text-blue-600' : ''}`}
                        onClick={() => startEdit(h)}
                        title={onUpdate ? 'Click to edit quantity' : undefined}
                      >
                        {renderValue(h.qty, (v) => formatNumber(v, 0))}
                        {onUpdate && (
                          <Pencil size={11} className="text-blue-500/70 dark:text-blue-400/70 hover:text-blue-600 transition-colors" />
                        )}
                      </span>
                    )}
                    {editError && editingId === getHoldingId(h) && (
                      <p className="text-[10px] text-red-500 mt-0.5">{editError}</p>
                    )}
                  </td>
                  <td role="cell" className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 text-right">
                    {editingId === getHoldingId(h) ? (
                      <div className="flex items-center justify-end">
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
                          className="w-24 border border-blue-300 dark:border-blue-800 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 ${onUpdate ? 'cursor-pointer hover:text-blue-600' : ''}`}
                        onClick={() => startEdit(h)}
                        title={onUpdate ? 'Click to edit average price' : undefined}
                      >
                        {isBalancesHidden ? '••••••' : <>₹{formatNumber(h.avgPrice)}</>}
                        {onUpdate && (
                          <Pencil size={11} className="text-blue-500/70 dark:text-blue-400/70 hover:text-blue-600 transition-colors" />
                        )}
                      </span>
                    )}
                  </td>
                  <td role="cell" className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 text-right">₹{formatNumber(h.ltp)}</td>
                  <td role="cell" className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 text-right">{renderValue(h.currentValue)}</td>
                  <td role="cell" className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-right">{renderValue(h.amountInvested)}</td>
                  <td role="cell" className={`px-4 py-3 text-sm font-semibold text-right ${pnlColor(h.unrealizedPnL)}`}>
                    {isBalancesHidden ? '••••••' : <>{h.unrealizedPnL >= 0 ? '+' : ''}{formatINR(h.unrealizedPnL)}</>}
                  </td>
                  <td role="cell" className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${h.pnlPercent >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-[#60a5fa]' : 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400'}`}>
                      <span className="text-[10px] font-extrabold mr-0.5">{h.pnlPercent >= 0 ? '↗' : '↘'}</span>
                      {isBalancesHidden ? '••••••' : formatPercent(h.pnlPercent)}
                    </span>
                  </td>
                  <td role="cell" className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold ${pnlColor(h.todayPnLPercent)}`}>
                      {isBalancesHidden ? '••••••' : formatPercent(h.todayPnLPercent)}
                    </span>
                  </td>
                  <td role="cell" className="px-4 py-3 text-right">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {((h as Record<string, unknown>)._allocation as number).toFixed(1)}%
                    </span>
                  </td>
                  {(onDelete || onUpdate) && (
                    <td role="cell" className="px-2 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onUpdate && (
                          <button
                            onClick={() => startEdit(h)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/50 dark:border-blue-800/50 shadow-sm"
                            title="Edit quantity & avg price"
                            aria-label="Edit holding quantity and price"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(h)}
                            disabled={isDeleting}
                            title="Delete holding"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200/50 dark:border-red-800/50 shadow-sm"
                            aria-label="Delete holding"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-800 dark:bg-slate-950 text-white dark:text-slate-200">
            <tr role="row">
              <td role="cell" colSpan={5} className="px-4 py-3 text-sm font-bold">Portfolio Total</td>
              <td role="cell" className="px-4 py-3 text-sm font-bold text-right">{renderValue(totalCurrentValue)}</td>
              <td role="cell" className="px-4 py-3 text-sm font-bold text-right text-slate-300 dark:text-slate-400">{renderValue(totalInvested)}</td>
              <td role="cell" className={`px-4 py-3 text-sm font-bold text-right ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {isBalancesHidden ? '••••••' : <>{totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}</>}
              </td>
              <td role="cell" colSpan={(onDelete || onUpdate) ? 4 : 3} className={`px-4 py-3 text-sm font-bold text-right ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {isBalancesHidden ? '••••••' : formatPercent(totalPnLPercent)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

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
    </div>
  );
});
