import React from 'react';
import { Icons, ChevronLeftIcon, ChevronRightIcon } from './icons';
import styles from './Sidebar.module.css';

export function SidebarFooter({ me, onLogout, onNavigate, collapsed, onToggleCollapse }) {
  const LogoutIcon = Icons.logout;
  const SettingsIcon = Icons.settings;

  return (
    <div className={styles.footer}>
      {me ? (
        <div className={styles.userRow}>
          {me.avatarUrl ? (
            <img src={me.avatarUrl} alt={me.username} className={styles.userAvatar} />
          ) : (
            <div className={styles.userAvatarFallback} aria-hidden="true">
              {(me.displayName || me.username || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          {!collapsed ? (
            <div className={styles.userMeta}>
              <span className={styles.userName}>{me.displayName || me.username}</span>
              <span className={styles.userRole}>{me.role}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.footerActions}>
        <button
          type="button"
          className={styles.footerBtn}
          onClick={() => onNavigate('settings')}
          title="Settings"
        >
          <SettingsIcon />
          {!collapsed ? <span>Settings</span> : null}
        </button>
        <button
          type="button"
          className={`${styles.footerBtn} ${styles.logoutAction}`}
          onClick={onLogout}
          title="Logout"
        >
          <LogoutIcon />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>

      <button
        type="button"
        className={styles.collapseToggle}
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand menu' : 'Collapse to icons'}
        aria-label={collapsed ? 'Expand menu' : 'Collapse to icons'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRightIcon size={18} /> : <ChevronLeftIcon size={18} />}
        {!collapsed ? <span>Collapse</span> : null}
      </button>
    </div>
  );
}
