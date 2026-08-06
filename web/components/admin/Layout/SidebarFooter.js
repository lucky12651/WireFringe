import React from 'react';
import { cn } from '../../../lib/utils';
import { Icons, ChevronLeftIcon, ChevronRightIcon } from './icons';

export function SidebarFooter({ me, onLogout, onNavigate, collapsed, onToggleCollapse }) {
  const LogoutIcon = Icons.logout;
  const SettingsIcon = Icons.settings;

  return (
    <div
      className={cn(
        'flex flex-col shrink-0 border-t border-white/[0.06]',
        collapsed ? 'py-4 px-0 items-center gap-3' : 'px-2.5 py-3 gap-2',
        'max-[980px]:flex-row max-[980px]:px-3 max-[980px]:py-0 max-[980px]:border-t-0 max-[980px]:gap-2 max-[980px]:items-center'
      )}
    >
      {me ? (
        <div
          className={cn(
            'flex items-center gap-2.5 min-w-0',
            collapsed ? 'p-0 justify-center' : 'py-1.5 px-2 rounded-xl bg-white/[0.03] border border-white/[0.05]'
          )}
        >
          {me.avatarUrl ? (
            <img
              src={me.avatarUrl}
              alt={me.username}
              className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/12 flex items-center justify-center text-white text-sm font-semibold shrink-0"
              aria-hidden="true"
            >
              {(me.displayName || me.username || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          {!collapsed ? (
            <div className="flex flex-col min-w-0 gap-px max-[980px]:hidden">
              <span className="text-[13px] font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                {me.displayName || me.username}
              </span>
              <span className="text-[11px] text-white/40 capitalize">{me.role}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-col gap-0.5',
          collapsed ? 'items-center w-auto gap-2' : 'w-full'
        )}
      >
        <button
          type="button"
          className={cn(
            'flex items-center border-none bg-transparent text-white/45 cursor-pointer transition-all duration-200',
            'font-medium text-[13px] text-left hover:bg-white/[0.06] hover:text-white',
            '[&>svg]:w-4 [&>svg]:h-4 [&>svg]:shrink-0',
            collapsed
              ? 'w-10 h-10 min-h-10 justify-center p-0 rounded-xl'
              : 'w-full min-h-10 rounded-xl gap-2.5 py-2 px-3',
            'max-[980px]:w-10 max-[980px]:h-10 max-[980px]:min-h-10 max-[980px]:justify-center max-[980px]:p-0 max-[980px]:rounded-xl'
          )}
          onClick={() => onNavigate('settings')}
          title="Settings"
        >
          <SettingsIcon />
          {!collapsed ? <span className="max-[980px]:hidden">Settings</span> : null}
        </button>
        <button
          type="button"
          className={cn(
            'flex items-center border-none bg-transparent text-white/45 cursor-pointer transition-all duration-200',
            'font-medium text-[13px] text-left hover:bg-[rgba(255,107,107,0.1)] hover:text-[#ff6b6b]',
            '[&>svg]:w-4 [&>svg]:h-4 [&>svg]:shrink-0',
            collapsed
              ? 'w-10 h-10 min-h-10 justify-center p-0 rounded-xl'
              : 'w-full min-h-10 rounded-xl gap-2.5 py-2 px-3',
            'max-[980px]:w-10 max-[980px]:h-10 max-[980px]:min-h-10 max-[980px]:justify-center max-[980px]:p-0 max-[980px]:rounded-xl'
          )}
          onClick={onLogout}
          title="Logout"
        >
          <LogoutIcon />
          {!collapsed ? <span className="max-[980px]:hidden">Logout</span> : null}
        </button>
      </div>

      <button
        type="button"
        className={cn(
          'flex items-center border border-white/10 bg-white/[0.03] text-white/50 cursor-pointer transition-all duration-200',
          'font-medium text-[13px] hover:bg-white/[0.08] hover:text-white hover:border-white/20',
          '[&>svg]:w-[18px] [&>svg]:h-[18px] [&>svg]:shrink-0',
          collapsed
            ? 'w-10 h-10 min-h-10 justify-center p-0 rounded-xl mt-0'
            : 'w-full min-h-10 mt-1 rounded-xl gap-2.5 py-2 px-3',
          'max-[980px]:hidden'
        )}
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand menu' : 'Collapse to icons'}
        aria-label={collapsed ? 'Expand menu' : 'Collapse to icons'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRightIcon size={18} /> : <ChevronLeftIcon size={18} />}
        {!collapsed ? <span>Collapse</span> : null}
      </button>
    </div>
  );
}
