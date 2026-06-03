import React, { useState } from 'react';
import { ActionButton } from '../shared/ActionButton';
import { EmptyState } from '../shared/EmptyState';
import { DeleteConfirmModal, SuccessToast } from '../shared';
import { PlusIcon, TrashIcon } from '../Layout/icons';

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
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">Categories Management</h2>
        <span className="title-count-v2">{categoriesWithCounts.length} Buckets</span>
      </div>

      <div className="admin-grid-v2">
        {/* Add Category Card */}
        {canManageUsers && (
          <div className="admin-card-v2 add-category-card">
            <h3 className="card-title-v2">Create New Category</h3>
            <form onSubmit={handleSubmit} className="v2-form">
              <div className="form-group-v2">
                <label>Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Technology"
                />
              </div>
              {hint && <p className="form-hint-v2">{hint}</p>}
              <button type="submit" className="primary-btn-v2">
                <PlusIcon /> Create Category
              </button>
            </form>
          </div>
        )}

        {/* Categories List Card */}
        <div className="admin-card-v2 categories-list-card">
          <h3 className="card-title-v2">Existing Categories</h3>
          <div className="v2-table-wrapper">
            <table className="v2-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Article Count</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesWithCounts.length ? (
                  categoriesWithCounts.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <div className="category-info-cell">
                          <span className="category-name-v2">{cat.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="count-badge-v2">{cat.count} Articles</span>
                      </td>
                      <td className="text-right">
                        {canManageUsers && (
                          <button
                            className="delete-btn-v2"
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
                    <td colSpan={3}>
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
