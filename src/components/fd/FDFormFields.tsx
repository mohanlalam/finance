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
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Bank / Issuer Name</label>
        <input
          type="text"
          list="indian-bank-suggestions"
          placeholder="e.g. HDFC Bank, SBI, Post Office"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
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
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Principal Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 100000"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Interest Rate (% p.a.)</label>
          <input
            type="number"
            min="0"
            max="30"
            step="0.05"
            placeholder="e.g. 7.10"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Maturity Date <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <input
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      {startDate && maturityDate && (
        <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
          <span>Tenure: {formatDateDuration(startDate, maturityDate)}</span>
          <button
            type="button"
            onClick={calculateMaturity}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Auto-calculate maturity value
          </button>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
          Maturity Amount (₹) <span className="font-normal text-slate-400">(Optional / Estimated)</span>
        </label>
        <input
          type="number"
          min="0"
          step="100"
          placeholder="e.g. 107250"
          value={maturityAmount}
          onChange={(e) => setMaturityAmount(e.target.value)}
          className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Deposit Status</label>
        <div className="flex gap-2">
          {(['active', 'matured'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 h-9 rounded-[14px] text-xs font-semibold transition-all capitalize ${
                status === s
                  ? s === 'active'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/40'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-2 border-amber-500/40'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
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
