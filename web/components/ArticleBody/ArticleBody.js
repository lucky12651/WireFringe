import { useMemo } from 'react';
import AdUnit from '../AdUnit/AdUnit';
import {
  AD_SLOTS,
  IN_ARTICLE_EVERY_N_PARAS,
  IN_ARTICLE_MAX_ADS,
  IN_ARTICLE_MIN_PARAS_BEFORE,
} from '../../lib/ads';
import styles from './ArticleBody.module.css';

/**
 * Normalize CMS / WordPress-style HTML into clean block paragraphs.
 * Many posts use <!-- wp:paragraph -->… without real <p> tags.
 */
function normalizeContentHtml(html) {
  let raw = String(html || '').trim();
  if (!raw) return '';

  // WordPress Gutenberg comment blocks → real <p> (and other blocks)
  if (/<!--\s*wp:/i.test(raw)) {
    // Paragraph blocks
    raw = raw.replace(
      /<!--\s*wp:paragraph(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:paragraph\s*-->/gi,
      (_, inner) => {
        const t = String(inner || '').trim();
        if (!t) return '';
        if (/^<p[\s>]/i.test(t)) return t;
        return `<p>${t}</p>`;
      }
    );
    // Heading blocks
    raw = raw.replace(
      /<!--\s*wp:heading(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:heading\s*-->/gi,
      (_, inner) => String(inner || '').trim()
    );
    // Image / figure / list / quote — keep inner HTML, drop comments
    raw = raw.replace(
      /<!--\s*wp:(?:image|list|quote|embed|html|separator|spacer|group|columns|column)(?:\s+\{[^}]*\})?\s*-->([\s\S]*?)<!--\s*\/wp:\w+\s*-->/gi,
      (_, inner) => String(inner || '').trim()
    );
    // Any remaining wp comments
    raw = raw.replace(/<!--\s*\/?wp:[^>]*-->/gi, '');
  }

  // Multiple <br><br> → paragraph breaks for plain paste content
  if (!/<\/p>/i.test(raw) && /<br\s*\/?>\s*<br\s*\/?>/i.test(raw)) {
    const parts = raw
      .split(/<br\s*\/?>\s*<br\s*\/?>/i)
      .map((s) => s.replace(/<br\s*\/?>/gi, ' ').trim())
      .filter(Boolean);
    if (parts.length > 1) {
      raw = parts.map((p) => ( /^<p[\s>]/i.test(p) ? p : `<p>${p}</p>` )).join('\n');
    }
  }

  // Plain text with newlines, no HTML tags at all
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

/**
 * Split HTML into block chunks for mid-article ad injection
 * (modern news pattern: first ad after ~2 paras, then every N).
 */
function splitHtmlBlocks(html) {
  const raw = normalizeContentHtml(html);
  if (!raw) return [];

  // 1) Split on closing </p>
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

  // 2) Split on other block-level open tags
  const parts = raw
    .split(/(?=<(?:p|h[1-6]|blockquote|ul|ol|figure|div|hr|pre|table)\b)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 1) return parts;

  // 3) Fallback: wrap plain text / long run-on as sentence groups (~2–3 sentences each)
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

  const nodes = useMemo(() => {
    if (!blocks.length) return [];

    const out = [];
    let paraCount = 0;
    let adsPlaced = 0;
    let parasSinceAd = 0;
    let firstParaDone = false;

    blocks.forEach((block, idx) => {
      const isFirstPara = !firstParaDone && isParagraphBlock(block);
      if (isFirstPara) firstParaDone = true;

      out.push(
        <div
          key={`b-${idx}`}
          className={`${styles.block} ${isFirstPara && magazine ? styles.dropCap : ''}`.trim()}
          dangerouslySetInnerHTML={{ __html: block }}
        />
      );

      if (!isParagraphBlock(block)) return;

      paraCount += 1;
      parasSinceAd += 1;

      const canInsert =
        adsPlaced < IN_ARTICLE_MAX_ADS &&
        paraCount >= IN_ARTICLE_MIN_PARAS_BEFORE &&
        (adsPlaced === 0
          ? parasSinceAd >= IN_ARTICLE_MIN_PARAS_BEFORE
          : parasSinceAd >= IN_ARTICLE_EVERY_N_PARAS) &&
        idx < blocks.length - 1; // never after last block

      if (canInsert) {
        adsPlaced += 1;
        parasSinceAd = 0;
        out.push(
          <div key={`ad-inline-${adsPlaced}`} className={styles.inlineAdWrap}>
            <AdUnit
              variant="inArticle"
              slot={AD_SLOTS.inArticle}
              label="Advertisement"
            />
          </div>
        );
      }
    });

    return out;
  }, [blocks, magazine]);

  if (!nodes.length) {
    return (
      <div
        className={`${styles.content} ${magazine ? styles.magazine : ''} ${className}`.trim()}
      >
        <p>No content available.</p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.content} ${magazine ? styles.magazine : ''} ${className}`.trim()}
    >
      {nodes}
    </div>
  );
}
