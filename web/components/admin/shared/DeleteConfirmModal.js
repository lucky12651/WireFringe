import React from 'react';
import { ActionButton } from './ActionButton';
import { AdminModal } from './AdminModal';
import { tw } from '../../../lib/tw';

export function DeleteConfirmModal({ 
  isOpen, 
  item, 
  title, 
  itemName, 
  message,
  onConfirm, 
  onCancel, 
  isDeleting 
}) {
  // Support both isOpen (new way) and item (old way) for visibility
  const visible = isOpen !== undefined ? isOpen : !!item;

  const displayTitle = title || 'Delete Item';
  const displayName = itemName || item?.name || item?.title;
  const displayMessage = message || 'Are you sure you want to delete this item?';

  return (
    <AdminModal open={visible} onClose={isDeleting ? undefined : onCancel}>
      <div className={tw.modalHeader}>
        <h3 className={tw.modalTitle}>{displayTitle}</h3>
      </div>
      <div className={tw.modalBody}>
        <p>{displayMessage}</p>
        {displayName && <p className="font-semibold text-ink mt-2">&quot;{displayName}&quot;</p>}
        <p className={tw.modalWarning}>This action cannot be undone.</p>
      </div>
      <div className={tw.modalActions}>
        <ActionButton size="sm" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </ActionButton>
        <ActionButton
          size="sm"
          onClick={onConfirm}
          variant="danger"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </ActionButton>
      </div>
    </AdminModal>
  );
}
