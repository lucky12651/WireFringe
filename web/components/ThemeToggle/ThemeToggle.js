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

  const iconSize = compact ? 12 : 14;
  const isLight = theme === 'light';

  if (compact) {
    return (
      <div
        className={cn('inline-flex h-8 items-center gap-px bg-transparent p-0', className)}
        role="group"
        aria-label="Color theme"
      >
        <button
          type="button"
          onClick={() => choose('light')}
          aria-pressed={isLight}
          aria-label="Light mode"
          className={cn(
            'inline-flex size-[22px] cursor-pointer items-center justify-center rounded-[2px] border-0 transition-colors duration-150',
            isLight
              ? 'bg-mint text-[var(--admin-accent-fg,#111)]'
              : 'bg-transparent text-[var(--admin-rail-muted,#8a8a8a)] hover:bg-[var(--admin-rail-hover)] hover:text-[var(--admin-rail-fg,#fff)]'
          )}
        >
          <SunIcon size={iconSize} />
        </button>
        <button
          type="button"
          onClick={() => choose('dark')}
          aria-pressed={!isLight}
          aria-label="Dark mode"
          className={cn(
            'inline-flex size-[22px] cursor-pointer items-center justify-center rounded-[2px] border-0 transition-colors duration-150',
            !isLight
              ? 'bg-mint text-[var(--admin-accent-fg,#111)]'
              : 'bg-transparent text-[var(--admin-rail-muted,#8a8a8a)] hover:bg-[var(--admin-rail-hover)] hover:text-[var(--admin-rail-fg,#fff)]'
          )}
        >
          <MoonIcon size={iconSize} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative isolate grid h-10 w-full grid-cols-2 items-stretch overflow-hidden rounded-pill border border-line bg-bg-secondary p-[3px]',
        className
      )}
      role="group"
      aria-label="Color theme"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-[3px] z-0 w-[calc(50%-3px)] rounded-pill bg-mint shadow-mint transition-[left] duration-200 ease-out"
        style={{ left: isLight ? '3px' : '50%' }}
      />
      <button
        type="button"
        onClick={() => choose('light')}
        aria-pressed={isLight}
        aria-label="Light mode"
        className={cn(
          'relative z-[1] inline-flex min-w-0 appearance-none cursor-pointer items-center justify-center gap-1.5 rounded-pill border-0 bg-transparent font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-150',
          isLight ? 'text-black' : 'text-ink-muted hover:text-ink'
        )}
      >
        <SunIcon size={iconSize} />
        Light
      </button>
      <button
        type="button"
        onClick={() => choose('dark')}
        aria-pressed={!isLight}
        aria-label="Dark mode"
        className={cn(
          'relative z-[1] inline-flex min-w-0 appearance-none cursor-pointer items-center justify-center gap-1.5 rounded-pill border-0 bg-transparent font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-150',
          !isLight ? 'text-black' : 'text-ink-muted hover:text-ink'
        )}
      >
        <MoonIcon size={iconSize} />
        Dark
      </button>
    </div>
  );
}
