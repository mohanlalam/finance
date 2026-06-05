import React, { useState, useEffect, useCallback } from 'react';
import { RDAccount, RDPayload } from '../../types/portfolio';
import { getRDEffectiveValue } from '../../utils/rdUtils';

interface PortfolioOption {
  name: string;
  label: string;
}

interface RDFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: RDAccount | null;
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  onAdd: (portfolioName: string, payload: RDPayload) => Promise<void>;
  onUpdate: (id: string, payload: Partial<RDPayload>) => Promise<void>;
}

export function RDFormModal({
  isOpen,
  onClose,
  editingAccount,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
}: RDFormModalProps) {
  const [formPortfolio, setFormPortfolio] = useState(() => portfolioName);
  const [bankName, setBankName] = useState('');
  const [monthlyDeposit, setMonthlyDeposit] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [maturityAmount, setMaturityAmount] = useState('');
  const [status, setStatus] = useState<'active' | 'matured'>('active');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill values when editing
  useEffect(() => {
    if (editingAccount) {
      setFormPortfolio(portfolioName);
      setBankName(editingAccount.bank_name);
      setMonthlyDeposit(editingAccount.monthly_deposit.toString());
      setInterestRate(editingAccount.interest_rate.toString());
      setStartDate(editingAccount.start_date);
      setMaturityDate(editingAccount.maturity_date);
      setMaturityAmount(editingAccount.maturity_amount.toString());
      setStatus(editingAccount.status);
      setNotes(editingAccount.notes ?? '');
    } else {
      setFormPortfolio(portfolioName);
      setBankName('');
      setMonthlyDeposit('');
      setInterestRate('');
      setStartDate('');
      setMaturityDate('');
      setMaturityAmount('');
      setStatus('active');
      setNotes('');
    }
    setError('');
  }, [editingAccount, isOpen, portfolioName]);

  const calculateMaturity = useCallback(() => {
    const p = parseFloat(monthlyDeposit);
    const r = parseFloat(interestRate);
    const s = new Date(startDate);
    const m = maturityDate ? new Date(maturityDate) : new Date();

    if (!isNaN(p) && !isNaN(r) && !isNaN(s.getTime()) && !isNaN(m.getTime())) {
      // Temporary mock object to invoke compound calculator
      const tempAccount: RDAccount = {
        id: '',
        portfolio_id: '',
        bank_name: '',
        monthly_deposit: p,
        interest_rate: r,
        start_date: startDate,
        maturity_date: maturityDate,
        maturity_amount: 0,
        status: 'active',
        contributions: editingAccount?.contributions || [],
      };
      const val = getRDEffectiveValue(tempAccount, m);
      setMaturityAmount(val.toFixed(2));
    }
  }, [monthlyDeposit, interestRate, startDate, maturityDate, editingAccount]);

  useEffect(() => {
    calculateMaturity();
  }, [startDate, monthlyDeposit, interestRate, maturityDate, calculateMaturity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName || !monthlyDeposit || !interestRate || !startDate || !maturityDate) {
      setError('All fields are required.');
      return;
    }

    const p = parseFloat(monthlyDeposit);
    const r = parseFloat(interestRate);
    const matAmt = parseFloat(maturityAmount);

    if (isNaN(p) || p <= 0) {
      setError('Monthly deposit must be a positive number.');
      return;
    }

    setLoading(true);
    setError('');

    const payload: RDPayload = {
      bank_name: bankName,
      monthly_deposit: p,
      interest_rate: r,
      start_date: startDate,
      maturity_date: maturityDate,
      maturity_amount: isNaN(matAmt) ? 0 : matAmt,
      status,
      notes: notes || undefined,
      contributions: editingAccount?.contributions,
    };

    try {
      if (editingAccount) {
        await onUpdate(editingAccount.id, payload);
      } else {
        await onAdd(formPortfolio, payload);
      }
      onClose();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Operation failed';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="rd-modal-title">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 id="rd-modal-title" className="text-base font-bold text-slate-800 dark:text-slate-100">
              {editingAccount ? 'Edit Recurring Deposit' : 'Create Recurring Deposit'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Enter details to track valuation and timeline</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors text-xl font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Portfolio Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Portfolio Owner</label>
            <select
              value={formPortfolio}
              onChange={(e) => setFormPortfolio(e.target.value)}
              disabled={!!editingAccount}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors disabled:opacity-50"
            >
              {portfolioOptions.map((o) => (
                <option key={o.name} value={o.name}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Bank / Post Office Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Bank / Post Office Name</label>
            <input
              type="text"
              placeholder="e.g. SBI, Post Office"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors"
            />
          </div>

          {/* Monthly Deposit & Interest Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Monthly Deposit (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(e.target.value)}
                onBlur={calculateMaturity}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 6.80"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                onBlur={calculateMaturity}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors"
              />
            </div>
          </div>

          {/* Start Date & Maturity Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={calculateMaturity}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Maturity Date</label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                onBlur={calculateMaturity}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors"
              />
            </div>
          </div>

          {/* Maturity Amount & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Est. Maturity Amount (₹)</label>
              <input
                type="number"
                placeholder="Auto-computed"
                value={maturityAmount}
                onChange={(e) => setMaturityAmount(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'matured')}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors"
              >
                <option value="active">Active</option>
                <option value="matured">Matured</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="e.g. Linked to child marriage, Post office scheme"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-450 transition-colors resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-3 py-2" role="alert">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-pink-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-pink-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingAccount ? 'Save Changes' : 'Create RD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
