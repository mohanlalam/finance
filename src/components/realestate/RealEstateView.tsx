import React, { useState, useCallback, useMemo } from 'react';
import { RealEstate, DocumentMetadata, PortfolioName } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import RealEstateCard from './RealEstateCard';
import RealEstateFormModal from './RealEstateFormModal';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import RegistryToolbar, { SortOption } from '../ui/RegistryToolbar';
import { useIsMutating } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useAssetFilterSort } from '../../hooks/useAssetFilterSort';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';
import { calculateRealEstateTotals } from '../../utils/realEstateUtils';
import { formatINR, formatPercent, pnlColor } from '../../utils/formatters';

interface PortfolioOption {
  name: string;
  label: string;
}

interface RealEstateViewProps {
  realEstate: RealEstate[];
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

type RealEstateSortField = 'current_valuation' | 'purchase_price' | 'property_name';

const SORT_OPTIONS: SortOption<RealEstateSortField>[] = [
  { field: 'current_valuation', label: 'Value' },
  { field: 'purchase_price', label: 'Invested' },
  { field: 'property_name', label: 'Name' },
];

export function RealEstateView({
  realEstate,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: RealEstateViewProps) {
  const isMobile = useIsMobile();
  const isMutating = useIsMutating();
  const { addToast } = useToastActions();
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

  // Summary Totals
  const totals = useMemo(() => calculateRealEstateTotals(realEstate), [realEstate]);

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

  // Stats ribbon UI
  const statsRibbon = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs">
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Total Investment</span>
        <span className="text-sm font-bold text-[var(--text-secondary)] tnum">{formatINR(totals.totalInvested)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Total Value as of Date</span>
        <span className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(totals.totalValuation)}</span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Total Gain / Loss</span>
        <span className={`text-sm font-bold tnum ${pnlColor(totals.totalPnL)}`}>
          {totals.totalPnL >= 0 ? '+' : ''}{formatINR(totals.totalPnL)} ({formatPercent(totals.totalPnLPct)})
        </span>
      </div>
      <div>
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Annual Rent / Yield</span>
        <span className="text-sm font-bold text-[var(--positive)] tnum">
          {totals.totalAnnualRent > 0 ? `${formatINR(totals.totalAnnualRent)} (${formatPercent(totals.overallRentalYieldPct)})` : 'None'}
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <AssetRegistryContainer
        title="Real Estate"
        createBtnLabel="Add Property"
        themeColor="bg-[var(--accent-blue)] hover:opacity-90"
        emptyType="real_estate"
        emptyTitle="No Properties Added"
        emptyDescription="Monitor land plots, residential apartments, houses, and commercial property valuations."
        isLoading={isMutating}
        itemCount={realEstate.length}
        onOpenAdd={openAdd}
        stats={realEstate.length > 0 ? statsRibbon : undefined}
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
        {filteredProperties.length > 10 ? (
          <List
            height={Math.min(filteredProperties.length * (isMobile ? 180 : 140), isMobile ? 420 : 540)}
            itemCount={filteredProperties.length}
            itemSize={isMobile ? 180 : 140}
            width="100%"
          >
            {({ index, style }) => {
              const property = filteredProperties[index];
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <RealEstateCard
                    property={property}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          filteredProperties.map((property) => (
            <RealEstateCard
              key={property.id}
              property={property}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <RealEstateFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingProperty={editingItem}
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
        onConfirm={handleDelete}
        title="Delete Property"
        message={confirmDeleteItem ? `Are you sure you want to delete "${confirmDeleteItem.property_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(RealEstateView);
