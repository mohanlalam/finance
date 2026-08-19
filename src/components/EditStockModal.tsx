import React, { useState } from 'react';
import { X, Check, Loader2, TrendingUp, TrendingDown, ArrowRightLeft } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Holding } from '../types/portfolio';
import { formatINR, formatPercent } from '../utils/formatters';

interface EditStockModalProps {
  holding: Holding;
  isOpen: boolean;
  onClose: () => void;
  onSave: (holdingId: string, qty: number, avgPrice: number, targetPortfolioId?: string) => Promise<void>;
  portfolioOptions?: { id?: string; name: string; label: string }[];
  currentPortfolioName?: string;
}

export default function EditStockModal({
  holding,
  isOpen,
  onClose,
  onSave,
  portfolioOptions = [],
  currentPortfolioName,
}: EditStockModalProps) {
  const [qty, setQty] = useState<string>(String(holding.qty));
  const [avgPrice, setAvgPrice] = useState<string>(String(holding.avgPrice));
  const [targetPortfolio, setTargetPortfolio] = useState<string>(currentPortfolioName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Live calculated preview metrics
  const numericQty = Math.max(0, parseFloat(qty) || 0);
  const numericAvgPrice = Math.max(0, parseFloat(avgPrice) || 0);
  const newInvested = numericQty * numericAvgPrice;
  const newCurrentValue = numericQty * holding.ltp;
  const newPnL = newCurrentValue - newInvested;
  const newPnLPct = newInvested > 0 ? (newPnL / newInvested) * 100 : 0;
  const isGain = newPnL >= 0;

  const handleStepper = (delta: number) => {
    const nextQty = Math.max(1, numericQty + delta);
    setQty(String(nextQty));
  };

  const handleUseLtp = () => {
    if (holding.ltp > 0) {
      setAvgPrice(String(holding.ltp));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericQty <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }
    if (numericAvgPrice <= 0) {
      setError('Please enter a valid average purchase price');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const holdingId = holding.id || holding.ticker || String(holding.sno);
      const targetId = targetPortfolio && targetPortfolio !== currentPortfolioName ? targetPortfolio : undefined;
      await onSave(holdingId, numericQty, numericAvgPrice, targetId);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update stock holding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      ariaLabel={`Edit ${holding.ticker} Stock Holding`}
      preventClose={saving}
      maxWidth="max-w-lg"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-secondary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-medium)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] font-extrabold text-sm flex items-center justify-center uppercase">
            {holding.ticker.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[var(--text-primary)] tracking-tight">
                {holding.ticker}
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[var(--radius-pill)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]">
                LTP: ₹{holding.ltp.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[220px]">
              {holding.stockName}
            </p>
          </div>
        </div>
        <IconButton
          icon={<X size={15} />}
          title="Close"
          onClick={() => !saving && onClose()}
          disabled={saving}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
        {/* Live Calculation Preview Banner */}
        <div className="p-4 rounded-[var(--radius-large)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Live Projection Preview</span>
            <span className="text-[11px] font-bold text-[var(--text-secondary)]">
              LTP: ₹{holding.ltp.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--border-subtle)] text-center">
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase">New Invested</p>
              <p className="text-sm font-extrabold tnum text-[var(--text-primary)] mt-0.5">{formatINR(newInvested)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase">Current Value</p>
              <p className="text-sm font-extrabold tnum text-[var(--text-primary)] mt-0.5">{formatINR(newCurrentValue)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase">Estimated P&amp;L</p>
              <p className={`text-sm font-extrabold tnum mt-0.5 flex items-center justify-center gap-0.5 ${isGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {isGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {formatPercent(newPnLPct, 1)}
              </p>
            </div>
          </div>
        </div>

        {/* Quantity Field with Quick Steppers */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-[var(--text-primary)]">
              Holding Quantity (Shares)
            </label>
            <span className="text-[11px] text-[var(--text-tertiary)]">Current: {holding.qty} shares</span>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              disabled={saving}
              className="flex-1 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3.5 py-2.5 text-sm font-extrabold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none tnum"
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Stepper Shortcut Pills */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mr-1">Quick Add:</span>
            {[-10, -1, +1, +5, +10, +50].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => handleStepper(delta)}
                className="px-2.5 py-1 rounded-[var(--radius-small)] text-xs font-extrabold bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-blue-soft)] hover:text-[var(--accent-blue)] border border-[var(--border-subtle)] transition-all active:scale-95"
              >
                {delta > 0 ? `+${delta}` : delta}
              </button>
            ))}
          </div>
        </div>

        {/* Avg Purchase Price Field with LTP Auto-Fill */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-[var(--text-primary)]">
              Average Buy Price (₹)
            </label>
            <button
              type="button"
              onClick={handleUseLtp}
              className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline flex items-center gap-1"
            >
              Use LTP (₹{holding.ltp.toLocaleString('en-IN')})
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[var(--text-tertiary)]">₹</span>
            <input
              type="number"
              min="0.01"
              step="any"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              disabled={saving}
              className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] pl-8 pr-3.5 py-2.5 text-sm font-extrabold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none tnum"
              placeholder="Enter avg price"
              required
            />
          </div>
        </div>

        {/* Portfolio Target Selector (if multiple portfolios exist) */}
        {portfolioOptions.length > 1 && (
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <ArrowRightLeft size={13} className="text-[var(--accent-blue)]" />
              Target Portfolio Member
            </label>
            <select
              value={targetPortfolio}
              onChange={(e) => setTargetPortfolio(e.target.value)}
              disabled={saving}
              className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none"
            >
              {portfolioOptions.map((opt) => (
                <option key={opt.name} value={opt.name}>
                  {opt.label} Portfolio
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-xs font-semibold text-[var(--negative)] bg-[var(--negative-soft)] p-3 rounded-[var(--radius-medium)] border border-[var(--negative)]/30">
            {error}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? <Loader2 size={15} className="animate-spin mr-1.5 inline" /> : <Check size={15} className="mr-1.5 inline" />}
            {saving ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
