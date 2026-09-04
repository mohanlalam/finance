import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { RealEstate, DocumentMetadata, PortfolioName, RealEstatePayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import RealEstateCard from './RealEstateCard';
import RealEstateFormModal from './RealEstateFormModal';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption } from '../ui/RegistryToolbar';
import { useIsMutating, usePortfolioEntities } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { formatINR, formatPercent, pnlColor } from '../../utils/formatters';
import { sortPortfolios } from '../../domains/portfolio/calculations/portfolioOrdering';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';
import { Building2 } from '../icons/AppIcons';

interface PortfolioOption {
  name: string;
  label: string;
}

interface RealEstateViewProps {
  realEstate?: RealEstate[];
  properties?: RealEstate[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd: (assetType: string, portfolioName: string, payload: RealEstatePayload | Record<string, unknown>) => Promise<{ id?: string; data?: { id?: string } } | void>;
  onUpdate: (assetType: string, id: string, payload: Partial<RealEstatePayload> | Record<string, unknown>) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

type RealEstateSortField = 'current_valuation' | 'purchase_price' | 'property_name';

const SORT_OPTIONS: SortOption<RealEstateSortField>[] = [
  { field: 'current_valuation', label: 'Value' },
  { field: 'purchase_price', label: 'Invested' },
  { field: 'property_name', label: 'Name' },
];

export function RealEstateView({
  realEstate: propRealEstate,
  properties: propProperties,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: RealEstateViewProps) {
  const realEstate = useMemo(() => propRealEstate || propProperties || [], [propRealEstate, propProperties]);
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
  const { portfolios } = usePortfolioEntities();

  const [selectedMember, setSelectedMember] = useState<string>(portfolioName || 'all');

  useEffect(() => {
    setSelectedMember(portfolioName || 'all');
  }, [portfolioName]);

  // Aggregate Family Real Estate totals across all family members
  const familyRealEstateSummary = useMemo(() => {
    let totalInvested = 0;
    let totalValuation = 0;
    let totalProperties = 0;

    const ordered = sortPortfolios(portfolios || []);
    const memberBreakdown = ordered.map((p) => {
      let memberInvested = 0;
      let memberValuation = 0;

      const properties = p.realEstate || [];
      for (const re of properties) {
        memberInvested += Number(re.purchase_price) || 0;
        memberValuation += Number(re.current_valuation) || 0;
      }

      totalInvested += memberInvested;
      totalValuation += memberValuation;
      totalProperties += properties.length;

      const memberPnL = memberValuation - memberInvested;
      const memberPnLPct = memberInvested > 0 ? (memberPnL / memberInvested) * 100 : 0;

      return {
        name: p.name,
        label: p.label || p.name,
        invested: memberInvested,
        valuation: memberValuation,
        pnl: memberPnL,
        pnlPct: memberPnLPct,
        count: properties.length,
      };
    });

    const totalPnL = totalValuation - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalValuation,
      totalPnL,
      totalPnLPct,
      totalProperties,
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
  } = useAssetModal<RealEstate>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);

  // Search & Sorting hook
  const {
    items: filteredProperties,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    toggleSort,
    filteredCount,
    totalCount,
  } = useAssetFilterSort<RealEstate, RealEstateSortField>(realEstate, {
    searchFields: ['property_name', 'location', 'property_type'],
    initialSortField: 'current_valuation',
    initialSortOrder: 'desc',
    sortComparators: {
      current_valuation: (a, b) => (Number(a.current_valuation) || 0) - (Number(b.current_valuation) || 0),
      purchase_price: (a, b) => (Number(a.purchase_price) || 0) - (Number(b.purchase_price) || 0),
      property_name: (a, b) => (a.property_name || '').localeCompare(b.property_name || ''),
    },
    debounceMs: 150,
  });

  const displayPropertiesByMember = useMemo(() => {
    const ordered = sortPortfolios(portfolios || []);
    return ordered.map((p) => {
      const pId = p.id;
      const memberProperties = filteredProperties.filter(
        (re) => re.portfolio_id === pId || (!re.portfolio_id && p.name === (portfolioName === 'all' ? p.name : portfolioName))
      );
      const memberInvested = memberProperties.reduce((sum, re) => sum + (Number(re.purchase_price) || 0), 0);
      const memberValuation = memberProperties.reduce((sum, re) => sum + (Number(re.current_valuation) || 0), 0);
      return {
        portfolio: p,
        properties: memberProperties,
        invested: memberInvested,
        valuation: memberValuation,
      };
    });
  }, [portfolios, filteredProperties, portfolioName]);

  const activePropertiesForMember = useMemo(() => {
    if (selectedMember === 'all') return filteredProperties;
    const found = displayPropertiesByMember.find((item) => item.portfolio.name === selectedMember);
    return found ? found.properties : filteredProperties;
  }, [selectedMember, filteredProperties, displayPropertiesByMember]);

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteItem) return;
    setDeleting(true);
    try {
      await onDelete('real_estate', confirmDeleteItem.id);
      addToast('Property removed', 'success');
      setConfirmDeleteItem(null);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to delete property', 'error');
    } finally {
      setDeleting(false);
    }
  }, [confirmDeleteItem, onDelete, addToast, setConfirmDeleteItem]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unified Family Real Estate Banner */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Building2 size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Total Family Real Estate
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                  Combined
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                Aggregated land, residential &amp; commercial properties
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: 4 Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Total Investment</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] tnum mt-0.5 block truncate">
              {formatINR(familyRealEstateSummary.totalInvested)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Current Valuation</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {formatINR(familyRealEstateSummary.totalValuation)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Total Properties</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {familyRealEstateSummary.totalProperties} Properties
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Overall Appreciation</span>
            <span className={`text-xs sm:text-sm font-bold tnum mt-0.5 block truncate ${pnlColor(familyRealEstateSummary.totalPnL)}`}>
              {familyRealEstateSummary.totalPnL >= 0 ? '+' : ''}{formatINR(familyRealEstateSummary.totalPnL)} ({formatPercent(familyRealEstateSummary.totalPnLPct)})
            </span>
          </div>
        </div>

        {/* Row 3: Family Members Breakdown: 3 compact columns on mobile */}
        {familyRealEstateSummary.memberBreakdown.length > 0 && (
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
                  {familyRealEstateSummary.totalProperties} Total Properties
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {familyRealEstateSummary.memberBreakdown.map((m) => {
                const config = getFamilyMemberConfig(m.name);
                const isSelected = selectedMember === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMember((prev) => (prev === m.name ? 'all' : m.name))}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 min-h-[44px] justify-center rounded-[var(--radius-small)] border transition-all cursor-pointer text-left ios-press min-w-0 ${
                      isSelected
                        ? 'bg-[var(--surface-secondary)] border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-emerald-500/40'
                    }`}
                    title={`Click to filter ${m.label}'s properties`}
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
                            <span className="hidden xs:inline text-[8px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] sm:text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {m.count} propert{m.count === 1 ? 'y' : 'ies'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      {m.count === 0 ? (
                        <span className="text-[10.5px] sm:text-xs text-[var(--text-tertiary)] font-normal block">—</span>
                      ) : (
                        <>
                          <p className="text-[10.5px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 tnum truncate">
                            {formatINR(m.valuation)}
                          </p>
                          <p className="text-[9.5px] sm:text-[10px] font-semibold text-[var(--text-secondary)] tnum truncate">
                            Inv: {formatINR(m.invested)}
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

      {/* Main Real Estate Registry Container */}
      <AssetRegistryContainer
        title="Real Estate"
        createBtnLabel="Add Property"
        themeColor="bg-emerald-600 hover:bg-emerald-700"
        emptyType="real_estate"
        emptyTitle="No Properties Added"
        emptyDescription="Monitor land plots, residential apartments, houses, and commercial property valuations."
        isLoading={isMutating}
        itemCount={realEstate.length}
        onOpenAdd={openAdd}
        toolbar={
          realEstate.length > 0 ? (
            <RegistryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search properties by name, location, type..."
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
                  {portfolioOptions.find((p) => p.name === selectedMember)?.label || selectedMember}&apos;s Properties
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {activePropertiesForMember.length}
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
            {activePropertiesForMember.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)] italic">
                No real estate properties recorded for this member.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {activePropertiesForMember.map((prop) => (
                  <RealEstateCard
                    key={prop.id}
                    property={prop}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={() => setConfirmDeleteItem(prop)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {displayPropertiesByMember.map((item) => {
              const config = getFamilyMemberConfig(item.portfolio.name);
              return (
                <div key={item.portfolio.name} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{item.portfolio.label}&apos;s Real Estate</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {item.properties.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 tnum">
                      {formatINR(item.valuation)} {item.invested > 0 ? `(Inv: ${formatINR(item.invested)})` : ''}
                    </span>
                  </div>

                  {item.properties.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[var(--text-tertiary)] italic">
                      No real estate properties recorded for {item.portfolio.label}
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {item.properties.map((prop) => (
                        <RealEstateCard
                          key={prop.id}
                          property={prop}
                          documents={documents}
                          onOpenEdit={openEdit}
                          onConfirmDelete={() => setConfirmDeleteItem(prop)}
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

      <RealEstateFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingProperty={editingItem}
        portfolioName={selectedMember !== 'all' ? selectedMember : (portfolioName !== 'all' ? portfolioName : (portfolios?.[0]?.name || 'personal'))}
        portfolioOptions={portfolioOptions}
        onAdd={onAdd}
        onUpdate={onUpdate}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Property"
        message={
          confirmDeleteItem
            ? `Are you sure you want to delete the property "${confirmDeleteItem.property_name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(RealEstateView);
