import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentMetadata, SSYAccount } from '../../types/portfolio';
import { formatINR } from '../../utils/formatters';
import { getSSYInvestedAmount, getSSYEffectiveValue } from '../../utils/ssyUtils';
import { Plus, TrendingUp, Calendar, Heart } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import SSYAccountCard from './SSYAccountCard';
import { SSYFormModal } from './SSYFormModal';
import { useSSYData } from '../../hooks/useSSYData';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface PortfolioOption {
  name: string;
  label: string;
}

interface SSYViewProps {
  documents: DocumentMetadata[];
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  autoOpenAddModal?: boolean;
}

export function SSYView({
  documents,
  portfolioName,
  portfolioOptions,
  autoOpenAddModal,
}: SSYViewProps) {
  const { portfolios } = usePortfolio();
  const {
    ssyAccounts,
    addSSYAccount,
    updateSSYAccount,
    deleteSSYAccount,
  } = useSSYData();

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SSYAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SSYAccount | null>(null);

  const activePortfolio = useMemo(() => {
    if (portfolioName === 'all') return null;
    return portfolios.find((p) => p.name === portfolioName) ?? null;
  }, [portfolios, portfolioName]);

  const filteredAccounts = useMemo(() => {
    if (portfolioName === 'all') return ssyAccounts;
    if (!activePortfolio) return [];
    return ssyAccounts.filter((s) => s.portfolio_id === activePortfolio.id);
  }, [ssyAccounts, portfolioName, activePortfolio]);

  const totalPrincipal = useMemo(() => {
    return filteredAccounts.reduce((s, acc) => s + getSSYInvestedAmount(acc), 0);
  }, [filteredAccounts]);

  const totalValue = useMemo(() => {
    return filteredAccounts.reduce((s, acc) => s + getSSYEffectiveValue(acc), 0);
  }, [filteredAccounts]);



  const avgRate = useMemo(() => {
    if (filteredAccounts.length === 0) return 0;
    const totalPrincipalForWeight = filteredAccounts.reduce((s, acc) => s + getSSYInvestedAmount(acc), 0);
    if (totalPrincipalForWeight > 0) {
      return (
        filteredAccounts.reduce((s, acc) => s + Number(acc.interest_rate) * getSSYInvestedAmount(acc), 0) /
        totalPrincipalForWeight
      );
    }
    return (
      filteredAccounts.reduce((s, acc) => s + Number(acc.interest_rate), 0) / filteredAccounts.length
    );
  }, [filteredAccounts]);

  const handleOpenAdd = useCallback(() => {
    setEditingAccount(null);
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (autoOpenAddModal) {
      handleOpenAdd();
    }
  }, [autoOpenAddModal, handleOpenAdd]);

  const handleOpenEdit = useCallback((account: SSYAccount) => {
    setEditingAccount(account);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSSYAccount(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Deletion failed');
      } finally {
        setConfirmDelete(null);
      }
    },
    [deleteSSYAccount]
  );

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="SSY summary metrics">
        <div className="bg-gradient-to-tr from-purple-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-white/80 font-semibold uppercase tracking-wider">Total SSY Invested</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalPrincipal)}</p>
            <p className="text-xs text-white/70 mt-2">Active Capital Locked</p>
          </div>
          <Heart size={40} className="opacity-20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Current Valuation</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalValue)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              +{formatINR(totalValue - totalPrincipal)} Interest Accrued
            </p>
          </div>
          <TrendingUp size={40} className="text-emerald-500/20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Weighted Interest Rate</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{avgRate.toFixed(2)}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Across all SSY accounts</p>
          </div>
          <Calendar size={40} className="text-purple-500/20 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Grid/List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">SSY Registry</h3>
          <button
            onClick={handleOpenAdd}
            aria-label="Create SSY Account"
            className="flex items-center gap-1.5 bg-purple-650 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} aria-hidden="true" />
            Create SSY Account
          </button>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-950/30 dark:to-fuchsia-950/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Heart size={36} className="text-purple-400 dark:text-purple-500" aria-hidden="true" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1.5">No SSY Accounts Yet</h4>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs mx-auto">
              Start tracking your SSY accounts to monitor maturity timelines and interest accrual.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-purple-500/20"
            >
              <Plus size={15} aria-hidden="true" />
              Create Your First SSY
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700" role="list" aria-label="Sukanya Samriddhi Accounts list">
            {filteredAccounts.map((account) => (
              <SSYAccountCard
                key={account.id}
                account={account}
                documents={documents}
                onOpenEdit={handleOpenEdit}
                onConfirmDelete={setConfirmDelete}
                onUpdate={updateSSYAccount}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <SSYFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingAccount={editingAccount}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={addSSYAccount}
        onUpdate={updateSSYAccount}
      />

      {/* Confirm delete dialog */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void handleDelete(confirmDelete.id); }}
        title="Delete SSY Account"
        message={confirmDelete ? `Are you sure you want to delete the SSY account at "${confirmDelete.bank_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default React.memo(SSYView);
