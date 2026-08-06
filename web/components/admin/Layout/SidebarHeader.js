import React from 'react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';

export function SidebarHeader({ isAuthed, me, collapsed }) {
  return (
    <div
      className={cn(
        'flex items-center shrink-0 border-b border-line-light',
        collapsed ? 'px-0 pt-[22px] pb-4 justify-center' : 'px-3.5 pt-[18px] pb-3.5',
        'max-[980px]:hidden'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 min-w-0',
          collapsed ? 'justify-center w-auto' : 'w-full'
        )}
      >
        <Link
          href="/"
          className={cn(
            'w-[42px] h-[42px] shrink-0 flex items-center justify-center overflow-hidden p-1',
            'bg-mint/10 border border-mint/25 rounded-[10px] no-underline',
            'transition-all duration-200 hover:bg-mint/20 hover:scale-105',
            'hover:shadow-[0_0_20px_rgba(60,255,208,0.15)]'
          )}
          title="Wirefringe"
          aria-label="Wirefringe home"
        >
          <img
            src="/logo.png"
            alt="Wirefringe"
            className="w-full h-full object-contain block rounded"
            width={32}
            height={32}
          />
        </Link>
        {!collapsed ? (
          <Link
            href="/"
            className="text-[15px] font-extrabold tracking-tight text-white no-underline whitespace-nowrap overflow-hidden text-ellipsis hover:text-mint"
            title="Wirefringe"
          >
            Wirefringe
          </Link>
        ) : null}
      </div>
    </div>
  );
}
