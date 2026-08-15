import React, { useState } from 'react';
import { X, Plus, Loader2 } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

interface PortfolioOption {
  name: string;
  label: string;
}

interface AddHoldingModalProps {
  onClose: () => void;
  onAdd: (data: AddHoldingPayload) => Promise<void>;
  portfolioOptions: PortfolioOption[];
  defaultPortfolio?: string;
}

export interface AddHoldingPayload {
  portfolioName: string;
  stockName: string;
  ticker: string;
  yahooSymbol: string;
  qty: number;
  avgPrice: number;
  amountInvested: number;
  weekLow52: number;
  weekHigh52: number;
}

const EXCHANGE_OPTIONS = ['.NS (NSE)', '.BO (BSE)'];

export default React.memo(function AddHoldingModal({ onClose, onAdd, portfolioOptions, defaultPortfolio }: AddHoldingModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const initialPortfolio = defaultPortfolio && portfolioOptions.some((o) => o.name === defaultPortfolio)
    ? defaultPortfolio
    : portfolioOptions[0]?.name ?? '';
  const [form, setForm] = useState({
    portfolioName: initialPortfolio,
    stockName: '',
    ticker: '',
    exchange: '.NS',
    yahooSymbol: '',
    qty: '',
    avgPrice: '',
    amountInvested: '',
    weekLow52: '',
    weekHigh52: '',
  });

  const validateField = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (field === 'ticker' && !form.ticker) next.ticker = 'Ticker is required';
      else if (field === 'ticker') delete next.ticker;
      
      if (field === 'qty' && (!form.qty || isNaN(Number(form.qty)))) next.qty = 'Valid quantity is required';
      else if (field === 'qty') delete next.qty;
      
      if (field === 'avgPrice' && (!form.avgPrice || isNaN(Number(form.avgPrice)))) next.avgPrice = 'Valid price is required';
      else if (field === 'avgPrice') delete next.avgPrice;
      
      return next;
    });
  };

  function set(field: string, value: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'ticker' || field === 'exchange') {
        const t = field === 'ticker' ? value : prev.ticker;
        const e = field === 'exchange' ? value : prev.exchange;
        next.yahooSymbol = t.toUpperCase() + e.split(' ')[0];
      }
      if ((field === 'qty' || field === 'avgPrice') && next.qty && next.avgPrice) {
        next.amountInvested = (parseFloat(next.qty) * parseFloat(next.avgPrice)).toFixed(2);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.stockName || !form.ticker || !form.qty || !form.avgPrice) {
      setError('Stock name, ticker, quantity and average price are required.');
      return;
    }
    const qty = parseFloat(form.qty);
    const avgPrice = parseFloat(form.avgPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice <= 0) {
      setError('Quantity and Average Price must be positive numbers.');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        portfolioName: form.portfolioName,
        stockName: form.stockName.trim(),
        ticker: form.ticker.trim().toUpperCase(),
        yahooSymbol: (form.yahooSymbol || form.ticker.trim().toUpperCase() + '.NS').trim(),
        qty,
        avgPrice,
        amountInvested: form.amountInvested ? parseFloat(form.amountInvested) : qty * avgPrice,
        weekLow52: form.weekLow52 ? parseFloat(form.weekLow52) : 0,
        weekHigh52: form.weekHigh52 ? parseFloat(form.weekHigh52) : 0,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add holding.');
    } finally {
      setSaving(false);
    }
  }

  const selectStyle = "w-full bg-[#f2f2f7] dark:bg-zinc-800 border border-transparent rounded-[14px] px-3 py-2 text-sm text-[var(--text-primary)] focus:bg-white dark:focus:bg-zinc-700/80 focus:ring-2 focus:ring-[#007aff] transition-all duration-150 outline-none";
  const inputStyle = "w-full bg-[#f2f2f7] dark:bg-zinc-800 border border-transparent rounded-[14px] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-slate-450 dark:placeholder-zinc-650 focus:bg-white dark:focus:bg-zinc-700/80 focus:ring-2 focus:ring-[#007aff] transition-all duration-150 outline-none";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      ariaLabel="Add New Holding"
      preventClose={saving}
      maxWidth="max-w-lg"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-zinc-800/10 modal-drag-handle cursor-grab active:cursor-grabbing" data-drag-handle>
        <div>
          <h2 className="text-card-title font-semibold text-slate-800 dark:text-slate-200">Add New Holding</h2>
          <p className="text-supporting mt-0.5">Stock will be fetched from Yahoo Finance on next refresh</p>
        </div>
        <IconButton
          icon={<X size={15} />}
          title="Close dialog"
          onClick={onClose}
          disabled={saving}
        />
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto min-h-0 flex-1">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Portfolio</label>
          <select
            value={form.portfolioName}
            onChange={(e) => set('portfolioName', e.target.value)}
            className={selectStyle}
          >
            {portfolioOptions.map((o) => (
              <option key={o.name} value={o.name}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Stock / ETF Name</label>
          <input
            type="text"
            placeholder="e.g. Reliance Industries Limited"
            value={form.stockName}
            onChange={(e) => set('stockName', e.target.value)}
            className={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Ticker Symbol</label>
            <input
              type="text"
              placeholder="e.g. RELIANCE"
              value={form.ticker}
              onChange={(e) => set('ticker', e.target.value.toUpperCase())}
              onBlur={() => validateField('ticker')}
              className={`${inputStyle} uppercase`}
            />
            {fieldErrors.ticker && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.ticker}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Exchange</label>
            <select
              value={form.exchange}
              onChange={(e) => set('exchange', e.target.value)}
              className={selectStyle}
            >
              {EXCHANGE_OPTIONS.map((o) => (
                <option key={o} value={o.split(' ')[0]}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Yahoo Finance Symbol
            <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">(auto-filled)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. RELIANCE.NS"
            value={form.yahooSymbol}
            onChange={(e) => setForm((p) => ({ ...p, yahooSymbol: e.target.value }))}
            className={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Quantity</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              step="any"
              value={form.qty}
              onChange={(e) => set('qty', e.target.value)}
              onBlur={() => validateField('qty')}
              className={inputStyle}
            />
            {fieldErrors.qty && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.qty}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Avg Buy Price (₹)</label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="any"
              value={form.avgPrice}
              onChange={(e) => set('avgPrice', e.target.value)}
              onBlur={() => validateField('avgPrice')}
              className={inputStyle}
            />
            {fieldErrors.avgPrice && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.avgPrice}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Amount Invested (₹)
            <span className="font-normal text-slate-400 dark:text-slate-550 ml-1">(auto-computed)</span>
          </label>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="any"
            value={form.amountInvested}
            onChange={(e) => setForm((p) => ({ ...p, amountInvested: e.target.value }))}
            className={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">52W Low (₹) <span className="font-normal text-slate-400 dark:text-slate-550">optional</span></label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="any"
              value={form.weekLow52}
              onChange={(e) => set('weekLow52', e.target.value)}
              className={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">52W High (₹) <span className="font-normal text-slate-400 dark:text-slate-550">optional</span></label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="any"
              value={form.weekHigh52}
              onChange={(e) => set('weekHigh52', e.target.value)}
              className={inputStyle}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-[14px] px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="flex-1"
          >
            {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Plus size={14} className="mr-1.5" />}
            {saving ? 'Adding...' : 'Add Holding'}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
