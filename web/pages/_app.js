import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// Single global CSS entry — Next 16 was dropping a second global import (admin.css),
// which left /admin unstyled in production while CSS modules still loaded.
import '../styles/globals.css';
import { initTheme } from '../lib/theme';

import Head from 'next/head';

const DEFAULT_ADSENSE_CLIENT = 'ca-pub-9036526646235532';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminRoute =
    (typeof router.pathname === 'string' && router.pathname.startsWith('/admin')) ||
    (typeof router.asPath === 'string' && router.asPath.startsWith('/admin'));
  const [adsScriptLoaded, setAdsScriptLoaded] = useState(false);

  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || DEFAULT_ADSENSE_CLIENT;

  useEffect(() => {
    // Screenshots show dark Verge; lock dark.
    initTheme({ defaultTheme: 'dark' });
    try {
      localStorage.setItem('cnb_theme', 'dark');
      localStorage.setItem('cnb_theme_mode', 'manual');
      document.documentElement.dataset.theme = 'dark';
    } catch (_) {}
  }, []);

  const refreshAds = useCallback(() => {
    try {
      const adEls = document.querySelectorAll('ins.adsbygoogle');
      adEls.forEach((el) => {
        // If AdSense has already touched this node, don't push again.
        // data-adsbygoogle-status is usually "done" (or sometimes other values).
        if (el.getAttribute('data-adsbygoogle-status')) return;
        if (el.dataset.cnbPushed === 'true') return;

        // Avoid the common "availableWidth=0" TagError.
        // Prefer width; height can be short for leaderboards (90px).
        const w = el.offsetWidth || el.parentElement?.offsetWidth || 0;
        const h = el.offsetHeight || el.parentElement?.offsetHeight || 0;
        if (w < 50) return;
        if (h > 0 && h < 40) return;

        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          el.dataset.cnbPushed = 'true';
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
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`;
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
  }, [isAdminRoute, refreshAds, adsenseClient]);

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

    // If the user resizes (or rails flip from display:none to visible), try again.
    const handleResize = () => {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => refreshAds());
      } else {
        refreshAds();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      window.removeEventListener('resize', handleResize);
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
