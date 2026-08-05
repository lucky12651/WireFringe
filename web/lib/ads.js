/**
 * Google AdSense slot map for Wirefringe
 * Reuses your approved slot until extra slots are created in AdSense.
 */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-9036526646235532';

/** Primary display slot (from existing site) */
export const AD_SLOTS = {
  default: '4810585579',
  // Aliases for placement clarity (same slot ID until you create more in AdSense)
  leaderboard: '4810585579',
  inArticle: '4810585579',
  sidebar: '4810585579',
  rail: '4810585579',
  multipath: '4810585579',
};

/** How many paragraphs between in-article ads (news-site cadence) */
export const IN_ARTICLE_EVERY_N_PARAS = 3;

/** Insert first in-article ad after at least this many paragraphs */
export const IN_ARTICLE_MIN_PARAS_BEFORE = 2;

/** Max in-article ads per post (long articles get more) */
export const IN_ARTICLE_MAX_ADS = 4;
