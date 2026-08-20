import React from 'react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

const BRAND_F =
  'admin-brand-f italic font-extrabold inline-block [transform:skewX(-6deg)]';

export function SidebarHeader({ collapsed, onClose }) {
  return (
    <div
      className={cn(
        'flex h-12 shrink-0 items-center gap-2',
        collapsed ? 'justify-center px-0' : 'px-3'
      )}
    >
      <Link
        href="/"
        className={cn(tw.logoLink, 'min-w-0 text-[var(--admin-rail-fg)] hover:opacity-80')}
        title="Wirefringe"
        aria-label="Wirefringe home"
      >
        {collapsed ? (
          <span className={cn(tw.logo, 'text-[17px] text-[var(--admin-rail-fg)]')} aria-label="Wirefringe">
            W<span className={BRAND_F}>F</span>
          </span>
        ) : (
          <span className={cn(tw.logo, 'font-serif text-lg font-normal tracking-tight text-[var(--admin-rail-fg)]')}>
            Wire<span className={BRAND_F}>F</span>ringe
          </span>
        )}
      </Link>
      <button
        type="button"
        className="ml-auto grid size-8 place-items-center text-[var(--admin-rail-fg)] md:hidden"
        onClick={onClose}
        aria-label="Close menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
