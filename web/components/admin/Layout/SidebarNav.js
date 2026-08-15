// Sidebar Navigation Component - Navigation sections

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
  // System Logs lives as a tab inside News Bot (like Posts → Published / Queue)
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
        'flex-1 flex flex-col overflow-y-auto overflow-x-hidden',
        'scrollbar-thin',
        collapsed
          ? 'py-[18px] px-0 items-center gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'py-3.5 px-2.5 gap-1',
        'max-[980px]:flex-row max-[980px]:px-3 max-[980px]:justify-around max-[980px]:overflow-x-auto max-[980px]:flex-1 max-[980px]:items-center max-[980px]:py-0'
      )}
      aria-label="Sections"
    >
      <div
        className={cn(
          'flex flex-col gap-0.5 w-full',
          collapsed && 'items-center gap-1.5',
          'max-[980px]:flex-row max-[980px]:w-auto max-[980px]:gap-1'
        )}
      >
        {NAV_ITEMS.map(renderNavItem)}
      </div>

      {systemVisible ? (
      <>
      <div
        className={cn(
          'h-px bg-line',
          collapsed ? 'w-9 my-2 mx-0' : 'my-2.5 mx-2 w-auto',
          'max-[980px]:hidden'
        )}
        aria-hidden="true"
      />

      <div
        className={cn(
          'flex flex-col gap-0.5 w-full',
          collapsed && 'items-center gap-1.5',
          'max-[980px]:flex-row max-[980px]:w-auto max-[980px]:gap-1'
        )}
      >
        {!collapsed ? (
          <div className="text-[10px] font-medium tracking-[0.14em] uppercase text-white/30 px-3 pt-3 pb-1.5 max-[980px]:hidden">
            System
          </div>
        ) : null}
        {SYSTEM_ITEMS.map(renderNavItem)}
      </div>
      </>
      ) : null}
    </nav>
  );
}
