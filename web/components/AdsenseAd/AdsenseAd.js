import { useMemo, useRef } from 'react';
import { ADSENSE_CLIENT } from '../../lib/ads';

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

  const client = useMemo(() => {
    return process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ADSENSE_CLIENT;
  }, []);

  // data-adtest only in dev so you can still see test inventory locally
  const adTest = process.env.NODE_ENV !== 'production' ? 'on' : undefined;

  const resolvedStyle = useMemo(() => {
    // AdSense needs real box size — never collapse to 0 width/height
    const base = fullWidthResponsive
      ? { display: 'block', width: '100%', minHeight: 90 }
      : { display: 'block', minHeight: 90 };
    return { ...base, ...(style || {}) };
  }, [fullWidthResponsive, style]);

  return (
    <ins
      ref={insRef}
      className={className ? `adsbygoogle ${className}` : 'adsbygoogle'}
      style={resolvedStyle}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format || 'auto'}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      {...(layout ? { 'data-ad-layout': layout } : {})}
      {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      data-adtest={adTest}
      data-cnb-ad="true"
    />
  );
}
