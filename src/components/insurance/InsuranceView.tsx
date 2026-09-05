import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Insurance, DocumentMetadata, PortfolioName, InsurancePayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import InsurancePolicyCard from './InsurancePolicyCard';
import InsuranceFormModal from './InsuranceFormModal';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption, FilterPillOption } from '../ui/RegistryToolbar';
import { useIsMutating, usePortfolioEntities } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { calculateInsuranceTotals } from '../../utils/insuranceUtils';
import { formatINR } from '../../utils/formatters';
import { sortPortfolios } from '../../domains/portfolio/calculations/portfolioOrdering';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';
import { Shield } from '../icons/AppIcons';

interface PortfolioOption {
  name: string;
  label: string;
}

interface InsuranceViewProps {
  insurances: Insurance[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd: (assetType: string, portfolioName: string, payload: InsurancePayload | Record<string, unknown>) => Promise<{ id?: string; data?: { id?: string } } | void>;
  onUpdate: (assetType: string, id: string, payload: Partial<InsurancePayload> | Record<string, unknown>) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

type InsuranceSortField = 'sum_assured' | 'premium_amount' | 'renewal_date' | 'policy_name';

const SORT_OPTIONS: SortOption<InsuranceSortField>[] = [
  { field: 'sum_assured', label: 'Sum Assured' },
  { field: 'premium_amount', label: 'Premium' },
  { field: 'renewal_date', label: 'Renewal' },
  { field: 'policy_name', label: 'Name' },
];

export function InsuranceView({
  insurances,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: InsuranceViewProps) {
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
  const { portfolios } = usePortfolioEntities();

  const [selectedMember, setSelectedMember] = useState<string>(portfolioName || 'all');

  useEffect(() => {
    setSelectedMember(portfolioName || 'all');
  }, [portfolioName]);

  // Aggregate Family Insurance totals across all family members
  const familyInsuranceSummary = useMemo(() => {
    let totalSumAssured = 0;
    let totalAnnualPremium = 0;
    let activeCount = 0;
    let expiringSoonCount = 0;

    const ordered = sortPortfolios(portfolios || []);
    const memberBreakdown = ordered.map((p) => {
      const policies = p.insurances || [];
      const memberTotals = calculateInsuranceTotals(policies);

      totalSumAssured += memberTotals.totalSumAssured;
      totalAnnualPremium += memberTotals.totalAnnualPremium;
      activeCount += memberTotals.activeCount;
      expiringSoonCount += memberTotals.expiringSoonCount;

      return {
        name: p.name,
        label: p.label || p.name,
        sumAssured: memberTotals.totalSumAssured,
        annualPremium: memberTotals.totalAnnualPremium,
        activeCount: memberTotals.activeCount,
        expiringSoonCount: memberTotals.expiringSoonCount,
        count: policies.length,
      };
    });

    return {
      totalSumAssured,
      totalAnnualPremium,
      activeCount,
      expiringSoonCount,
      totalCount: insurances.length,
      memberBreakdown,
    };
  }, [portfolios, insurances.length]);

  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<Insurance>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Filter & Sort Hook
  const {
    items: filteredPolicies,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    toggleSort,
    filteredCount,
    totalCount,
  } = useAssetFilterSort<Insurance, InsuranceSortField>(insurances, {
    searchFields: ['policy_name', 'provider', 'insurance_type'],
    initialSortField: 'sum_assured',
    initialSortOrder: 'desc',
    customFilter: (item, query) => {
      const matchesCategory = activeCategory === 'all' || item.insurance_type === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        item.policy_name.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        item.insurance_type.toLowerCase().includes(q)
      );
    },
    sortComparators: {
      sum_assured: (a, b) => (Number(a.sum_assured) || 0) - (Number(b.sum_assured) || 0),
      premium_amount: (a, b) => (Number(a.premium_amount) || 0) - (Number(b.premium_amount) || 0),
      renewal_date: (a, b) => (a.renewal_date ?? '').localeCompare(b.renewal_date ?? ''),
      policy_name: (a, b) => (a.policy_name || '').localeCompare(b.policy_name || ''),
    },
    debounceMs: 150,
  });

  const displayPoliciesByMember = useMemo(() => {
    const ordered = sortPortfolios(portfolios || []);
    return ordered.map((p) => {
      const pId = p.id;
      const memberPolicies = filteredPolicies.filter(
        (ins) => ins.portfolio_id === pId || (!ins.portfolio_id && (portfolioName !== 'all' ? p.name === portfolioName : p.id === (ordered[0]?.id)))
      );
      const memberSum = memberPolicies.reduce((sum, ins) => sum + (Number(ins.sum_assured) || 0), 0);
      const memberPrem = memberPolicies.reduce((sum, ins) => sum + (Number(ins.premium_amount) || 0), 0);
      return {
        portfolio: p,
        policies: memberPolicies,
        sumAssured: memberSum,
        annualPremium: memberPrem,
      };
    });
  }, [portfolios, filteredPolicies, portfolioName]);

  const activePoliciesForMember = useMemo(() => {
    if (selectedMember === 'all') return filteredPolicies;
    const found = displayPoliciesByMember.find((item) => item.portfolio.name === selectedMember);
    return found ? found.policies : filteredPolicies;
  }, [selectedMember, filteredPolicies, displayPoliciesByMember]);

  // Category counts for pills
  const filterPills: FilterPillOption[] = useMemo(() => {
    const counts = { all: insurances.length, health: 0, term: 0, motor: 0, life: 0 };
    for (const p of insurances) {
      if (p.insurance_type in counts) {
        counts[p.insurance_type as keyof typeof counts]++;
      }
    }
    return [
      { id: 'all', label: 'All', count: counts.all },
      { id: 'health', label: 'Health', count: counts.health },
      { id: 'term', label: 'Term Life', count: counts.term },
      { id: 'motor', label: 'Motor', count: counts.motor },
      { id: 'life', label: 'Life', count: counts.life },
    ].filter((p) => p.id === 'all' || (p.count && p.count > 0));
  }, [insurances]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await onDelete('insurance', id);
      addToast('Insurance policy deleted successfully', 'success');
      setConfirmDeleteItem(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete insurance policy', 'error');
    } finally {
      setDeleting(false);
    }
  }, [onDelete, addToast, setConfirmDeleteItem]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unified Family Insurance Policies Banner */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Shield size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Total Family Insurance Policies
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 uppercase tracking-wider shrink-0">
                  Combined
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                Aggregated life, health &amp; general coverage across family vaults
              </p>
            </div>
          </div>

          {/* Right: Aggregate Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--positive)] bg-[var(--positive-soft)] px-2 py-0.5 rounded-[var(--radius-small)] tnum">
              {familyInsuranceSummary.activeCount} Active Policies
            </span>
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-[var(--radius-small)] hidden sm:inline-block tnum">
              Click member to filter
            </span>
          </div>
        </div>

        {/* Row 2: 4 Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Total Sum Assured</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {formatINR(familyInsuranceSummary.totalSumAssured)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Annual Premium Outflow</span>
            <span className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 tnum mt-0.5 block truncate">
              {formatINR(familyInsuranceSummary.totalAnnualPremium)}/yr
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Active Policies</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {familyInsuranceSummary.activeCount} Covered
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Renewals Alert</span>
            <span className={`text-xs sm:text-sm font-bold tnum mt-0.5 block truncate ${familyInsuranceSummary.expiringSoonCount > 0 ? 'text-[var(--negative)]' : 'text-[var(--positive)]'}`}>
              {familyInsuranceSummary.expiringSoonCount > 0 ? `⚠️ ${familyInsuranceSummary.expiringSoonCount} Due Soon` : '✓ All Current'}
            </span>
          </div>
        </div>

        {/* Row 3: Family Members Breakdown: 3 compact columns on mobile */}
        {familyInsuranceSummary.memberBreakdown.length > 0 && (
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
                  {familyInsuranceSummary.totalCount} Total Policies
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {familyInsuranceSummary.memberBreakdown.map((m) => {
                const config = getFamilyMemberConfig(m.name);
                const isSelected = selectedMember === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMember((prev) => (prev === m.name ? 'all' : m.name))}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 min-h-[44px] justify-center rounded-[var(--radius-small)] border transition-all cursor-pointer text-left ios-press min-w-0 ${
                      isSelected
                        ? 'bg-[var(--surface-secondary)] border-rose-500 ring-1 ring-rose-500/30 shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-rose-500/40'
                    }`}
                    title={`Click to filter ${m.label}'s insurance policies`}
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
                            <span className="hidden xs:inline text-[8px] font-bold px-1 rounded bg-rose-500/20 text-rose-700 dark:text-rose-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {m.count} polic{m.count === 1 ? 'y' : 'ies'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      {m.count === 0 ? (
                        <span className="text-xs text-[var(--text-tertiary)] font-normal block">—</span>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-rose-700 dark:text-rose-400 tnum truncate">
                            {formatINR(m.sumAssured)}
                          </p>
                          <p className="text-[10px] font-semibold text-[var(--text-secondary)] tnum truncate">
                            {formatINR(m.annualPremium)}/yr
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

      {/* Main Insurance Registry Container */}
      <AssetRegistryContainer
        title="Insurance Policies"
        createBtnLabel="Add Policy"
        themeColor="bg-rose-600 hover:bg-rose-700"
        emptyType="insurance"
        emptyTitle="No Insurance Policies Added"
        emptyDescription="Keep track of health, term life, motor, and family protection policies in one place."
        isLoading={isMutating}
        itemCount={insurances.length}
        onOpenAdd={openAdd}
        toolbar={
          insurances.length > 0 ? (
            <RegistryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search policies by name, provider, type..."
              sortOptions={SORT_OPTIONS}
              currentSortField={sortField}
              currentSortOrder={sortOrder}
              onToggleSort={toggleSort}
              filterOptions={filterPills}
              activeFilter={activeCategory}
              onFilterChange={setActiveCategory}
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
                  {portfolioOptions.find((p) => p.name === selectedMember)?.label || selectedMember}&apos;s Policies
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {activePoliciesForMember.length}
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
            {activePoliciesForMember.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)] italic">
                No insurance policies recorded for this member.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {activePoliciesForMember.map((insurance) => (
                  <InsurancePolicyCard
                    key={insurance.id}
                    policy={insurance}
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
            {displayPoliciesByMember.map((item) => {
              const config = getFamilyMemberConfig(item.portfolio.name);
              return (
                <div key={item.portfolio.name} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{item.portfolio.label}&apos;s Policies</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {item.policies.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-500 tnum">
                      Cover: {formatINR(item.sumAssured)} {item.annualPremium > 0 ? `(Prem: ${formatINR(item.annualPremium)}/yr)` : ''}
                    </span>
                  </div>

                  {item.policies.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-tertiary)] italic">
                      No insurance policies recorded for {item.portfolio.label}
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {item.policies.map((insurance) => (
                        <InsurancePolicyCard
                          key={insurance.id}
                          policy={insurance}
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

      <InsuranceFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingPolicy={editingItem}
        portfolioName={selectedMember !== 'all' ? selectedMember : (portfolioName !== 'all' ? portfolioName : (portfolios?.[0]?.name || 'personal'))}
        portfolioOptions={portfolioOptions}
        onAdd={onAdd}
        onUpdate={onUpdate}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
        title="Delete Insurance Policy"
        message={confirmDeleteItem ? `Are you sure you want to delete the policy "${confirmDeleteItem.policy_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(InsuranceView);
