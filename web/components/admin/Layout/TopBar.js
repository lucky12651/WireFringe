import React from 'react';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';

export function TopBar({ me, onLogout, onOpenMenu }) {
  const label = me?.displayName || me?.email || me?.username || 'Account';

  return (
    <header className="wp-admin-bar">
      <button
        type="button"
        className="grid h-8 w-8 place-items-center border-0 bg-transparent md:hidden"
        onClick={onOpenMenu}
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <a
        href="/"
        className="inline-flex h-8 items-center px-2.5 font-semibold no-underline hover:bg-[var(--admin-rail-hover)]"
        title="Visit site"
      >
        Wirefringe
      </a>

      <a
        href="/admin/post"
        className="hidden h-8 items-center px-2.5 no-underline hover:bg-[var(--admin-rail-hover)] sm:inline-flex"
      >
        + New
      </a>

      <div className="ml-auto flex h-full items-center">
        <a
          href="/"
          className="hidden h-8 items-center px-2.5 no-underline hover:bg-[var(--admin-rail-hover)] sm:inline-flex"
          target="_blank"
          rel="noreferrer"
        >
          View site
        </a>
        <div className="hidden h-8 items-center px-2 sm:flex">
          <ThemeToggle compact />
        </div>
        <div className="flex h-8 items-center gap-2 px-2">
          {me?.avatarUrl ? (
            <img src={me.avatarUrl} alt="" className="size-5 rounded-full object-cover" />
          ) : (
            <span className="grid size-5 place-items-center rounded-full bg-[var(--admin-rail-hover)] text-[10px] font-medium">
              {String(label).charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden max-w-32 truncate sm:inline">{label}</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="h-8 border-0 bg-transparent px-2.5 hover:bg-[var(--admin-rail-hover)]"
        >
          Log Out
        </button>
      </div>
    </header>
  );
}
