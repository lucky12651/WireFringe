import React from 'react';
import { cn } from '../../../lib/utils';
import { Icons, ChevronLeftIcon, ChevronRightIcon } from './icons';

export function SidebarFooter({ onNavigate, collapsed, onToggleCollapse, activeView }) {
  const SettingsIcon = Icons.settings;
  const settingsActive = activeView === 'settings';

  return (
    <div className={cn('mt-auto shrink-0 border-t border-white/10 px-2 py-2', collapsed && 'px-1')}>
      <button
        type="button"
        className={cn(
          'mb-0.5 flex h-10 w-full items-center gap-2.5 rounded-sm border-none text-left text-[13px] transition-colors',
          collapsed ? 'justify-center px-0' : 'px-2',
          settingsActive
            ? 'bg-mint text-[var(--admin-accent-fg,#111)] font-medium'
            : 'bg-transparent text-[var(--admin-rail-fg)]/85 hover:bg-[var(--admin-rail-hover)]'
        )}
        onClick={() => onNavigate('settings')}
        title="Settings"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
          <SettingsIcon />
        </span>
        {!collapsed ? <span>Settings</span> : null}
      </button>

      <button
        type="button"
        className={cn(
          'flex h-9 w-full items-center gap-2.5 rounded-sm border-none bg-transparent text-[13px] text-[var(--admin-rail-muted)] hover:bg-[var(--admin-rail-hover)] hover:text-[var(--admin-rail-fg)]',
          collapsed ? 'justify-center px-0' : 'px-2'
        )}
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand menu' : 'Collapse menu'}
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
        {!collapsed ? <span>Collapse</span> : null}
      </button>
    </div>
  );
}
