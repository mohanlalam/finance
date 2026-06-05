import React, { useState, useEffect, useCallback } from 'react';
import { SSYAccount, SSYPayload } from '../../types/portfolio';
import { calculateSSYMaturityWithRates } from '../../utils/ssyUtils';

interface PortfolioOption {
  name: string;
  label: string;
}

interface SSYFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: SSYAccount | null;
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  onAdd: (portfolioName: string, payload: SSYPayload) => Promise<void>;
  onUpdate: (id: string, payload: Partial<SSYPayload>) => Promise<void>;
}

export function SSYFormModal({
  isOpen,
  onClose,
  editingAccount,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
}: SSYFormModalProps) {
  const [formPortfolio, setFormPortfolio] = useState(() => portfolioName);
  const [bankName, setBankName] = useState('');
  const [girlDob, setGirlDob] = useState('');
  const [annualDeposit, setAnnualDeposit] = useState('');
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
      setGirlDob(editingAccount.girl_dob);
      setAnnualDeposit(editingAccount.annual_deposit.toString());
      setInterestRate(editingAccount.interest_rate.toString());
      setStartDate(editingAccount.start_date);
      setMaturityDate(editingAccount.maturity_date);
      setMaturityAmount(editingAccount.maturity_amount.toString());
      setStatus(editingAccount.status);
      setNotes(editingAccount.notes ?? '');
    } else {
      setFormPortfolio(portfolioName);
      setBankName('');
      setGirlDob('');
      setAnnualDeposit('');
      setInterestRate('8.2'); // default SSY rate is 8.2%
      setStartDate('');
      setMaturityDate('');
      setMaturityAmount('');
      setStatus('active');
      setNotes('');
    }
    setError('');
  }, [editingAccount, isOpen, portfolioName]);

  // Auto-calculate maturity date when start date changes
  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        const matYear = start.getFullYear() + 21;
        const matMonth = String(start.getMonth() + 1).padStart(2, '0');
        const matDay = String(start.getDate()).padStart(2, '0');
        setMaturityDate(`${matYear}-${matMonth}-${matDay}`);
      }
    }
  }, [startDate]);

  const calculateMaturity = useCallback(() => {
    const p = parseFloat(annualDeposit);
    const r = parseFloat(interestRate);
    const s = new Date(startDate);
    const m = maturityDate ? new Date(maturityDate) : null;

    if (!isNaN(p) && !isNaN(r) && !isNaN(s.getTime()) && m && !isNaN(m.getTime())) {
      const { maturityAmount: ssyAmt } = calculateSSYMaturityWithRates(
        startDate,
        p,
        editingAccount?.contributions,
        editingAccount?.rate_schedule,
        r
      );
      setMaturityAmount(ssyAmt.toFixed(2));
    }
  }, [annualDeposit, interestRate, startDate, maturityDate, editingAccount]);

  useEffect(() => {
    calculateMaturity();
  }, [startDate, annualDeposit, interestRate, maturityDate, calculateMaturity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName || !annualDeposit || !interestRate || !startDate || !girlDob) {
      setError('All fields are required.');
      return;
    }

    const p = parseFloat(annualDeposit);
    if (isNaN(p) || p < 250 || p > 150000) {
      setError('SSY guidelines: Annual deposits must be between ₹250 and ₹1,50,000 per financial year.');
      return;
    }

    // Age validation (must be <= 10 years at start date)
    const start = new Date(startDate);
    const dob = new Date(girlDob);
    if (!isNaN(start.getTime()) && !isNaN(dob.getTime())) {
      let age = start.getFullYear() - dob.getFullYear();
      const monthDiff = start.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && start.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 0) {
        setError("Girl child's Date of Birth cannot be after the start date.");
        return;
      }
      if (age > 10 || (age === 10 && (monthDiff > 0 || (monthDiff === 0 && start.getDate() > dob.getDate())))) {
        setError("Girl child must be 10 years or younger at the account start date.");
        return;
      }
    }

    setLoading(true);
    setError('');

    const payload: SSYPayload = {
      bank_name: bankName,
      girl_dob: girlDob,
      annual_deposit: p,
      interest_rate: parseFloat(interestRate),
      start_date: startDate,
      maturity_date: maturityDate || `${start.getFullYear() + 21}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      maturity_amount: parseFloat(maturityAmount) || 0,
      status,
      notes: notes || undefined,
      contributions: editingAccount?.contributions,
      rate_schedule: editingAccount?.rate_schedule,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ssy-modal-title">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 id="ssy-modal-title" className="text-base font-bold text-slate-800 dark:text-slate-100">
              {editingAccount ? 'Edit SSY Account' : 'Create SSY Account'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Enter details to track girls' savings scheme</p>
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
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors disabled:opacity-50"
            >
              {portfolioOptions.map((o) => (
                <option key={o.name} value={o.name}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Bank / Post Office Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Post Office / Bank Name</label>
            <input
              type="text"
              placeholder="e.g. Post Office, SBI Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Girl Child DOB */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Girl child's Date of Birth</label>
              <input
                type="date"
                value={girlDob}
                onChange={(e) => setGirlDob(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
              />
            </div>
            <div className="flex flex-col justify-end pb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {girlDob && startDate ? (
                  (() => {
                    const start = new Date(startDate);
                    const dob = new Date(girlDob);
                    if (!isNaN(start.getTime()) && !isNaN(dob.getTime())) {
                      let age = start.getFullYear() - dob.getFullYear();
                      const monthDiff = start.getMonth() - dob.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && start.getDate() < dob.getDate())) {
                        age--;
                      }
                      if (age >= 0) {
                        return (
                          <span className={age > 10 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}>
                            Age on opening: {age} years {age > 10 ? '⚠️ (Max 10)' : '✓'}
                          </span>
                        );
                      }
                    }
                    return '';
                  })()
                ) : (
                  <span className="text-slate-400 font-normal">Select DOB & Start Date</span>
                )}
              </span>
            </div>
          </div>

          {/* Annual Deposit & Default Interest Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Annual Deposit Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={annualDeposit}
                onChange={(e) => setAnnualDeposit(e.target.value)}
                onBlur={calculateMaturity}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Default Future Rate (% p.a.)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 8.2"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                onBlur={calculateMaturity}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
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
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Maturity Date (21 years)</label>
              <input
                type="date"
                value={maturityDate}
                readOnly
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Maturity Amount & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Est. Maturity Amount (₹)</label>
              <input
                type="text"
                placeholder="Auto-computed"
                value={maturityAmount}
                readOnly
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'matured')}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
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
              placeholder="e.g. For daughter's higher education"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-3 py-2" role="alert">{error}</p>
          )}

          {/* Action Buttons */}
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
              className="flex-1 bg-purple-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingAccount ? 'Save Changes' : 'Create SSY Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
