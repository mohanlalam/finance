import React from 'react';

interface SIPFormFieldsProps {
  mfSchemeCode: string;
  setMfSchemeCode: (val: string) => void;
  bankName: string;
  setBankName: (val: string) => void;
  principalAmount: string;
  setPrincipalAmount: (val: string) => void;
  interestRate: string;
  setInterestRate: (val: string) => void;
  units: string;
  setUnits: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  maturityDate: string;
  setMaturityDate: (val: string) => void;
  maturityAmount: string;
  setMaturityAmount: (val: string) => void;
  isValidatingScheme: boolean;
  onValidateScheme: () => Promise<void>;
}

export function SIPFormFields({
  mfSchemeCode,
  setMfSchemeCode,
  bankName,
  setBankName,
  principalAmount,
  setPrincipalAmount,
  interestRate,
  setInterestRate,
  units,
  setUnits,
  startDate,
  setStartDate,
  maturityDate,
  setMaturityDate,
  maturityAmount,
  setMaturityAmount,
  isValidatingScheme,
  onValidateScheme,
}: SIPFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">MF Scheme Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 102867"
            value={mfSchemeCode}
            onChange={(e) => setMfSchemeCode(e.target.value)}
            className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
          <button
            type="button"
            onClick={onValidateScheme}
            disabled={isValidatingScheme}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 shrink-0"
          >
            {isValidatingScheme ? 'Validating...' : 'Fetch Fund'}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Mutual Fund Name</label>
        <input
          type="text"
          placeholder="e.g. HDFC Top 100 Mutual Fund"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Monthly SIP (₹)</label>
          <input
            type="number"
            placeholder="0"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Expected CAGR (%)</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 12.00"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Units Owned</label>
          <input
            type="number"
            step="0.001"
            placeholder="0.000"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
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
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Next SIP Date <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Current / Fallback Valuation (₹)</label>
        <input
          type="number"
          placeholder="Manual / Fallback valuation"
          value={maturityAmount}
          onChange={(e) => setMaturityAmount(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
        />
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Note: If a valid Scheme Code is set, live valuation is auto-calculated using the fetched NAV. Otherwise, this manual value is used.
        </p>
      </div>
    </div>
  );
}

export default React.memo(SIPFormFields);
