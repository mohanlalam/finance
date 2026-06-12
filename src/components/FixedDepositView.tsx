import React, { useState, useCallback, useEffect } from 'react';
import { FixedDeposit, DocumentMetadata, PortfolioName } from '../types/portfolio';
import { formatINR, getFDInvestedAmount, getFDEffectiveValue } from '../utils/formatters';
import { Plus, TrendingUp, Landmark, Calendar } from './icons/AppIcons';
import ConfirmModal from './ConfirmModal';
import EmptyState from './EmptyState';
import StandardFormFields from './fd/StandardFormFields';
import DepositDetailsCard from './fd/DepositDetailsCard';
import { usePortfolioState } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import AssetCardSkeleton from './AssetCardSkeleton';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface PortfolioOption {
  name: string;
  label: string;
}

interface FixedDepositViewProps {
  fixedDeposits: FixedDeposit[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

const CFG = {
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
  themeColor: 'from-blue-600 to-indigo-600',
  iconBg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  iconClass: Landmark,
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
}: FixedDepositViewProps) {
  const { isMutating } = usePortfolioState();
  const { addToast } = useToastActions();
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

  const calculateMaturity = useCallback(() => {
    const p = parseFloat(principalAmount);
    const r = parseFloat(interestRate);
    const s = new Date(startDate);
    const m = maturityDate ? new Date(maturityDate) : new Date();
    if (!isNaN(p) && !isNaN(r) && !isNaN(s.getTime()) && !isNaN(m.getTime())) {
      const timeDiff = m.getTime() - s.getTime();
      const years = timeDiff / (1000 * 3600 * 24 * 365.25);
      if (years > 0) {
        const amt = p * Math.pow(1 + r / 200, 2 * years);
        setMaturityAmount(amt.toFixed(2));
      } else {
        setMaturityAmount(p.toFixed(2));
      }
    }
  }, [principalAmount, interestRate, startDate, maturityDate]);

  useEffect(() => {
    calculateMaturity();
  }, [startDate, calculateMaturity]);

  // Math
  const totalPrincipal = fixedDeposits.reduce((s, f) => s + getFDInvestedAmount(f), 0);
  const totalMaturity = fixedDeposits.reduce((s, f) => s + getFDEffectiveValue(f), 0);
  const avgRate = fixedDeposits.length && totalPrincipal > 0
    ? fixedDeposits.reduce((s, f) => s + Number(f.interest_rate) * getFDInvestedAmount(f), 0) / totalPrincipal
    : 0;

  const handleOpenAdd = useCallback(() => {
    setEditingFd(null);
    setFormPortfolio(portfolioName);
    setBankName('');
    setPrincipalAmount('');
    setInterestRate('');
    setStartDate('');
    setMaturityDate('');
    setMaturityAmount('');
    setStatus('active');
    setNotes('');
    setError('');
    setShowModal(true);
  }, [portfolioName]);

  useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAdd();
    }
  }, [autoOpenAddModal, handleOpenAdd]);

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
      fdType: 'regular',
      notes: notes || null,
    };

    try {
      if (editingFd) {
        await onUpdate('fd', editingFd.id, payload);
        addToast('Fixed deposit updated successfully', 'success');
      } else {
        await onAdd('fd', formPortfolio, payload);
        addToast('Fixed deposit created successfully', 'success');
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
      addToast(err instanceof Error ? err.message : 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDelete('fd', id);
      addToast('Fixed deposit deleted successfully', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Deletion failed', 'error');
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label={`${CFG.title} summary metrics`}>
        <div className={`bg-gradient-to-tr ${CFG.themeColor} rounded-2xl p-5 text-white shadow-md flex items-center justify-between`}>
          <div>
            <p className="text-xs text-white/80 font-semibold uppercase tracking-wider">{CFG.totalLabel}</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalPrincipal)}</p>
            <p className="text-xs text-white/70 mt-2">Active Capital Locked</p>
          </div>
          <Landmark size={40} className="opacity-20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{CFG.estMaturityLabel}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalMaturity)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              +{formatINR(totalMaturity - totalPrincipal)} Total Earnings
            </p>
          </div>
          <TrendingUp size={40} className="text-emerald-500/20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              Weighted Interest Rate
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{avgRate.toFixed(2)}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{CFG.rateSub}</p>
          </div>
          <Calendar size={40} className="text-blue-500/20 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Grid/List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{CFG.registryTitle}</h3>
          <button
            onClick={handleOpenAdd}
            aria-label={CFG.createBtn}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} aria-hidden="true" />
            {CFG.createBtn}
          </button>
        </div>

        {isMutating ? (
          <div className="p-6">
            <AssetCardSkeleton count={Math.max(1, fixedDeposits.length || 3)} />
          </div>
                ) : fixedDeposits.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="fd"
              title={CFG.noActiveText}
              description={CFG.subText}
              actionButton={
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
                >
                  <Plus size={15} aria-hidden="true" />
                  {CFG.firstBtn}
                </button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700" role="list" aria-label={`${CFG.titlePlural} list`}>
            {fixedDeposits.length > 8 ? (
              <List
                height={500}
                itemCount={fixedDeposits.length}
                itemSize={180}
                width="100%"
                itemKey={(index) => fixedDeposits[index].id}
              >
                {({ index, style }: ListChildComponentProps) => {
                  const fd = fixedDeposits[index];
                  return (
                    <div style={style} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                      <DepositDetailsCard
                        fd={fd}
                        cfg={CFG}
                        documents={documents}
                        onOpenEdit={handleOpenEdit}
                        onConfirmDelete={setConfirmDelete}
                        onUpdate={onUpdate}
                      />
                    </div>
                  );
                }}
              </List>
            ) : (
              fixedDeposits.map((fd) => (
                <DepositDetailsCard
                  key={fd.id}
                  fd={fd}
                  cfg={CFG}
                  documents={documents}
                  onOpenEdit={handleOpenEdit}
                  onConfirmDelete={setConfirmDelete}
                  onUpdate={onUpdate}
                />
              ))
            )}
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
                  {editingFd ? CFG.editTitle : CFG.createTitle}
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
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors disabled:opacity-50"
                >
                  {portfolioOptions.map((o) => (
                    <option key={o.name} value={o.name}>{o.label}</option>
                  ))}
                </select>
              </div>

              <StandardFormFields
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
                  {loading ? 'Saving...' : editingFd ? 'Save Changes' : `Create ${CFG.title}`}
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
        title={`Delete ${CFG.title}`}
        message={confirmDelete ? `Are you sure you want to delete the ${CFG.title.toLowerCase()} at "${confirmDelete.bank_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default React.memo(FixedDepositView);
