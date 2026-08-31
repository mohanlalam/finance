import React, { useState, useCallback, useMemo } from 'react';
import { FixedDeposit, DocumentMetadata, PortfolioName } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import DepositDetailsCard from './DepositDetailsCard';
import FDFormModal from './FDFormModal';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption, FilterPillOption } from '../ui/RegistryToolbar';
import { usePortfolioStatus } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';
import { getFDInvestedAmount, getFDEffectiveValue } from '../../domains/assets/fd/calculations/fdCompounding';
import { formatINR } from '../../utils/formatters';

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
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

type FDSortField = 'principal_amount' | 'interest_rate' | 'maturity_date' | 'bank_name';

const SORT_OPTIONS: SortOption<FDSortField>[] = [
  { field: 'principal_amount', label: 'Amount' },
  { field: 'interest_rate', label: 'Rate' },
  { field: 'maturity_date', label: 'Maturity' },
  { field: 'bank_name', label: 'Bank' },
];

export function FixedDepositView({
  fixedDeposits,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: FixedDepositViewProps) {
  const isMobile = useIsMobile();
  const { isMutating } = usePortfolioStatus();
  const { addToast } = useToastActions();
  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<FixedDeposit>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Search & Filter Hook
  const {
    items: filteredDeposits,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    toggleSort,
    filteredCount,
    totalCount,
  } = useAssetFilterSort<FixedDeposit, FDSortField>(fixedDeposits, {
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
        String(item.principal_amount).includes(q)
      );
    },
    sortComparators: {
      principal_amount: (a, b) => (Number(a.principal_amount) || 0) - (Number(b.principal_amount) || 0),
      interest_rate: (a, b) => (Number(a.interest_rate) || 0) - (Number(b.interest_rate) || 0),
      maturity_date: (a, b) => (a.maturity_date ?? '').localeCompare(b.maturity_date ?? ''),
      bank_name: (a, b) => (a.bank_name || '').localeCompare(b.bank_name || ''),
    },
    debounceMs: 150,
  });

  // Calculate totals
  const totals = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let activeCount = 0;
    let maturedCount = 0;

    for (const fd of fixedDeposits) {
      totalInvested += getFDInvestedAmount(fd);
      totalCurrent += getFDEffectiveValue(fd);
      if (fd.status === 'matured') {
        maturedCount++;
      } else {
        activeCount++;
      }
    }

    return { totalInvested, totalCurrent, activeCount, maturedCount };
  }, [fixedDeposits]);

  const filterPills: FilterPillOption[] = useMemo(() => [
    { id: 'all', label: 'All', count: fixedDeposits.length },
    { id: 'active', label: 'Active', count: totals.activeCount },
    { id: 'matured', label: 'Matured', count: totals.maturedCount },
  ], [fixedDeposits.length, totals.activeCount, totals.maturedCount]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await onDelete('fd', id);
      addToast('Fixed Deposit deleted successfully', 'success');
      setConfirmDeleteItem(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete Fixed Deposit', 'error');
    } finally {
      setDeleting(false);
    }
  }, [onDelete, addToast, setConfirmDeleteItem]);

  // Stats ribbon
  const statsRibbon = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-4 sm:px-6 py-3 text-xs">
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Principal Invested</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalInvested)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Current / Maturity Value</span>
        <span className="text-sm font-bold text-[var(--positive)] tnum">{formatINR(totals.totalCurrent)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Accrued Interest</span>
        <span className="text-sm font-bold text-[var(--positive)] tnum">
          +{formatINR(Math.max(0, totals.totalCurrent - totals.totalInvested))}
        </span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Active Deposits</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{totals.activeCount} Active ({totals.maturedCount} Matured)</span>
      </div>
    </div>
  );

  return (
    <div>
      <AssetRegistryContainer
        title="Fixed Deposits"
        createBtnLabel="Add FD"
        themeColor="bg-indigo-600 hover:bg-indigo-700"
        emptyType="fd"
        emptyTitle="No Fixed Deposits Added"
        emptyDescription="Keep track of your high-yield fixed deposits, interest rates, and maturity schedules."
        isLoading={isMutating}
        itemCount={fixedDeposits.length}
        onOpenAdd={openAdd}
        stats={fixedDeposits.length > 0 ? statsRibbon : undefined}
        toolbar={
          fixedDeposits.length > 0 ? (
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
        {filteredDeposits.length > 10 ? (
          <List
            height={Math.min(filteredDeposits.length * (isMobile ? 180 : 140), isMobile ? 420 : 540)}
            itemCount={filteredDeposits.length}
            itemSize={isMobile ? 180 : 140}
            width="100%"
          >
            {({ index, style }) => {
              const deposit = filteredDeposits[index];
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <DepositDetailsCard
                    deposit={deposit}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          filteredDeposits.map((deposit) => (
            <DepositDetailsCard
              key={deposit.id}
              deposit={deposit}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <FDFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingFd={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={onAdd}
        onUpdate={onUpdate}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
        title="Delete Fixed Deposit"
        message={confirmDeleteItem ? `Are you sure you want to delete the Fixed Deposit at "${confirmDeleteItem.bank_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(FixedDepositView);
