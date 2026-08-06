/**
 * Site identity used across legal / trust pages (AdSense approval).
 * Update CONTACT_EMAIL and SITE_URL to your real public values before submitting.
 */
export const SITE_NAME = 'Wirefringe';
export const SITE_LEGAL_NAME = 'Wirefringe';
export const SITE_TAGLINE = 'Tech, science, culture — and how technology makes us feel.';
export const SITE_DESCRIPTION =
  'Wirefringe is an independent digital publication covering technology, AI, business, personal finance, India news, sports, and culture.';

/** Public site URL (no trailing slash). Override with NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) ||
  'https://wirefringe.com';

/** Public contact — use a real inbox you monitor */
export const CONTACT_EMAIL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CONTACT_EMAIL) ||
  'contact@wirefringe.com';

export const EDITORIAL_EMAIL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_EDITORIAL_EMAIL) ||
  'tips@wirefringe.com';

export const PRIVACY_EMAIL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PRIVACY_EMAIL) ||
  'privacy@wirefringe.com';

/**
 * AdSense publisher ID is NOT hardcoded here.
 * It is managed only in Admin → AdSense (GET /api/adsense/public).
 * Use loadAdsenseConfig() from lib/ads.js on any public page that needs it.
 */

export const LAST_UPDATED = 'August 4, 2026';
