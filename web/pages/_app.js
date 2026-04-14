import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import '../styles/variables.css';
import '../styles/admin.css';
import { initTheme, startAutoThemeSync } from '../lib/theme';

import Head from 'next/head';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminRoute =
    (typeof router.pathname === 'string' && router.pathname.startsWith('/admin')) ||
    (typeof router.asPath === 'string' && router.asPath.startsWith('/admin'));
  const [adsScriptLoaded, setAdsScriptLoaded] = useState(false);

  useEffect(() => {
    // Apply the theme immediately on first client render.
    initTheme({ defaultTheme: 'auto' });

    // If the user has not explicitly selected a theme, auto-switch at 6am/6pm.
    const stop = startAutoThemeSync();
    return () => stop();
  }, []);

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
    // Load AdSense without Next's <Script> so AdSense doesn't warn about data-nscript.
    if (typeof window === 'undefined') return;
    if (isAdminRoute) return;

    const existing = document.getElementById('adsbygoogle-script');
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        setAdsScriptLoaded(true);
      } else {
        const onLoad = () => {
          existing.dataset.loaded = 'true';
          setAdsScriptLoaded(true);
          if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => refreshAds());
          } else {
            refreshAds();
          }
        };
        existing.addEventListener('load', onLoad, { once: true });
        return () => existing.removeEventListener('load', onLoad);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'adsbygoogle-script';
    script.async = true;
    script.src =
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9036526646235532';
    script.crossOrigin = 'anonymous';
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        setAdsScriptLoaded(true);
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => refreshAds());
        } else {
          refreshAds();
        }
      },
      { once: true }
    );

    document.head.appendChild(script);
    // Intentionally do not remove the script on unmount; it should persist across navigations.
  }, [isAdminRoute, refreshAds]);

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

      <Component {...pageProps} />
    </>
  );
}
