import React, { useState } from 'react';
import { PillButton } from '../shared/PillButton';
import { EmptyState } from '../shared/EmptyState';

export function CategoriesView({
  categoriesWithCounts,
  onCreate,
  onDelete,
  canManageUsers,
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [hint, setHint] = useState('');

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

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    const result = await onDelete(id);
    if (!result.success) {
      setHint(result.error);
    }
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
                    onClick={() => handleDelete(c.id, c.name)}
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
    </>
  );
}
