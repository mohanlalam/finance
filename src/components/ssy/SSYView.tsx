import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentMetadata, SSYAccount } from '../../types/portfolio';
import { formatINR } from '../../utils/formatters';
import { getSSYInvestedAmount, getSSYEffectiveValue } from '../../utils/ssyUtils';
import { Plus, TrendingUp, Calendar, Heart } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import SSYAccountCard from './SSYAccountCard';
import { SSYFormModal } from './SSYFormModal';
import { useSSYData } from '../../hooks/useSSYData';
import { usePortfolioState } from '../../contexts/PortfolioContext';
import AssetCardSkeleton from '../AssetCardSkeleton';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

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
  const { portfolios, isMutating } = usePortfolioState();
  const {
    ssyAccounts,
    loading,
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
        <div className="rounded-2xl border p-5 flex items-center justify-between premium-card bg-purple-500/[0.04] dark:bg-purple-500/[0.03] border-purple-500/25 dark:border-purple-500/15 glow-purple">
          <div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Total SSY Invested</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalPrincipal)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Active Capital Locked</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <Heart size={20} className="text-purple-600 dark:text-purple-400" aria-hidden="true" />
          </div>
        </div>

        <div className="rounded-2xl border p-5 flex items-center justify-between premium-card bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03] border-emerald-500/25 dark:border-emerald-500/15 glow-emerald">
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Current Valuation</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalValue)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              +{formatINR(totalValue - totalPrincipal)} Interest Accrued
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
        </div>

        <div className="rounded-2xl border p-5 flex items-center justify-between premium-card bg-indigo-500/[0.04] dark:bg-indigo-500/[0.03] border-indigo-500/25 dark:border-indigo-500/15 glow-indigo">
          <div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Weighted Interest Rate</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{avgRate.toFixed(2)}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Across all SSY accounts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100/50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Registry Title and Actions */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">SSY Registry</h3>
        {filteredAccounts.length > 0 && (
          <button
            onClick={handleOpenAdd}
            aria-label="Create SSY Account"
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shadow-purple-500/10 active:scale-95"
          >
            <Plus size={14} aria-hidden="true" />
            Create SSY Account
          </button>
        )}
      </div>

      {loading || isMutating ? (
        <div className="p-2">
          <AssetCardSkeleton count={Math.max(1, filteredAccounts.length || 3)} />
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden p-16 text-center">
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
        <div className="space-y-4" role="list" aria-label="Sukanya Samriddhi Accounts list">
          {filteredAccounts.length > 8 ? (
            <List
              height={600}
              itemCount={filteredAccounts.length}
              itemSize={320}
              width="100%"
              itemKey={(index) => filteredAccounts[index].id}
            >
              {({ index, style }: ListChildComponentProps) => {
                const account = filteredAccounts[index];
                return (
                  <div style={style} className="pb-4 last:pb-0">
                    <SSYAccountCard
                      account={account}
                      documents={documents}
                      onOpenEdit={handleOpenEdit}
                      onConfirmDelete={setConfirmDelete}
                      onUpdate={updateSSYAccount}
                    />
                  </div>
                );
              }}
            </List>
          ) : (
            filteredAccounts.map((account) => (
              <SSYAccountCard
                key={account.id}
                account={account}
                documents={documents}
                onOpenEdit={handleOpenEdit}
                onConfirmDelete={setConfirmDelete}
                onUpdate={updateSSYAccount}
              />
            ))
          )}
        </div>
      )}

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
