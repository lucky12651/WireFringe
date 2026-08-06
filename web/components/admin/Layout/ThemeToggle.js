import React, { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { getTheme, setTheme, initTheme } from '../../../lib/theme';

export function ThemeToggle() {
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    initTheme({ defaultTheme: 'auto' });
    setThemeMode(getTheme());
  }, []);

  const handleSetTheme = (mode) => {
    const t = setTheme(mode);
    setThemeMode(t);
  };

  return (
    <div
      className="flex gap-1 p-1 bg-bg-elevated rounded-full border border-line"
      aria-label="Theme"
    >
      <button
        type="button"
        className={cn(
          'flex items-center justify-center w-8 h-8 border-none rounded-full cursor-pointer transition-all duration-200',
          themeMode === 'light'
            ? 'bg-mint text-black shadow-[0_2px_12px_rgba(60,255,208,0.3)]'
            : 'bg-transparent text-[#777] hover:text-white'
        )}
        onClick={() => handleSetTheme('light')}
        aria-label="Light mode"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      </button>
      <button
        type="button"
        className={cn(
          'flex items-center justify-center w-8 h-8 border-none rounded-full cursor-pointer transition-all duration-200',
          themeMode === 'dark'
            ? 'bg-mint text-black shadow-[0_2px_12px_rgba(60,255,208,0.3)]'
            : 'bg-transparent text-[#777] hover:text-white'
        )}
        onClick={() => handleSetTheme('dark')}
        aria-label="Dark mode"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  );
}
