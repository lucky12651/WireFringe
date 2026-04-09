import React from 'react';
import Link from 'next/link';
import { PillButton } from '../shared/PillButton';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'posts', label: 'Posts' },
  { id: 'categories', label: 'Categories' },
  { id: 'media', label: 'Media' },
  { id: 'comments', label: 'Comments' },
];

const SYSTEM_ITEMS = [
  { id: 'users', label: 'Users', adminOnly: true },
  { id: 'settings', label: 'Settings' },
];

export function Sidebar({
  me,
  isAuthed,
  activeView,
  onNavigate,
  onLogout,
  pendingCommentsCount,
}) {
  const canManageUsers = me?.role === 'admin';
  const isAuthor = me?.role === 'author';

  const renderNavItem = (item) => {
    const isActive = activeView === item.id;
    const isDisabled = !isAuthed;

    // Hide users nav for authors
    if (item.id === 'users' && isAuthor) return null;

    // Disable users nav for non-admins
    const isUserNavDisabled = item.id === 'users' && !canManageUsers;

    return (
      <button
        key={item.id}
        type="button"
        className={`admin-nav-item ${isActive ? 'active' : ''}`}
        onClick={() => onNavigate(item.id)}
        disabled={isDisabled || isUserNavDisabled}
        title={isUserNavDisabled ? 'Admins only' : ''}
      >
        {item.label}
        {item.id === 'comments' && pendingCommentsCount > 0 && (
          <span className="nav-badge">{pendingCommentsCount}</span>
        )}
      </button>
    );
  };

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar-top">
        <div className="brand">
          <div className="brand-mark">
            <div className="brand-mark-inner">CnB</div>
          </div>
          <div className="brand-text">
            <h1>Admin</h1>
            <span>{isAuthed ? 'Dashboard & tools' : 'Sign in to manage'}</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Sections">
          {NAV_ITEMS.map(renderNavItem)}

          <div className="admin-nav-sep" aria-hidden="true"></div>
          <div className="admin-nav-label">System</div>

          {SYSTEM_ITEMS.map(renderNavItem)}
        </nav>
      </div>

      <div className="admin-sidebar-bottom">
        <div className="admin-me" id="meLine">
          {me ? `Signed in as ${me.username} (${me.role})` : 'Not signed in'}
        </div>

        <ThemeToggle />

        <div className="admin-sidebar-actions">
          {me && (
            <PillButton onClick={onLogout} dotColor="var(--danger)">
              Logout
            </PillButton>
          )}
          <Link className="pill-btn" href="/" aria-label="Go to site">
            <span className="dot" style={{ background: 'var(--accent)' }}></span>
            Site
          </Link>
        </div>
      </div>
    </aside>
  );
}
