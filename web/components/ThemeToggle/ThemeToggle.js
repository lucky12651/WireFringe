import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { getTheme, setTheme, THEME_CHANGE_EVENT, THEME_KEY } from '../../lib/theme';

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-full border border-line bg-bg-elevated shadow-sm',
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
          'inline-flex items-center gap-1.5 h-8 rounded-full border-0 cursor-pointer font-mono text-[10px] font-bold tracking-[0.1em] uppercase transition-all duration-200',
          compact ? 'w-8 px-0 justify-center' : 'px-3',
          theme === 'light'
            ? 'bg-mint text-black shadow-[0_2px_12px_rgba(11,143,114,0.28)]'
            : 'bg-transparent text-ink-tertiary hover:text-ink'
        )}
      >
        <SunIcon />
        {compact ? null : 'Light'}
      </button>
      <button
        type="button"
        onClick={() => choose('dark')}
        aria-pressed={theme === 'dark'}
        aria-label="Dark mode"
        className={cn(
          'inline-flex items-center gap-1.5 h-8 rounded-full border-0 cursor-pointer font-mono text-[10px] font-bold tracking-[0.1em] uppercase transition-all duration-200',
          compact ? 'w-8 px-0 justify-center' : 'px-3',
          theme === 'dark'
            ? 'bg-mint text-black shadow-[0_2px_12px_rgba(60,255,208,0.35)]'
            : 'bg-transparent text-ink-tertiary hover:text-ink'
        )}
      >
        <MoonIcon />
        {compact ? null : 'Dark'}
      </button>
    </div>
  );
}
