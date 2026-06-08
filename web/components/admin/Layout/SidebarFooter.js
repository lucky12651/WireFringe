import React from 'react';
import { Icons } from './icons';
import styles from './Sidebar.module.css';

export function SidebarFooter({ me, onLogout, onNavigate }) {
  const LogoutIcon = Icons.logout;
  const SettingsIcon = Icons.settings;

  return (
    <div className={styles.footer}>
      {me?.avatarUrl && (
        <img src={me.avatarUrl} alt={me.username} className={styles.userAvatar} />
      )}
      <button className={styles.logoutBtn} onClick={onLogout} title="Logout">
        <LogoutIcon />
      </button>
      <button className={styles.logoutBtn} title="Settings" onClick={() => onNavigate('settings')}>
        <SettingsIcon />
      </button>
    </div>
  );
}
