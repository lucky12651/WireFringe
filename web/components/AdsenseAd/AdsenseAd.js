import { useEffect, useMemo, useRef, useState } from 'react';
import { loadAdsenseConfig } from '../../lib/ads';

export default function AdsenseAd({
  slot,
  format = 'auto',
  fullWidthResponsive = true,
  style,
  className,
  layout,
  layoutKey,
}) {
  const insRef = useRef(null);
  const [client, setClient] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [resolvedSlot, setResolvedSlot] = useState(slot || '');

  useEffect(() => {
    let cancelled = false;
    loadAdsenseConfig().then((cfg) => {
      if (cancelled) return;
      setEnabled(!!cfg.enabled && !!cfg.clientId);
      setClient(cfg.clientId || '');
      if (slot) {
        setResolvedSlot(slot);
      } else if (cfg.slots?.default) {
        setResolvedSlot(cfg.slots.default);
      } else {
        setResolvedSlot('');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  // data-adtest only in dev so you can still see test inventory locally
  const adTest = process.env.NODE_ENV !== 'production' ? 'on' : undefined;

  const resolvedStyle = useMemo(() => {
    // AdSense needs real box size — never collapse to 0 width/height
    const base = fullWidthResponsive
      ? { display: 'block', width: '100%', minHeight: 90 }
      : { display: 'block', minHeight: 90 };
    return { ...base, ...(style || {}) };
  }, [fullWidthResponsive, style]);

  if (!enabled || !client || !resolvedSlot) {
    return null;
  }

  return (
    <ins
      ref={insRef}
      className={className ? `adsbygoogle ${className}` : 'adsbygoogle'}
      style={resolvedStyle}
      data-ad-client={client}
      data-ad-slot={resolvedSlot}
      data-ad-format={format || 'auto'}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      {...(layout ? { 'data-ad-layout': layout } : {})}
      {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      data-adtest={adTest}
      data-cnb-ad="true"
    />
  );
}
