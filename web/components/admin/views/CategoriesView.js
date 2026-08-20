import React, { useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { DeleteConfirmModal, SuccessToast } from '../shared';
import { TrashIcon } from '../Layout/icons';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';

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
    <div className="wp-wrap">
      <ScreenTitle title="Categories" />
      {successMessage ? <Notice type="success">{successMessage}</Notice> : null}
      {canManageUsers ? (
        <section className="postbox">
          <h2 className="hndle">Add New Category</h2>
          <div className="inside">
            <form onSubmit={handleSubmit}>
              <table className="form-table">
                <tbody>
                  <tr>
                    <th scope="row"><label htmlFor="cat-name">Name</label></th>
                    <td>
                      <input
                        id="cat-name"
                        type="text"
                        className={cn(tw.formInput, 'max-w-md')}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Technology"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              {hint ? <p className={tw.formHint}>{hint}</p> : null}
              <p className="submit">
                <button type="submit" className={tw.primaryBtn}>Add New Category</button>
              </p>
            </form>
          </div>
        </section>
      ) : null}

      <section className="postbox">
        <h2 className="hndle">Categories <span className="font-normal text-ink-secondary">({categoriesWithCounts.length})</span></h2>
        <div className="inside">
        <div className={tw.tableWrap}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th className={tw.th}>Name</th>
                <th className={tw.th}>Articles</th>
                <th className={cn(tw.th, tw.textRight)}> </th>
              </tr>
            </thead>
            <tbody>
              {categoriesWithCounts.length ? (
                categoriesWithCounts.map((cat) => (
                  <tr key={cat.id}>
                    <td className={tw.td}>
                      <span className="font-semibold text-ink">{cat.name}</span>
                    </td>
                    <td className={tw.td}>
                      <span className="font-mono text-xs text-ink-secondary">{cat.count}</span>
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
                    <EmptyState>No categories yet.</EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </section>

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
