import { useState, useCallback, useEffect } from 'react';

export interface UseAssetModalReturn<T> {
  showModal: boolean;
  editingItem: T | null;
  confirmDeleteItem: T | null;
  openAdd: () => void;
  openEdit: (item: T) => void;
  closeModal: () => void;
  setConfirmDeleteItem: (item: T | null) => void;
  closeDelete: () => void;
}

/**
 * Reusable hook encapsulating modal visibility, active item editing target,
 * delete confirmation target, and auto-open behavior for asset registry views.
 */
export function useAssetModal<T>(autoOpenAddModal?: boolean): UseAssetModalReturn<T> {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<T | null>(null);

  const openAdd = useCallback(() => {
    setEditingItem(null);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditingItem(item);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const closeDelete = useCallback(() => {
    setConfirmDeleteItem(null);
  }, []);

  useEffect(() => {
    if (autoOpenAddModal) {
      openAdd();
    }
  }, [autoOpenAddModal, openAdd]);

  return {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
    closeDelete,
  };
}

export default useAssetModal;
