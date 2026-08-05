import React, { useMemo, useState } from 'react';
import { ROLE_OPTIONS } from '../../../lib/constants';
import { SuccessToast } from '../shared';
import { ActionButton } from '../shared/ActionButton';
import { EmptyState } from '../shared/EmptyState';
import { Icons, PlusIcon, TrashIcon } from '../Layout/icons';

const MIN_PASSWORD_LENGTH = 8;

export function UsersView({
  users,
  onCreate,
  onDelete,
  onSetPassword,
  onSetRole,
  canManageUsers,
}) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [hint, setHint] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletePostsAction, setDeletePostsAction] = useState('transfer'); // transfer | delete
  const [transferToUserId, setTransferToUserId] = useState('');
  const [deleteHint, setDeleteHint] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [failedAvatars, setFailedAvatars] = useState(() => new Set());

  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [roleUser, setRoleUser] = useState(null);
  const [roleValue, setRoleValue] = useState('editor');
  const [roleHint, setRoleHint] = useState('');
  const [isSavingRole, setIsSavingRole] = useState(false);

  const usersCount = Array.isArray(users) ? users.length : 0;
  const UserAvatarIcon = Icons.users;
  const KeyIcon = Icons.key;
  const ShieldIcon = Icons.shield;

  const transferCandidates = useMemo(() => {
    if (!userToDelete) return users || [];
    return (users || []).filter((u) => u.id !== userToDelete.id);
  }, [users, userToDelete]);

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
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      setHint(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
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
    setDeletePostsAction('transfer');
    setDeleteHint('');
    const others = (users || []).filter((u) => u.id !== user.id);
    // Prefer admin/editor as default transfer target
    const preferred =
      others.find((u) => String(u.role).toLowerCase() === 'admin') ||
      others.find((u) => String(u.role).toLowerCase() === 'editor') ||
      others[0];
    setTransferToUserId(preferred ? String(preferred.id) : '');
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const deletedUsername = userToDelete.username;

    if (deletePostsAction === 'transfer') {
      if (!transferToUserId) {
        setDeleteHint('Select a user to transfer posts to.');
        return;
      }
    }

    setIsDeleting(true);
    setDeleteHint('');
    try {
      const result = await onDelete(userToDelete.id, {
        postsAction: deletePostsAction,
        transferToUserId:
          deletePostsAction === 'transfer' ? Number(transferToUserId) : null,
      });
      if (result.success) {
        const info = result.result || {};
        let msg = `User "${deletedUsername}" deleted.`;
        if (deletePostsAction === 'delete') {
          msg += ` ${Number(info.postsDeleted) || 0} post(s) removed.`;
        } else {
          msg += ` ${Number(info.postsTransferred) || 0} post(s) transferred to ${
            info.transferToUsername || 'selected user'
          }.`;
        }
        setSuccessMessage(msg);
        setUserToDelete(null);
        setTransferToUserId('');
      } else {
        setDeleteHint(result.error || 'Failed to delete user.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setUserToDelete(null);
    setDeleteHint('');
    setTransferToUserId('');
  };

  const openPasswordModal = (user) => {
    setPasswordUser(user);
    setPasswordValue('');
    setPasswordConfirm('');
    setPasswordHint('');
  };

  const closePasswordModal = () => {
    if (isSavingPassword) return;
    setPasswordUser(null);
    setPasswordValue('');
    setPasswordConfirm('');
    setPasswordHint('');
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordUser || !onSetPassword) return;

    if (!passwordValue || passwordValue.length < MIN_PASSWORD_LENGTH) {
      setPasswordHint(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (passwordValue !== passwordConfirm) {
      setPasswordHint('Passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    setPasswordHint('');
    try {
      const result = await onSetPassword(passwordUser.id, passwordValue);
      if (result.success) {
        setSuccessMessage(`Password updated for "${passwordUser.username}".`);
        setPasswordUser(null);
        setPasswordValue('');
        setPasswordConfirm('');
      } else {
        setPasswordHint(result.error || 'Failed to update password.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const openRoleModal = (user) => {
    setRoleUser(user);
    setRoleValue(String(user.role || 'user').toLowerCase());
    setRoleHint('');
  };

  const closeRoleModal = () => {
    if (isSavingRole) return;
    setRoleUser(null);
    setRoleHint('');
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleUser || !onSetRole) return;

    if (!roleValue) {
      setRoleHint('Select a role.');
      return;
    }
    if (String(roleUser.role || '').toLowerCase() === String(roleValue).toLowerCase()) {
      setRoleHint('That is already their current role.');
      return;
    }

    setIsSavingRole(true);
    setRoleHint('');
    try {
      const result = await onSetRole(roleUser.id, roleValue);
      if (result.success) {
        setSuccessMessage(`Role updated for "${roleUser.username}" → ${roleValue}.`);
        setRoleUser(null);
      } else {
        setRoleHint(result.error || 'Failed to update role.');
      }
    } finally {
      setIsSavingRole(false);
    }
  };

  return (
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">Users Management</h2>
        <span className="title-count-v2">{usersCount} Users</span>
      </div>

      <div className="admin-grid-v2">
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
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {hint && <p className="form-hint-v2">{hint}</p>}
            <button type="submit" className="primary-btn-v2">
              <PlusIcon /> Create User
            </button>
          </form>
        </div>

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
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <span className="status-dot-active">Active</span>
                    </td>
                    <td className="text-right">
                      <div className="action-group-v2">
                        <button
                          type="button"
                          className="edit-btn-v2"
                          onClick={() => openRoleModal(user)}
                          title="Change role"
                          aria-label={`Change role for ${user.username}`}
                        >
                          <ShieldIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="edit-btn-v2"
                          onClick={() => openPasswordModal(user)}
                          title="Change password"
                          aria-label={`Change password for ${user.username}`}
                        >
                          <KeyIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="delete-btn-v2"
                          onClick={() => handleDeleteClick(user)}
                          title="Delete user"
                          aria-label={`Delete ${user.username}`}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {userToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
            </div>
            <div className="modal-body">
              <p>
                Delete <strong>{userToDelete.username}</strong>? Choose what happens to
                their posts.
              </p>

              <div className="delete-options">
                <label
                  className={`delete-option-card ${
                    deletePostsAction === 'transfer' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="posts-action"
                    value="transfer"
                    checked={deletePostsAction === 'transfer'}
                    onChange={() => setDeletePostsAction('transfer')}
                    disabled={isDeleting}
                  />
                  <span>
                    <span className="option-title">Transfer posts</span>
                    <span className="option-desc">
                      Move this user’s posts to another account, then delete the user.
                    </span>
                  </span>
                </label>

                {deletePostsAction === 'transfer' ? (
                  <div className="delete-transfer-box form-group-v2">
                    <label htmlFor="transfer-to-user">Transfer posts to</label>
                    <select
                      id="transfer-to-user"
                      value={transferToUserId}
                      onChange={(e) => setTransferToUserId(e.target.value)}
                      disabled={isDeleting || transferCandidates.length === 0}
                    >
                      {transferCandidates.length === 0 ? (
                        <option value="">No other users available</option>
                      ) : (
                        transferCandidates.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username}
                            {u.displayName ? ` (${u.displayName})` : ''} — {u.role}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ) : null}

                <label
                  className={`delete-option-card is-danger ${
                    deletePostsAction === 'delete' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="posts-action"
                    value="delete"
                    checked={deletePostsAction === 'delete'}
                    onChange={() => setDeletePostsAction('delete')}
                    disabled={isDeleting}
                  />
                  <span>
                    <span className="option-title">Delete posts too</span>
                    <span className="option-desc">
                      Permanently remove this user and all of their posts.
                    </span>
                  </span>
                </label>
              </div>

              {deleteHint ? <p className="form-hint-v2">{deleteHint}</p> : null}
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <ActionButton
                type="button"
                size="sm"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="button"
                size="sm"
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={
                  isDeleting ||
                  (deletePostsAction === 'transfer' &&
                    (!transferToUserId || transferCandidates.length === 0))
                }
              >
                {isDeleting
                  ? 'Deleting…'
                  : deletePostsAction === 'delete'
                    ? 'Delete user & posts'
                    : 'Transfer & delete'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {passwordUser && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
            </div>
            <form onSubmit={handleSavePassword}>
              <div className="modal-body">
                <p>
                  Set a new password for <strong>{passwordUser.username}</strong>. They can
                  sign in with this password immediately.
                </p>
                <div className="form-group-v2" style={{ marginTop: 16 }}>
                  <label htmlFor="admin-new-password">New password</label>
                  <input
                    id="admin-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    disabled={isSavingPassword}
                  />
                </div>
                <div className="form-group-v2">
                  <label htmlFor="admin-confirm-password">Confirm password</label>
                  <input
                    id="admin-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={isSavingPassword}
                  />
                </div>
                {passwordHint ? (
                  <p className="form-hint-v2" style={{ marginTop: 8 }}>
                    {passwordHint}
                  </p>
                ) : null}
              </div>
              <div className="modal-actions">
                <ActionButton
                  type="button"
                  size="sm"
                  onClick={closePasswordModal}
                  disabled={isSavingPassword}
                >
                  Cancel
                </ActionButton>
                <ActionButton type="submit" size="sm" disabled={isSavingPassword}>
                  {isSavingPassword ? 'Saving…' : 'Update Password'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {roleUser && (
        <div className="modal-overlay" onClick={closeRoleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Role</h3>
            </div>
            <form onSubmit={handleSaveRole}>
              <div className="modal-body">
                <p>
                  Update the role for <strong>{roleUser.username}</strong>. Current role:{' '}
                  <span className={`role-badge ${roleUser.role}`}>{roleUser.role}</span>
                </p>
                <div className="form-group-v2" style={{ marginTop: 16 }}>
                  <label htmlFor="admin-user-role">New role</label>
                  <select
                    id="admin-user-role"
                    value={roleValue}
                    onChange={(e) => setRoleValue(e.target.value)}
                    disabled={isSavingRole}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {roleHint ? (
                  <p className="form-hint-v2" style={{ marginTop: 8 }}>
                    {roleHint}
                  </p>
                ) : null}
              </div>
              <div className="modal-actions">
                <ActionButton
                  type="button"
                  size="sm"
                  onClick={closeRoleModal}
                  disabled={isSavingRole}
                >
                  Cancel
                </ActionButton>
                <ActionButton type="submit" size="sm" disabled={isSavingRole}>
                  {isSavingRole ? 'Saving…' : 'Update Role'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {successMessage && (
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
    </div>
  );
}
