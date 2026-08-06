/**
 * Google AdSense config for Wirefringe.
 *
 * Single source of truth: Admin → AdSense (stored in DB, served by
 * GET /api/adsense/public). No hardcoded publisher IDs or slot IDs.
 */

/** How many paragraphs between in-article ads (news-site cadence defaults) */
export const IN_ARTICLE_EVERY_N_PARAS = 3;
export const IN_ARTICLE_MIN_PARAS_BEFORE = 2;
export const IN_ARTICLE_MAX_ADS = 4;

/** Empty slot map — filled only from admin settings at runtime */
export const AD_SLOTS = {
  default: '',
  leaderboard: '',
  inArticle: '',
  sidebar: '',
  rail: '',
  multipath: '',
};

const EMPTY_CONFIG = {
  enabled: false,
  clientId: '',
  publisherId: '',
  slots: { ...AD_SLOTS },
  autoAdsEnabled: false,
  inArticleEnabled: true,
  inArticleEveryN: IN_ARTICLE_EVERY_N_PARAS,
  inArticleMinBefore: IN_ARTICLE_MIN_PARAS_BEFORE,
  inArticleMax: IN_ARTICLE_MAX_ADS,
  adsTxt: '',
};

let cachedConfig = null;
let loadPromise = null;

function internalApiBase() {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
}

/**
 * Load public AdSense config from the admin-managed API.
 * Cached after first success; call clearAdsenseConfigCache() after admin save/delete.
 */
export async function loadAdsenseConfig({ force = false } = {}) {
  if (!force && cachedConfig) return cachedConfig;
  if (!force && loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const base = typeof window === 'undefined' ? internalApiBase() : '';
      const res = await fetch(`${base}/api/adsense/public`, {
        credentials: typeof window !== 'undefined' ? 'include' : undefined,
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`adsense public ${res.status}`);
      const data = await res.json();

      const slots = {
        default: data.slots?.default || '',
        leaderboard: data.slots?.leaderboard || data.slots?.default || '',
        inArticle: data.slots?.inArticle || data.slots?.default || '',
        sidebar: data.slots?.sidebar || data.slots?.default || '',
        rail: data.slots?.rail || data.slots?.default || '',
        multipath: data.slots?.multipath || data.slots?.default || '',
      };

      const clientId = String(data.clientId || '').trim();
      const publisherId = String(data.publisherId || '').trim();
      // Ads only when admin enabled them AND credentials exist
      const enabled = !!data.enabled && !!clientId;

      cachedConfig = {
        enabled,
        clientId,
        publisherId,
        slots,
        autoAdsEnabled: !!data.autoAdsEnabled,
        inArticleEnabled: data.inArticleEnabled !== false,
        inArticleEveryN: Number(data.inArticleEveryN) || IN_ARTICLE_EVERY_N_PARAS,
        inArticleMinBefore: Number(data.inArticleMinBefore) || IN_ARTICLE_MIN_PARAS_BEFORE,
        inArticleMax: Number(data.inArticleMax) || IN_ARTICLE_MAX_ADS,
        adsTxt: String(data.adsTxt || ''),
      };
      return cachedConfig;
    } catch {
      cachedConfig = { ...EMPTY_CONFIG, slots: { ...AD_SLOTS } };
      return cachedConfig;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/** Synchronous snapshot after load (or empty config). */
export function getAdsenseConfigSync() {
  return cachedConfig || EMPTY_CONFIG;
}

/** Invalidate cache after admin saves/deletes credentials. */
export function clearAdsenseConfigCache() {
  cachedConfig = null;
  loadPromise = null;
}

/**
 * @deprecated Use loadAdsenseConfig() — kept only so old imports do not crash.
 * Always empty; never a hardcoded pub ID.
 */
export const ADSENSE_CLIENT = '';
