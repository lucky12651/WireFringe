import { useEffect, useMemo, useState } from 'react';
import AdUnit from '../AdUnit/AdUnit';
import {
  AD_SLOTS,
  IN_ARTICLE_EVERY_N_PARAS,
  IN_ARTICLE_MAX_ADS,
  IN_ARTICLE_MIN_PARAS_BEFORE,
  loadAdsenseConfig,
} from '../../lib/ads';
import { cn } from '../../lib/utils';

/**
 * Normalize CMS / WordPress-style HTML into clean block paragraphs.
 * Many posts use <!-- wp:paragraph -->… without real <p> tags.
 */
function normalizeContentHtml(html) {
  let raw = String(html || '').trim();
  if (!raw) return '';

  if (/<!--\s*wp:/i.test(raw)) {
    raw = raw.replace(
      /<!--\s*wp:paragraph(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:paragraph\s*-->/gi,
      (_, inner) => {
        const t = String(inner || '').trim();
        if (!t) return '';
        if (/^<p[\s>]/i.test(t)) return t;
        return `<p>${t}</p>`;
      }
    );
    raw = raw.replace(
      /<!--\s*wp:heading(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:heading\s*-->/gi,
      (_, inner) => String(inner || '').trim()
    );
    raw = raw.replace(
      /<!--\s*wp:(?:image|list|quote|embed|html|separator|spacer|group|columns|column)(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:\w+\s*-->/gi,
      (_, inner) => String(inner || '').trim()
    );
    raw = raw.replace(/<!--\s*\/?wp:[^>]*-->/gi, '');
  }

  if (!/<\/p>/i.test(raw) && /<br\s*\/?>\s*<br\s*\/?>/i.test(raw)) {
    const parts = raw
      .split(/<br\s*\/?>\s*<br\s*\/?>/i)
      .map((s) => s.replace(/<br\s*\/?>/gi, ' ').trim())
      .filter(Boolean);
    if (parts.length > 1) {
      raw = parts.map((p) => (/^<p[\s>]/i.test(p) ? p : `<p>${p}</p>`)).join('\n');
    }
  }

  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    const paras = raw
      .split(/\n\s*\n+/)
      .map((s) => s.replace(/\n/g, ' ').trim())
      .filter(Boolean);
    if (paras.length) {
      raw = paras.map((p) => `<p>${p}</p>`).join('\n');
    }
  }

  return raw.trim();
}

function splitHtmlBlocks(html) {
  const raw = normalizeContentHtml(html);
  if (!raw) return [];

  if (/<\/p>/i.test(raw)) {
    const chunks = raw
      .split(/(<\/p>)/i)
      .reduce((acc, part, i, arr) => {
        if (/^<\/p>$/i.test(part)) return acc;
        const next = arr[i + 1];
        const block = next && /^<\/p>$/i.test(next) ? part + next : part;
        const t = block.trim();
        if (t) acc.push(t);
        return acc;
      }, []);
    if (chunks.length > 1) return chunks;
    if (chunks.length === 1) return chunks;
  }

  const parts = raw
    .split(/(?=<(?:p|h[1-6]|blockquote|ul|ol|figure|div|hr|pre|table)\b)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 1) return parts;

  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return [raw];
  const sentences = plain.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
  if (sentences.length >= 2) {
    const groups = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join(' ');
      groups.push(`<p>${chunk}</p>`);
    }
    return groups;
  }
  return [`<p>${plain}</p>`];
}

function isParagraphBlock(html) {
  const s = String(html || '').trim();
  if (/^<p[\s>]/i.test(s) || /<\/p>/i.test(s)) return true;
  if (/^<h[1-6]/i.test(s) || /^<(?:ul|ol|figure|pre|table|hr)\b/i.test(s)) return false;
  const text = s.replace(/<[^>]+>/g, '').trim();
  return text.length > 80;
}

export default function ArticleBody({ html, className = '', magazine = false }) {
  const blocks = useMemo(() => splitHtmlBlocks(html), [html]);
  const [adCfg, setAdCfg] = useState({
    enabled: true,
    inArticleEnabled: true,
    everyN: IN_ARTICLE_EVERY_N_PARAS,
    minBefore: IN_ARTICLE_MIN_PARAS_BEFORE,
    maxAds: IN_ARTICLE_MAX_ADS,
    slot: AD_SLOTS.inArticle,
  });

  useEffect(() => {
    let cancelled = false;
    loadAdsenseConfig().then((cfg) => {
      if (cancelled) return;
      setAdCfg({
        enabled: !!cfg.enabled && !!cfg.clientId,
        inArticleEnabled: cfg.inArticleEnabled !== false,
        everyN: Number(cfg.inArticleEveryN) || IN_ARTICLE_EVERY_N_PARAS,
        minBefore: Number(cfg.inArticleMinBefore) || IN_ARTICLE_MIN_PARAS_BEFORE,
        maxAds: Number(cfg.inArticleMax) || IN_ARTICLE_MAX_ADS,
        slot: cfg.slots?.inArticle || AD_SLOTS.inArticle,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const nodes = useMemo(() => {
    if (!blocks.length) return [];

    const out = [];
    let paraCount = 0;
    let adsPlaced = 0;
    let parasSinceAd = 0;
    let firstParaDone = false;
    const insertAds = adCfg.enabled && adCfg.inArticleEnabled && adCfg.maxAds > 0;

    blocks.forEach((block, idx) => {
      const isFirstPara = !firstParaDone && isParagraphBlock(block);
      if (isFirstPara) firstParaDone = true;

      out.push(
        <div
          key={`b-${idx}`}
          className={cn(isFirstPara && magazine && 'drop-cap')}
          dangerouslySetInnerHTML={{ __html: block }}
        />
      );

      if (!insertAds || !isParagraphBlock(block)) return;

      paraCount += 1;
      parasSinceAd += 1;

      const canInsert =
        adsPlaced < adCfg.maxAds &&
        paraCount >= adCfg.minBefore &&
        (adsPlaced === 0
          ? parasSinceAd >= adCfg.minBefore
          : parasSinceAd >= adCfg.everyN) &&
        idx < blocks.length - 1;

      if (canInsert) {
        adsPlaced += 1;
        parasSinceAd = 0;
        out.push(
          <div key={`ad-inline-${adsPlaced}`} className="w-full my-2 mb-3 clear-both">
            <AdUnit variant="inArticle" slot={adCfg.slot} label="Advertisement" />
          </div>
        );
      }
    });

    return out;
  }, [blocks, magazine, adCfg]);

  const bodyClass = cn(
    'article-body',
    magazine && 'article-body--magazine',
    className
  );

  if (!nodes.length) {
    return (
      <div className={bodyClass}>
        <p>No content available.</p>
      </div>
    );
  }

  return <div className={bodyClass}>{nodes}</div>;
}
