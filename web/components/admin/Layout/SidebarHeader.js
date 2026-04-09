// Sidebar Header Component - Brand section

import React from 'react';
import styles from './Sidebar.module.css';

export function SidebarHeader({ isAuthed }) {
  return (
    <div className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>CnB</div>
        <div className={styles.brandText}>
          <h1 className={styles.brandTitle}>Coffee n Blog</h1>
          <span className={styles.brandSubtitle}>
            {isAuthed ? 'Admin Dashboard' : 'Sign in to manage'}
          </span>
        </div>
      </div>
    </div>
  );
}
