import { useEffect, useId, useRef } from 'react';
import AdsenseAd from '../AdsenseAd/AdsenseAd';
import { AD_SLOTS } from '../../lib/ads';
import styles from './AdUnit.module.css';

function isAdFilled(ins) {
  if (!ins) return false;
  const status = (ins.getAttribute('data-ad-status') || '').toLowerCase();
  if (status === 'unfilled') return false;
  if (status === 'filled') return true;
  // Some fills only expose an iframe with real height
  const iframe = ins.querySelector('iframe');
  if (iframe) {
    const h = iframe.offsetHeight || Number(iframe.getAttribute('height')) || 0;
    const w = iframe.offsetWidth || Number(iframe.getAttribute('width')) || 0;
    if (h > 24 && w > 24) return true;
  }
  // Client-status attribute used by older snippets
  const clientStatus = (ins.getAttribute('data-adsbygoogle-status') || '').toLowerCase();
  if (clientStatus === 'done') {
    // done + no iframe almost always means unfilled
    return !!(iframe && (iframe.offsetHeight || 0) > 24);
  }
  return false;
}

/**
 * Modern news-style ad frame: label, min size, placement variants.
 * Variants: banner | inArticle | sidebar | rail | multipath
 * Empty / unfilled units are hidden so they don't leave black dead space.
 */
export default function AdUnit({
  slot,
  variant = 'banner',
  format,
  fullWidthResponsive,
  className = '',
  label = 'Advertisement',
}) {
  const unitRef = useRef(null);
  const reactId = useId();
  const adSlot = slot || AD_SLOTS.default;

  const variantConfig = {
    banner: {
      format: format || 'horizontal',
      fullWidth: fullWidthResponsive !== false,
      style: { minHeight: 90, width: '100%', maxHeight: 120 },
      frameClass: styles.banner,
    },
    multipath: {
      format: format || 'auto',
      fullWidth: fullWidthResponsive !== false,
      style: { minHeight: 200, width: '100%', maxHeight: 280 },
      frameClass: styles.multipath,
    },
    inArticle: {
      format: format || 'fluid',
      fullWidth: true,
      style: { display: 'block', minHeight: 200, width: '100%', textAlign: 'center', maxHeight: 320 },
      layout: 'in-article',
      frameClass: styles.inArticle,
    },
    sidebar: {
      format: format || 'rectangle',
      fullWidth: false,
      style: { minHeight: 200, width: '100%', maxWidth: 300, maxHeight: 280 },
      frameClass: styles.sidebar,
    },
    rail: {
      format: format || 'vertical',
      fullWidth: false,
      style: { width: 160, minHeight: 400, maxHeight: 600 },
      frameClass: styles.rail,
    },
  };

  const cfg = variantConfig[variant] || variantConfig.banner;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = unitRef.current;
    if (!root) return;

    const markEmpty = (empty) => {
      root.dataset.adEmpty = empty ? 'true' : 'false';
      root.setAttribute('aria-hidden', empty ? 'true' : 'false');
      if (empty) {
        root.style.display = 'none';
      } else {
        root.style.display = '';
      }
    };

    const evaluate = () => {
      const el = root.querySelector('ins.adsbygoogle');
      if (!el) return;
      const status = (el.getAttribute('data-ad-status') || '').toLowerCase();
      if (status === 'unfilled') {
        markEmpty(true);
        return;
      }
      if (isAdFilled(el)) {
        markEmpty(false);
      }
    };

    const tryPush = () => {
      const el = root.querySelector('ins.adsbygoogle');
      if (!el) return;
      if (el.getAttribute('data-adsbygoogle-status')) {
        evaluate();
        return;
      }
      if (el.dataset.cnbPushed === 'true') {
        evaluate();
        return;
      }
      const w = el.offsetWidth || root.offsetWidth || 0;
      const h = el.offsetHeight || root.offsetHeight || 0;
      if (w < 50 || h < 40) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        el.dataset.cnbPushed = 'true';
      } catch {
        // ignore
      }
      evaluate();
    };

    const t1 = window.setTimeout(tryPush, 120);
    const t2 = window.setTimeout(tryPush, 600);
    const t3 = window.setTimeout(tryPush, 1500);
    // If still unfilled after a few seconds, hide the dead frame
    const tHide = window.setTimeout(() => {
      const el = root.querySelector('ins.adsbygoogle');
      if (!el || !isAdFilled(el)) markEmpty(true);
    }, 3500);

    const observer = new MutationObserver(() => evaluate());
    observer.observe(root, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status', 'style', 'class'],
      childList: true,
    });

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(tHide);
      observer.disconnect();
    };
  }, [adSlot, variant, reactId]);

  return (
    <aside
      ref={unitRef}
      className={`${styles.unit} ${cfg.frameClass} ${className}`.trim()}
      aria-label={label}
      data-ad-variant={variant}
      data-ad-empty="false"
    >
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        <span className={styles.labelLine} aria-hidden="true" />
      </div>
      <div className={styles.slot}>
        <AdsenseAd
          slot={adSlot}
          format={cfg.format}
          fullWidthResponsive={cfg.fullWidth}
          layout={cfg.layout}
          style={cfg.style}
        />
      </div>
    </aside>
  );
}
