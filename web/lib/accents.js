export const DEFAULT_ACCENT = '#DEF23A';

export const ACCENT_PRESETS = [
  { name: 'Lime', value: '#DEF23A' },
  { name: 'Mint', value: '#5FF2C0' },
  { name: 'Gold', value: '#F4E04D' },
  { name: 'Lavender', value: '#ECE7FC' },
  { name: 'Pink', value: '#FF8FC8' },
  { name: 'Coral', value: '#FF6A95' },
  { name: 'Peach', value: '#FFB199' },
  { name: 'Sky', value: '#A1C4FD' },
];

export function normalizeAccentColor(value, fallback = DEFAULT_ACCENT) {
  const v = String(value || '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toUpperCase();
  return fallback;
}
