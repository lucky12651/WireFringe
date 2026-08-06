import React, { useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { DeleteConfirmModal, SuccessToast } from '../shared';
import { PlusIcon, TrashIcon } from '../Layout/icons';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

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
    <div className={tw.adminView}>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="m-0 text-xl font-extrabold text-white tracking-tight">Categories Management</h2>
        <span className={tw.titleCount}>{categoriesWithCounts.length} Buckets</span>
      </div>

      <div className={tw.adminGrid}>
        {/* Add Category Card */}
        {canManageUsers && (
          <div className={tw.card}>
            <h3 className={tw.cardTitle}>Create New Category</h3>
            <form onSubmit={handleSubmit} className={tw.form}>
              <div className={tw.formGroup}>
                <label className={tw.formLabel}>Category Name</label>
                <input
                  type="text"
                  className={tw.formInput}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Technology"
                />
              </div>
              {hint && <p className={tw.formHint}>{hint}</p>}
              <button type="submit" className={tw.primaryBtn}>
                <PlusIcon /> Create Category
              </button>
            </form>
          </div>
        )}

        {/* Categories List Card */}
        <div className={tw.card}>
          <h3 className={tw.cardTitle}>Existing Categories</h3>
          <div className={tw.tableWrap}>
            <table className={tw.table}>
              <thead>
                <tr>
                  <th className={tw.th}>Category Name</th>
                  <th className={tw.th}>Article Count</th>
                  <th className={cn(tw.th, tw.textRight)}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesWithCounts.length ? (
                  categoriesWithCounts.map((cat) => (
                    <tr key={cat.id}>
                      <td className={tw.td}>
                        <span className="font-semibold text-white">{cat.name}</span>
                      </td>
                      <td className={tw.td}>
                        <span className="font-mono text-xs text-mint">{cat.count} Articles</span>
                      </td>
                      <td className={cn(tw.td, tw.textRight)}>
                        {canManageUsers && (
                          <button
                            className={tw.iconBtnDanger}
                            onClick={() => handleDeleteClick(cat)}
                            title="Delete category"
                          >
                            <TrashIcon size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className={tw.td}>
                      <EmptyState>No categories created yet.</EmptyState>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!categoryToDelete}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? This will NOT delete articles in this category, but they will be left without a bucket.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}
