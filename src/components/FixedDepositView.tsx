import React, { useState, useCallback } from 'react';
import { FixedDeposit, DocumentMetadata, PortfolioName } from '../types/portfolio';
import { formatINR, getDocumentUrl, getFDEffectiveValue } from '../utils/formatters';
import { Plus, Trash2, Edit2, Calendar, TrendingUp, Landmark, FileText, CheckCircle, Clock } from 'lucide-react';

interface FixedDepositViewProps {
  fixedDeposits: FixedDeposit[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  onAdd: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<void>;
  onUpdate: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
}

function FixedDepositView({
  fixedDeposits,
  documents,
  portfolioName,
  onAdd,
  onUpdate,
  onDelete,
}: FixedDepositViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingFd, setEditingFd] = useState<FixedDeposit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [bankName, setBankName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [maturityAmount, setMaturityAmount] = useState('');
  const [status, setStatus] = useState<'active' | 'matured'>('active');

  const calculateMaturity = useCallback(() => {
    const p = parseFloat(principalAmount);
    const r = parseFloat(interestRate);
    const s = new Date(startDate);
    const m = maturityDate ? new Date(maturityDate) : new Date();
    if (!isNaN(p) && !isNaN(r) && !isNaN(s.getTime()) && !isNaN(m.getTime())) {
      const timeDiff = m.getTime() - s.getTime();
      const years = timeDiff / (1000 * 3600 * 24 * 365.25);
      if (years > 0) {
        // Quarter compounding standard (A = P(1 + r/4)^4n)
        const amt = p * Math.pow(1 + r / 400, 4 * years);
        setMaturityAmount(amt.toFixed(2));
      } else {
        setMaturityAmount(p.toFixed(2));
      }
    }
  }, [principalAmount, interestRate, startDate, maturityDate]);

  React.useEffect(() => {
    calculateMaturity();
  }, [startDate, calculateMaturity]);

  // Math
  const totalPrincipal = fixedDeposits.reduce((s, f) => s + Number(f.principal_amount), 0);
  const totalMaturity = fixedDeposits.reduce((s, f) => s + getFDEffectiveValue(f), 0);
  const avgRate = fixedDeposits.length
    ? fixedDeposits.reduce((s, f) => s + Number(f.interest_rate) * Number(f.principal_amount), 0) / totalPrincipal
    : 0;

  function handleOpenAdd() {
    setEditingFd(null);
    setBankName('');
    setPrincipalAmount('');
    setInterestRate('');
    setStartDate('');
    setMaturityDate('');
    setMaturityAmount('');
    setStatus('active');
    setError('');
    setShowModal(true);
  }

  function handleOpenEdit(fd: FixedDeposit) {
    setEditingFd(fd);
    setBankName(fd.bank_name);
    setPrincipalAmount(fd.principal_amount.toString());
    setInterestRate(fd.interest_rate.toString());
    setStartDate(fd.start_date);
    setMaturityDate(fd.maturity_date || '');
    setMaturityAmount(fd.maturity_amount.toString());
    setStatus(fd.status);
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bankName || !principalAmount || !interestRate || !startDate || !maturityAmount) {
      setError('All fields except Maturity Date are required.');
      return;
    }
    setLoading(true);
    setError('');

    const payload = {
      bankName,
      principalAmount: parseFloat(principalAmount),
      interestRate: parseFloat(interestRate),
      startDate,
      maturityDate: maturityDate || null,
      maturityAmount: parseFloat(maturityAmount),
      status,
    };

    try {
      if (editingFd) {
        await onUpdate('fd', editingFd.id, payload);
      } else {
        await onAdd('fd', portfolioName === 'all' ? 'personal' : portfolioName, payload);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this Fixed Deposit?')) {
      try {
        await onDelete('fd', id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Deletion failed');
      }
    }
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="Fixed deposit summary metrics">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-100 font-semibold uppercase tracking-wider">Total FD Balance</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalPrincipal)}</p>
            <p className="text-xs text-blue-200 mt-2">Active Capital Locked</p>
          </div>
          <Landmark size={40} className="opacity-20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Est. Maturity Value</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalMaturity)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              +{formatINR(totalMaturity - totalPrincipal)} Total Earnings
            </p>
          </div>
          <TrendingUp size={40} className="text-emerald-500/20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Weighted Interest Rate</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{avgRate.toFixed(2)}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Across all FDs</p>
          </div>
          <Calendar size={40} className="text-blue-500/20 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* FD Grid/List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">FD Registry</h3>
          <button
            onClick={handleOpenAdd}
            aria-label="Create a new Fixed Deposit"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} aria-hidden="true" />
            Create Fixed Deposit
          </button>
        </div>

        {fixedDeposits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <Landmark size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold">No Fixed Deposits found</p>
            <p className="text-xs mt-1">Add your first FD to begin tracking interest returns.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700" role="list" aria-label="Fixed deposits list">
            {fixedDeposits.map((fd) => {
              const progress = getProgressPercent(fd);
              const fdDocs = documents.filter((d) => d.asset_type === 'fd' && d.asset_id === fd.id);
              const isMatured = fd.status === 'matured' || progress >= 100;

              return (
                <div key={fd.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors" role="listitem">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMatured ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                        {isMatured ? <CheckCircle size={20} aria-hidden="true" /> : <Landmark size={20} aria-hidden="true" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{fd.bank_name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMatured ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                            {isMatured ? 'Matured' : `${fd.interest_rate}% p.a.`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {fd.start_date} &rarr; {fd.maturity_date || 'Ongoing'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:text-right">
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Principal</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(Number(fd.principal_amount))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{fd.maturity_date ? 'Maturity Value' : 'Current Value'}</p>
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
                          title="Edit FD"
                          aria-label={`Edit fixed deposit at ${fd.bank_name}`}
                        >
                          <Edit2 size={14} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(fd.id)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                          title="Delete FD"
                          aria-label={`Delete fixed deposit at ${fd.bank_name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FD Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="fd-modal-title">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} aria-hidden="true" />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 id="fd-modal-title" className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {editingFd ? 'Edit Fixed Deposit' : 'Create Fixed Deposit'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Enter details to lock and calculate returns</p>
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
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Bank / Issuer Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Principal Amount (₹)</label>
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
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Interest Rate (% p.a.)</label>
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
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onBlur={calculateMaturity}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Maturity Date</label>
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
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Maturity Amount (₹)</label>
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
                  {loading ? 'Saving...' : editingFd ? 'Save Changes' : 'Create FD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(FixedDepositView);
