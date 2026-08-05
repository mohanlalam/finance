import AddHoldingModal, { AddHoldingPayload } from '../components/AddHoldingModal';
import AddFamilyModal from '../components/AddFamilyModal';
import RenamePortfolioModal from '../components/RenamePortfolioModal';
import ConfirmModal from '../components/ConfirmModal';
import ChangePinModal from '../components/ChangePinModal';

export interface ModalManagerProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  handleAddHolding: (data: AddHoldingPayload) => Promise<void>;
  portfolioOptionsForModal: { name: string; label: string }[];
  activeTab: string;
  
  showAddFamily: boolean;
  setShowAddFamily: (show: boolean) => void;
  handleAddFamilySubmit: (label: string, name: string) => Promise<void>;
  
  renameTarget: { id: string; name: string; label: string } | null;
  setRenameTarget: (target: { id: string; name: string; label: string } | null) => void;
  handleRenameSubmit: (id: string, label: string) => Promise<void>;
  
  deleteTarget: { id: string; name: string; label: string } | null;
  setDeleteTarget: (target: { id: string; name: string; label: string } | null) => void;
  handleConfirmDeletePortfolio: () => Promise<void>;
  isDeleting: boolean;
  
  showChangePinModal: boolean;
  setShowChangePinModal: (show: boolean) => void;
  handleChangePinSuccess: () => void;
}

export default function ModalManager(props: ModalManagerProps) {
  return (
    <>
      {props.showAddModal && (
        <AddHoldingModal
          onClose={() => props.setShowAddModal(false)}
          onAdd={props.handleAddHolding}
          portfolioOptions={props.portfolioOptionsForModal}
          defaultPortfolio={props.activeTab === 'all' ? props.portfolioOptionsForModal[0]?.name : props.activeTab}
        />
      )}

      <AddFamilyModal
        isOpen={props.showAddFamily}
        onClose={() => props.setShowAddFamily(false)}
        onSubmit={props.handleAddFamilySubmit}
      />

      <RenamePortfolioModal
        isOpen={!!props.renameTarget}
        target={props.renameTarget}
        onClose={() => props.setRenameTarget(null)}
        onSubmit={props.handleRenameSubmit}
      />

      <ConfirmModal
        isOpen={!!props.deleteTarget}
        onClose={() => props.setDeleteTarget(null)}
        onConfirm={props.handleConfirmDeletePortfolio}
        title="Delete Family Member"
        message={`Are you sure you want to delete ${props.deleteTarget?.label} and all of their holdings, fixed deposits, and other assets? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={props.isDeleting}
      />

      {props.showChangePinModal && (
        <ChangePinModal
          onClose={() => props.setShowChangePinModal(false)}
          onSuccess={props.handleChangePinSuccess}
        />
      )}
    </>
  );
}
