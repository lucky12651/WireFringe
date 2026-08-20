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
  unreadContactCount,
  open = false,
  onClose,
}) {
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
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed bottom-0 left-0 top-8 z-40 flex flex-col overflow-hidden',
          'bg-[var(--admin-rail)] text-[var(--admin-rail-fg)] font-sans',
          'transition-[transform,width] duration-200 ease-out',
          collapsed ? 'w-12' : 'w-44',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'md:static md:z-0 md:h-full'
        )}
        aria-label="Admin navigation"
        data-collapsed={collapsed ? 'true' : 'false'}
      >
        <SidebarHeader isAuthed={isAuthed} me={me} collapsed={collapsed} onClose={onClose} />
        <SidebarNav
          me={me}
          isAuthed={isAuthed}
          activeView={activeView}
          onNavigate={onNavigate}
          pendingCommentsCount={pendingCommentsCount}
          unreadContactCount={unreadContactCount}
          collapsed={collapsed}
        />
        <SidebarFooter
          me={me}
          onLogout={onLogout}
          onNavigate={onNavigate}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          activeView={activeView}
        />
      </aside>
    </>
  );
}
