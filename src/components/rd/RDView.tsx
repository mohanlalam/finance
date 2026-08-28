import React, { useState, useCallback, useMemo } from 'react';
import { DocumentMetadata, RDAccount, PortfolioName, RDPayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import RDAccountCard from './RDAccountCard';
import { RDFormModal } from './RDFormModal';
import { usePortfolioStatus, usePortfolioActions } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import { useAssetModal } from '../../hooks/useAssetModal';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';

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
  const { isMutating } = usePortfolioStatus();
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

  const filteredAccounts = useMemo(() => {
    return rawAccounts || [];
  }, [rawAccounts]);

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
    <div>
      <AssetRegistryContainer
        title="Recurring Deposits"
        createBtnLabel="Add RD"
        themeColor="bg-[var(--accent-blue)] hover:opacity-90"
        emptyType="rd"
        emptyTitle="No Recurring Deposits"
        emptyDescription="Track monthly systematic deposits across banks."
        isLoading={isMutating}
        itemCount={filteredAccounts.length}
        onOpenAdd={openAdd}
      >
        {filteredAccounts.length > 10 ? (
          <List
            height={Math.min(filteredAccounts.length * (isMobile ? 165 : 135), isMobile ? 420 : 540)}
            itemCount={filteredAccounts.length}
            itemSize={isMobile ? 165 : 135}
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
