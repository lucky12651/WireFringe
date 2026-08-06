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
  { id: 'adsense', label: 'AdSense', adminOnly: true, icon: 'adsense' },
  { id: 'bot', label: 'News Bot', adminOnly: true, icon: 'bot' },
  { id: 'logs', label: 'System Logs', adminOnly: true, icon: 'logs' },
];

export function SidebarNav({
  me,
  isAuthed,
  activeView,
  onNavigate,
  pendingCommentsCount,
  collapsed,
}) {
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
        collapsed={collapsed}
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
        {!collapsed ? <div className={styles.sectionLabel}>System</div> : null}
        {SYSTEM_ITEMS.map(renderNavItem)}
      </div>
    </nav>
  );
}
