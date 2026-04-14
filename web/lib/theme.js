export const THEME_KEY = 'cnb_theme';
export const THEME_MODE_KEY = 'cnb_theme_mode';

export const DEFAULT_LIGHT_START_HOUR = 6;
export const DEFAULT_DARK_START_HOUR = 18;

export function getTimeBasedTheme(
  now = new Date(),
  { lightStartHour = DEFAULT_LIGHT_START_HOUR, darkStartHour = DEFAULT_DARK_START_HOUR } = {}
) {
  // Uses the user's LOCAL system time zone.
  const hour = now.getHours();
  // Light from 06:00 (inclusive) to 18:00 (exclusive)
  if (hour >= lightStartHour && hour < darkStartHour) return 'light';
  return 'dark';
}

function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return 'dark';
  const normalized = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = normalized;
  return normalized;
}

function getSavedTheme() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

function getSavedThemeMode() {
  if (typeof window === 'undefined') return null;
  try {
    const mode = localStorage.getItem(THEME_MODE_KEY);
    return mode === 'manual' || mode === 'auto' ? mode : null;
  } catch {
    return null;
  }
}

function setSavedThemeMode(mode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_MODE_KEY, mode === 'manual' ? 'manual' : 'auto');
  } catch {
    // ignore
  }
}

// Manual theme setter (persists by default)
export function setTheme(theme, { persist = true } = {}) {
  const normalized = applyThemeToDocument(theme);

  if (persist && typeof window !== 'undefined') {
    try {
      localStorage.setItem(THEME_KEY, normalized);
      localStorage.setItem(THEME_MODE_KEY, 'manual');
    } catch {
      // ignore
    }
  }

  return normalized;
}

export function getTheme() {
  if (typeof document === 'undefined') return 'dark';
  const t = document.documentElement.dataset.theme;
  return t === 'light' ? 'light' : 'dark';
}

export function initTheme({ defaultTheme = 'dark' } = {}) {
  if (typeof window === 'undefined') {
    if (defaultTheme === 'light') return 'light';
    if (defaultTheme === 'auto') return 'dark';
    return 'dark';
  }

  const mode = getSavedThemeMode();
  const saved = getSavedTheme();

  // If user explicitly set manual mode, always honor saved theme.
  if (mode === 'manual' && saved) {
    return applyThemeToDocument(saved);
  }

  // When default is auto, prefer auto mode even if an old saved theme exists.
  if (defaultTheme === 'auto') {
    if (mode !== 'manual') setSavedThemeMode('auto');
    return applyThemeToDocument(getTimeBasedTheme(new Date()));
  }

  // Non-auto default: use the default without persisting.
  return applyThemeToDocument(defaultTheme);
}

export function startAutoThemeSync(
  { lightStartHour = DEFAULT_LIGHT_START_HOUR, darkStartHour = DEFAULT_DARK_START_HOUR } = {}
) {
  if (typeof window === 'undefined') return () => {};

  let timerId = null;

  const clear = () => {
    if (timerId != null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    clear();

    // If user chose manual mode, don't auto-switch.
    const mode = getSavedThemeMode();
    if (mode === 'manual') return;

    if (mode !== 'auto') setSavedThemeMode('auto');

    const now = new Date();
    applyThemeToDocument(getTimeBasedTheme(now, { lightStartHour, darkStartHour }));

    const next = new Date(now);
    const hour = now.getHours();

    // Next boundary: 06:00 or 18:00 (local time)
    const isLightWindow = hour >= lightStartHour && hour < darkStartHour;
    const nextBoundaryHour = isLightWindow ? darkStartHour : lightStartHour;

    next.setHours(nextBoundaryHour, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    const delay = next.getTime() - now.getTime();
    const safeDelay = Math.max(delay, 250);
    timerId = window.setTimeout(scheduleNext, safeDelay);
  };

  scheduleNext();
  return () => clear();
}

export function toggleTheme() {
  if (typeof window === 'undefined') return 'dark';
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  return setTheme(next, { persist: true });
}
