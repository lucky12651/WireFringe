import { useEffect, useId, useRef, useState } from 'react';
import AdsenseAd from '../AdsenseAd/AdsenseAd';
import { AD_SLOTS, loadAdsenseConfig } from '../../lib/ads';
import { cn } from '../../lib/utils';

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
      unitClass: 'my-6 mb-8 max-md:my-[22px]',
      slotClass: 'min-h-[100px] p-2.5 px-2 max-md:min-h-[90px]',
      hideLabel: false,
      centerLabel: false,
    },
    multipath: {
      format: format || 'auto',
      fullWidth: fullWidthResponsive !== false,
      style: { minHeight: 250, width: '100%' },
      unitClass: 'my-9 mb-8 pt-5 pb-2 border-t border-b border-line-dim max-md:my-7 max-md:mb-6 max-md:pt-4 max-md:pb-1',
      slotClass: 'min-h-[280px] p-3.5 px-3 bg-bg-card border-line max-md:min-h-[250px]',
      hideLabel: false,
      centerLabel: false,
    },
    inArticle: {
      format: format || 'fluid',
      fullWidth: true,
      style: { display: 'block', minHeight: 280, width: '100%', textAlign: 'center' },
      layout: 'in-article',
      unitClass: 'my-10 max-md:my-7 max-md:-mx-1 pt-2 pb-1',
      slotClass:
        'min-h-[280px] p-4 px-3 bg-bg-card border border-line rounded-sm max-md:min-h-[250px] max-md:p-3 max-md:px-2 max-md:rounded-sm',
      hideLabel: false,
      centerLabel: true,
    },
    sidebar: {
      format: format || 'rectangle',
      fullWidth: false,
      style: { minHeight: 250, width: '100%', maxWidth: 300 },
      unitClass: 'm-0 mb-5',
      slotClass: 'min-h-[260px] p-2.5 rounded-sm',
      hideLabel: false,
      centerLabel: false,
    },
    rail: {
      format: format || 'vertical',
      fullWidth: false,
      style: { width: 160, minHeight: 600 },
      unitClass: 'm-0',
      slotClass: 'min-h-[600px] w-40 p-0 bg-transparent border-0 rounded-none',
      hideLabel: true,
      centerLabel: false,
      noStripe: true,
    },
  };

  const cfg = variantConfig[variant] || variantConfig.banner;

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
      className={cn(
        'w-full flex flex-col items-stretch gap-2 opacity-95',
        cfg.unitClass,
        className
      )}
      aria-label={label}
      data-ad-variant={variant}
    >
      {!cfg.hideLabel ? (
        <div
          className={cn(
            'flex items-center gap-2.5 w-full',
            cfg.centerLabel && 'justify-center mb-0.5'
          )}
        >
          <span
            className={cn(
              'font-mono text-[9px] font-bold tracking-[0.16em] uppercase text-ink-muted shrink-0',
              cfg.centerLabel && 'tracking-[0.18em]'
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              'flex-1 h-px bg-gradient-to-r from-line via-line-light to-transparent',
              cfg.centerLabel && 'max-w-12 bg-line'
            )}
            aria-hidden="true"
          />
        </div>
      ) : null}
      <div
        className={cn(
          'w-full min-w-0 flex justify-center items-center bg-bg-card border border-line rounded-sm overflow-hidden relative',
          cfg.slotClass,
          '[&_ins.adsbygoogle]:relative [&_ins.adsbygoogle]:z-[1] [&_ins.adsbygoogle]:!min-w-full [&_ins.adsbygoogle]:!block'
        )}
      >
        {!cfg.noStripe ? (
          <div
            className="absolute inset-0 pointer-events-none z-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,rgba(255,255,255,0.012)_10px,rgba(255,255,255,0.012)_20px)]"
            aria-hidden="true"
          />
        ) : null}
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
