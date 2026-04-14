import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import '../styles/variables.css';
import '../styles/admin.css';

import Head from 'next/head';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminRoute =
    (typeof router.pathname === 'string' && router.pathname.startsWith('/admin')) ||
    (typeof router.asPath === 'string' && router.asPath.startsWith('/admin'));
  const [adsScriptLoaded, setAdsScriptLoaded] = useState(false);

  const refreshAds = useCallback(() => {
    try {
      const adEls = document.querySelectorAll('ins.adsbygoogle');
      adEls.forEach((el) => {
        if (el.getAttribute('data-adsbygoogle-status') === 'done') return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Basic view tracking
    if (typeof window !== 'undefined' && !isAdminRoute) {
      fetch('/api/views/increment', { method: 'POST' }).catch(() => {});
    }
  }, [isAdminRoute]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAdminRoute) return;
    if (!adsScriptLoaded) return;

    // Initial load (after script is loaded)
    refreshAds();

    // Re-run after client-side navigation
    const handleRouteChange = () => {
      // Let the new page render before requesting ads
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => refreshAds());
      } else {
        refreshAds();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, isAdminRoute, adsScriptLoaded, refreshAds]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {!isAdminRoute && (
        <Script
          id="adsbygoogle-script"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9036526646235532"
          crossOrigin="anonymous"
          onLoad={() => {
            setAdsScriptLoaded(true);
            if (typeof window !== 'undefined') {
              if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(() => refreshAds());
              } else {
                refreshAds();
              }
            }
          }}
        />
      )}

      <Component {...pageProps} />
    </>
  );
}
