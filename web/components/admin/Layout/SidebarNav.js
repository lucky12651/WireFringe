// Sidebar Navigation Component - Navigation sections

import React from 'react';
import { NavItem } from './NavItem';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'posts', label: 'Posts', icon: 'posts' },
  { id: 'categories', label: 'Categories', icon: 'categories' },
  { id: 'media', label: 'Media', icon: 'media' },
  { id: 'comments', label: 'Comments', icon: 'comments' },
  { id: 'users', label: 'Users', adminOnly: true, icon: 'users' },
];

const SYSTEM_ITEMS = [
  { id: 'logs', label: 'System Logs', adminOnly: true, icon: 'logs' },
];

export function SidebarNav({
  me,
  isAuthed,
  activeView,
  onNavigate,
  pendingCommentsCount,
}) {
  const canManageUsers = me?.role === 'admin';
  const isAuthor = me?.role === 'author';

  const renderNavItem = (item) => {
    const isActive = activeView === item.id;
    const isDisabled = !isAuthed;
    const isHidden = item.adminOnly && me?.role !== 'admin';

    return (
      <NavItem
        key={item.id}
        item={item}
        isActive={isActive}
        isDisabled={isDisabled}
        isHidden={isHidden}
        pendingCommentsCount={pendingCommentsCount}
        onNavigate={onNavigate}
      />
    );
  };

  return (
    <nav className={styles.nav} aria-label="Sections">
      <div className={styles.navSection}>
        {NAV_ITEMS.map(renderNavItem)}
      </div>

      <div className={styles.navDivider} aria-hidden="true" />

      <div className={styles.navSection}>
        <div className={styles.sectionLabel}>System</div>
        {SYSTEM_ITEMS.map(renderNavItem)}
      </div>
    </nav>
  );
}
