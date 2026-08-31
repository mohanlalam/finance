import React, { useState, useCallback, useMemo } from 'react';
import { Insurance, DocumentMetadata, PortfolioName } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import InsurancePolicyCard from './InsurancePolicyCard';
import InsuranceFormModal from './InsuranceFormModal';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption, FilterPillOption } from '../ui/RegistryToolbar';
import { usePortfolioStatus } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';
import { calculateInsuranceTotals } from '../../utils/insuranceUtils';
import { formatINR } from '../../utils/formatters';

interface PortfolioOption {
  name: string;
  label: string;
}

interface InsuranceViewProps {
  insurances: Insurance[];
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

  // Summary Totals
  const totals = useMemo(() => calculateInsuranceTotals(insurances), [insurances]);

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

  // Stats ribbon UI
  const statsRibbon = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-4 sm:px-6 py-3 text-xs">
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Total Sum Assured</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalSumAssured)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Annual Premium Outflow</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalAnnualPremium)}/yr</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Active Policies</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{totals.activeCount} Covered</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Renewals Alert</span>
        <span className={`text-sm font-bold tnum ${totals.expiringSoonCount > 0 ? 'text-[var(--negative)]' : 'text-[var(--positive)]'}`}>
          {totals.expiringSoonCount > 0 ? `⚠️ ${totals.expiringSoonCount} Due Soon` : '✓ All Up to date'}
        </span>
      </div>
    </div>
  );

  return (
    <div>
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
        stats={insurances.length > 0 ? statsRibbon : undefined}
        toolbar={
          insurances.length > 0 ? (
            <RegistryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search policies by name, insurer, type..."
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
        {filteredPolicies.length > 10 ? (
          <List
            height={Math.min(filteredPolicies.length * (isMobile ? 180 : 140), isMobile ? 420 : 540)}
            itemCount={filteredPolicies.length}
            itemSize={isMobile ? 180 : 140}
            width="100%"
          >
            {({ index, style }) => {
              const policy = filteredPolicies[index];
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <InsurancePolicyCard
                    policy={policy}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          filteredPolicies.map((policy) => (
            <InsurancePolicyCard
              key={policy.id}
              policy={policy}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <InsuranceFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingPolicy={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        documents={documents}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDeleteDoc={onDelete}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
        title="Delete Insurance Policy"
        message={confirmDeleteItem ? `Are you sure you want to delete "${confirmDeleteItem.policy_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(InsuranceView);
