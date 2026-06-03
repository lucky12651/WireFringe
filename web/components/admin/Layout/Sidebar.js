import React from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import styles from './Sidebar.module.css';

export function Sidebar({
  me,
  isAuthed,
  activeView,
  onNavigate,
  onLogout,
  pendingCommentsCount,
}) {
  return (
    <aside className={styles.sidebar} aria-label="Admin navigation">
      <SidebarHeader isAuthed={isAuthed} me={me} />
      <SidebarNav
        me={me}
        isAuthed={isAuthed}
        activeView={activeView}
        onNavigate={onNavigate}
        pendingCommentsCount={pendingCommentsCount}
      />
      <SidebarFooter me={me} onLogout={onLogout} />
    </aside>
  );
}
