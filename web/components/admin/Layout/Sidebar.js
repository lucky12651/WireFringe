import React, { useCallback, useEffect, useState } from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import styles from './Sidebar.module.css';

const STORAGE_KEY = 'wf_admin_sidebar_collapsed';

export function Sidebar({
  me,
  isAuthed,
  activeView,
  onNavigate,
  onLogout,
  pendingCommentsCount,
}) {
  // Default expanded (full labels). User can collapse to icons-only.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === '1' || raw === 'true') setCollapsed(true);
      if (raw === '0' || raw === 'false') setCollapsed(false);
    } catch (_) {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch (_) {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : styles.expanded}`}
      aria-label="Admin navigation"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <SidebarHeader isAuthed={isAuthed} me={me} collapsed={collapsed} />
      <SidebarNav
        me={me}
        isAuthed={isAuthed}
        activeView={activeView}
        onNavigate={onNavigate}
        pendingCommentsCount={pendingCommentsCount}
        collapsed={collapsed}
      />
      <SidebarFooter
        me={me}
        onLogout={onLogout}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
    </aside>
  );
}
