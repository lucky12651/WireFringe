import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';

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
      className={cn(
        'sticky top-0 self-start flex flex-col h-screen overflow-hidden',
        'bg-bg-elevated/90 backdrop-blur-2xl border-r border-line font-sans z-[100]',
        'transition-[width] duration-[220ms] ease-out',
        collapsed ? 'w-[84px]' : 'w-64',
        'max-[980px]:fixed max-[980px]:bottom-0 max-[980px]:left-0 max-[980px]:top-auto',
        'max-[980px]:w-full max-[980px]:h-16 max-[980px]:flex-row',
        'max-[980px]:border-r-0 max-[980px]:border-t max-[980px]:border-line',
        'max-[980px]:bg-bg-elevated/95 max-[980px]:backdrop-blur-xl'
      )}
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
