import React from 'react';
import { Icons } from './icons';
import { ActionButton } from '../shared';
import styles from './Sidebar.module.css';

export function SidebarFooter({ me, onLogout }) {
  const LogoutIcon = Icons.logout;
  const SiteIcon = Icons.site;

  return (
    <div className={styles.footer}>
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
