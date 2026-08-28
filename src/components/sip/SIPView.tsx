import React, { useState, useCallback, useMemo } from 'react';
import { DocumentMetadata, SIPAccount, PortfolioName, SIPPayload } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import SIPAccountCard from './SIPAccountCard';
import { SIPFormModal } from './SIPFormModal';
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

interface SIPViewProps {
  sipAccounts?: SIPAccount[];
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
  const isMobile = useIsMobile();
  const { isMutating } = usePortfolioStatus();
  const { addToast } = useToastActions();
  const { addSIPAccount, updateSIPAccount, deleteSIPAccount } = usePortfolioActions();

  const rawAccounts = propSipAccounts;

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

  const filteredAccounts = useMemo(() => {
    return rawAccounts || [];
  }, [rawAccounts]);

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
    <div>
      <AssetRegistryContainer
        title="Mutual Fund SIPs"
        createBtnLabel="Add SIP"
        themeColor="bg-[var(--positive)] hover:opacity-90"
        emptyType="sip"
        emptyTitle="No Mutual Fund SIPs"
        emptyDescription="Track systematic investment plans and live AMFI NAV valuations."
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
                  <SIPAccountCard
                    account={account}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          filteredAccounts.map((account) => (
            <SIPAccountCard
              key={account.id}
              account={account}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <SIPFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingAccount={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={handleAddSIP}
        onUpdate={handleUpdateSIP}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Mutual Fund / SIP"
        message={confirmDeleteItem ? `Are you sure you want to delete the Mutual Fund / SIP for "${confirmDeleteItem.fund_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(SIPView);
