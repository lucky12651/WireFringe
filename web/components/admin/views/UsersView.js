import React, { useState } from 'react';
import { ROLES } from '../../../lib/constants';
import { PillButton } from '../shared/PillButton';
import { EmptyState } from '../shared/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../shared/Table';
import styles from './UsersView.module.css';
import { Icons } from '../Layout/icons';

export function UsersView({ users, onCreate, onDelete, canManageUsers }) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [hint, setHint] = useState('');
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
        <span className="admin-title-count">{usersCount}</span>
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
      </section>

      <section className="side-card" aria-label="All users">
        <div className="side-header">
          <h3>All Users</h3>
          <span>{usersCount} total</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Profile</TableHead>
              <TableHead scope="col">Username</TableHead>
              <TableHead scope="col">Role</TableHead>
              <TableHead scope="col" className={styles.actionsHead}>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {usersCount ? (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className={styles.avatarWrap}>
                      {String(u?.avatarUrl || '').trim() && !failedAvatars.has(u.id) ? (
                        <img
                          className={styles.avatar}
                          src={u.avatarUrl}
                          alt={`Profile photo of ${u.username}`}
                          loading="lazy"
                          onError={() => markAvatarFailed(u.id)}
                        />
                      ) : (
                        <div className={styles.avatarFallback} aria-hidden="true">
                          <span className={styles.avatarIcon}>
                            <UserAvatarIcon />
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={styles.username}>{u.username}</span>
                  </TableCell>
                  <TableCell>
                    <span className={styles.roleTag}>{u.role}</span>
                  </TableCell>
                  <TableCell className={styles.actionsCell}>
                    <div className={styles.actions}>
                      <PillButton
                        variant="danger"
                        title={`Delete user ${u.username}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(u.id, u.username);
                        }}
                      >
                        Delete
                      </PillButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState>No users yet.</EmptyState>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
