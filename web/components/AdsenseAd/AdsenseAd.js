import { useMemo, useRef } from 'react';

const DEFAULT_CLIENT = 'ca-pub-9036526646235532';

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
    return process.env.NEXT_PUBLIC_ADSENSE_CLIENT || DEFAULT_CLIENT;
  }, []);

  const adTest = process.env.NODE_ENV !== 'production' ? 'on' : undefined;

  const resolvedStyle = useMemo(() => {
    // For responsive/auto ads, AdSense needs a real width.
    // In flex containers, a block element with no content can shrink to 0.
    const base = fullWidthResponsive ? { width: '100%' } : null;
    return { display: 'block', ...(base || {}), ...(style || {}) };
  }, [fullWidthResponsive, style]);

  return (
    <ins
      ref={insRef}
      className={className ? `adsbygoogle ${className}` : 'adsbygoogle'}
      style={resolvedStyle}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      data-ad-layout={layout}
      data-ad-layout-key={layoutKey}
      data-adtest={adTest}
      data-cnb-ad="true"
    />
  );
}
