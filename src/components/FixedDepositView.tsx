import React, { useState, useCallback } from 'react';
import { FixedDeposit, DocumentMetadata, PortfolioName } from '../types/portfolio';
import { formatINR, getDocumentUrl, getFDEffectiveValue } from '../utils/formatters';
import { Plus, Trash2, Edit2, Calendar, TrendingUp, Landmark, FileText, CheckCircle, Clock, StickyNote, Heart, AlertCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface PortfolioOption {
  name: string;
  label: string;
}

interface FixedDepositViewProps {
  fixedDeposits: FixedDeposit[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<void>;
  onUpdate: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
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
  const [expandedRd, setExpandedRd] = useState<Record<string, boolean>>({});

  const calculateMaturity = useCallback(() => {
    if (mode === 'sip') return; // For SIP, current value is fully manual

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
          // Annual compounding for SSY
          const amt = p * Math.pow(1 + r / 100, years);
          setMaturityAmount(amt.toFixed(2));
        } else {
          // Quarter compounding standard (A = P(1 + r/4)^4n)
          const amt = p * Math.pow(1 + r / 400, 4 * years);
          setMaturityAmount(amt.toFixed(2));
        }
      } else {
        setMaturityAmount(p.toFixed(2));
      }
    }
  }, [principalAmount, interestRate, startDate, maturityDate, mode]);

  React.useEffect(() => {
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

  React.useEffect(() => {
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

  // Helper for RD installment calculation
  const getRDInstallmentMonths = useCallback((startDateStr: string, maturityDateStr: string | null): Date[] => {
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return [];
    
    const end = maturityDateStr ? new Date(maturityDateStr) : new Date();
    const limit = new Date();
    const actualEnd = end.getTime() < limit.getTime() ? end : limit;
    
    const months: Date[] = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCompare = new Date(actualEnd.getFullYear(), actualEnd.getMonth(), 1);
    
    while (current.getTime() <= endCompare.getTime()) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }, []);

  const isRDMonthPaid = useCallback((monthDate: Date, contributions?: { date: string; amount: number }[]): boolean => {
    if (!contributions) return false;
    const targetYear = monthDate.getFullYear();
    const targetMonth = monthDate.getMonth();
    
    return contributions.some((c) => {
      const cDate = new Date(c.date);
      return !isNaN(cDate.getTime()) && cDate.getFullYear() === targetYear && cDate.getMonth() === targetMonth;
    });
  }, []);

  async function handleRecordInstallment(fd: FixedDeposit, targetMonth: Date) {
    const year = targetMonth.getFullYear();
    const month = String(targetMonth.getMonth() + 1).padStart(2, '0');
    const today = new Date();
    let dateStr = `${year}-${month}-01`;
    if (today.getFullYear() === year && today.getMonth() === targetMonth.getMonth()) {
      dateStr = today.toISOString().split('T')[0];
    }
    
    const existing = fd.contributions || [];
    const updated = [...existing, { date: dateStr, amount: fd.principal_amount }].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    try {
      await onUpdate('fd', fd.id, { contributions: updated });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record installment');
    }
  }

  const toggleExpandRd = useCallback((id: string) => {
    setExpandedRd((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Helper to compute progress bar percentage
  function getProgressPercent(fd: FixedDeposit) {
    if (fd.status === 'matured') return 100;
    if (!fd.maturity_date) return 100;
    const start = new Date(fd.start_date).getTime();
    const end = new Date(fd.maturity_date).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return ((now - start) / (end - start)) * 100;
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
            {fixedDeposits.map((fd) => {
              const progress = getProgressPercent(fd);
              const fdDocs = documents.filter((d) => d.asset_type === 'fd' && d.asset_id === fd.id);
              const isMatured = fd.status === 'matured' || (mode !== 'sip' && progress >= 100);

              return (
                <div key={fd.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors" role="listitem">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMatured ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : cfg.iconBg}`}>
                        {isMatured ? <CheckCircle size={20} aria-hidden="true" /> : <IconComponent size={20} aria-hidden="true" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{fd.bank_name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMatured ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                            {isMatured ? 'Matured' : `${fd.interest_rate}% ${mode === 'sip' ? 'Expected CAGR' : 'p.a.'}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {fd.start_date} &rarr; {fd.maturity_date || (mode === 'sip' ? 'Ongoing SIP' : 'Ongoing')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:text-right">
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{cfg.principalLabel.replace(' (₹)', '')}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(Number(fd.principal_amount))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{mode === 'sip' ? 'Current Valuation' : (fd.maturity_date ? 'Maturity Value' : 'Current Value')}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(getFDEffectiveValue(fd))}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-start md:justify-end gap-2">
                        {fdDocs.map((doc) => (
                          <a
                            key={doc.id}
                            href={getDocumentUrl(doc.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                            title={doc.name}
                            aria-label={`Open document: ${doc.name}`}
                          >
                            <FileText size={14} aria-hidden="true" />
                          </a>
                        ))}
                        <button
                          onClick={() => handleOpenEdit(fd)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                          title={`Edit ${cfg.title}`}
                          aria-label={`Edit ${cfg.title} at ${fd.bank_name}`}
                        >
                          <Edit2 size={14} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(fd)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                          title={`Delete ${cfg.title}`}
                          aria-label={`Delete ${cfg.title} at ${fd.bank_name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar / Next SIP Due Date details */}
                  {mode !== 'sip' ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                          <span className="flex items-center gap-1">
                            <Clock size={10} aria-hidden="true" />
                            Maturity Timeline
                          </span>
                          <span>{fd.maturity_date ? `${progress.toFixed(0)}% elapsed` : 'Ongoing accumulation'}</span>
                        </div>
                        {fd.maturity_date && (
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Maturity timeline progress">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isMatured ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {mode === 'ssy' && (Number(fd.principal_amount) < 250 || Number(fd.principal_amount) > 150000) && (
                        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-250/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-xl p-3 text-[11px] flex items-start gap-2">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          <span>SSY guidelines: Annual deposits must be between ₹250 and ₹1,50,000 per financial year. Adjust this account's annual contribution to conform.</span>
                        </div>
                      )}
                      
                      {mode === 'rd' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                          <button
                            type="button"
                            onClick={() => toggleExpandRd(fd.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {expandedRd[fd.id] ? 'Hide Installment Schedule' : 'Show Installment Schedule'}
                          </button>
                          
                          {expandedRd[fd.id] && (
                            <div className="mt-3 space-y-2">
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                Monthly Installments
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {getRDInstallmentMonths(fd.start_date, fd.maturity_date).map((monthDate, idx) => {
                                  const isPaid = isRDMonthPaid(monthDate, fd.contributions);
                                  const label = monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                                  return (
                                    <div
                                      key={idx}
                                      className={`rounded-xl border p-2 flex flex-col items-center justify-between text-center gap-1.5 transition-all ${
                                        isPaid
                                          ? 'bg-emerald-50/30 border-emerald-250 dark:bg-emerald-950/10 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400'
                                          : 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-750 text-slate-500 dark:text-slate-450'
                                      }`}
                                    >
                                      <span className="text-[10px] font-bold tracking-wide">{label}</span>
                                      {isPaid ? (
                                        <span className="text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                                          ✓ Paid
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => void handleRecordInstallment(fd, monthDate)}
                                          className="text-[9px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded-md transition-all active:scale-95 shadow-xs"
                                        >
                                          + Pay
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {fd.notes && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
                          <StickyNote size={11} className="shrink-0 mt-0.5" />
                          <span className="italic">{fd.notes}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {fd.notes && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
                          <StickyNote size={11} className="shrink-0 mt-0.5" />
                          <span className="italic">{fd.notes}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
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
                        onClick={handleValidateScheme}
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
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Next SIP Date <span className="font-normal text-slate-400">(optional)</span></label>
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
              ) : (
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
