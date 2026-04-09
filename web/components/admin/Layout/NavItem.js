// Nav Item Component - Individual navigation button

import React from 'react';
import { Icons } from './icons';
import styles from './Sidebar.module.css';

export function NavItem({
  item,
  isActive,
  isDisabled,
  isHidden,
  pendingCommentsCount,
  onNavigate,
}) {
  if (isHidden) return null;

  const IconComponent = Icons[item.icon];
  const isUserNavDisabled = item.id === 'users' && isDisabled;

  return (
    <button
      type="button"
      className={`${styles.navItem} ${isActive ? styles.active : ''} ${isUserNavDisabled ? styles.disabled : ''}`}
      onClick={() => onNavigate(item.id)}
      disabled={isDisabled || isUserNavDisabled}
      title={isUserNavDisabled ? 'Admins only' : ''}
    >
      <span className={styles.navIcon}>
        <IconComponent />
      </span>
      <span className={styles.navLabel}>{item.label}</span>
      {item.id === 'comments' && pendingCommentsCount > 0 && (
        <span className={styles.navBadge}>{pendingCommentsCount}</span>
      )}
    </button>
  );
}
