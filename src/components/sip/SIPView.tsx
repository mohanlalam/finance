import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentMetadata, SIPAccount } from '../../types/portfolio';
import { formatINR } from '../../utils/formatters';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../../utils/sipUtils';
import { Plus, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import EmptyState from '../EmptyState';
import SIPAccountCard from './SIPAccountCard';
import { SIPFormModal } from './SIPFormModal';
import { useSIPData } from '../../hooks/useSIPData';
import { usePortfolioState } from '../../contexts/PortfolioContext';
import { useToast } from '../../contexts/ToastContext';
import AssetCardSkeleton from '../AssetCardSkeleton';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface PortfolioOption {
  name: string;
  label: string;
}

interface SIPViewProps {
  documents: DocumentMetadata[];
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  autoOpenAddModal?: boolean;
}

export function SIPView({
  documents,
  portfolioName,
  portfolioOptions,
  autoOpenAddModal,
}: SIPViewProps) {
  const { portfolios, isMutating } = usePortfolioState();
  const { addToast } = useToast();
  const {
    sipAccounts,
    loading,
    addSIPAccount,
    updateSIPAccount,
    deleteSIPAccount,
  } = useSIPData();

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SIPAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SIPAccount | null>(null);

  const activePortfolio = useMemo(() => {
    if (portfolioName === 'all') return null;
    return portfolios.find((p) => p.name === portfolioName) ?? null;
  }, [portfolios, portfolioName]);

  const filteredAccounts = useMemo(() => {
    if (portfolioName === 'all') return sipAccounts;
    if (!activePortfolio) return [];
    return sipAccounts.filter((s) => s.portfolio_id === activePortfolio.id);
  }, [sipAccounts, portfolioName, activePortfolio]);

  const totalPrincipal = useMemo(() => {
    return filteredAccounts.reduce((s, acc) => s + getSIPInvestedAmount(acc), 0);
  }, [filteredAccounts]);

  const totalValue = useMemo(() => {
    return filteredAccounts.reduce((s, acc) => s + getSIPEffectiveValue(acc), 0);
  }, [filteredAccounts]);

  const avgRate = useMemo(() => {
    if (filteredAccounts.length === 0) return 0;
    const totalPrincipalForWeight = filteredAccounts.reduce((s, acc) => s + getSIPInvestedAmount(acc), 0);
    if (totalPrincipalForWeight > 0) {
      return (
        filteredAccounts.reduce((s, acc) => s + Number(acc.expected_cagr) * getSIPInvestedAmount(acc), 0) /
        totalPrincipalForWeight
      );
    }
    return (
      filteredAccounts.reduce((s, acc) => s + Number(acc.expected_cagr), 0) / filteredAccounts.length
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

  const handleOpenEdit = useCallback((account: SIPAccount) => {
    setEditingAccount(account);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSIPAccount(id);
        addToast('Mutual Fund / SIP account deleted successfully', 'success');
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Deletion failed', 'error');
      } finally {
        setConfirmDelete(null);
      }
    },
    [deleteSIPAccount, addToast]
  );

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="SIP summary metrics">
        <div className="bg-gradient-to-tr from-sky-600 to-cyan-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-white/80 font-semibold uppercase tracking-wider">Total SIP Invested</p>
            <p className="text-2xl font-bold mt-1">{formatINR(totalPrincipal)}</p>
            <p className="text-xs text-white/70 mt-2">Est. Contributions Paid</p>
          </div>
          <ArrowUpRight size={40} className="opacity-20 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Portfolio Value</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(totalValue)}</p>
            <p className={`text-xs font-medium mt-2 ${totalValue >= totalPrincipal ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {totalValue >= totalPrincipal ? '+' : ''}{formatINR(totalValue - totalPrincipal)} Gains
            </p>
          </div>
          <TrendingUp size={40} className="text-emerald-500/25 shrink-0" aria-hidden="true" />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Expected CAGR</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{avgRate.toFixed(2)}%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Weighted target cagr</p>
          </div>
          <Calendar size={40} className="text-sky-500/20 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Grid/List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">SIP Registry</h3>
          <button
            onClick={handleOpenAdd}
            aria-label="Create SIP Account"
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} aria-hidden="true" />
            Create SIP
          </button>
        </div>

        {loading || isMutating ? (
          <div className="p-6">
            <AssetCardSkeleton count={Math.max(1, filteredAccounts.length || 3)} />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="sip"
              title="No Mutual Funds / SIPs Yet"
              description="Start tracking your SIPs to monitor fund growth, total investment, and live valuation."
              actionButton={
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-sky-500/20"
                >
                  <Plus size={15} aria-hidden="true" />
                  Create Your First SIP
                </button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700" role="list" aria-label="SIP Mutual Funds list">
            {filteredAccounts.length > 8 ? (
              <List
                height={500}
                itemCount={filteredAccounts.length}
                itemSize={130}
                width="100%"
                itemKey={(index) => filteredAccounts[index].id}
              >
                {({ index, style }: ListChildComponentProps) => {
                  const account = filteredAccounts[index];
                  return (
                    <div style={style} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                      <SIPAccountCard
                        account={account}
                        documents={documents}
                        onOpenEdit={handleOpenEdit}
                        onConfirmDelete={setConfirmDelete}
                      />
                    </div>
                  );
                }}
              </List>
            ) : (
              filteredAccounts.map((account) => (
                <SIPAccountCard
                  key={account.id}
                  account={account}
                  documents={documents}
                  onOpenEdit={handleOpenEdit}
                  onConfirmDelete={setConfirmDelete}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <SIPFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingAccount={editingAccount}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={addSIPAccount}
        onUpdate={updateSIPAccount}
      />

      {/* Confirm delete dialog */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void handleDelete(confirmDelete.id); }}
        title="Delete Mutual Fund / SIP"
        message={confirmDelete ? `Are you sure you want to delete the Mutual Fund / SIP for "${confirmDelete.fund_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default React.memo(SIPView);
