import React from 'react';
import { formatDateDuration } from '../../utils/dateUtils';
import { INDIAN_BANKS_LIST } from '../../utils/indianFinancialPresets';

interface StandardFormFieldsProps {
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

export function StandardFormFields({
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
}: StandardFormFieldsProps) {
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
        />
        <datalist id="indian-bank-suggestions">
          {INDIAN_BANKS_LIST.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 truncate">Principal Amount (₹)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
            onBlur={calculateMaturity}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 truncate">Interest Rate (% p.a.)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="e.g. 7.10"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            onBlur={calculateMaturity}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 overflow-hidden">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 truncate">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onBlur={calculateMaturity}
            className="w-full h-10 min-w-0 border border-slate-200 dark:border-slate-700 rounded-[14px] px-2.5 sm:px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div className="min-w-0 overflow-hidden">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 truncate">Maturity Date</label>
          <input
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            onBlur={calculateMaturity}
            className="w-full h-10 min-w-0 border border-slate-200 dark:border-slate-700 rounded-[14px] px-2.5 sm:px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        {startDate && maturityDate && (
          <div className="col-span-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium -mt-1 flex items-center gap-1">
            <span>Duration:</span>
            <strong className="font-bold">{formatDateDuration(startDate, maturityDate)}</strong>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 truncate">Maturity Amount (₹)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Auto-computed"
            value={maturityAmount}
            onChange={(e) => setMaturityAmount(e.target.value)}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 truncate">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'matured')}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          >
            <option value="active">Active</option>
            <option value="matured">Matured</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default React.memo(StandardFormFields);
