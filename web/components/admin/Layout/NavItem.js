// Nav Item Component - Individual navigation button

import React from 'react';
import { cn } from '../../../lib/utils';
import { Icons } from './icons';

export function NavItem({
  item,
  isActive,
  isDisabled,
  isHidden,
  pendingCommentsCount,
  onNavigate,
  collapsed,
}) {
  if (isHidden) return null;

  const IconComponent = Icons[item.icon];
  const isUserNavDisabled = item.id === 'users' && isDisabled;

  return (
    <button
      type="button"
      className={cn(
        'relative border-none cursor-pointer transition-all duration-200 ease-out text-left',
        'flex items-center',
        collapsed
          ? 'w-12 h-12 min-h-12 rounded-xl justify-center p-0 gap-0'
          : 'w-full min-h-11 h-auto rounded-[10px] justify-start gap-3 py-2.5 px-3',
        isActive
          ? 'bg-mint text-black shadow-[0_4px_18px_rgba(60,255,208,0.3)] font-semibold'
          : 'bg-transparent text-[#999] hover:bg-bg-elevated hover:text-white',
        (isDisabled || isUserNavDisabled) && 'opacity-40 cursor-not-allowed',
        'max-[980px]:w-12 max-[980px]:h-12 max-[980px]:min-h-12 max-[980px]:justify-center max-[980px]:p-0'
      )}
      onClick={() => onNavigate(item.id)}
      disabled={isDisabled || isUserNavDisabled}
      title={isUserNavDisabled ? 'Admins only' : collapsed ? item.label : ''}
    >
      <span className="flex items-center justify-center shrink-0 w-5 h-5 [&>svg]:w-5 [&>svg]:h-5">
        <IconComponent />
      </span>
      <span
        className={cn(
          'text-[13.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis',
          collapsed && 'hidden',
          'max-[980px]:hidden'
        )}
      >
        {item.label}
      </span>
      {item.id === 'comments' && pendingCommentsCount > 0 && (
        <span
          className={cn(
            'bg-[#ff6b6b] text-white font-bold text-center shrink-0 rounded-full',
            collapsed
              ? 'absolute top-1.5 right-1.5 ml-0 text-[9px] py-0.5 px-1.5 border-2 border-black min-w-4'
              : 'ml-auto text-[10px] py-0.5 px-1.5 min-w-[18px]',
            'max-[980px]:absolute max-[980px]:top-1.5 max-[980px]:right-1.5 max-[980px]:ml-0 max-[980px]:text-[9px] max-[980px]:py-0.5 max-[980px]:px-1.5 max-[980px]:border-2 max-[980px]:border-black max-[980px]:min-w-4'
          )}
        >
          {pendingCommentsCount}
        </span>
      )}
    </button>
  );
}
