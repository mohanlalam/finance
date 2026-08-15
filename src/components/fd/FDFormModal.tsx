import React, { useState, useEffect, useCallback } from 'react';
import { FixedDeposit } from '../../types/portfolio';
import Modal from '../Modal';
import StandardFormFields from './StandardFormFields';

interface PortfolioOption {
  name: string;
  label: string;
}

interface FDFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFd: FixedDeposit | null;
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
}

export const FDFormModal = React.memo(function FDFormModal({
  isOpen,
  onClose,
  editingFd,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
}: FDFormModalProps) {
  const [bankName, setBankName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [maturityAmount, setMaturityAmount] = useState('');
  const [status, setStatus] = useState<'active' | 'matured'>('active');
  const [notes, setNotes] = useState('');
  const [targetPortfolio, setTargetPortfolio] = useState(portfolioName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingFd) {
      setBankName(editingFd.bank_name || '');
      setPrincipal(editingFd.principal_amount ? String(editingFd.principal_amount) : '');
      setInterestRate(editingFd.interest_rate ? String(editingFd.interest_rate) : '');
      setStartDate(editingFd.start_date || '');
      setMaturityDate(editingFd.maturity_date || '');
      setMaturityAmount(editingFd.maturity_amount ? String(editingFd.maturity_amount) : '');
      setStatus(editingFd.status || 'active');
      setNotes(editingFd.notes || '');
      setTargetPortfolio(portfolioName);
    } else {
      setBankName('');
      setPrincipal('');
      setInterestRate('');
      setStartDate('');
      setMaturityDate('');
      setMaturityAmount('');
      setStatus('active');
      setNotes('');
      setTargetPortfolio(portfolioName);
    }
    setError(null);
  }, [editingFd, portfolioName, isOpen]);

  const calculateMaturity = useCallback(() => {
    const p = parseFloat(principal);
    const r = parseFloat(interestRate);
    if (isNaN(p) || isNaN(r) || p <= 0 || r <= 0 || !startDate || !maturityDate) return;
    
    const start = new Date(startDate);
    const end = new Date(maturityDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    if (years <= 0) return;
    
    // Half-yearly compounding for FDs
    const matAmt = p * Math.pow(1 + r / 200, 2 * years);
    setMaturityAmount(matAmt.toFixed(2));
  }, [principal, interestRate, startDate, maturityDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      setError('Bank name is required');
      return;
    }
    const p = parseFloat(principal);
    if (isNaN(p) || p <= 0) {
      setError('Please enter a valid principal amount');
      return;
    }
    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate <= 0) {
      setError('Please enter a valid interest rate');
      return;
    }
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (maturityDate && maturityDate < startDate) {
      setError('Maturity date cannot be earlier than start date');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        bank_name: bankName.trim(),
        principal_amount: p,
        interest_rate: rate,
        start_date: startDate,
        maturity_date: maturityDate || undefined,
        maturity_amount: maturityAmount ? parseFloat(maturityAmount) : undefined,
        status: status,
        notes: notes.trim() || undefined,
      };

      if (editingFd) {
        await onUpdate('fd', editingFd.id, payload);
      } else {
        await onAdd('fd', targetPortfolio, payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fixed deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingFd ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
      preventClose={loading}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {portfolioOptions.length > 1 && !editingFd && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Portfolio
            </label>
            <select
              value={targetPortfolio}
              onChange={(e) => setTargetPortfolio(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {portfolioOptions.map((p) => (
                <option key={p.name} value={p.name}>{p.label}</option>
              ))}
            </select>
          </div>
        )}

        <StandardFormFields
          bankName={bankName}
          setBankName={setBankName}
          principalAmount={principal}
          setPrincipalAmount={setPrincipal}
          interestRate={interestRate}
          setInterestRate={setInterestRate}
          startDate={startDate}
          setStartDate={setStartDate}
          maturityDate={maturityDate}
          setMaturityDate={setMaturityDate}
          maturityAmount={maturityAmount}
          setMaturityAmount={setMaturityAmount}
          status={status}
          setStatus={setStatus}
          calculateMaturity={calculateMaturity}
        />

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-[14px] px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-[14px] py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white font-semibold text-sm rounded-[14px] py-2.5 hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingFd ? 'Save Changes' : 'Add Fixed Deposit'}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default FDFormModal;
