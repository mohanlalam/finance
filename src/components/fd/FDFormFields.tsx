import React from 'react';
import { formatDateDuration } from '../../utils/dateUtils';
import { INDIAN_BANKS_LIST } from '../../utils/indianFinancialPresets';

export interface FDFormFieldsProps {
  bankName: string;
  setBankName: (val: string) => void;
  principalAmount: string;
  setPrincipalAmount: (val: string) => void;
  interestRate: string;
  setInterestRate: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  maturityDate: string;
  setMaturityDate: (val: string) => void;
  maturityAmount: string;
  setMaturityAmount: (val: string) => void;
  status: 'active' | 'matured';
  setStatus: (val: 'active' | 'matured') => void;
  calculateMaturity: () => void;
}

export function FDFormFields({
  bankName,
  setBankName,
  principalAmount,
  setPrincipalAmount,
  interestRate,
  setInterestRate,
  startDate,
  setStartDate,
  maturityDate,
  setMaturityDate,
  maturityAmount,
  setMaturityAmount,
  status,
  setStatus,
  calculateMaturity,
}: FDFormFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Bank / Issuer Name</label>
        <input
          type="text"
          list="indian-bank-suggestions"
          placeholder="e.g. HDFC Bank, SBI, Post Office"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full h-10 border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
          required
        />
        <datalist id="indian-bank-suggestions">
          {INDIAN_BANKS_LIST.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Principal Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 100000"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
            className="w-full h-10 border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Interest Rate (% p.a.)</label>
          <input
            type="number"
            min="0"
            max="30"
            step="0.05"
            placeholder="e.g. 7.10"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full h-10 border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-10 border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Maturity Date <span className="font-normal text-[var(--text-tertiary)]">(Optional)</span>
          </label>
          <input
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            className="w-full h-10 border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>
      </div>

      {startDate && maturityDate && (
        <div className="flex items-center justify-between text-xs px-1 text-[var(--text-secondary)]">
          <span>Tenure: {formatDateDuration(startDate, maturityDate)}</span>
          <button
            type="button"
            onClick={calculateMaturity}
            className="text-[var(--accent-blue)] hover:underline font-medium cursor-pointer"
          >
            Auto-calculate maturity value
          </button>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
          Maturity Amount (₹) <span className="font-normal text-[var(--text-tertiary)]">(Optional / Estimated)</span>
        </label>
        <input
          type="number"
          min="0"
          step="100"
          placeholder="e.g. 107250"
          value={maturityAmount}
          onChange={(e) => setMaturityAmount(e.target.value)}
          className="w-full h-10 border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Deposit Status</label>
        <div className="flex gap-2">
          {(['active', 'matured'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 h-9 rounded-[var(--radius-medium)] text-xs font-semibold transition-all capitalize cursor-pointer ${
                status === s
                  ? s === 'active'
                    ? 'bg-[var(--positive-soft)] text-[var(--positive)] border-2 border-[var(--positive)]'
                    : 'bg-[var(--warning-soft)] text-[var(--warning)] border-2 border-[var(--warning)]'
                  : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-luminous)]'
              }`}
            >
              {s === 'active' ? '● Active Deposit' : '✓ Matured'}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default React.memo(FDFormFields);
