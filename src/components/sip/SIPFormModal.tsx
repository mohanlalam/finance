import React, { useState, useEffect } from 'react';
import { SIPAccount, SIPPayload } from '../../types/portfolio';
import SIPFormFields from './SIPFormFields';
import { fetchAMFIScheme } from '../../utils/amfiClient';

interface PortfolioOption {
  name: string;
  label: string;
}

interface SIPFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: SIPAccount | null;
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  onAdd: (portfolioName: string, payload: SIPPayload) => Promise<void>;
  onUpdate: (id: string, payload: Partial<SIPPayload>) => Promise<void>;
}

export function SIPFormModal({
  isOpen,
  onClose,
  editingAccount,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
}: SIPFormModalProps) {
  const [formPortfolio, setFormPortfolio] = useState(() => portfolioName);
  const [fundName, setFundName] = useState('');
  const [monthlySip, setMonthlySip] = useState('');
  const [expectedCagr, setExpectedCagr] = useState('');
  const [units, setUnits] = useState('');
  const [startDate, setStartDate] = useState('');
  const [nextSipDate, setNextSipDate] = useState('');
  const [fallbackValuation, setFallbackValuation] = useState('');
  const [mfSchemeCode, setMfSchemeCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidatingScheme, setIsValidatingScheme] = useState(false);

  // Auto-fill values when editing
  useEffect(() => {
    if (editingAccount) {
      setFormPortfolio(portfolioName);
      setFundName(editingAccount.fund_name);
      setMonthlySip(editingAccount.monthly_sip.toString());
      setExpectedCagr(editingAccount.expected_cagr.toString());
      setUnits(editingAccount.units.toString());
      setStartDate(editingAccount.start_date);
      setNextSipDate(editingAccount.next_sip_date ?? '');
      setFallbackValuation(editingAccount.fallback_valuation.toString());
      setMfSchemeCode(editingAccount.mf_scheme_code ?? '');
      setNotes(editingAccount.notes ?? '');
    } else {
      setFormPortfolio(portfolioName);
      setFundName('');
      setMonthlySip('');
      setExpectedCagr('12.00'); // default Mutual Fund CAGR is 12%
      setUnits('');
      setStartDate('');
      setNextSipDate('');
      setFallbackValuation('');
      setMfSchemeCode('');
      setNotes('');
    }
    setError('');
  }, [editingAccount, isOpen, portfolioName]);

  const handleValidateScheme = async () => {
    if (!mfSchemeCode) {
      setError('Please enter a Scheme Code first.');
      return;
    }
    setIsValidatingScheme(true);
    setError('');
    try {
      const details = await fetchAMFIScheme(mfSchemeCode);
      setFundName(details.schemeName);
      if (details.latestNav !== null && units) {
        setFallbackValuation((parseFloat(units) * details.latestNav).toFixed(2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidatingScheme(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fundName || !monthlySip || !expectedCagr || !startDate) {
      setError('Fund Name, Monthly SIP, Expected CAGR, and Start Date are required.');
      return;
    }

    const sip = parseFloat(monthlySip);
    const cagr = parseFloat(expectedCagr);
    const u = parseFloat(units) || 0;
    const val = parseFloat(fallbackValuation) || 0;

    if (isNaN(sip) || sip <= 0) {
      setError('Monthly SIP amount must be a positive number.');
      return;
    }

    setLoading(true);
    setError('');

    const payload: SIPPayload = {
      fund_name: fundName,
      monthly_sip: sip,
      expected_cagr: cagr,
      units: u,
      start_date: startDate,
      next_sip_date: nextSipDate || null,
      fallback_valuation: val,
      mf_scheme_code: mfSchemeCode || undefined,
      notes: notes || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="sip-modal-title">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700/50">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 id="sip-modal-title" className="text-base font-bold text-slate-800 dark:text-slate-100">
              {editingAccount ? 'Edit SIP' : 'Create SIP'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Enter details to track fund growth and units</p>
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
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-colors disabled:opacity-50"
            >
              {portfolioOptions.map((o) => (
                <option key={o.name} value={o.name}>{o.label}</option>
              ))}
            </select>
          </div>

          <SIPFormFields
            mfSchemeCode={mfSchemeCode}
            setMfSchemeCode={setMfSchemeCode}
            fundName={fundName}
            setFundName={setFundName}
            monthlySip={monthlySip}
            setMonthlySip={setMonthlySip}
            expectedCagr={expectedCagr}
            setExpectedCagr={setExpectedCagr}
            units={units}
            setUnits={setUnits}
            startDate={startDate}
            setStartDate={setStartDate}
            nextSipDate={nextSipDate}
            setNextSipDate={setNextSipDate}
            fallbackValuation={fallbackValuation}
            setFallbackValuation={setFallbackValuation}
            isValidatingScheme={isValidatingScheme}
            onValidateScheme={handleValidateScheme}
          />

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="e.g. Linked to child education, monthly auto-debit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-colors resize-none"
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
              className="flex-1 bg-sky-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingAccount ? 'Save Changes' : 'Create SIP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
