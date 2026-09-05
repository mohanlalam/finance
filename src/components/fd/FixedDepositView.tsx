import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FixedDeposit, DocumentMetadata, PortfolioName, FDPayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import DepositDetailsCard from './DepositDetailsCard';
import FDFormModal from './FDFormModal';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption, FilterPillOption } from '../ui/RegistryToolbar';
import { useIsMutating, usePortfolioEntities } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { getFDInvestedAmount, getFDEffectiveValue } from '../../domains/assets/fd/calculations/fdCompounding';
import { formatINR } from '../../utils/formatters';
import { sortPortfolios } from '../../domains/portfolio/calculations/portfolioOrdering';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';
import { Landmark } from '../icons/AppIcons';

interface PortfolioOption {
  name: string;
  label: string;
}

interface FixedDepositViewProps {
  fixedDeposits: FixedDeposit[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd: (assetType: string, portfolioName: string, payload: FDPayload | Record<string, unknown>) => Promise<unknown>;
  onUpdate: (assetType: string, id: string, payload: Partial<FDPayload> | Record<string, unknown>) => Promise<void>;
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
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
  const { portfolios } = usePortfolioEntities();

  const [selectedMember, setSelectedMember] = useState<string>(portfolioName || 'all');

  useEffect(() => {
    setSelectedMember(portfolioName || 'all');
  }, [portfolioName]);

  // Aggregate Family FD totals across all family members
  const familyFDSummary = useMemo(() => {
    let totalPrincipal = 0;
    let totalCurrent = 0;
    let activeCount = 0;
    let maturedCount = 0;

    const ordered = sortPortfolios(portfolios || []);
    const memberBreakdown = ordered.map((p) => {
      let memberPrincipal = 0;
      let memberCurrent = 0;
      let memberActive = 0;
      let memberMatured = 0;

      const fds = (p.fixedDeposits || []).filter((f) => f.fd_type === 'regular' || !f.fd_type);
      for (const fd of fds) {
        const principal = getFDInvestedAmount(fd);
        const current = getFDEffectiveValue(fd);
        memberPrincipal += principal;
        memberCurrent += current;
        if (fd.status === 'matured') {
          memberMatured++;
        } else {
          memberActive++;
        }
      }

      totalPrincipal += memberPrincipal;
      totalCurrent += memberCurrent;
      activeCount += memberActive;
      maturedCount += memberMatured;

      return {
        name: p.name,
        label: p.label || p.name,
        principal: memberPrincipal,
        current: memberCurrent,
        activeCount: memberActive,
        maturedCount: memberMatured,
        count: fds.length,
      };
    });

    const accruedInterest = Math.max(0, totalCurrent - totalPrincipal);

    return {
      totalPrincipal,
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

  const displayDepositsByMember = useMemo(() => {
    const ordered = sortPortfolios(portfolios || []);
    return ordered.map((p) => {
      const pId = p.id;
      const memberDeposits = filteredDeposits.filter(
        (fd) => fd.portfolio_id === pId || (!fd.portfolio_id && (portfolioName !== 'all' ? p.name === portfolioName : p.id === (ordered[0]?.id)))
      );
      const memberPrincipal = memberDeposits.reduce((sum, fd) => sum + getFDInvestedAmount(fd), 0);
      const memberCurrent = memberDeposits.reduce((sum, fd) => sum + getFDEffectiveValue(fd), 0);
      return {
        portfolio: p,
        deposits: memberDeposits,
        principal: memberPrincipal,
        current: memberCurrent,
      };
    });
  }, [portfolios, filteredDeposits, portfolioName]);

  const activeDepositsForMember = useMemo(() => {
    if (selectedMember === 'all') return filteredDeposits;
    const found = displayDepositsByMember.find((item) => item.portfolio.name === selectedMember);
    return found ? found.deposits : filteredDeposits;
  }, [selectedMember, filteredDeposits, displayDepositsByMember]);

  const filterPills: FilterPillOption[] = useMemo(() => [
    { id: 'all', label: 'All', count: fixedDeposits.length },
    { id: 'active', label: 'Active', count: familyFDSummary.activeCount },
    { id: 'matured', label: 'Matured', count: familyFDSummary.maturedCount },
  ], [fixedDeposits.length, familyFDSummary.activeCount, familyFDSummary.maturedCount]);

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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unified Family Fixed Deposits Banner */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Landmark size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Total Family Fixed Deposits
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 uppercase tracking-wider shrink-0">
                  Combined
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                Aggregated term deposits across all family portfolios
              </p>
            </div>
          </div>

          {/* Right: Aggregate Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--positive)] bg-[var(--positive-soft)] px-2 py-0.5 rounded-[var(--radius-small)] tnum">
              {familyFDSummary.activeCount} Active FDs
            </span>
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-[var(--radius-small)] hidden sm:inline-block tnum">
              {fixedDeposits.length} Total Deposits &bull; Click member to filter
            </span>
          </div>
        </div>

        {/* Row 2: 4 Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Principal Invested</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] tnum mt-0.5 block truncate">
              {formatINR(familyFDSummary.totalPrincipal)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Current / Maturity Value</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--positive)] tnum mt-0.5 block truncate">
              {formatINR(familyFDSummary.totalCurrent)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Accrued Interest</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--positive)] tnum mt-0.5 block truncate">
              +{formatINR(familyFDSummary.accruedInterest)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Active Deposits</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {familyFDSummary.activeCount} Act ({familyFDSummary.maturedCount} Mat)
            </span>
          </div>
        </div>

        {/* Row 3: Family Members Breakdown: 3 compact columns on mobile */}
        {familyFDSummary.memberBreakdown.length > 0 && (
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
                  {familyFDSummary.totalCount} Total FDs
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {familyFDSummary.memberBreakdown.map((m) => {
                const config = getFamilyMemberConfig(m.name);
                const isSelected = selectedMember === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMember((prev) => (prev === m.name ? 'all' : m.name))}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 min-h-[44px] justify-center rounded-[var(--radius-small)] border transition-all cursor-pointer text-left ios-press min-w-0 ${
                      isSelected
                        ? 'bg-[var(--surface-secondary)] border-cyan-500 ring-1 ring-cyan-500/30 shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-cyan-500/40'
                    }`}
                    title={`Click to filter ${m.label}'s fixed deposits`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {m.label}
                          </p>
                          {isSelected && (
                            <span className="hidden xs:inline text-[8px] font-bold px-1 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {m.count} deposit{m.count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      {m.count === 0 ? (
                        <span className="text-xs text-[var(--text-tertiary)] font-normal block">—</span>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400 tnum truncate">
                            {formatINR(m.principal)}
                          </p>
                          <p className="text-[10px] font-semibold text-[var(--positive)] tnum truncate">
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

      {/* Main FD Registry Container */}
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
        {selectedMember !== 'all' ? (
          <div>
            <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {portfolioOptions.find((p) => p.name === selectedMember)?.label || selectedMember}&apos;s Fixed Deposits
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {activeDepositsForMember.length}
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
            {activeDepositsForMember.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)] italic">
                No fixed deposits recorded for this member.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {activeDepositsForMember.map((deposit) => (
                  <DepositDetailsCard
                    key={deposit.id}
                    deposit={deposit}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {displayDepositsByMember.map((item) => {
              const config = getFamilyMemberConfig(item.portfolio.name);
              return (
                <div key={item.portfolio.name} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{item.portfolio.label}&apos;s Fixed Deposits</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {item.deposits.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-500 tnum">
                      {formatINR(item.principal)} {item.current > item.principal ? `(Mat: ${formatINR(item.current)})` : ''}
                    </span>
                  </div>

                  {item.deposits.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-tertiary)] italic">
                      No fixed deposits recorded for {item.portfolio.label}
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {item.deposits.map((deposit) => (
                        <DepositDetailsCard
                          key={deposit.id}
                          deposit={deposit}
                          documents={documents}
                          onOpenEdit={openEdit}
                          onConfirmDelete={setConfirmDeleteItem}
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

      <FDFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingFd={editingItem}
        portfolioName={selectedMember !== 'all' ? selectedMember : (portfolioName !== 'all' ? portfolioName : (portfolios?.[0]?.name || 'personal'))}
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
