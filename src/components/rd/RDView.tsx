import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentMetadata, RDAccount } from '../../types/portfolio';
import { formatINR } from '../../utils/formatters';
import { getRDInvestedAmount, getRDEffectiveValue } from '../../utils/rdUtils';
import { Plus, TrendingUp, Calendar, Clock } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import RDAccountCard from './RDAccountCard';
import { RDFormModal } from './RDFormModal';
import { useRDData } from '../../hooks/useRDData';
import { usePortfolioState } from '../../contexts/PortfolioContext';
import AssetCardSkeleton from '../AssetCardSkeleton';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface PortfolioOption {
  name: string;
  label: string;
}

interface RDViewProps {
  documents: DocumentMetadata[];
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  autoOpenAddModal?: boolean;
}

export function RDView({
  documents,
  portfolioName,
  portfolioOptions,
  autoOpenAddModal,
}: RDViewProps) {
  const { portfolios, isMutating } = usePortfolioState();
  const {
    rdAccounts,
    loading,
    addRDAccount,
    updateRDAccount,
    deleteRDAccount,
  } = useRDData();

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<RDAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RDAccount | null>(null);

  const activePortfolio = useMemo(() => {
    if (portfolioName === 'all') return null;
    return portfolios.find((p) => p.name === portfolioName) ?? null;
  }, [portfolios, portfolioName]);

  const filteredAccounts = useMemo(() => {
    if (portfolioName === 'all') return rdAccounts;
    if (!activePortfolio) return [];
    return rdAccounts.filter((r) => r.portfolio_id === activePortfolio.id);
  }, [rdAccounts, portfolioName, activePortfolio]);

  const totalPrincipal = useMemo(() => {
    return filteredAccounts.reduce((s, acc) => s + getRDInvestedAmount(acc), 0);
  }, [filteredAccounts]);

  const totalValue = useMemo(() => {
    return filteredAccounts.reduce((s, acc) => s + getRDEffectiveValue(acc), 0);
  }, [filteredAccounts]);

  const avgRate = useMemo(() => {
    if (filteredAccounts.length === 0) return 0;
    const totalPrincipalForWeight = filteredAccounts.reduce((s, acc) => s + getRDInvestedAmount(acc), 0);
    if (totalPrincipalForWeight > 0) {
      return (
        filteredAccounts.reduce((s, acc) => s + Number(acc.interest_rate) * getRDInvestedAmount(acc), 0) /
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

  const handleOpenEdit = useCallback((account: RDAccount) => {
    setEditingAccount(account);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteRDAccount(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Deletion failed');
      } finally {
        setConfirmDelete(null);
      }
    },
    [deleteRDAccount]
  );

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="RD summary metrics">
        <div className="bg-gradient-to-tr from-pink-600 to-rose-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-white/80 font-semibold uppercase tracking-wider">Total RD Invested</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalPrincipal)}</p>
            <p className="text-xs text-white/70 mt-2">Active Capital Invested</p>
          </div>
          <Clock size={40} className="opacity-20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Current Valuation</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalValue)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              +{formatINR(totalValue - totalPrincipal)} Interest Accrued
            </p>
          </div>
          <TrendingUp size={40} className="text-emerald-500/25 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Weighted Interest Rate</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{avgRate.toFixed(2)}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Across all RD accounts</p>
          </div>
          <Calendar size={40} className="text-pink-500/20 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Grid/List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">RD Registry</h3>
          <button
            onClick={handleOpenAdd}
            aria-label="Create RD Account"
            className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} aria-hidden="true" />
            Create RD Account
          </button>
        </div>

        {loading || isMutating ? (
          <div className="p-6">
            <AssetCardSkeleton count={Math.max(1, filteredAccounts.length || 3)} />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-950/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Clock size={36} className="text-pink-400 dark:text-pink-500" aria-hidden="true" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1.5">No Recurring Deposits Yet</h4>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs mx-auto">
              Start tracking your RDs to monitor recurring timelines and interest accrual.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-pink-500/20"
            >
              <Plus size={15} aria-hidden="true" />
              Create Your First RD
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700" role="list" aria-label="Recurring Deposits list">
            {filteredAccounts.length > 8 ? (
              <List
                height={500}
                itemCount={filteredAccounts.length}
                itemSize={240}
                width="100%"
              >
                {({ index, style }: ListChildComponentProps) => {
                  const account = filteredAccounts[index];
                  return (
                    <div style={style} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                      <RDAccountCard
                        account={account}
                        documents={documents}
                        onOpenEdit={handleOpenEdit}
                        onConfirmDelete={setConfirmDelete}
                        onUpdate={updateRDAccount}
                      />
                    </div>
                  );
                }}
              </List>
            ) : (
              filteredAccounts.map((account) => (
                <RDAccountCard
                  key={account.id}
                  account={account}
                  documents={documents}
                  onOpenEdit={handleOpenEdit}
                  onConfirmDelete={setConfirmDelete}
                  onUpdate={updateRDAccount}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <RDFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingAccount={editingAccount}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={addRDAccount}
        onUpdate={updateRDAccount}
      />

      {/* Confirm delete dialog */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void handleDelete(confirmDelete.id); }}
        title="Delete Recurring Deposit"
        message={confirmDelete ? `Are you sure you want to delete the Recurring Deposit at "${confirmDelete.bank_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default React.memo(RDView);
