import React from 'react';
import { cn } from '../../../lib/utils';
import { Icons } from './icons';

export function NavItem({
  item,
  isActive,
  isDisabled,
  isHidden,
  pendingCommentsCount,
  unreadContactCount,
  onNavigate,
  collapsed,
}) {
  if (isHidden) return null;

  const IconComponent = Icons[item.icon];
  const isUserNavDisabled = item.id === 'users' && isDisabled;
  const badge =
    item.id === 'comments' && pendingCommentsCount > 0
      ? pendingCommentsCount
      : item.id === 'contact' && unreadContactCount > 0
        ? unreadContactCount
        : 0;

  return (
    <button
      type="button"
      className={cn(
        'relative mb-0.5 flex h-10 w-full items-center gap-2.5 rounded-sm border-none text-left text-[13px] transition-colors duration-150',
        collapsed ? 'justify-center px-0' : 'px-2',
        isActive
          ? 'bg-mint text-[var(--admin-accent-fg,#111)] font-medium'
          : 'bg-transparent text-[var(--admin-rail-fg)]/85 hover:bg-[var(--admin-rail-hover)]',
        (isDisabled || isUserNavDisabled) && 'opacity-40 cursor-not-allowed'
      )}
      onClick={() => onNavigate(item.id)}
      disabled={isDisabled || isUserNavDisabled}
      title={isUserNavDisabled ? 'Admins only' : collapsed ? item.label : ''}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
        <IconComponent />
      </span>
      {!collapsed ? <span className="min-w-0 truncate">{item.label}</span> : null}
      {badge > 0 ? (
        <span
          className={cn(
            'ml-auto min-w-[18px] rounded-sm px-1.5 py-0.5 text-center text-[10px] font-bold',
            collapsed && 'absolute right-0.5 top-0.5 ml-0',
            isActive
              ? 'bg-[var(--admin-accent-fg,#111)] text-mint'
              : 'bg-mint text-[var(--admin-accent-fg,#111)]'
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
