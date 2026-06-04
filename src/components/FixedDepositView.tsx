import React, { useState, useCallback, useEffect } from 'react';
import { FixedDeposit, DocumentMetadata, PortfolioName } from '../types/portfolio';
import { formatINR, getFDEffectiveValue } from '../utils/formatters';
import { Plus, TrendingUp, Landmark, Calendar, Clock, Heart } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import SIPFormFields from './fd/SIPFormFields';
import StandardFormFields from './fd/StandardFormFields';
import DepositDetailsCard from './fd/DepositDetailsCard';

interface PortfolioOption {
  name: string;
  label: string;
}

interface FixedDepositViewProps {
  fixedDeposits: FixedDeposit[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<void>;
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
  mode?: 'fd' | 'rd' | 'ssy' | 'sip';
}

const MODE_CONFIG = {
  fd: {
    title: 'Fixed Deposit',
    titlePlural: 'Fixed Deposits',
    registryTitle: 'FD Registry',
    createBtn: 'Create Fixed Deposit',
    firstBtn: 'Create Your First FD',
    issuerLabel: 'Bank / Issuer Name',
    principalLabel: 'Principal Amount (₹)',
    maturityLabel: 'Maturity Amount (₹)',
    editTitle: 'Edit Fixed Deposit',
    createTitle: 'Create Fixed Deposit',
    rateLabel: 'Interest Rate (% p.a.)',
    rateSub: 'Across all FDs',
    startLabel: 'Start Date',
    maturityDateLabel: 'Maturity Date',
    noActiveText: 'No Fixed Deposits Yet',
    subText: 'Start tracking your FDs to monitor maturity timelines, interest accrual, and upcoming deadlines.',
    totalLabel: 'Total FD Balance',
    estMaturityLabel: 'Est. Maturity Value',
    iconClass: Landmark,
    themeColor: 'from-blue-600 to-indigo-600',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  rd: {
    title: 'Recurring Deposit',
    titlePlural: 'Recurring Deposits',
    registryTitle: 'RD Registry',
    createBtn: 'Create Recurring Deposit',
    firstBtn: 'Create Your First RD',
    issuerLabel: 'Bank / Post Office Name',
    principalLabel: 'Monthly Deposit Amount (₹)',
    maturityLabel: 'Maturity Amount (₹)',
    editTitle: 'Edit Recurring Deposit',
    createTitle: 'Create Recurring Deposit',
    rateLabel: 'Interest Rate (% p.a.)',
    rateSub: 'Across all RDs',
    startLabel: 'Start Date',
    maturityDateLabel: 'Maturity Date',
    noActiveText: 'No Recurring Deposits Yet',
    subText: 'Start tracking your RDs to monitor recurring timelines, interest accrual, and upcoming deadlines.',
    totalLabel: 'Total RD Invested',
    estMaturityLabel: 'Est. Maturity Value',
    iconClass: Clock,
    themeColor: 'from-pink-600 to-rose-600',
    iconBg: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  },
  ssy: {
    title: 'Sukanya Samriddhi (SSY)',
    titlePlural: 'Sukanya Samriddhi Accounts',
    registryTitle: 'SSY Registry',
    createBtn: 'Create SSY Account',
    firstBtn: 'Create Your First SSY',
    issuerLabel: 'Post Office / Bank Name',
    principalLabel: 'Annual Deposit Amount (₹)',
    maturityLabel: 'Est. Maturity Amount (₹)',
    editTitle: 'Edit SSY Account',
    createTitle: 'Create SSY Account',
    rateLabel: 'Interest Rate (% p.a.)',
    rateSub: 'Across all SSY accounts',
    startLabel: 'Start Date',
    maturityDateLabel: 'Maturity Date',
    noActiveText: 'No SSY Accounts Yet',
    subText: 'Start tracking your SSY accounts to monitor maturity timelines and interest accrual.',
    totalLabel: 'Total SSY Invested',
    estMaturityLabel: 'Est. Maturity Value',
    iconClass: Heart,
    themeColor: 'from-purple-600 to-fuchsia-600',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  },
  sip: {
    title: 'SIP Mutual Fund',
    titlePlural: 'SIP Mutual Funds',
    registryTitle: 'SIP Registry',
    createBtn: 'Create SIP',
    firstBtn: 'Create Your First SIP',
    issuerLabel: 'Mutual Fund / Stock Name',
    principalLabel: 'Monthly SIP Amount (₹)',
    maturityLabel: 'Current Valuation (₹)',
    editTitle: 'Edit SIP',
    createTitle: 'Create SIP',
    rateLabel: 'Expected Return (% CAGR)',
    rateSub: 'Expected returns',
    startLabel: 'Start Date',
    maturityDateLabel: 'Next SIP Date',
    noActiveText: 'No SIPs Yet',
    subText: 'Start tracking your SIPs to monitor fund growth, total investment, and current valuation.',
    totalLabel: 'Total SIP Invested',
    estMaturityLabel: 'Current Portfolio Value',
    iconClass: TrendingUp,
    themeColor: 'from-sky-600 to-cyan-600',
    iconBg: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
  },
};

function FixedDepositView({
  fixedDeposits,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
  mode = 'fd',
}: FixedDepositViewProps) {
  const cfg = MODE_CONFIG[mode];
  const IconComponent = cfg.iconClass;

  const [showModal, setShowModal] = useState(false);
  const [editingFd, setEditingFd] = useState<FixedDeposit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<FixedDeposit | null>(null);

  // Form State
  const [formPortfolio, setFormPortfolio] = useState(() => portfolioName);
  const [bankName, setBankName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [maturityAmount, setMaturityAmount] = useState('');
  const [status, setStatus] = useState<'active' | 'matured'>('active');
  const [notes, setNotes] = useState('');
  const [mfSchemeCode, setMfSchemeCode] = useState('');
  const [units, setUnits] = useState('');
  const [isValidatingScheme, setIsValidatingScheme] = useState(false);

  const calculateMaturity = useCallback(() => {
    if (mode === 'sip') return;

    if (mode === 'ssy' && startDate && !maturityDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        const matYear = start.getFullYear() + 21;
        const matMonth = String(start.getMonth() + 1).padStart(2, '0');
        const matDay = String(start.getDate()).padStart(2, '0');
        setMaturityDate(`${matYear}-${matMonth}-${matDay}`);
      }
    }

    const p = parseFloat(principalAmount);
    const r = parseFloat(interestRate);
    const s = new Date(startDate);
    const m = maturityDate ? new Date(maturityDate) : new Date();
    if (!isNaN(p) && !isNaN(r) && !isNaN(s.getTime()) && !isNaN(m.getTime())) {
      const timeDiff = m.getTime() - s.getTime();
      const years = timeDiff / (1000 * 3600 * 24 * 365.25);
      if (years > 0) {
        if (mode === 'ssy') {
          const amt = p * Math.pow(1 + r / 100, years);
          setMaturityAmount(amt.toFixed(2));
        } else {
          const amt = p * Math.pow(1 + r / 400, 4 * years);
          setMaturityAmount(amt.toFixed(2));
        }
      } else {
        setMaturityAmount(p.toFixed(2));
      }
    }
  }, [principalAmount, interestRate, startDate, maturityDate, mode]);

  useEffect(() => {
    calculateMaturity();
  }, [startDate, calculateMaturity]);

  // Math
  const totalPrincipal = fixedDeposits.reduce((s, f) => s + Number(f.principal_amount), 0);
  const totalMaturity = fixedDeposits.reduce((s, f) => s + getFDEffectiveValue(f), 0);
  const avgRate = fixedDeposits.length
    ? fixedDeposits.reduce((s, f) => s + Number(f.interest_rate) * Number(f.principal_amount), 0) / totalPrincipal
    : 0;

  const handleOpenAdd = useCallback(() => {
    setEditingFd(null);
    setFormPortfolio(portfolioName);
    setBankName('');
    setPrincipalAmount('');
    setInterestRate(mode === 'sip' ? '0' : '');
    setStartDate('');
    setMaturityDate('');
    setMaturityAmount('');
    setStatus('active');
    setNotes('');
    setMfSchemeCode('');
    setUnits('');
    setError('');
    setShowModal(true);
  }, [portfolioName, mode]);

  useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAdd();
    }
  }, [autoOpenAddModal, handleOpenAdd]);

  const handleValidateScheme = async () => {
    if (!mfSchemeCode) {
      setError('Please enter a Scheme Code first.');
      return;
    }
    setIsValidatingScheme(true);
    setError('');
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${mfSchemeCode}`);
      if (!res.ok) throw new Error(`Scheme not found (HTTP ${res.status})`);
      const json = await res.json();
      if (json.meta && json.meta.scheme_name) {
        setBankName(json.meta.scheme_name);
        if (json.data && json.data.length > 0) {
          const latestNav = parseFloat(json.data[0].nav);
          if (!isNaN(latestNav) && units) {
            setMaturityAmount((parseFloat(units) * latestNav).toFixed(2));
          }
        }
      } else {
        throw new Error('Invalid scheme code or details not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate scheme code');
    } finally {
      setIsValidatingScheme(false);
    }
  };

  function handleOpenEdit(fd: FixedDeposit) {
    setEditingFd(fd);
    setFormPortfolio(portfolioName);
    setBankName(fd.bank_name);
    setPrincipalAmount(fd.principal_amount.toString());
    setInterestRate(fd.interest_rate.toString());
    setStartDate(fd.start_date);
    setMaturityDate(fd.maturity_date || '');
    setMaturityAmount(fd.maturity_amount.toString());
    setStatus(fd.status);
    setNotes(fd.notes ?? '');
    setMfSchemeCode(fd.mf_scheme_code ?? '');
    setUnits(fd.units?.toString() ?? '');
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'sip') {
      if (!bankName || !principalAmount || !startDate) {
        setError('Scheme Name, Monthly SIP Amount, and Start Date are required.');
        return;
      }
    } else {
      if (!bankName || !principalAmount || !interestRate || !startDate || !maturityAmount) {
        setError('All fields except Maturity Date are required.');
        return;
      }
    }
    setLoading(true);
    setError('');

    const payload = {
      bankName,
      principalAmount: parseFloat(principalAmount),
      interestRate: parseFloat(interestRate || '0'),
      startDate,
      maturityDate: maturityDate || null,
      maturityAmount: parseFloat(maturityAmount || '0'),
      status,
      fdType: mode === 'rd' ? 'recurring' : mode === 'ssy' ? 'ssy' : mode === 'sip' ? 'sip' : 'regular',
      notes: notes || null,
      mfSchemeCode: mode === 'sip' ? (mfSchemeCode || null) : null,
      units: mode === 'sip' ? (parseFloat(units) || null) : null,
    };

    try {
      if (editingFd) {
        await onUpdate('fd', editingFd.id, payload);
      } else {
        await onAdd('fd', formPortfolio, payload);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete('fd', id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Deletion failed');
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label={`${cfg.title} summary metrics`}>
        <div className={`bg-gradient-to-tr ${cfg.themeColor} rounded-2xl p-5 text-white shadow-md flex items-center justify-between`}>
          <div>
            <p className="text-xs text-white/80 font-semibold uppercase tracking-wider">{cfg.totalLabel}</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalPrincipal)}</p>
            <p className="text-xs text-white/70 mt-2">Active Capital Locked</p>
          </div>
          <IconComponent size={40} className="opacity-20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{cfg.estMaturityLabel}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalMaturity)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              {mode === 'sip' 
                ? `${totalMaturity >= totalPrincipal ? '+' : ''}${formatINR(totalMaturity - totalPrincipal)} Net Returns` 
                : `+${formatINR(totalMaturity - totalPrincipal)} Total Earnings`
              }
            </p>
          </div>
          <TrendingUp size={40} className="text-emerald-500/20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              {mode === 'sip' ? 'Average Return rate' : 'Weighted Interest Rate'}
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{avgRate.toFixed(2)}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{cfg.rateSub}</p>
          </div>
          <Calendar size={40} className="text-blue-500/20 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Grid/List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{cfg.registryTitle}</h3>
          <button
            onClick={handleOpenAdd}
            aria-label={cfg.createBtn}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} aria-hidden="true" />
            {cfg.createBtn}
          </button>
        </div>

        {fixedDeposits.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <IconComponent size={36} className="text-indigo-400 dark:text-indigo-500" aria-hidden="true" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1.5">{cfg.noActiveText}</h4>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs mx-auto">
              {cfg.subText}
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
            >
              <Plus size={15} aria-hidden="true" />
              {cfg.firstBtn}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700" role="list" aria-label={`${cfg.titlePlural} list`}>
            {fixedDeposits.map((fd) => (
              <DepositDetailsCard
                key={fd.id}
                fd={fd}
                mode={mode}
                cfg={cfg}
                documents={documents}
                onOpenEdit={handleOpenEdit}
                onConfirmDelete={setConfirmDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="fd-modal-title">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} aria-hidden="true" />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 id="fd-modal-title" className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {editingFd ? cfg.editTitle : cfg.createTitle}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Enter details to track valuation and timeline</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors text-xl font-bold"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Portfolio</label>
                <select
                  value={formPortfolio}
                  onChange={(e) => setFormPortfolio(e.target.value)}
                  disabled={!!editingFd}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors disabled:opacity-50"
                >
                  {portfolioOptions.map((o) => (
                    <option key={o.name} value={o.name}>{o.label}</option>
                  ))}
                </select>
              </div>

              {mode === 'sip' ? (
                <SIPFormFields
                  mfSchemeCode={mfSchemeCode}
                  setMfSchemeCode={setMfSchemeCode}
                  bankName={bankName}
                  setBankName={setBankName}
                  principalAmount={principalAmount}
                  setPrincipalAmount={setPrincipalAmount}
                  interestRate={interestRate}
                  setInterestRate={setInterestRate}
                  units={units}
                  setUnits={setUnits}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  maturityDate={maturityDate}
                  setMaturityDate={setMaturityDate}
                  maturityAmount={maturityAmount}
                  setMaturityAmount={setMaturityAmount}
                  isValidatingScheme={isValidatingScheme}
                  onValidateScheme={handleValidateScheme}
                />
              ) : (
                <StandardFormFields
                  cfg={cfg}
                  bankName={bankName}
                  setBankName={setBankName}
                  principalAmount={principalAmount}
                  setPrincipalAmount={setPrincipalAmount}
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
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea
                  rows={2}
                  placeholder={`e.g. Linked to child education, monthly auto-debit`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-3 py-2" role="alert">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingFd ? 'Save Changes' : `Create ${cfg.title}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void handleDelete(confirmDelete.id); }}
        title={`Delete ${cfg.title}`}
        message={confirmDelete ? `Are you sure you want to delete the ${cfg.title.toLowerCase()} at "${confirmDelete.bank_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default React.memo(FixedDepositView);
