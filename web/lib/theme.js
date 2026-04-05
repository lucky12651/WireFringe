export const THEME_KEY = 'cnb_theme';

export function setTheme(theme) {
  if (typeof document === 'undefined') return 'dark';
  const normalized = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = normalized;

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, normalized);
    }
  } catch {
    // ignore
  }

  return normalized;
}

export function getTheme() {
  if (typeof document === 'undefined') return 'dark';
  const t = document.documentElement.dataset.theme;
  return t === 'light' ? 'light' : 'dark';
}

export function initTheme({ defaultTheme = 'dark' } = {}) {
  if (typeof window === 'undefined') return defaultTheme === 'light' ? 'light' : 'dark';

  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    saved = null;
  }

  return setTheme(saved || defaultTheme);
}

export function toggleTheme() {
  if (typeof window === 'undefined') return 'dark';

  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';

  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // ignore
  }

  return setTheme(next);
}
