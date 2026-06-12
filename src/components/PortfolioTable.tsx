import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Trash2, Pencil, Loader2, Check, X, SlidersHorizontal } from './icons/AppIcons';
import { Holding } from '../types/portfolio';
import { formatINR, formatNumber, formatPercent, pnlColor } from '../utils/formatters';

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
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortAsc: boolean;
  handleSort: (key: SortKey) => void;
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
      onClick={() => handleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={11} className={sortKey === k ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'} />
      </span>
    </th>
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
  const [sortKey, setSortKey] = useState<SortKey>('currentValue');
  const [sortAsc, setSortAsc] = useState(false);
  const [activePreset, setActivePreset] = useState<SortPreset | null>('value');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editAvgPrice, setEditAvgPrice] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editError, setEditError] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const holdingsWithAlloc = useMemo(() => {
    return holdings.map((h) => ({
      ...h,
      _allocation: totalCurrentValue > 0 ? (h.currentValue / totalCurrentValue) * 100 : 0,
    }));
  }, [holdings, totalCurrentValue]);

  const sorted = useMemo(() => {
    return [...holdingsWithAlloc].sort((a, b) => {
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
  }, [holdingsWithAlloc, sortKey, sortAsc]);

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

  async function handleDelete(h: Holding) {
    if (!onDelete || !h.id) return;
    if (confirmId !== h.id) {
      setConfirmId(h.id);
      return;
    }
    setDeletingId(h.id);
    setConfirmId(null);
    try {
      await onDelete(h.id);
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(h: Holding) {
    if (!onUpdate || !h.id) return;
    setEditingId(h.id);
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
    if (!onUpdate || !h.id) return;
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
    setUpdatingId(h.id);
    setEditError('');
    try {
      await onUpdate(h.id, newQty, newAvgPrice);
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
              <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 whitespace-nowrap">{formatINR(totalCurrentValue)}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">Invested: {formatINR(totalInvested)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Total P&amp;L</p>
              <div className="flex flex-wrap items-baseline gap-x-1 mt-0.5">
                <span className={`text-base font-extrabold whitespace-nowrap ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}
                </span>
                <span className={`text-xs font-semibold whitespace-nowrap opacity-90 ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  ({formatPercent(totalPnLPercent)})
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 p-3 space-y-3">
          {sorted.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-400 text-center py-4">No stock holdings yet.</p>
          ) : (
            sorted.map((h) => {
            const isDeleting = deletingId === h.id;
            const isConfirming = confirmId === h.id;
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
                        {formatNumber(h.qty, 0)} shares @ ₹{formatNumber(h.avgPrice)} (LTP: ₹{formatNumber(h.ltp)})
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatINR(h.currentValue)}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold whitespace-nowrap ${pnlColor(h.unrealizedPnL)}`}>
                        {h.unrealizedPnL >= 0 ? '+' : ''}{formatINR(h.unrealizedPnL)}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.2 rounded-full whitespace-nowrap ${h.pnlPercent >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
                        {formatPercent(h.pnlPercent)}
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
                    <div className="flex items-center gap-2">
                      {onUpdate && h.id && (
                        <button
                          onClick={() => startEdit(h)}
                          className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                          aria-label="Edit holding quantity and price"
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                      {onDelete && h.id && (
                        <button
                          onClick={() => handleDelete(h)}
                          className={`p-1 rounded transition-colors ${
                            isConfirming
                              ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                              : 'text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                          }`}
                          aria-label={isConfirming ? 'Confirm delete' : 'Delete holding'}
                        >
                          <Trash2 size={11} />
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
              <Th label="Alloc %" k={"_allocation" as SortKey} sortKey={sortKey} sortAsc={sortAsc} handleSort={handleSort} />
              {onDelete && <th role="columnheader" className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40" role="rowgroup">
            {sorted.map((h) => {
              const isDeleting = deletingId === h.id;
              const isConfirming = confirmId === h.id;
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
                            <button onClick={() => saveEdit(h)} className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors" title="Save">
                              <Check size={13} />
                            </button>
                            <button onClick={cancelEdit} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Cancel">
                              <X size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 ${onUpdate && h.id ? 'cursor-pointer group/qty hover:text-blue-600' : ''}`}
                        onClick={() => startEdit(h)}
                        title={onUpdate && h.id ? 'Click to edit quantity' : undefined}
                      >
                        {formatNumber(h.qty, 0)}
                        {onUpdate && h.id && (
                          <Pencil size={11} className="opacity-0 group-hover/qty:opacity-100 text-blue-400 transition-opacity" />
                        )}
                      </span>
                    )}
                    {editError && editingId === h.id && (
                      <p className="text-[10px] text-red-500 mt-0.5">{editError}</p>
                    )}
                  </td>
                  <td role="cell" className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 text-right">
                    {editingId === h.id ? (
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
                          disabled={updatingId === h.id}
                          className="w-24 border border-blue-300 dark:border-blue-800 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 ${onUpdate && h.id ? 'cursor-pointer group/price hover:text-blue-600' : ''}`}
                        onClick={() => startEdit(h)}
                        title={onUpdate && h.id ? 'Click to edit average price' : undefined}
                      >
                        ₹{formatNumber(h.avgPrice)}
                        {onUpdate && h.id && (
                          <Pencil size={11} className="opacity-0 group-hover/price:opacity-100 text-blue-400 transition-opacity" />
                        )}
                      </span>
                    )}
                  </td>
                  <td role="cell" className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 text-right">₹{formatNumber(h.ltp)}</td>
                  <td role="cell" className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 text-right">{formatINR(h.currentValue)}</td>
                  <td role="cell" className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-right">{formatINR(h.amountInvested)}</td>
                  <td role="cell" className={`px-4 py-3 text-sm font-semibold text-right ${pnlColor(h.unrealizedPnL)}`}>
                    {h.unrealizedPnL >= 0 ? '+' : ''}{formatINR(h.unrealizedPnL)}
                  </td>
                  <td role="cell" className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${h.pnlPercent >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
                      {h.pnlPercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {formatPercent(h.pnlPercent)}
                    </span>
                  </td>
                  <td role="cell" className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold ${pnlColor(h.todayPnLPercent)}`}>
                      {formatPercent(h.todayPnLPercent)}
                    </span>
                  </td>
                  <td role="cell" className="px-4 py-3 text-right">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {((h as Record<string, unknown>)._allocation as number).toFixed(1)}%
                    </span>
                  </td>
                  {onDelete && (
                    <td role="cell" className="px-2 py-3">
                      <button
                        onClick={() => handleDelete(h)}
                        disabled={isDeleting}
                        title={isConfirming ? 'Click again to confirm delete' : 'Delete holding'}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isConfirming
                            ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 hover:bg-red-200'
                            : 'text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                        }`}
                        onBlur={() => setConfirmId(null)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-800 dark:bg-slate-950 text-white dark:text-slate-200">
            <tr role="row">
              <td role="cell" colSpan={5} className="px-4 py-3 text-sm font-bold">Portfolio Total</td>
              <td role="cell" className="px-4 py-3 text-sm font-bold text-right">{formatINR(totalCurrentValue)}</td>
              <td role="cell" className="px-4 py-3 text-sm font-bold text-right text-slate-300 dark:text-slate-400">{formatINR(totalInvested)}</td>
              <td role="cell" className={`px-4 py-3 text-sm font-bold text-right ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}
              </td>
              <td role="cell" colSpan={onDelete ? 4 : 3} className={`px-4 py-3 text-sm font-bold text-right ${totalPnL >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {formatPercent(totalPnLPercent)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});
