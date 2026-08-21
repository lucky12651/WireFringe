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
import { injectHeadingIds } from '../../lib/articleExtras';
import {
  decoratePullQuote,
  isParagraphBlock,
  prepareArticleHtml,
  splitHtmlBlocks,
} from '../../lib/articleHtml';
import { ImageLightbox } from '../PostDesigns/reading';

export default function ArticleBody({ html, title = '', className = '', magazine = false }) {
  const prepared = useMemo(
    () => injectHeadingIds(prepareArticleHtml(html, title)),
    [html, title]
  );
  const blocks = useMemo(() => decoratePullQuote(splitHtmlBlocks(prepared)), [prepared]);
  const [lightbox, setLightbox] = useState('');
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

    blocks.forEach((item, idx) => {
      const block = typeof item === 'string' ? item : item.html;
      const pull = typeof item === 'object' && item.pull;
      const isFirstPara = !firstParaDone && isParagraphBlock(block);
      if (isFirstPara) firstParaDone = true;

      const isQuote = pull || /^<blockquote/i.test(String(block || '').trim());
      out.push(
        <div
          key={`b-${idx}`}
          className={cn(
            isFirstPara && 'article-lead',
            isFirstPara && magazine && 'drop-cap',
            isQuote && 'pull-quote'
          )}
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

  return (
    <div
      className={bodyClass}
      onClick={(e) => {
        const img = e.target.closest?.('img');
        if (img?.src && img.closest('.article-body')) setLightbox(img.src);
      }}
    >
      {nodes}
      {lightbox ? <ImageLightbox src={lightbox} onClose={() => setLightbox('')} /> : null}
    </div>
  );
}
