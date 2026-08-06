import { useEffect, useId, useRef, useState } from 'react';
import AdsenseAd from '../AdsenseAd/AdsenseAd';
import { AD_SLOTS, loadAdsenseConfig } from '../../lib/ads';
import styles from './AdUnit.module.css';

/**
 * Modern news-style ad frame: label, min size, placement variants.
 * Variants: banner | inArticle | sidebar | rail | multipath
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
  const [adSlot, setAdSlot] = useState(slot || AD_SLOTS.default || '');
  const [adsEnabled, setAdsEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAdsenseConfig().then((cfg) => {
      if (cancelled) return;
      setAdsEnabled(!!cfg.enabled && !!cfg.clientId);
      if (slot) {
        setAdSlot(slot);
        return;
      }
      const map = {
        banner: cfg.slots?.leaderboard,
        multipath: cfg.slots?.multipath || cfg.slots?.default,
        inArticle: cfg.slots?.inArticle,
        sidebar: cfg.slots?.sidebar,
        rail: cfg.slots?.rail,
      };
      setAdSlot(map[variant] || cfg.slots?.default || AD_SLOTS.default);
    });
    return () => {
      cancelled = true;
    };
  }, [slot, variant]);

  const variantConfig = {
    banner: {
      format: format || 'horizontal',
      fullWidth: fullWidthResponsive !== false,
      style: { minHeight: 90, width: '100%' },
      frameClass: styles.banner,
    },
    multipath: {
      format: format || 'auto',
      fullWidth: fullWidthResponsive !== false,
      style: { minHeight: 250, width: '100%' },
      frameClass: styles.multipath,
    },
    inArticle: {
      // fluid + in-article layout is the modern mid-story AdSense format
      format: format || 'fluid',
      fullWidth: true,
      style: { display: 'block', minHeight: 280, width: '100%', textAlign: 'center' },
      layout: 'in-article',
      frameClass: styles.inArticle,
    },
    sidebar: {
      format: format || 'rectangle',
      fullWidth: false,
      style: { minHeight: 250, width: '100%', maxWidth: 300 },
      frameClass: styles.sidebar,
    },
    rail: {
      format: format || 'vertical',
      fullWidth: false,
      style: { width: 160, minHeight: 600 },
      frameClass: styles.rail,
    },
  };

  const cfg = variantConfig[variant] || variantConfig.banner;

  // Nudge AdSense to fill when this unit mounts (route changes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tryPush = () => {
      const root = unitRef.current;
      if (!root) return;
      const el = root.querySelector('ins.adsbygoogle');
      if (!el) return;
      if (el.getAttribute('data-adsbygoogle-status')) return;
      if (el.dataset.cnbPushed === 'true') return;
      const w = el.offsetWidth || root.offsetWidth || 0;
      const h = el.offsetHeight || root.offsetHeight || 0;
      if (w < 50 || h < 50) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        el.dataset.cnbPushed = 'true';
      } catch {
        // ignore
      }
    };

    const t1 = window.setTimeout(tryPush, 120);
    const t2 = window.setTimeout(tryPush, 600);
    const t3 = window.setTimeout(tryPush, 1500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [adSlot, variant, reactId]);

  if (!adsEnabled || !adSlot) {
    return null;
  }

  return (
    <aside
      ref={unitRef}
      className={`${styles.unit} ${cfg.frameClass} ${className}`.trim()}
      aria-label={label}
      data-ad-variant={variant}
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
