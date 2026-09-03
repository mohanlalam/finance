import React, { useState, useCallback, useMemo } from 'react';
import { DocumentMetadata, RDAccount, PortfolioName, RDPayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import RDAccountCard from './RDAccountCard';
import { RDFormModal } from './RDFormModal';
import { useIsMutating, usePortfolioActions } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption, FilterPillOption } from '../ui/RegistryToolbar';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';
import { getRDInvestedAmount, getRDEffectiveValue } from '../../domains/assets/rd/calculations/rdCompounding';
import { formatINR } from '../../utils/formatters';

interface PortfolioOption {
  name: string;
  label: string;
}

interface RDViewProps {
  rdAccounts?: RDAccount[];
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

type RDSortField = 'monthly_deposit' | 'interest_rate' | 'maturity_date' | 'bank_name';

const SORT_OPTIONS: SortOption<RDSortField>[] = [
  { field: 'monthly_deposit', label: 'Monthly' },
  { field: 'interest_rate', label: 'Rate' },
  { field: 'maturity_date', label: 'Maturity' },
  { field: 'bank_name', label: 'Bank' },
];

export function RDView({
  rdAccounts: propRdAccounts = [],
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: RDViewProps) {
  const isMobile = useIsMobile();
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
  const { addRDAccount, updateRDAccount, deleteRDAccount } = usePortfolioActions();

  const rawAccounts = propRdAccounts;

  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<RDAccount>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

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
  } = useAssetFilterSort<RDAccount, RDSortField>(rawAccounts, {
    searchFields: ['bank_name', 'status'],
    initialSortField: 'maturity_date',
    initialSortOrder: 'asc',
    customFilter: (item, query) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'active' && item.status !== 'matured') ||
        (activeFilter === 'matured' && item.status === 'matured');
      if (!matchesFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        item.bank_name.toLowerCase().includes(q) ||
        (item.status || '').toLowerCase().includes(q) ||
        String(item.monthly_deposit).includes(q)
      );
    },
    sortComparators: {
      monthly_deposit: (a, b) => (Number(a.monthly_deposit) || 0) - (Number(b.monthly_deposit) || 0),
      interest_rate: (a, b) => (Number(a.interest_rate) || 0) - (Number(b.interest_rate) || 0),
      maturity_date: (a, b) => (a.maturity_date ?? '').localeCompare(b.maturity_date ?? ''),
      bank_name: (a, b) => (a.bank_name || '').localeCompare(b.bank_name || ''),
    },
    debounceMs: 150,
  });

  // Calculate totals
  const totals = useMemo(() => {
    let totalMonthly = 0;
    let totalInvested = 0;
    let totalCurrent = 0;
    let activeCount = 0;
    let maturedCount = 0;

    for (const rd of rawAccounts) {
      totalMonthly += Number(rd.monthly_deposit) || 0;
      totalInvested += getRDInvestedAmount(rd);
      totalCurrent += getRDEffectiveValue(rd);
      if (rd.status === 'matured') {
        maturedCount++;
      } else {
        activeCount++;
      }
    }

    return { totalMonthly, totalInvested, totalCurrent, activeCount, maturedCount };
  }, [rawAccounts]);

  const filterPills: FilterPillOption[] = useMemo(() => [
    { id: 'all', label: 'All', count: rawAccounts.length },
    { id: 'active', label: 'Active', count: totals.activeCount },
    { id: 'matured', label: 'Matured', count: totals.maturedCount },
  ], [rawAccounts.length, totals.activeCount, totals.maturedCount]);

  const handleAddRD = useCallback(
    async (targetPortfolioName: string, payload: RDPayload) => {
      try {
        if (onAdd) {
          await onAdd('rd_account', targetPortfolioName, payload);
        } else {
          await addRDAccount(targetPortfolioName, payload);
        }
        addToast('Recurring Deposit created', 'success');
        closeModal();
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to add RD', 'error');
      }
    },
    [onAdd, addRDAccount, addToast, closeModal]
  );

  const handleUpdateRD = useCallback(
    async (id: string, payload: Partial<RDPayload>) => {
      try {
        if (onUpdate) {
          await onUpdate('rd_account', id, payload);
        } else {
          await updateRDAccount(id, payload);
        }
        addToast('Recurring Deposit updated', 'success');
        closeModal();
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to update RD', 'error');
      }
    },
    [onUpdate, updateRDAccount, addToast, closeModal]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteItem) return;
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete('rd_account', confirmDeleteItem.id);
      } else {
        await deleteRDAccount(confirmDeleteItem.id);
      }
      addToast('Recurring Deposit deleted', 'success');
      setConfirmDeleteItem(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete RD', 'error');
    } finally {
      setDeleting(false);
    }
  }, [confirmDeleteItem, onDelete, deleteRDAccount, addToast, setConfirmDeleteItem]);

  // Stats ribbon
  const statsRibbon = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs">
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Monthly Deposit Outflow</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalMonthly)}/mo</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Invested to Date</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalInvested)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Current Valuation</span>
        <span className="text-sm font-bold text-[var(--positive)] tnum">{formatINR(totals.totalCurrent)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Active Accounts</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{totals.activeCount} Active ({totals.maturedCount} Matured)</span>
      </div>
    </div>
  );

  return (
    <div>
      <AssetRegistryContainer
        title="Recurring Deposits"
        createBtnLabel="Add RD"
        themeColor="bg-[var(--accent-blue)] hover:opacity-90"
        emptyType="rd"
        emptyTitle="No Recurring Deposits"
        emptyDescription="Track monthly systematic deposits across banks."
        isLoading={isMutating}
        itemCount={rawAccounts.length}
        onOpenAdd={openAdd}
        stats={rawAccounts.length > 0 ? statsRibbon : undefined}
        toolbar={
          rawAccounts.length > 0 ? (
            <RegistryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by bank name or amount..."
              sortOptions={SORT_OPTIONS}
              currentSortField={sortField}
              currentSortOrder={sortOrder}
              onToggleSort={toggleSort}
              filterOptions={filterPills}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
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
                  <RDAccountCard
                    account={account}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                    onUpdate={handleUpdateRD}
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
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
              onUpdate={handleUpdateRD}
            />
          ))
        )}
      </AssetRegistryContainer>

      <RDFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingAccount={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={handleAddRD}
        onUpdate={handleUpdateRD}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Recurring Deposit"
        message={confirmDeleteItem ? `Are you sure you want to delete the Recurring Deposit at "${confirmDeleteItem.bank_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(RDView);
