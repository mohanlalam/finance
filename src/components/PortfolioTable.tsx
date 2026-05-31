import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Trash2, Pencil, Loader2, Check, X, SlidersHorizontal } from 'lucide-react';
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

export default function PortfolioTable({
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
  const [activePreset, setActivePreset] = useState<SortPreset>('value');
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
      const av = (a as Record<string, unknown>)[sortKey] as number;
      const bv = (b as Record<string, unknown>)[sortKey] as number;
      return sortAsc ? av - bv : bv - av;
    });
  }, [holdingsWithAlloc, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

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

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors whitespace-nowrap"
      onClick={() => handleSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={11} className={sortKey === k ? 'text-blue-500' : 'text-slate-300'} />
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Sorting presets */}
      <div className="px-4 py-2.5 border-b border-slate-50 flex items-center gap-2 overflow-x-auto">
        <SlidersHorizontal size={12} className="text-slate-400 shrink-0" />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Sort:</span>
        {SORT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePreset(preset.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              activePreset === preset.id
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <Th label="Stock" k="stockName" />
              <Th label="Ticker" k="ticker" />
              <Th label="Qty" k="qty" />
              <Th label="Avg Price" k="avgPrice" />
              <Th label="LTP" k="ltp" />
              <Th label="Current Value" k="currentValue" />
              <Th label="Invested" k="amountInvested" />
              <Th label="P&L" k="unrealizedPnL" />
              <Th label="% P&L" k="pnlPercent" />
              <Th label="Today %" k="todayPnLPercent" />
              <Th label="Alloc %" k={"_allocation" as SortKey} />
              {onDelete && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((h) => {
              const isDeleting = deletingId === h.id;
              const isConfirming = confirmId === h.id;
              return (
                <tr key={`${h.ticker}-${h.sno}`} className={`hover:bg-slate-50/80 transition-colors ${isDeleting ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-[180px]">
                    <span className="truncate block" title={h.stockName}>{h.stockName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md">{h.ticker}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">
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
                          className="w-20 border border-blue-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-blue-50/50"
                        />
                        {updatingId === h.id ? (
                          <Loader2 size={14} className="animate-spin text-blue-500" />
                        ) : (
                          <>
                            <button onClick={() => saveEdit(h)} className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors" title="Save">
                              <Check size={13} />
                            </button>
                            <button onClick={cancelEdit} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors" title="Cancel">
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
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">
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
                          className="w-24 border border-blue-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-blue-50/50"
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
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right">₹{formatNumber(h.ltp)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right">{formatINR(h.currentValue)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 text-right">{formatINR(h.amountInvested)}</td>
                  <td className={`px-4 py-3 text-sm font-semibold text-right ${pnlColor(h.unrealizedPnL)}`}>
                    {h.unrealizedPnL >= 0 ? '+' : ''}{formatINR(h.unrealizedPnL)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${h.pnlPercent >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {h.pnlPercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {formatPercent(h.pnlPercent)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold ${pnlColor(h.todayPnLPercent)}`}>
                      {formatPercent(h.todayPnLPercent)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-medium text-slate-500">
                      {((h as Record<string, unknown>)._allocation as number).toFixed(1)}%
                    </span>
                  </td>
                  {onDelete && (
                    <td className="px-2 py-3">
                      <button
                        onClick={() => handleDelete(h)}
                        disabled={isDeleting}
                        title={isConfirming ? 'Click again to confirm delete' : 'Delete holding'}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isConfirming
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
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
          <tfoot className="bg-slate-800 text-white">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-sm font-bold">Portfolio Total</td>
              <td className="px-4 py-3 text-sm font-bold text-right">{formatINR(totalCurrentValue)}</td>
              <td className="px-4 py-3 text-sm font-bold text-right text-slate-300">{formatINR(totalInvested)}</td>
              <td className={`px-4 py-3 text-sm font-bold text-right ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}
              </td>
              <td colSpan={onDelete ? 4 : 3} className={`px-4 py-3 text-sm font-bold text-right ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercent(totalPnLPercent)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
