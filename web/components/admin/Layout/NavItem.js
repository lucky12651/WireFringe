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
          ? 'w-11 h-11 min-h-11 rounded-xl justify-center p-0 gap-0'
          : 'w-full min-h-10 h-auto rounded-xl justify-start gap-3 py-2.5 px-3',
        isActive
          ? 'bg-white text-black font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_8px_28px_rgba(255,255,255,0.08)]'
          : 'bg-transparent text-[#8a8a8a] hover:bg-white/[0.06] hover:text-white',
        (isDisabled || isUserNavDisabled) && 'opacity-40 cursor-not-allowed',
        'max-[980px]:w-12 max-[980px]:h-12 max-[980px]:min-h-12 max-[980px]:justify-center max-[980px]:p-0'
      )}
      onClick={() => onNavigate(item.id)}
      disabled={isDisabled || isUserNavDisabled}
      title={isUserNavDisabled ? 'Admins only' : collapsed ? item.label : ''}
    >
      <span className="flex items-center justify-center shrink-0 w-5 h-5 [&>svg]:w-[18px] [&>svg]:h-[18px]">
        <IconComponent />
      </span>
      <span
        className={cn(
          'text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis',
          collapsed && 'hidden',
          'max-[980px]:hidden'
        )}
      >
        {item.label}
      </span>
      {item.id === 'comments' && pendingCommentsCount > 0 && (
        <span
          className={cn(
            'font-bold text-center shrink-0 rounded-full',
            isActive
              ? 'bg-black text-white'
              : 'bg-white text-black',
            collapsed
              ? 'absolute top-1 right-1 ml-0 text-[9px] py-0.5 px-1.5 min-w-4'
              : 'ml-auto text-[10px] py-0.5 px-1.5 min-w-[18px]',
            'max-[980px]:absolute max-[980px]:top-1.5 max-[980px]:right-1.5 max-[980px]:ml-0 max-[980px]:text-[9px] max-[980px]:py-0.5 max-[980px]:px-1.5 max-[980px]:min-w-4'
          )}
        >
          {pendingCommentsCount}
        </span>
      )}
    </button>
  );
}
