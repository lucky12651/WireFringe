// Sidebar Footer Component - User info and actions

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Icons } from './icons';
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
        {/* <ThemeToggle /> */}

        <div className={styles.actionButtons}>
          {me && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={onLogout}
            >
              <LogoutIcon />
              Logout
            </button>
          )}
          <Link href="/" className={styles.actionButton}>
            <SiteIcon />
            View Site
          </Link>
        </div>
      </div>
    </div>
  );
}
