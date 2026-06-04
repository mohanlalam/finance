import React from 'react';

interface ModeConfig {
  issuerLabel: string;
  principalLabel: string;
  rateLabel: string;
  startLabel: string;
  maturityDateLabel: string;
  maturityLabel: string;
}

interface StandardFormFieldsProps {
  cfg: ModeConfig;
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
  cfg,
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
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{cfg.issuerLabel}</label>
        <input
          type="text"
          placeholder="e.g. SBI Bank, Post Office"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
        />
      </div>



      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{cfg.principalLabel}</label>
          <input
            type="number"
            placeholder="0"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
            onBlur={calculateMaturity}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{cfg.rateLabel}</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 7.10"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            onBlur={calculateMaturity}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{cfg.startLabel}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onBlur={calculateMaturity}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{cfg.maturityDateLabel}</label>
          <input
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            onBlur={calculateMaturity}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{cfg.maturityLabel}</label>
          <input
            type="number"
            placeholder="Auto-computed"
            value={maturityAmount}
            onChange={(e) => setMaturityAmount(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'matured')}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
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
