import React, { useState } from 'react';
import styles from './Sidebar.module.css';
import { Icons } from './icons';

export function SidebarHeader({ isAuthed, me }) {
  const UserIcon = Icons.users;
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatarUrl = String(me?.avatarUrl || '').trim();
  const shouldShowPhoto = Boolean(avatarUrl) && !avatarFailed;

  return (
    <>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            {/* Simple Leaf Icon Placeholder */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M2 12h20M12 2v20" />
            </svg>
          </div>
          <div className={styles.brandText}>
            <h1 className={styles.brandTitle}>Coffee n Blog</h1>
          </div>
        </div>
      </div>
      
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
    </>
  );
}
