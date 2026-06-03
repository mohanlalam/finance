import { useState, useCallback } from 'react';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import Modal from './Modal';
import {
  AllocationTargets,
  DEFAULT_ALLOCATION_TARGETS,
  ALLOCATION_TARGETS_KEY,
  getAllocationTargets,
} from '../hooks/usePortfolioInsights';

interface Props {
  /** Called after saving so the parent can re-render insights */
  onSaved?: () => void;
}

/**
 * A gear button that opens a modal where the user can configure
 * their target asset allocation percentages (Stocks / FD / Gold / Real Estate).
 * Values are persisted in localStorage under `finance_allocation_targets`.
 */
export default function AllocationTargetsSettings({ onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<AllocationTargets>(getAllocationTargets);
  const [error, setError] = useState('');

  const total = targets.stocks + targets.fd + targets.gold + targets.realEstate;

  const handleOpen = useCallback(() => {
    setTargets(getAllocationTargets());
    setError('');
    setOpen(true);
  }, []);

  function set(field: keyof AllocationTargets, value: string) {
    const n = parseFloat(value);
    setTargets((prev) => ({ ...prev, [field]: isNaN(n) ? 0 : Math.max(0, Math.min(100, n)) }));
    setError('');
  }

  function handleReset() {
    setTargets({ ...DEFAULT_ALLOCATION_TARGETS });
    setError('');
  }

  function handleSave() {
    if (Math.abs(total - 100) > 0.01) {
      setError(`Targets must sum to 100%. Current total: ${total.toFixed(1)}%`);
      return;
    }
    try {
      localStorage.setItem(ALLOCATION_TARGETS_KEY, JSON.stringify(targets));
    } catch { /* ignore */ }
    setOpen(false);
    onSaved?.();
  }

  const FIELDS: { key: keyof AllocationTargets; label: string; color: string }[] = [
    { key: 'stocks', label: 'Stocks / Equity', color: 'text-blue-600 dark:text-blue-400' },
    { key: 'fd', label: 'Fixed Deposits', color: 'text-indigo-600 dark:text-indigo-400' },
    { key: 'gold', label: 'Gold', color: 'text-amber-600 dark:text-amber-400' },
    { key: 'realEstate', label: 'Real Estate', color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <>
      <button
        onClick={handleOpen}
        title="Configure allocation targets"
        aria-label="Configure allocation targets"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <SlidersHorizontal size={14} />
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} maxWidth="max-w-sm" ariaLabel="Allocation Targets Settings">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Allocation Targets</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Set target % for each asset class (must sum to 100)</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {FIELDS.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-3">
              <label className={`flex-1 text-sm font-semibold ${color}`}>{label}</label>
              <div className="relative w-24">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={targets[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-7 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors text-right"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
              </div>
            </div>
          ))}

          {/* Total indicator */}
          <div className={`flex items-center justify-between text-sm font-bold pt-1 border-t border-slate-100 dark:border-slate-700 ${Math.abs(total - 100) > 0.01 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
            <span>Total</span>
            <span>{total.toFixed(1)}%</span>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold text-sm rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw size={13} />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-blue-700 transition-colors"
            >
              Save Targets
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
