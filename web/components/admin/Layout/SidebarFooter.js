// Sidebar Footer Component - User info and actions

import React from 'react';
import { Icons } from './icons';
import { ActionButton } from '../shared';
import styles from './Sidebar.module.css';

export function SidebarFooter({ me, onLogout }) {
  const LogoutIcon = Icons.logout;
  const SiteIcon = Icons.site;

  return (
    <div className={styles.footer}>
      {me && (
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {me.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{me.username}</span>
            <span className={styles.userRole}>{me.role}</span>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <div className={styles.actionButtons}>
          {me && (
            <ActionButton
              icon={LogoutIcon}
              onClick={onLogout}
            >
              Logout
            </ActionButton>
          )}
          <ActionButton
            href="/"
            icon={SiteIcon}
          >
            View Site
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
