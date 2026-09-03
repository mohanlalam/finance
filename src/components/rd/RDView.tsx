import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DocumentMetadata, RDAccount, PortfolioName, RDPayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import RDAccountCard from './RDAccountCard';
import { RDFormModal } from './RDFormModal';
import { useIsMutating, usePortfolioActions, usePortfolioEntities } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption, FilterPillOption } from '../ui/RegistryToolbar';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { getRDInvestedAmount, getRDEffectiveValue } from '../../domains/assets/rd/calculations/rdCompounding';
import { formatINR } from '../../utils/formatters';
import { sortPortfolios } from '../../domains/portfolio/calculations/portfolioOrdering';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';
import { Clock } from '../icons/AppIcons';

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
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
  const { addRDAccount, updateRDAccount, deleteRDAccount } = usePortfolioActions();
  const { portfolios } = usePortfolioEntities();

  const [selectedMember, setSelectedMember] = useState<string>(portfolioName || 'all');

  useEffect(() => {
    setSelectedMember(portfolioName || 'all');
  }, [portfolioName]);

  const rawAccounts = propRdAccounts;

  // Aggregate Family RD totals across all family members
  const familyRDSummary = useMemo(() => {
    let totalMonthly = 0;
    let totalInvested = 0;
    let totalCurrent = 0;
    let activeCount = 0;
    let maturedCount = 0;

    const ordered = sortPortfolios(portfolios || []);
    const memberBreakdown = ordered.map((p) => {
      let memberMonthly = 0;
      let memberInvested = 0;
      let memberCurrent = 0;
      let memberActive = 0;
      let memberMatured = 0;

      const accounts = p.rdAccounts || [];
      for (const rd of accounts) {
        memberMonthly += Number(rd.monthly_deposit) || 0;
        memberInvested += getRDInvestedAmount(rd);
        memberCurrent += getRDEffectiveValue(rd);
        if (rd.status === 'matured') {
          memberMatured++;
        } else {
          memberActive++;
        }
      }

      totalMonthly += memberMonthly;
      totalInvested += memberInvested;
      totalCurrent += memberCurrent;
      activeCount += memberActive;
      maturedCount += memberMatured;

      return {
        name: p.name,
        label: p.label || p.name,
        monthly: memberMonthly,
        invested: memberInvested,
        current: memberCurrent,
        activeCount: memberActive,
        maturedCount: memberMatured,
        count: accounts.length,
      };
    });

    const accruedInterest = Math.max(0, totalCurrent - totalInvested);

    return {
      totalMonthly,
      totalInvested,
      totalCurrent,
      accruedInterest,
      activeCount,
      maturedCount,
      totalCount: activeCount + maturedCount,
      memberBreakdown,
    };
  }, [portfolios]);

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

  const displayAccountsByMember = useMemo(() => {
    const ordered = sortPortfolios(portfolios || []);
    return ordered.map((p) => {
      const pId = p.id;
      const memberAccounts = filteredAccounts.filter(
        (rd) => rd.portfolio_id === pId || (!rd.portfolio_id && p.name === (portfolioName === 'all' ? p.name : portfolioName))
      );
      const memberMonthly = memberAccounts.reduce((sum, rd) => sum + (Number(rd.monthly_deposit) || 0), 0);
      const memberInvested = memberAccounts.reduce((sum, rd) => sum + getRDInvestedAmount(rd), 0);
      const memberCurrent = memberAccounts.reduce((sum, rd) => sum + getRDEffectiveValue(rd), 0);
      return {
        portfolio: p,
        accounts: memberAccounts,
        monthly: memberMonthly,
        invested: memberInvested,
        current: memberCurrent,
      };
    });
  }, [portfolios, filteredAccounts, portfolioName]);

  const activeAccountsForMember = useMemo(() => {
    if (selectedMember === 'all') return filteredAccounts;
    const found = displayAccountsByMember.find((item) => item.portfolio.name === selectedMember);
    return found ? found.accounts : filteredAccounts;
  }, [selectedMember, filteredAccounts, displayAccountsByMember]);

  const filterPills: FilterPillOption[] = useMemo(() => [
    { id: 'all', label: 'All', count: rawAccounts.length },
    { id: 'active', label: 'Active', count: familyRDSummary.activeCount },
    { id: 'matured', label: 'Matured', count: familyRDSummary.maturedCount },
  ], [rawAccounts.length, familyRDSummary.activeCount, familyRDSummary.maturedCount]);

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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unified Family Recurring Deposits Banner */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-purple-500/20 text-purple-500 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Total Family Recurring Deposits
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider shrink-0">
                  Combined
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                Aggregated monthly compounding accounts across family portfolios
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: 4 Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Total Invested</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] tnum mt-0.5 block truncate">
              {formatINR(familyRDSummary.totalInvested)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Current Valuation</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--positive)] tnum mt-0.5 block truncate">
              {formatINR(familyRDSummary.totalCurrent)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Accrued Interest</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--positive)] tnum mt-0.5 block truncate">
              +{formatINR(familyRDSummary.accruedInterest)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Monthly Deposit</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {formatINR(familyRDSummary.totalMonthly)}/mo
            </span>
          </div>
        </div>

        {/* Row 3: Family Members Breakdown: 3 compact columns on mobile */}
        {familyRDSummary.memberBreakdown.length > 0 && (
          <div className="pt-1.5 sm:pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                Family Members Breakdown
              </span>
              <div className="flex items-center gap-1.5">
                {selectedMember !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedMember('all')}
                    className="text-[10px] font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {familyRDSummary.totalCount} Total RDs
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {familyRDSummary.memberBreakdown.map((m) => {
                const config = getFamilyMemberConfig(m.name);
                const isSelected = selectedMember === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMember((prev) => (prev === m.name ? 'all' : m.name))}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 min-h-[44px] justify-center rounded-[var(--radius-small)] border transition-all cursor-pointer text-left ios-press min-w-0 ${
                      isSelected
                        ? 'bg-[var(--surface-secondary)] border-purple-500 ring-1 ring-purple-500/30 shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-purple-500/40'
                    }`}
                    title={`Click to filter ${m.label}'s recurring deposits`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-[10.5px] sm:text-xs font-bold text-[var(--text-primary)] truncate">
                            {m.label}
                          </p>
                          {isSelected && (
                            <span className="hidden xs:inline text-[8px] font-bold px-1 rounded bg-purple-500/20 text-purple-700 dark:text-purple-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] sm:text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {m.count} account{m.count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      {m.count === 0 ? (
                        <span className="text-[10.5px] sm:text-xs text-[var(--text-tertiary)] font-normal block">—</span>
                      ) : (
                        <>
                          <p className="text-[10.5px] sm:text-xs font-bold text-purple-700 dark:text-purple-400 tnum truncate">
                            {formatINR(m.monthly)}/mo
                          </p>
                          <p className="text-[9.5px] sm:text-[10px] font-semibold text-[var(--positive)] tnum truncate">
                            {formatINR(m.current)}
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main RD Registry Container */}
      <AssetRegistryContainer
        title="Recurring Deposits"
        createBtnLabel="Add RD"
        themeColor="bg-purple-600 hover:bg-purple-700"
        emptyType="rd"
        emptyTitle="No Recurring Deposits Added"
        emptyDescription="Track monthly systematic deposits across banks."
        isLoading={isMutating}
        itemCount={rawAccounts.length}
        onOpenAdd={openAdd}
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
        {selectedMember !== 'all' ? (
          <div>
            <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {portfolioOptions.find((p) => p.name === selectedMember)?.label || selectedMember}&apos;s Recurring Deposits
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {activeAccountsForMember.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember('all')}
                className="text-xs text-[var(--accent-blue)] hover:underline font-semibold cursor-pointer"
              >
                Show All Family
              </button>
            </div>
            {activeAccountsForMember.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)] italic">
                No recurring deposits recorded for this member.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {activeAccountsForMember.map((rd) => (
                  <RDAccountCard
                    key={rd.id}
                    account={rd}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={() => setConfirmDeleteItem(rd)}
                    onUpdate={handleUpdateRD}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {displayAccountsByMember.map((item) => {
              const config = getFamilyMemberConfig(item.portfolio.name);
              return (
                <div key={item.portfolio.name} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{item.portfolio.label}&apos;s Recurring Deposits</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {item.accounts.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-purple-500 tnum">
                      {formatINR(item.monthly)}/mo {item.current > 0 ? `(Val: ${formatINR(item.current)})` : ''}
                    </span>
                  </div>

                  {item.accounts.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-tertiary)] italic">
                      No recurring deposits recorded for {item.portfolio.label}
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {item.accounts.map((rd) => (
                        <RDAccountCard
                          key={rd.id}
                          account={rd}
                          documents={documents}
                          onOpenEdit={openEdit}
                          onConfirmDelete={() => setConfirmDeleteItem(rd)}
                          onUpdate={handleUpdateRD}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AssetRegistryContainer>

      <RDFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingAccount={editingItem}
        portfolioName={selectedMember !== 'all' ? selectedMember : (portfolioName !== 'all' ? portfolioName : (portfolios?.[0]?.name || 'personal'))}
        portfolioOptions={portfolioOptions}
        onAdd={handleAddRD}
        onUpdate={handleUpdateRD}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Recurring Deposit"
        message={
          confirmDeleteItem
            ? `Are you sure you want to delete the RD account at "${confirmDeleteItem.bank_name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(RDView);
