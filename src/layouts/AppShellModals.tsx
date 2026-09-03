import React, { Suspense } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import PWAInstallBanner from '../components/PWAInstallBanner';
import type { AddHoldingPayload } from '../components/AddHoldingModal';
import type { Alert } from '../hooks/useAlerts';
import type { PortfolioTarget } from '../hooks/useModalState';

const SmartImportModal = React.lazy(() => import('../components/SmartImportModal'));
const AddHoldingModal = React.lazy(() => import('../components/AddHoldingModal'));
const AddFamilyModal = React.lazy(() => import('../components/AddFamilyModal'));
const RenamePortfolioModal = React.lazy(() => import('../components/RenamePortfolioModal'));
const ChangePinModal = React.lazy(() => import('../components/ChangePinModal'));
const MobileAlertsView = React.lazy(() => import('../components/MobileAlertsView'));

export interface AppShellModalsProps {
  showSmartImport: boolean;
  closeSmartImport: () => void;
  showAddModal: boolean;
  closeAddModal: () => void;
  handleAddHolding: (payload: AddHoldingPayload) => Promise<void>;
  portfolioOptionsForModal: { name: string; label: string }[];
  activeTab: string;
  showAddFamily: boolean;
  closeAddFamily: () => void;
  handleAddFamilySubmit: (name: string, label: string) => Promise<void>;
  renameTarget: PortfolioTarget | null;
  closeRenameModal: () => void;
  handleRenameSubmit: (portfolioId: string, newLabel: string) => Promise<void>;
  showChangePinModal: boolean;
  closeChangePinModal: () => void;
  onPinChangeSuccess: () => void;
  showMobileAlerts: boolean;
  closeMobileAlerts: () => void;
  visibleAlerts: Alert[];
  handleDismissAlert: (id: string) => void;
  handleDismissAll: () => void;
  deleteTarget: PortfolioTarget | null;
  closeDeleteModal: () => void;
  handleConfirmDeletePortfolio: () => Promise<void>;
  isDeleting: boolean;
}

export const AppShellModals = React.memo(function AppShellModals({
  showSmartImport,
  closeSmartImport,
  showAddModal,
  closeAddModal,
  handleAddHolding,
  portfolioOptionsForModal,
  activeTab,
  showAddFamily,
  closeAddFamily,
  handleAddFamilySubmit,
  renameTarget,
  closeRenameModal,
  handleRenameSubmit,
  showChangePinModal,
  closeChangePinModal,
  onPinChangeSuccess,
  showMobileAlerts,
  closeMobileAlerts,
  visibleAlerts,
  handleDismissAlert,
  handleDismissAll,
  deleteTarget,
  closeDeleteModal,
  handleConfirmDeletePortfolio,
  isDeleting,
}: AppShellModalsProps) {
  return (
    <>
      <Suspense fallback={null}>
        {showSmartImport && (
          <SmartImportModal
            isOpen={showSmartImport}
            onClose={closeSmartImport}
          />
        )}

        {showAddModal && (
          <AddHoldingModal
            onClose={closeAddModal}
            onAdd={handleAddHolding}
            portfolioOptions={portfolioOptionsForModal}
            defaultPortfolio={activeTab === 'all' ? portfolioOptionsForModal[0]?.name : activeTab}
          />
        )}

        {showAddFamily && (
          <AddFamilyModal
            isOpen={showAddFamily}
            onClose={closeAddFamily}
            onSubmit={handleAddFamilySubmit}
          />
        )}

        {renameTarget && (
          <RenamePortfolioModal
            isOpen={!!renameTarget}
            target={renameTarget}
            onClose={closeRenameModal}
            onSubmit={handleRenameSubmit}
          />
        )}

        {showChangePinModal && (
          <ChangePinModal
            onClose={closeChangePinModal}
            onSuccess={onPinChangeSuccess}
          />
        )}

        {showMobileAlerts && (
          <MobileAlertsView
            alerts={visibleAlerts}
            onClose={closeMobileAlerts}
            onDismissAlert={handleDismissAlert}
            onDismissAll={handleDismissAll}
          />
        )}
      </Suspense>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDeletePortfolio}
        title="Delete Family Member"
        message={`Are you sure you want to delete ${deleteTarget?.label} and all of their holdings, fixed deposits, and other assets? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      <PWAInstallBanner />
    </>
  );
});
