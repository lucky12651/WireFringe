import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { getTheme, setTheme, THEME_CHANGE_EVENT, THEME_KEY } from '../../lib/theme';

function SunIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeToggle({ className = '', compact = false }) {
  const [theme, setThemeState] = useState('dark');

  useEffect(() => {
    const sync = () => setThemeState(getTheme());
    sync();
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    const onStorage = (e) => {
      if (e.key === THEME_KEY) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const choose = (next) => {
    setTheme(next, { persist: true });
    setThemeState(next);
  };

  const iconSize = compact ? 12 : 15;

  return (
    <div
      className={cn(
        compact
          ? 'inline-flex h-8 items-center gap-px bg-transparent p-0'
          : 'inline-flex items-center gap-1 rounded-full border border-line bg-bg-elevated p-1 shadow-sm',
        className
      )}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => choose('light')}
        aria-pressed={theme === 'light'}
        aria-label="Light mode"
        className={cn(
          'inline-flex cursor-pointer items-center justify-center border-0 transition-colors duration-150',
          compact
            ? 'size-[22px] rounded-[2px]'
            : 'h-8 gap-1.5 rounded-full px-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em]',
          theme === 'light'
            ? compact
              ? 'bg-mint text-[var(--admin-accent-fg,#111)]'
              : 'bg-mint text-black'
            : compact
              ? 'bg-transparent text-[var(--admin-rail-muted,#8a8a8a)] hover:bg-[var(--admin-rail-hover)] hover:text-[var(--admin-rail-fg,#fff)]'
              : 'bg-transparent text-ink-tertiary hover:text-ink'
        )}
      >
        <SunIcon size={iconSize} />
        {compact ? null : 'Light'}
      </button>
      <button
        type="button"
        onClick={() => choose('dark')}
        aria-pressed={theme === 'dark'}
        aria-label="Dark mode"
        className={cn(
          'inline-flex cursor-pointer items-center justify-center border-0 transition-colors duration-150',
          compact
            ? 'size-[22px] rounded-[2px]'
            : 'h-8 gap-1.5 rounded-full px-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em]',
          theme === 'dark'
            ? compact
              ? 'bg-mint text-[var(--admin-accent-fg,#111)]'
              : 'bg-mint text-black shadow-mint'
            : compact
              ? 'bg-transparent text-[var(--admin-rail-muted,#8a8a8a)] hover:bg-[var(--admin-rail-hover)] hover:text-[var(--admin-rail-fg,#fff)]'
              : 'bg-transparent text-ink-tertiary hover:text-ink'
        )}
      >
        <MoonIcon size={iconSize} />
        {compact ? null : 'Dark'}
      </button>
    </div>
  );
}
