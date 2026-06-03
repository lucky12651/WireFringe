import React from 'react';
import { ActionButton } from './ActionButton';

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
  if (!visible) return null;

  const displayTitle = title || 'Delete Item';
  const displayName = itemName || item?.name || item?.title;
  const displayMessage = message || 'Are you sure you want to delete this item?';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{displayTitle}</h3>
        </div>
        <div className="modal-body">
          <p>{displayMessage}</p>
          {displayName && <p className="modal-post-title">"{displayName}"</p>}
          <p className="modal-warning">This action cannot be undone.</p>
        </div>
        <div className="modal-actions">
          <ActionButton onClick={onCancel} disabled={isDeleting}>
            Cancel
          </ActionButton>
          <ActionButton
            onClick={onConfirm}
            variant="danger"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
