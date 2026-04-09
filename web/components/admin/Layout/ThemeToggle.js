import React, { useState, useEffect } from 'react';
import { getTheme, setTheme, initTheme } from '../../../lib/theme';

export function ThemeToggle() {
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    initTheme({ defaultTheme: 'dark' });
    setThemeMode(getTheme());
  }, []);

  const handleSetTheme = (mode) => {
    const t = setTheme(mode);
    setThemeMode(t);
  };

  return (
    <div className="admin-theme-toggle" aria-label="Theme">
      <button
        type="button"
        className={`admin-theme-btn ${themeMode === 'light' ? 'active' : ''}`}
        onClick={() => handleSetTheme('light')}
      >
        Light
      </button>
      <button
        type="button"
        className={`admin-theme-btn ${themeMode === 'dark' ? 'active' : ''}`}
        onClick={() => handleSetTheme('dark')}
      >
        Dark
      </button>
    </div>
  );
}
