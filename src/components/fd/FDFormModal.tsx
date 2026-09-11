import React, { useState, useEffect, useCallback } from 'react';
import { FixedDeposit } from '../../types/portfolio';
import { calculateFDMaturityValue } from '../../domains/assets/fd/calculations/fdCompounding';
import Modal from '../Modal';
import FDFormFields from './FDFormFields';

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
  onAdd: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
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
  const defaultTargetPort = portfolioName === 'all' ? (portfolioOptions[0]?.name || 'rammohan') : portfolioName;
  const [targetPortfolio, setTargetPortfolio] = useState(defaultTargetPort);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolvedPort = portfolioName === 'all' ? (portfolioOptions[0]?.name || 'rammohan') : portfolioName;
    if (editingFd) {
      setBankName(editingFd.bank_name || '');
      setPrincipal(editingFd.principal_amount ? String(editingFd.principal_amount) : '');
      setInterestRate(editingFd.interest_rate ? String(editingFd.interest_rate) : '');
      setStartDate(editingFd.start_date || '');
      setMaturityDate(editingFd.maturity_date || '');
      setMaturityAmount(editingFd.maturity_amount ? String(editingFd.maturity_amount) : '');
      setStatus(editingFd.status || 'active');
      setNotes(editingFd.notes || '');
      setTargetPortfolio(resolvedPort);
    } else {
      setBankName('');
      setPrincipal('');
      setInterestRate('');
      setStartDate('');
      setMaturityDate('');
      setMaturityAmount('');
      setStatus('active');
      setNotes('');
      setTargetPortfolio(resolvedPort);
    }
    setError(null);
  }, [editingFd, portfolioName, portfolioOptions, isOpen]);

  const calculateMaturity = useCallback(() => {
    const p = parseFloat(principal);
    const r = parseFloat(interestRate);
    if (isNaN(p) || isNaN(r) || p <= 0 || r <= 0 || !startDate || !maturityDate) return;
    
    // Indian Banking quarterly compounding for term deposits (frequency = 4)
    const matAmt = calculateFDMaturityValue(p, r, startDate, maturityDate, 4);
    if (matAmt > 0) {
      setMaturityAmount(matAmt.toFixed(2));
    }
  }, [principal, interestRate, startDate, maturityDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      setError('Bank name is required');
      return;
    }
    const p = parseFloat(principal);
    if (isNaN(p) || p <= 0 || p > 1_000_000_000) {
      setError('Please enter a valid principal amount up to ₹100 Crore');
      return;
    }
    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate <= 0 || rate > 50) {
      setError('Please enter a valid interest rate between 0.1% and 50%');
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

    let matAmt: number = p;
    if (maturityAmount && maturityAmount.trim() !== '') {
      const parsed = parseFloat(maturityAmount);
      if (isNaN(parsed) || parsed < 0 || parsed > 10_000_000_000) {
        setError('Please enter a valid maturity amount');
        return;
      }
      matAmt = parsed;
    } else if (startDate && maturityDate) {
      const calculated = calculateFDMaturityValue(p, rate, startDate, maturityDate, 4);
      if (calculated > 0) {
        matAmt = calculated;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        bankName: bankName.trim(),
        bank_name: bankName.trim(),
        principalAmount: p,
        principal_amount: p,
        interestRate: rate,
        interest_rate: rate,
        startDate: startDate,
        start_date: startDate,
        maturityDate: maturityDate || undefined,
        maturity_date: maturityDate || undefined,
        maturityAmount: matAmt,
        maturity_amount: matAmt,
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
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        {portfolioOptions.length > 1 && !editingFd && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Portfolio
            </label>
            <select
              value={targetPortfolio}
              onChange={(e) => setTargetPortfolio(e.target.value)}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
            >
              {portfolioOptions.map((p) => (
                <option key={p.name} value={p.name}>{p.label}</option>
              ))}
            </select>
          </div>
        )}

        <FDFormFields
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
          notes={notes}
          setNotes={setNotes}
          calculateMaturity={calculateMaturity}
        />

        {error && (
          <p className="text-xs text-[var(--negative)] bg-[var(--negative-soft)] border border-[var(--negative)]/20 rounded-[var(--radius-medium)] px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] font-semibold text-sm rounded-[var(--radius-medium)] h-11 py-2.5 hover:bg-[var(--surface-secondary)] shadow-xs ios-press transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[var(--asset-fd)] text-slate-900 font-semibold text-sm rounded-[var(--radius-medium)] h-11 py-2.5 hover:opacity-90 transition-colors disabled:opacity-50 ios-press shadow-xs cursor-pointer"
          >
            {loading ? 'Saving...' : editingFd ? 'Save Changes' : 'Add Fixed Deposit'}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default FDFormModal;
