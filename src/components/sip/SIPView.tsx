import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DocumentMetadata, SIPAccount, PortfolioName, SIPPayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import SIPAccountCard from './SIPAccountCard';
import { SIPFormModal } from './SIPFormModal';
import { useIsMutating, usePortfolioActions, usePortfolioEntities } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption } from '../ui/RegistryToolbar';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../../domains/assets/sip/calculations/sipValuation';
import { formatINR, formatPercent, pnlColor } from '../../utils/formatters';
import { sortPortfolios } from '../../domains/portfolio/calculations/portfolioOrdering';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';
import { TrendingUp } from '../icons/AppIcons';

interface PortfolioOption {
  name: string;
  label: string;
}

interface SIPViewProps {
  sipAccounts?: SIPAccount[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd?: (assetType: string, portfolioName: string, payload: SIPPayload | Record<string, unknown>) => Promise<unknown>;
  onUpdate?: (assetType: string, id: string, payload: Partial<SIPPayload> | Record<string, unknown>) => Promise<void>;
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
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
  const { addSIPAccount, updateSIPAccount, deleteSIPAccount } = usePortfolioActions();
  const { portfolios } = usePortfolioEntities();

  const [selectedMember, setSelectedMember] = useState<string>(portfolioName || 'all');

  useEffect(() => {
    setSelectedMember(portfolioName || 'all');
  }, [portfolioName]);

  const rawAccounts = propSipAccounts;

  // Aggregate Family SIP totals across all family members
  const familySIPSummary = useMemo(() => {
    let totalMonthly = 0;
    let totalInvested = 0;
    let totalCurrent = 0;

    const ordered = sortPortfolios(portfolios || []);
    const memberBreakdown = ordered.map((p) => {
      let memberMonthly = 0;
      let memberInvested = 0;
      let memberCurrent = 0;

      const accounts = p.sipAccounts || [];
      for (const sip of accounts) {
        memberMonthly += Number(sip.monthly_sip) || 0;
        memberInvested += getSIPInvestedAmount(sip);
        memberCurrent += getSIPEffectiveValue(sip);
      }

      totalMonthly += memberMonthly;
      totalInvested += memberInvested;
      totalCurrent += memberCurrent;

      const memberPnL = memberCurrent - memberInvested;
      const memberPnLPct = memberInvested > 0 ? (memberPnL / memberInvested) * 100 : 0;

      return {
        name: p.name,
        label: p.label || p.name,
        monthly: memberMonthly,
        invested: memberInvested,
        current: memberCurrent,
        pnl: memberPnL,
        pnlPct: memberPnLPct,
        count: accounts.length,
      };
    });

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalMonthly,
      totalInvested,
      totalCurrent,
      totalPnL,
      totalPnLPct,
      totalCount: rawAccounts.length,
      memberBreakdown,
    };
  }, [portfolios, rawAccounts.length]);

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

  const displayAccountsByMember = useMemo(() => {
    const ordered = sortPortfolios(portfolios || []);
    return ordered.map((p) => {
      const pId = p.id;
      const memberAccounts = filteredAccounts.filter(
        (sip) => sip.portfolio_id === pId || (!sip.portfolio_id && (portfolioName !== 'all' ? p.name === portfolioName : p.id === (ordered[0]?.id)))
      );
      const memberMonthly = memberAccounts.reduce((sum, sip) => sum + (Number(sip.monthly_sip) || 0), 0);
      const memberInvested = memberAccounts.reduce((sum, sip) => sum + getSIPInvestedAmount(sip), 0);
      const memberCurrent = memberAccounts.reduce((sum, sip) => sum + getSIPEffectiveValue(sip), 0);
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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unified Family Mutual Funds & SIPs Banner */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <TrendingUp size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Total Family Mutual Funds &amp; SIPs
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider shrink-0">
                  Combined
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                Aggregated equity &amp; debt schemes across family portfolios
              </p>
            </div>
          </div>

          {/* Right: Aggregate Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--positive)] bg-[var(--positive-soft)] px-2 py-0.5 rounded-[var(--radius-small)] tnum">
              {familySIPSummary.totalCount} Active Schemes
            </span>
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-[var(--radius-small)] hidden sm:inline-block tnum">
              {formatINR(familySIPSummary.totalMonthly)}/mo SIP &bull; Click member to filter
            </span>
          </div>
        </div>

        {/* Row 2: 4 Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Total Invested</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] tnum mt-0.5 block truncate">
              {formatINR(familySIPSummary.totalInvested)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Current Valuation</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {formatINR(familySIPSummary.totalCurrent)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Monthly SIP</span>
            <span className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-400 tnum mt-0.5 block truncate">
              {formatINR(familySIPSummary.totalMonthly)}/mo
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Overall Return</span>
            <span className={`text-xs sm:text-sm font-bold tnum mt-0.5 block truncate ${pnlColor(familySIPSummary.totalPnL)}`}>
              {familySIPSummary.totalPnL >= 0 ? '+' : ''}{formatINR(familySIPSummary.totalPnL)} ({formatPercent(familySIPSummary.totalPnLPct)})
            </span>
          </div>
        </div>

        {/* Row 3: Family Members Breakdown: 3 compact columns on mobile */}
        {familySIPSummary.memberBreakdown.length > 0 && (
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
                  {familySIPSummary.totalCount} Total Schemes
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {familySIPSummary.memberBreakdown.map((m) => {
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
                    title={`Click to filter ${m.label}'s mutual funds`}
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
                            <span className="hidden xs:inline text-[8px] font-bold px-1 rounded bg-purple-500/20 text-purple-700 dark:text-purple-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {m.count} scheme{m.count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      {m.count === 0 ? (
                        <span className="text-xs text-[var(--text-tertiary)] font-normal block">—</span>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-purple-700 dark:text-purple-400 tnum truncate">
                            {formatINR(m.monthly)}/mo
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

      {/* Main SIP Registry Container */}
      <AssetRegistryContainer
        title="Mutual Funds &amp; SIPs"
        createBtnLabel="Add SIP"
        themeColor="bg-teal-600 hover:bg-teal-700"
        emptyType="sip"
        emptyTitle="No Mutual Funds / SIPs Added"
        emptyDescription="Track AMFI mutual fund schemes, live NAV updates, and monthly systematic contributions."
        isLoading={isMutating}
        itemCount={rawAccounts.length}
        onOpenAdd={openAdd}
        toolbar={
          rawAccounts.length > 0 ? (
            <RegistryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search funds by name or scheme code..."
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
        {selectedMember !== 'all' ? (
          <div>
            <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {portfolioOptions.find((p) => p.name === selectedMember)?.label || selectedMember}&apos;s Mutual Funds
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
                No mutual funds / SIPs recorded for this member.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {activeAccountsForMember.map((sip) => (
                  <SIPAccountCard
                    key={sip.id}
                    account={sip}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={() => setConfirmDeleteItem(sip)}
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
                      <span className="text-xs font-bold text-[var(--text-primary)]">{item.portfolio.label}&apos;s Mutual Funds</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {item.accounts.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-teal-500 tnum">
                      {formatINR(item.monthly)}/mo {item.current > 0 ? `(Val: ${formatINR(item.current)})` : ''}
                    </span>
                  </div>

                  {item.accounts.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-tertiary)] italic">
                      No mutual funds recorded for {item.portfolio.label}
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {item.accounts.map((sip) => (
                        <SIPAccountCard
                          key={sip.id}
                          account={sip}
                          documents={documents}
                          onOpenEdit={openEdit}
                          onConfirmDelete={() => setConfirmDeleteItem(sip)}
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

      <SIPFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingAccount={editingItem}
        portfolioName={selectedMember !== 'all' ? selectedMember : (portfolioName !== 'all' ? portfolioName : (portfolios?.[0]?.name || 'personal'))}
        portfolioOptions={portfolioOptions}
        onAdd={handleAddSIP}
        onUpdate={handleUpdateSIP}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Mutual Fund / SIP"
        message={
          confirmDeleteItem
            ? `Are you sure you want to delete the SIP account "${confirmDeleteItem.fund_name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(SIPView);
