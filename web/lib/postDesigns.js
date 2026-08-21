import { DEFAULT_ACCENT, normalizeAccentColor } from './accents';

export const DEFAULT_POST_DESIGN = 'magazine';
export const BANNER_ACCENT = '#5B1BE4';

export const POST_DESIGNS = [
  {
    id: 'magazine',
    name: 'Magazine',
    blurb: 'Lime hero, square photo, two-column story. The current Wirefringe look.',
  },
  {
    id: 'split',
    name: 'Split hero',
    blurb: 'Headline first, then a tall photo beside the deck — light Verge-style.',
  },
  {
    id: 'banner',
    name: 'Feature banner',
    blurb: 'Purple header, huge title, then a wide cinematic photo.',
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
 * - solid: post accent fill + dark type (magazine lime)
 * - solid-inverse: post accent fill + light type (banner purple)
 * - theme: follows light/dark mode
 */
export function postHeaderConfig(design, postAccent) {
  const d = normalizePostDesign(design);
  if (d === 'magazine') {
    return {
      accent: normalizeAccentColor(postAccent, DEFAULT_ACCENT),
      variant: 'solid',
    };
  }
  if (d === 'banner') {
    return { accent: BANNER_ACCENT, variant: 'solid-inverse' };
  }
  return { accent: null, variant: 'theme' };
}
