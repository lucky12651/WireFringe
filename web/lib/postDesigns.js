export const DEFAULT_POST_DESIGN = 'magazine';

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
