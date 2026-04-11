import React, { useState } from 'react';
import { PillButton } from '../shared/PillButton';
import { EmptyState } from '../shared/EmptyState';
import { DeleteConfirmModal, SuccessToast } from '../shared';

export function CategoriesView({
  categoriesWithCounts,
  onCreate,
  onDelete,
  canManageUsers,
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [hint, setHint] = useState('');

  // Delete confirmation state
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success toast state
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHint('');

    const name = newCategoryName.trim();
    if (!name) {
      setHint('Category name is required');
      return;
    }

    const result = await onCreate(name);
    if (result.success) {
      setNewCategoryName('');
      setHint('Created.');
    } else {
      setHint(result.error);
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    const deletedName = categoryToDelete.name;
    setIsDeleting(true);
    try {
      const result = await onDelete(categoryToDelete.id);
      if (result.success) {
        setCategoryToDelete(null);
        setSuccessMessage(`"${deletedName}" has been deleted successfully.`);
      } else {
        setHint(result.error);
        setCategoryToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setCategoryToDelete(null);
  };

  return (
    <>
      <div className="admin-title-row">
        <h2>Categories</h2>
        <div className="accent-line"></div>
      </div>

      {canManageUsers && (
        <section className="side-card">
          <div className="side-header">
            <h3>Add Category</h3>
            <span>Create new bucket</span>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              <span className="label">Category name</span>
              <input
                className="input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Lifestyle"
              />
            </label>
            <div className="row">
              <PillButton type="submit">Add category</PillButton>
              <div className="hint">{hint}</div>
            </div>
          </form>
        </section>
      )}

      <section className="side-card">
        <div className="side-header">
          <h3>Bucket Counts</h3>
          <span>{categoriesWithCounts.length}</span>
        </div>

        <div className="admin-member-grid">
          {categoriesWithCounts.map((c) => (
            <div key={c.id} className="admin-member-card">
              <div className="admin-member-top">
                <div className="admin-member-name">{c.name}</div>
                {canManageUsers && (
                  <button
                    className="pill-btn danger"
                    onClick={() => handleDeleteClick(c)}
                    title="Delete category"
                  >
                    <span className="dot" style={{ background: 'var(--danger)' }}></span>
                    Delete
                  </button>
                )}
              </div>
              <div className="admin-member-count">{c.count}</div>
              <div className="admin-member-sub">posts</div>
            </div>
          ))}
        </div>

        {!categoriesWithCounts.length && <EmptyState>No categories yet.</EmptyState>}
      </section>

      <DeleteConfirmModal
        item={categoryToDelete}
        title="Delete Category"
        itemName={categoryToDelete?.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      {successMessage && (
        <SuccessToast
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </>
  );
}
