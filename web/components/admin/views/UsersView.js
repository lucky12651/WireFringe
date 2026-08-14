import React, { useMemo, useState } from 'react';
import { ROLE_OPTIONS } from '../../../lib/constants';
import { SuccessToast, AdminModal } from '../shared';
import { ActionButton } from '../shared/ActionButton';
import { EmptyState } from '../shared/EmptyState';
import { Icons, PlusIcon, TrashIcon } from '../Layout/icons';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

const MIN_PASSWORD_LENGTH = 8;

export function UsersView({
  users,
  onCreate,
  onDelete,
  onSetPassword,
  onSetRole,
  onClaimOrphan,
  onReassignOrphan,
  onDeleteOrphanPosts,
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

  // Orphan author management
  const [claimAuthor, setClaimAuthor] = useState(null);
  const [claimUsername, setClaimUsername] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimRole, setClaimRole] = useState('author');
  const [claimHint, setClaimHint] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  const [reassignAuthor, setReassignAuthor] = useState(null);
  const [reassignToUserId, setReassignToUserId] = useState('');
  const [reassignHint, setReassignHint] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  const [deletePostsAuthor, setDeletePostsAuthor] = useState(null);
  const [deletePostsHint, setDeletePostsHint] = useState('');
  const [isDeletingPosts, setIsDeletingPosts] = useState(false);

  const accountUsers = useMemo(
    () =>
      (users || []).filter(
        (u) => !u.isOrphan && u.role !== 'orphan' && Number(u.id) > 0
      ),
    [users]
  );
  const orphanAuthors = useMemo(() => {
    const list = users || [];
    // Prefer API-flagged orphans
    const flagged = list.filter(
      (u) => u.isOrphan === true || u.role === 'orphan' || Number(u.id) < 0
    );
    if (flagged.length > 0) return flagged;

    // Fallback: if backend is older / missed isOrphan, still show authors from list
    // that look like non-accounts (no positive id).
    return list.filter((u) => u.id == null || Number(u.id) <= 0);
  }, [users]);

  const usersCount = accountUsers.length;
  const orphanCount = orphanAuthors.length;
  const UserAvatarIcon = Icons.users;
  const KeyIcon = Icons.key;
  const ShieldIcon = Icons.shield;

  const transferCandidates = useMemo(() => {
    if (!userToDelete) return accountUsers;
    return accountUsers.filter((u) => u.id !== userToDelete.id);
  }, [accountUsers, userToDelete]);

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
        <div className={tw.adminTitleRow}>
          <h2>Users</h2>
          <div className={tw.accentLine}></div>
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
    const others = accountUsers.filter((u) => u.id !== user.id);
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

  const openClaim = (author) => {
    setClaimAuthor(author);
    setClaimUsername(author.username || '');
    setClaimPassword('');
    setClaimRole('author');
    setClaimHint('');
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!claimAuthor || !onClaimOrphan) return;
    if (!claimPassword || claimPassword.length < MIN_PASSWORD_LENGTH) {
      setClaimHint(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    const uname = (claimUsername || claimAuthor.username || '').trim();
    if (uname.length < 3) {
      setClaimHint('Username must be at least 3 characters.');
      return;
    }

    setIsClaiming(true);
    setClaimHint('');
    try {
      const result = await onClaimOrphan({
        creatorName: claimAuthor.username,
        username: uname,
        password: claimPassword,
        role: claimRole,
        displayName: claimAuthor.displayName || claimAuthor.username,
        reassignPosts: true,
      });
      if (result.success) {
        const n = result.result?.postsAffected ?? claimAuthor.postCount ?? 0;
        setSuccessMessage(
          `Created account "${uname}" for author "${claimAuthor.username}" (${n} post(s)).`
        );
        setClaimAuthor(null);
      } else {
        setClaimHint(result.error || 'Failed to create account.');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const openReassign = (author) => {
    setReassignAuthor(author);
    setReassignHint('');
    const preferred =
      accountUsers.find((u) => String(u.role).toLowerCase() === 'admin') ||
      accountUsers.find((u) => String(u.role).toLowerCase() === 'editor') ||
      accountUsers[0];
    setReassignToUserId(preferred ? String(preferred.id) : '');
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassignAuthor || !onReassignOrphan) return;
    if (!reassignToUserId) {
      setReassignHint('Select a user to receive the posts.');
      return;
    }
    setIsReassigning(true);
    setReassignHint('');
    try {
      const result = await onReassignOrphan(reassignAuthor.username, Number(reassignToUserId));
      if (result.success) {
        const n = result.result?.postsAffected ?? 0;
        const to = result.result?.user?.username || 'selected user';
        setSuccessMessage(
          `Moved ${n} post(s) from "${reassignAuthor.username}" → "${to}".`
        );
        setReassignAuthor(null);
      } else {
        setReassignHint(result.error || 'Failed to reassign posts.');
      }
    } finally {
      setIsReassigning(false);
    }
  };

  const handleDeleteOrphanPosts = async () => {
    if (!deletePostsAuthor || !onDeleteOrphanPosts) return;
    setIsDeletingPosts(true);
    setDeletePostsHint('');
    try {
      const result = await onDeleteOrphanPosts(deletePostsAuthor.username);
      if (result.success) {
        const n = result.result?.postsAffected ?? 0;
        setSuccessMessage(`Deleted ${n} post(s) by "${deletePostsAuthor.username}".`);
        setDeletePostsAuthor(null);
      } else {
        setDeletePostsHint(result.error || 'Failed to delete posts.');
      }
    } finally {
      setIsDeletingPosts(false);
    }
  };

  return (
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Create user</h3>
        <p className={tw.adminSectionDesc}>Add a login account for editors, authors, or admins.</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end max-w-[900px]">
          <div className={tw.formGroup}>
            <label className={tw.formLabel}>Username</label>
            <input
              className={tw.formInput} type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className={tw.formGroup}>
            <label className={tw.formLabel}>Password</label>
            <input
              className={tw.formInput} type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <div className={tw.formGroup}>
            <label className={tw.formLabel}>Role</label>
            <select className={tw.formSelect} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className={tw.primaryBtn}>
              <PlusIcon /> Create
            </button>
            {hint ? <p className={tw.formHint}>{hint}</p> : null}
          </div>
        </form>
      </section>

      <section className={tw.adminSection}>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h3 className={cn(tw.adminSectionTitle, 'mb-0')}>Login accounts</h3>
          <span className="text-[12px] text-ink-tertiary">{usersCount}</span>
        </div>
          <div className={tw.tableWrap}>
            <table className={tw.table}>
              <thead>
                <tr>
                  <th className={tw.th}>User</th>
                  <th className={tw.th}>Role</th>
                  <th className={tw.th}>Posts</th>
                  <th className={cn(tw.th, tw.textRight)}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accountUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState>No login accounts yet.</EmptyState>
                    </td>
                  </tr>
                ) : (
                  accountUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-line overflow-hidden flex items-center justify-center shrink-0 text-mint">
                            {user.avatarUrl && !failedAvatars.has(user.id) ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-full h-full object-cover"
                                onError={() => markAvatarFailed(user.id)}
                              />
                            ) : (
                              <UserAvatarIcon size={18} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-ink">{user.username}</span>
                            {user.displayName && user.displayName !== user.username ? (
                              <div className={tw.textMuted} style={{ fontSize: 12 }}>
                                {user.displayName}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className={tw.td}>
                        <span className={cn(tw.statusBadge, 'bg-mint/10 text-mint border border-mint/25')}>{user.role}</span>
                      </td>
                      <td className={tw.td}>
                        <span className={tw.textMuted}>{Number(user.postCount) || 0}</span>
                      </td>
                      <td className={cn(tw.td, tw.textRight)}>
                        <div className={tw.actionGroup}>
                          <button
                            type="button"
                            className={tw.iconBtn}
                            onClick={() => openRoleModal(user)}
                            title="Change role"
                            aria-label={`Change role for ${user.username}`}
                          >
                            <ShieldIcon size={16} />
                          </button>
                          <button
                            type="button"
                            className={tw.iconBtn}
                            onClick={() => openPasswordModal(user)}
                            title="Change password"
                            aria-label={`Change password for ${user.username}`}
                          >
                            <KeyIcon size={16} />
                          </button>
                          <button
                            type="button"
                            className={tw.iconBtnDanger}
                            onClick={() => handleDeleteClick(user)}
                            title="Delete user"
                            aria-label={`Delete ${user.username}`}
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </section>

      <section className={tw.adminSection}>
          <h3 className={tw.adminSectionTitle}>Authors without an account</h3>
          <p className={tw.adminSectionDesc}>
            These names appear on posts but have no login. Create an account, transfer posts, or delete them.
          </p>
          <div className={tw.tableWrap}>
            {orphanAuthors.length === 0 ? (
              <EmptyState>All post authors have matching login accounts.</EmptyState>
            ) : (
              <table className={tw.table}>
                <thead>
                  <tr>
                    <th className={tw.th}>Author name on posts</th>
                    <th className={tw.th}>Posts</th>
                    <th className={tw.th}>Status</th>
                    <th className={cn(tw.th, tw.textRight)}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orphanAuthors.map((author) => (
                    <tr key={`orphan-${author.username}`}>
                      <td>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-line overflow-hidden flex items-center justify-center shrink-0 text-mint">
                            <UserAvatarIcon size={18} />
                          </div>
                          <span className="font-semibold text-ink">{author.username}</span>
                        </div>
                      </td>
                      <td className={tw.td}>
                        <strong>{Number(author.postCount) || 0}</strong>
                      </td>
                      <td className={tw.td}>
                        <span className={cn(tw.statusBadge, 'bg-[#e8b342]/15 text-[#e8b342] border border-[#e8b342]/30')}>no account</span>
                      </td>
                      <td className={cn(tw.td, tw.textRight)}>
                        <div
                          className={tw.actionGroup}
                          style={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 6 }}
                        >
                          <button
                            type="button"
                            className={tw.secondaryBtn}
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => openClaim(author)}
                            title="Create login account"
                          >
                            Create account
                          </button>
                          <button
                            type="button"
                            className={tw.secondaryBtn}
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => openReassign(author)}
                            title="Move posts to existing user"
                          >
                            Transfer posts
                          </button>
                          <button
                            type="button"
                            className={tw.iconBtnDanger}
                            onClick={() => {
                              setDeletePostsAuthor(author);
                              setDeletePostsHint('');
                            }}
                            title="Delete all posts by this author"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      </section>

      {userToDelete ? (
      <AdminModal open onClose={isDeleting ? undefined : handleCancelDelete}>
            <div className={tw.modalHeader}>
              <h3 className={tw.modalTitle}>Delete User</h3>
            </div>
            <div className={tw.modalBody}>
              <p>
                Delete <strong className="text-ink">{userToDelete?.username}</strong>? Choose what happens to
                their posts.
              </p>

              <div className="flex flex-col gap-2.5 mt-3">
                <label
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors',
                    deletePostsAction === 'transfer'
                      ? 'border-mint/40 bg-mint/[0.06]'
                      : 'border-line bg-bg-hover hover:border-line-strong'
                  )}
                >
                  <input
                    type="radio"
                    name="posts-action"
                    value="transfer"
                    checked={deletePostsAction === 'transfer'}
                    onChange={() => setDeletePostsAction('transfer')}
                    disabled={isDeleting}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-ink text-sm">Transfer posts</span>
                    <span className="block text-xs text-ink-tertiary mt-0.5">
                      Move this user’s posts to another account, then delete the user.
                    </span>
                  </span>
                </label>

                {deletePostsAction === 'transfer' ? (
                  <div className={tw.formGroup}>
                    <label htmlFor="transfer-to-user" className={tw.formLabel}>Transfer posts to</label>
                    <select
                      className={tw.formSelect}
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
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors',
                    deletePostsAction === 'delete'
                      ? 'border-[#ff6b6b]/50 bg-red-500/10'
                      : 'border-line bg-bg-hover hover:border-[#ff6b6b]/35'
                  )}
                >
                  <input
                    type="radio"
                    name="posts-action"
                    value="delete"
                    checked={deletePostsAction === 'delete'}
                    onChange={() => setDeletePostsAction('delete')}
                    disabled={isDeleting}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-ink text-sm">Delete posts too</span>
                    <span className="block text-xs text-ink-tertiary mt-0.5">
                      Permanently remove this user and all of their posts.
                    </span>
                  </span>
                </label>
              </div>

              {deleteHint ? <p className={tw.formHint}>{deleteHint}</p> : null}
              <p className={tw.modalWarning}>This action cannot be undone.</p>
            </div>
            <div className={tw.modalActions}>
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
      </AdminModal>
      ) : null}

      {passwordUser ? (
      <AdminModal open onClose={isSavingPassword ? undefined : closePasswordModal}>
            <div className={tw.modalHeader}>
              <h3 className={tw.modalTitle}>Change Password</h3>
            </div>
            <form onSubmit={handleSavePassword}>
              <div className={tw.modalBody}>
                <p>
                  Set a new password for <strong className="text-ink">{passwordUser?.username}</strong>. They can
                  sign in with this password immediately.
                </p>
                <div className={tw.formGroup} style={{ marginTop: 16 }}>
                  <label htmlFor="admin-new-password" className={tw.formLabel}>New password</label>
                  <input
                    className={tw.formInput} id="admin-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    disabled={isSavingPassword}
                  />
                </div>
                <div className={tw.formGroup}>
                  <label htmlFor="admin-confirm-password" className={tw.formLabel}>Confirm password</label>
                  <input
                    className={tw.formInput} id="admin-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={isSavingPassword}
                  />
                </div>
                {passwordHint ? (
                  <p className={tw.formHint} style={{ marginTop: 8 }}>
                    {passwordHint}
                  </p>
                ) : null}
              </div>
              <div className={tw.modalActions}>
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
      </AdminModal>
      ) : null}

      {roleUser ? (
      <AdminModal open onClose={isSavingRole ? undefined : closeRoleModal}>
            <div className={tw.modalHeader}>
              <h3 className={tw.modalTitle}>Change Role</h3>
            </div>
            <form onSubmit={handleSaveRole}>
              <div className={tw.modalBody}>
                <p>
                  Update the role for <strong className="text-ink">{roleUser.username}</strong>. Current role:{' '}
                  <span className={cn(tw.statusBadge, 'bg-mint/10 text-mint border border-mint/25')}>{roleUser.role}</span>
                </p>
                <div className={tw.formGroup} style={{ marginTop: 16 }}>
                  <label htmlFor="admin-user-role" className={tw.formLabel}>New role</label>
                  <select
                    className={tw.formSelect} id="admin-user-role"
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
                  <p className={tw.formHint} style={{ marginTop: 8 }}>
                    {roleHint}
                  </p>
                ) : null}
              </div>
              <div className={tw.modalActions}>
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
      </AdminModal>
      ) : null}

      {claimAuthor ? (
      <AdminModal open onClose={isClaiming ? undefined : () => setClaimAuthor(null)}>
            <div className={tw.modalHeader}>
              <h3 className={tw.modalTitle}>Create account for author</h3>
            </div>
            <form onSubmit={handleClaim}>
              <div className={tw.modalBody}>
                <p>
                  Create a login for <strong className="text-ink">{claimAuthor?.username}</strong> (
                  {Number(claimAuthor?.postCount) || 0} posts). They can then sign in and
                  appear in Users management.
                </p>
                <div className={tw.formGroup} style={{ marginTop: 16 }}>
                  <label className={tw.formLabel}>Login username</label>
                  <input
                    className={tw.formInput} type="text"
                    value={claimUsername}
                    onChange={(e) => setClaimUsername(e.target.value)}
                    disabled={isClaiming}
                  />
                </div>
                <div className={tw.formGroup}>
                  <label className={tw.formLabel}>Password</label>
                  <input
                    className={tw.formInput} type="password"
                    value={claimPassword}
                    onChange={(e) => setClaimPassword(e.target.value)}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    disabled={isClaiming}
                  />
                </div>
                <div className={tw.formGroup}>
                  <label className={tw.formLabel}>Role</label>
                  <select
                    className={tw.formSelect} value={claimRole}
                    onChange={(e) => setClaimRole(e.target.value)}
                    disabled={isClaiming}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {claimHint ? <p className={tw.formHint}>{claimHint}</p> : null}
              </div>
              <div className={tw.modalActions}>
                <ActionButton
                  type="button"
                  size="sm"
                  onClick={() => setClaimAuthor(null)}
                  disabled={isClaiming}
                >
                  Cancel
                </ActionButton>
                <ActionButton type="submit" size="sm" disabled={isClaiming}>
                  {isClaiming ? 'Creating…' : 'Create account'}
                </ActionButton>
              </div>
            </form>
      </AdminModal>
      ) : null}

      {reassignAuthor ? (
      <AdminModal open onClose={isReassigning ? undefined : () => setReassignAuthor(null)}>
            <div className={tw.modalHeader}>
              <h3 className={tw.modalTitle}>Transfer posts</h3>
            </div>
            <form onSubmit={handleReassign}>
              <div className={tw.modalBody}>
                <p>
                  Move all posts by <strong className="text-ink">{reassignAuthor?.username}</strong> (
                  {Number(reassignAuthor?.postCount) || 0}) to an existing login account.
                </p>
                <div className={tw.formGroup} style={{ marginTop: 16 }}>
                  <label className={tw.formLabel}>Transfer to</label>
                  <select
                    className={tw.formSelect} value={reassignToUserId}
                    onChange={(e) => setReassignToUserId(e.target.value)}
                    disabled={isReassigning || accountUsers.length === 0}
                  >
                    {accountUsers.length === 0 ? (
                      <option value="">No accounts available</option>
                    ) : (
                      accountUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username}
                          {u.displayName ? ` (${u.displayName})` : ''} — {u.role}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {reassignHint ? <p className={tw.formHint}>{reassignHint}</p> : null}
              </div>
              <div className={tw.modalActions}>
                <ActionButton
                  type="button"
                  size="sm"
                  onClick={() => setReassignAuthor(null)}
                  disabled={isReassigning}
                >
                  Cancel
                </ActionButton>
                <ActionButton type="submit" size="sm" disabled={isReassigning}>
                  {isReassigning ? 'Transferring…' : 'Transfer posts'}
                </ActionButton>
              </div>
            </form>
      </AdminModal>
      ) : null}

      {deletePostsAuthor ? (
      <AdminModal open onClose={isDeletingPosts ? undefined : () => setDeletePostsAuthor(null)}>
            <div className={tw.modalHeader}>
              <h3 className={tw.modalTitle}>Delete author posts</h3>
            </div>
            <div className={tw.modalBody}>
              <p>
                Permanently delete all <strong className="text-ink">{Number(deletePostsAuthor?.postCount) || 0}</strong>{' '}
                post(s) by <strong className="text-ink">{deletePostsAuthor?.username}</strong>? This cannot be undone.
              </p>
              {deletePostsHint ? <p className={tw.formHint}>{deletePostsHint}</p> : null}
              <p className={tw.modalWarning}>This action cannot be undone.</p>
            </div>
            <div className={tw.modalActions}>
              <ActionButton
                type="button"
                size="sm"
                onClick={() => setDeletePostsAuthor(null)}
                disabled={isDeletingPosts}
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDeleteOrphanPosts}
                disabled={isDeletingPosts}
              >
                {isDeletingPosts ? 'Deleting…' : 'Delete all posts'}
              </ActionButton>
            </div>
      </AdminModal>
      ) : null}

      {successMessage && (
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
    </div>
  );
}
