import React from 'react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

/** Original site mint — admin theme remaps --mint to white, so brand F must use this hex. */
const BRAND_F =
  'text-[#3cffd0] italic font-extrabold inline-block [transform:skewX(-6deg)] [text-shadow:0_0_18px_rgba(60,255,208,0.35)]';

export function SidebarHeader({ isAuthed, me, collapsed }) {
  return (
    <div
      className={cn(
        'flex items-center shrink-0 border-b border-white/[0.06]',
        collapsed ? 'px-0 pt-[22px] pb-4 justify-center' : 'px-3.5 pt-5 pb-4',
        'max-[980px]:hidden'
      )}
    >
      <div
        className={cn(
          'flex items-center min-w-0',
          collapsed ? 'justify-center w-auto' : 'w-full'
        )}
      >
        <Link
          href="/"
          className={cn(tw.logoLink, 'hover:opacity-80 transition-opacity')}
          title="Wirefringe"
          aria-label="Wirefringe home"
        >
          {collapsed ? (
            <span className={cn(tw.logo, 'text-[20px]')} aria-label="Wirefringe">
              W<span className={BRAND_F}>F</span>
            </span>
          ) : (
            <span className={cn(tw.logo, tw.logoMd)} aria-label="Wirefringe">
              Wire<span className={BRAND_F}>F</span>ringe
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
