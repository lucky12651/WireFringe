// Sidebar Footer Component - User info and actions

import React, { useState } from 'react';
import { Icons } from './icons';
import { ActionButton } from '../shared';
import styles from './Sidebar.module.css';

export function SidebarFooter({ me, onLogout }) {
  const LogoutIcon = Icons.logout;
  const SiteIcon = Icons.site;
  const UserIcon = Icons.users;
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatarUrl = String(me?.avatarUrl || '').trim();
  const shouldShowPhoto = Boolean(avatarUrl) && !avatarFailed;

  return (
    <div className={styles.footer}>
      {me && (
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {shouldShowPhoto ? (
              <img
                className={styles.userAvatarImg}
                src={avatarUrl}
                alt={`Profile photo of ${me.username}`}
                loading="lazy"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className={styles.userAvatarIcon} aria-hidden="true">
                <UserIcon />
              </span>
            )}
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
