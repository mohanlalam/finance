import React, { useState, useCallback, useMemo } from 'react';
import { DocumentMetadata, SIPAccount, PortfolioName, SIPPayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import SIPAccountCard from './SIPAccountCard';
import { SIPFormModal } from './SIPFormModal';
import { usePortfolioStatus, usePortfolioActions } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption } from '../ui/RegistryToolbar';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../../domains/assets/sip/calculations/sipValuation';
import { formatINR, formatPercent, pnlColor } from '../../utils/formatters';

interface PortfolioOption {
  name: string;
  label: string;
}

interface SIPViewProps {
  sipAccounts?: SIPAccount[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd?: (assetType: string, portfolioName: string, payload: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate?: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete?: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

type SIPSortField = 'current_value' | 'monthly_sip' | 'fund_name';

const SORT_OPTIONS: SortOption<SIPSortField>[] = [
  { field: 'current_value', label: 'Valuation' },
  { field: 'monthly_sip', label: 'Monthly SIP' },
  { field: 'fund_name', label: 'Fund Name' },
];

export function SIPView({
  sipAccounts: propSipAccounts = [],
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: SIPViewProps) {
  const isMobile = useIsMobile();
  const { isMutating } = usePortfolioStatus();
  const { addToast } = useToastActions();
  const { addSIPAccount, updateSIPAccount, deleteSIPAccount } = usePortfolioActions();

  const rawAccounts = propSipAccounts;

  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<SIPAccount>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);

  // Search & Filter Hook
  const {
    items: filteredAccounts,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    toggleSort,
    filteredCount,
    totalCount,
  } = useAssetFilterSort<SIPAccount, SIPSortField>(rawAccounts, {
    searchFields: ['fund_name', 'mf_scheme_code'],
    initialSortField: 'current_value',
    initialSortOrder: 'desc',
    sortComparators: {
      current_value: (a, b) => getSIPEffectiveValue(a) - getSIPEffectiveValue(b),
      monthly_sip: (a, b) => (Number(a.monthly_sip) || 0) - (Number(b.monthly_sip) || 0),
      fund_name: (a, b) => (a.fund_name || '').localeCompare(b.fund_name || ''),
    },
    debounceMs: 150,
  });

  // Calculate totals
  const totals = useMemo(() => {
    let totalMonthly = 0;
    let totalInvested = 0;
    let totalCurrent = 0;

    for (const sip of rawAccounts) {
      totalMonthly += Number(sip.monthly_sip) || 0;
      totalInvested += getSIPInvestedAmount(sip);
      totalCurrent += getSIPEffectiveValue(sip);
    }

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return { totalMonthly, totalInvested, totalCurrent, totalPnL, totalPnLPct };
  }, [rawAccounts]);

  const handleAddSIP = useCallback(
    async (targetPortfolioName: string, payload: SIPPayload) => {
      try {
        if (onAdd) {
          await onAdd('sip_account', targetPortfolioName, payload);
        } else {
          await addSIPAccount(targetPortfolioName, payload);
        }
        addToast('Mutual Fund / SIP created', 'success');
        closeModal();
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to add SIP', 'error');
      }
    },
    [onAdd, addSIPAccount, addToast, closeModal]
  );

  const handleUpdateSIP = useCallback(
    async (id: string, payload: Partial<SIPPayload>) => {
      try {
        if (onUpdate) {
          await onUpdate('sip_account', id, payload);
        } else {
          await updateSIPAccount(id, payload);
        }
        addToast('Mutual Fund / SIP updated', 'success');
        closeModal();
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to update SIP', 'error');
      }
    },
    [onUpdate, updateSIPAccount, addToast, closeModal]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteItem) return;
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete('sip_account', confirmDeleteItem.id);
      } else {
        await deleteSIPAccount(confirmDeleteItem.id);
      }
      addToast('Mutual Fund / SIP deleted', 'success');
      setConfirmDeleteItem(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete SIP', 'error');
    } finally {
      setDeleting(false);
    }
  }, [confirmDeleteItem, onDelete, deleteSIPAccount, addToast, setConfirmDeleteItem]);

  // Stats ribbon
  const statsRibbon = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-4 sm:px-6 py-3 text-xs">
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Monthly Inflow</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalMonthly)}/mo</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Total Invested</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalInvested)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Current NAV Value</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalCurrent)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Total Gain / Loss</span>
        <span className={`text-sm font-bold tnum ${pnlColor(totals.totalPnL)}`}>
          {totals.totalPnL >= 0 ? '+' : ''}{formatINR(totals.totalPnL)} ({formatPercent(totals.totalPnLPct)})
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <AssetRegistryContainer
        title="Mutual Funds & SIPs"
        createBtnLabel="Add SIP"
        themeColor="bg-[var(--accent-blue)] hover:opacity-90"
        emptyType="sip"
        emptyTitle="No Mutual Funds Added"
        emptyDescription="Track AMFI mutual fund portfolios, daily NAVs, and systematic investment schedules."
        isLoading={isMutating}
        itemCount={rawAccounts.length}
        onOpenAdd={openAdd}
        stats={rawAccounts.length > 0 ? statsRibbon : undefined}
        toolbar={
          rawAccounts.length > 0 ? (
            <RegistryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search schemes by fund name or AMFI code..."
              sortOptions={SORT_OPTIONS}
              currentSortField={sortField}
              currentSortOrder={sortOrder}
              onToggleSort={toggleSort}
              filteredCount={filteredCount}
              totalCount={totalCount}
            />
          ) : undefined
        }
      >
        {filteredAccounts.length > 10 ? (
          <List
            height={Math.min(filteredAccounts.length * (isMobile ? 180 : 140), isMobile ? 420 : 540)}
            itemCount={filteredAccounts.length}
            itemSize={isMobile ? 180 : 140}
            width="100%"
          >
            {({ index, style }) => {
              const account = filteredAccounts[index];
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <SIPAccountCard
                    account={account}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
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
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <SIPFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingAccount={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={handleAddSIP}
        onUpdate={handleUpdateSIP}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Mutual Fund"
        message={confirmDeleteItem ? `Are you sure you want to delete "${confirmDeleteItem.fund_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(SIPView);
