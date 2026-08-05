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
  'https://wirefringe.gridwork.me';

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

/** AdSense publisher ID (without ca- prefix in ads.txt style) */
export const ADSENSE_PUB_ID = 'pub-9036526646235532';

export const LAST_UPDATED = 'August 4, 2026';
