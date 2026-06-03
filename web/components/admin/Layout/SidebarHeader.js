import React from 'react';
import styles from './Sidebar.module.css';
import { Icons } from './icons';

export function SidebarHeader({ isAuthed, me }) {
  const DashboardIcon = Icons.dashboard;

  return (
    <div className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <DashboardIcon />
        </div>
      </div>
    </div>
  );
}
