import React, { useState } from 'react';
import { ROLES } from '../../../lib/constants';
import { PillButton } from '../shared/PillButton';
import { EmptyState } from '../shared/EmptyState';

export function UsersView({ users, onCreate, onDelete, canManageUsers }) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [hint, setHint] = useState('');

  if (!canManageUsers) {
    return (
      <>
        <div className="admin-title-row">
          <h2>Users</h2>
          <div className="accent-line"></div>
        </div>
        <EmptyState>Users management is admin-only.</EmptyState>
      </>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHint('');

    const username = newUsername.trim();
    if (!username) {
      setHint('Username is required');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setHint('Password must be at least 8 characters');
      return;
    }

    const result = await onCreate(username, newPassword, newRole);
    if (result.success) {
      setNewUsername('');
      setNewPassword('');
      setNewRole('editor');
      setHint('User created.');
    } else {
      setHint(result.error);
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete user ${username}?`)) return;
    const result = await onDelete(id);
    if (!result.success) {
      setHint(result.error);
    }
  };

  return (
    <>
      <div className="admin-title-row">
        <h2>Users</h2>
        <div className="accent-line"></div>
      </div>

      <section className="side-card">
        <div className="side-header">
          <h3>Manage Users</h3>
          <span>Admins only</span>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            <span className="label">New username</span>
            <input
              className="input"
              autoComplete="off"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </label>
          <label>
            <span className="label">New password</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Role</span>
            <select
              className="input"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <div className="row">
            <PillButton type="submit">Add user</PillButton>
            <div className="hint">{hint}</div>
          </div>
        </form>

        <div className="mini-list">
          {users.map((u) => (
            <div key={u.id} className="mini-item">
              <div className="role">
                <span className="title">{u.username}</span>
                <span className="tag">{u.role}</span>
              </div>
              <PillButton
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(u.id, u.username);
                }}
              >
                Delete
              </PillButton>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
