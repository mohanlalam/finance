import React, { useState, useEffect } from 'react';
import { SIPAccount, SIPPayload } from '../../types/portfolio';
import SIPFormFields from './SIPFormFields';
import { fetchAMFIScheme } from '../../utils/amfiClient';
import Modal from '../Modal';

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

    if (isNaN(sip) || sip <= 0 || sip > 50_000_000) {
      setError('Monthly SIP amount must be a positive number up to ₹5 Crore.');
      return;
    }

    if (isNaN(cagr) || cagr < -100 || cagr > 100) {
      setError('Expected CAGR must be between -100% and 100%.');
      return;
    }

    const u = units.trim() === '' ? 0 : parseFloat(units);
    if (isNaN(u) || u < 0 || u > 10_000_000) {
      setError('Units must be a valid number between 0 and 10,000,000.');
      return;
    }

    const val = fallbackValuation.trim() === '' ? 0 : parseFloat(fallbackValuation);
    if (isNaN(val) || val < 0 || val > 1_000_000_000) {
      setError('Valuation must be a valid number between 0 and ₹100 Crore.');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      ariaLabel={editingAccount ? 'Edit SIP' : 'Create SIP'}
    >
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center modal-drag-handle cursor-grab active:cursor-grabbing" data-drag-handle>
        <div>
          <h3 id="sip-modal-title" className="text-base font-bold text-[var(--text-primary)]">
            {editingAccount ? 'Edit SIP' : 'Create SIP'}
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Enter details to track fund growth and units</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-[var(--radius-small)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors text-xl font-bold ios-press"
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6 sm:py-5 space-y-3.5 sm:space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* Portfolio Select */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Portfolio Owner</label>
            <select
              value={formPortfolio}
              onChange={(e) => setFormPortfolio(e.target.value)}
              disabled={!!editingAccount}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors disabled:opacity-50"
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
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Notes <span className="font-normal text-[var(--text-tertiary)]">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="e.g. Linked to child education, monthly auto-debit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-[var(--negative)] bg-[var(--negative-soft)] border border-[var(--negative)]/30 rounded-[var(--radius-medium)] px-3 py-2" role="alert">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-[var(--radius-medium)] h-11 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs ios-press transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--accent-blue)] text-white font-semibold text-sm rounded-[var(--radius-medium)] h-11 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 ios-press shadow-xs cursor-pointer"
            >
              {loading ? 'Saving...' : editingAccount ? 'Save Changes' : 'Create SIP'}
            </button>
          </div>
        </form>
    </Modal>
  );
}
