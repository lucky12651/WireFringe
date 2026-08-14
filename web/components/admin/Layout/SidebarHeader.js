import React from 'react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

/** Brand F: neon mint on dark admin, forest mint on light (admin remaps --mint). */
const BRAND_F =
  'admin-brand-f italic font-extrabold inline-block [transform:skewX(-6deg)]';

export function SidebarHeader({ isAuthed, me, collapsed }) {
  return (
    <div
      className={cn(
        'flex items-center shrink-0 border-b border-line',
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
