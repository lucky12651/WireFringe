export const DEFAULT_POST_DESIGN = 'magazine';
export const BANNER_ACCENT = 'var(--banner-bg)';

export const POST_DESIGNS = [
  {
    id: 'magazine',
    name: 'Magazine',
    blurb: 'Editorial headline, portrait photo, and a focused reading column. Follows the site theme.',
  },
  {
    id: 'split',
    name: 'Split hero',
    blurb: 'Headline first, then a tall photo beside the deck — light Verge-style.',
  },
  {
    id: 'banner',
    name: 'Feature banner',
    blurb: 'Theme-aware green header, huge title, then a wide cinematic photo.',
  },
  {
    id: 'dark',
    name: 'Dark night',
    blurb: 'Black canvas, overlapping hero, white type. Night-mode feature.',
  },
];

export const POST_DESIGN_IDS = POST_DESIGNS.map((d) => d.id);

export function normalizePostDesign(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  return POST_DESIGN_IDS.includes(v) ? v : DEFAULT_POST_DESIGN;
}

/**
 * Header chrome for a public post:
 * - banner: the theme's green background with contrasting type
 * - theme: follows light/dark mode
 */
export function postHeaderConfig(design) {
  const d = normalizePostDesign(design);
  if (d === 'banner') {
    return { accent: null, variant: 'banner' };
  }
  return { accent: null, variant: 'theme' };
}
