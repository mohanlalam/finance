import React, { useState, useCallback } from 'react';
import { Insurance, DocumentMetadata, PortfolioName } from '../types/portfolio';
import ConfirmModal from './ConfirmModal';
import InsurancePolicyCard from './insurance/InsurancePolicyCard';
import InsuranceFormModal from './insurance/InsuranceFormModal';
import AssetRegistryContainer from './ui/AssetRegistryContainer';
import { usePortfolioState } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useAssetModal } from '../hooks/useAssetModal';
import { useIsMobile } from '../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';

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
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

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
  const { isMutating } = usePortfolioState();
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
      >
        {insurances.length > 10 ? (
          <List
            height={Math.min(insurances.length * (isMobile ? 165 : 135), isMobile ? 420 : 540)}
            itemCount={insurances.length}
            itemSize={isMobile ? 165 : 135}
            width="100%"
          >
            {({ index, style }) => {
              const policy = insurances[index];
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
          insurances.map((policy) => (
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
