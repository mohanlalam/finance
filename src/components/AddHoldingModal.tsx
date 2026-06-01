import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import Modal from './Modal';

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

  function set(field: string, value: string) {
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
    setSaving(true);
    try {
      await onAdd({
        portfolioName: form.portfolioName,
        stockName: form.stockName,
        ticker: form.ticker.toUpperCase(),
        yahooSymbol: form.yahooSymbol || form.ticker.toUpperCase() + '.NS',
        qty: parseFloat(form.qty),
        avgPrice: parseFloat(form.avgPrice),
        amountInvested: form.amountInvested ? parseFloat(form.amountInvested) : parseFloat(form.qty) * parseFloat(form.avgPrice),
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      ariaLabel="Add New Holding"
      preventClose={saving}
      maxWidth="max-w-lg"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Add New Holding</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Stock will be fetched from Yahoo Finance on next refresh</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          aria-label="Close dialog"
        >
          <X size={16} className="text-slate-400 dark:text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Portfolio</label>
          <select
            value={form.portfolioName}
            onChange={(e) => set('portfolioName', e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
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
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-300 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-450 transition-colors"
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
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-300 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-450 transition-colors uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Exchange</label>
            <select
              value={form.exchange}
              onChange={(e) => set('exchange', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
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
            <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">(auto-filled, edit if needed)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. RELIANCE.NS"
            value={form.yahooSymbol}
            onChange={(e) => setForm((p) => ({ ...p, yahooSymbol: e.target.value }))}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-300 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-450 transition-colors"
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
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-300 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-450 transition-colors"
            />
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
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-300 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-450 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Amount Invested (₹)
            <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">(auto-computed from qty × avg price)</span>
          </label>
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="any"
            value={form.amountInvested}
            onChange={(e) => setForm((p) => ({ ...p, amountInvested: e.target.value }))}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-300 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-450 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">52W Low (₹) <span className="font-normal text-slate-400 dark:text-slate-500">optional</span></label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="any"
              value={form.weekLow52}
              onChange={(e) => set('weekLow52', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-300 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-450 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">52W High (₹) <span className="font-normal text-slate-400 dark:text-slate-500">optional</span></label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="any"
              value={form.weekHigh52}
              onChange={(e) => set('weekHigh52', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-750 dark:text-slate-200 bg-white dark:bg-slate-900 placeholder-slate-300 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-450 transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Adding...' : 'Add Holding'}
          </button>
        </div>
      </form>
    </Modal>
  );
});
