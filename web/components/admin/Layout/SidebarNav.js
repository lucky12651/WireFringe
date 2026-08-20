import React from 'react';
import { cn } from '../../../lib/utils';
import { NavItem } from './NavItem';
import { canAccessView } from '../../../lib/access';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'posts', label: 'Posts', icon: 'posts' },
  { id: 'categories', label: 'Categories', icon: 'categories' },
  { id: 'media', label: 'Media', icon: 'media' },
  { id: 'comments', label: 'Comments', icon: 'comments' },
  { id: 'contact', label: 'Contact', icon: 'contact' },
  { id: 'tips', label: 'Tips', icon: 'contact' },
  { id: 'users', label: 'Users', adminOnly: true, icon: 'users' },
];

const SYSTEM_ITEMS = [
  { id: 'frontpage', label: 'Front page', icon: 'posts' },
  { id: 'newsletter', label: 'Newsletter', icon: 'contact' },
  { id: 'analytics', label: 'Analytics', icon: 'dashboard' },
  { id: 'redirects', label: 'Redirects', icon: 'logs' },
  { id: 'masthead', label: 'Masthead', icon: 'users' },
  { id: 'adsense', label: 'AdSense', adminOnly: true, icon: 'adsense' },
  { id: 'bot', label: 'News Bot', adminOnly: true, icon: 'bot' },
];

export function SidebarNav({
  me,
  isAuthed,
  activeView,
  onNavigate,
  pendingCommentsCount,
  unreadContactCount,
  collapsed,
}) {
  const systemVisible = SYSTEM_ITEMS.some((item) => canAccessView(me, item.id));

  const renderNavItem = (item) => {
    const isActive = activeView === item.id;
    const isDisabled = !isAuthed;
    const isHidden = !canAccessView(me, item.id);

    return (
      <NavItem
        key={item.id}
        item={item}
        isActive={isActive}
        isDisabled={isDisabled}
        isHidden={isHidden}
        pendingCommentsCount={pendingCommentsCount}
        unreadContactCount={unreadContactCount}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
    );
  };

  return (
    <nav
      className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden px-2 mt-1',
        collapsed && 'px-1'
      )}
      aria-label="Sections"
    >
      <div className="flex flex-col">{NAV_ITEMS.map(renderNavItem)}</div>

      {systemVisible ? (
        <>
          <div
            className={cn(
              'my-2 h-px bg-white/10',
              collapsed ? 'mx-1' : 'mx-1'
            )}
            aria-hidden="true"
          />
          {!collapsed ? (
            <div className="px-2 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--admin-rail-muted)]">
              System
            </div>
          ) : null}
          <div className="flex flex-col">{SYSTEM_ITEMS.map(renderNavItem)}</div>
        </>
      ) : null}
    </nav>
  );
}
