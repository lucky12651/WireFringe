import React, { useState } from 'react';
import { ROLES } from '../../../lib/constants';
import { ActionButton } from '../shared/ActionButton';
import { EmptyState } from '../shared/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../shared/Table';
import { DeleteConfirmModal, SuccessToast } from '../shared';
import styles from './UsersView.module.css';
import { Icons, PlusIcon, TrashIcon } from '../Layout/icons';

export function UsersView({ users, onCreate, onDelete, canManageUsers }) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [hint, setHint] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [failedAvatars, setFailedAvatars] = useState(() => new Set());

  const usersCount = Array.isArray(users) ? users.length : 0;

  const UserAvatarIcon = Icons.users;

  const markAvatarFailed = (userId) => {
    setFailedAvatars((prev) => {
      if (prev.has(userId)) return prev;
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

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

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const deletedUsername = userToDelete.username;
    setIsDeleting(true);
    try {
      const result = await onDelete(userToDelete.id);
      if (result.success) {
        setSuccessMessage(`User "${deletedUsername}" has been deleted successfully.`);
        setUserToDelete(null);
      } else {
        setHint(result.error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setUserToDelete(null);
  };

  return (
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">Users Management</h2>
        <span className="title-count-v2">{usersCount} Users</span>
      </div>

      <div className="admin-grid-v2">
        {/* Create User Card */}
        <div className="admin-card-v2 create-user-card">
          <h3 className="card-title-v2">Create New User</h3>
          <form onSubmit={handleSubmit} className="v2-form">
            <div className="form-group-v2">
              <label>Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="form-group-v2">
              <label>Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="form-group-v2">
              <label>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="editor">Editor</option>
                <option value="author">Author</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {hint && <p className="form-hint-v2">{hint}</p>}
            <button type="submit" className="primary-btn-v2">
              <PlusIcon /> Create User
            </button>
          </form>
        </div>

        {/* Users List Card */}
        <div className="admin-card-v2 users-list-card">
          <h3 className="card-title-v2">Existing Users</h3>
          <div className="v2-table-wrapper">
            <table className="v2-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-v2">
                          {user.avatarUrl && !failedAvatars.has(user.id) ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              onError={() => markAvatarFailed(user.id)}
                            />
                          ) : (
                            <UserAvatarIcon size={18} />
                          )}
                        </div>
                        <span className="username-text">{user.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="status-dot-active">Active</span>
                    </td>
                    <td className="text-right">
                      <button
                        className="delete-btn-v2"
                        onClick={() => handleDeleteClick(user)}
                        title="Delete user"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!userToDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone.`}
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
