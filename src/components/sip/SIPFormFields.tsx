import React from 'react';

interface SIPFormFieldsProps {
  mfSchemeCode: string;
  setMfSchemeCode: (val: string) => void;
  fundName: string;
  setFundName: (val: string) => void;
  monthlySip: string;
  setMonthlySip: (val: string) => void;
  expectedCagr: string;
  setExpectedCagr: (val: string) => void;
  units: string;
  setUnits: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  nextSipDate: string;
  setNextSipDate: (val: string) => void;
  fallbackValuation: string;
  setFallbackValuation: (val: string) => void;
  isValidatingScheme: boolean;
  onValidateScheme: () => Promise<void>;
}

export function SIPFormFields({
  mfSchemeCode,
  setMfSchemeCode,
  fundName,
  setFundName,
  monthlySip,
  setMonthlySip,
  expectedCagr,
  setExpectedCagr,
  units,
  setUnits,
  startDate,
  setStartDate,
  nextSipDate,
  setNextSipDate,
  fallbackValuation,
  setFallbackValuation,
  isValidatingScheme,
  onValidateScheme,
}: SIPFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">MF Scheme Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 102867"
            value={mfSchemeCode}
            onChange={(e) => setMfSchemeCode(e.target.value)}
            className="flex-1 border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
          />
          <button
            type="button"
            onClick={onValidateScheme}
            disabled={isValidatingScheme}
            className="bg-[var(--accent-blue)] hover:opacity-90 text-white text-xs font-semibold px-4 py-2 rounded-[var(--radius-medium)] transition-all disabled:opacity-50 shrink-0 ios-press shadow-xs"
          >
            {isValidatingScheme ? 'Validating...' : 'Fetch Fund'}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Mutual Fund Name</label>
        <input
          type="text"
          placeholder="e.g. HDFC Top 100 Mutual Fund"
          value={fundName}
          onChange={(e) => setFundName(e.target.value)}
          className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Monthly SIP (₹)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={monthlySip}
            onChange={(e) => setMonthlySip(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Expected CAGR (%)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="e.g. 12.00"
            value={expectedCagr}
            onChange={(e) => setExpectedCagr(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Units Owned</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            placeholder="0.000"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
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
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Next SIP Date <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
          </label>
          <input
            type="date"
            value={nextSipDate}
            onChange={(e) => setNextSipDate(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Current / Fallback Valuation (₹)</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Manual / Fallback valuation"
          value={fallbackValuation}
          onChange={(e) => setFallbackValuation(e.target.value)}
          className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
        />
        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
          Note: If a valid Scheme Code is set, live valuation is auto-calculated using the fetched NAV. Otherwise, this manual value is used.
        </p>
      </div>
    </div>
  );
}

export default React.memo(SIPFormFields);
