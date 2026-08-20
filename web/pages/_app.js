import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SWRConfig } from 'swr';
// Single global CSS entry: Tailwind + design tokens + shared helpers (GridWork-style).
import '../styles/globals.css';
import { initTheme } from '../lib/theme';
import { loadAdsenseConfig } from '../lib/ads';

import Head from 'next/head';
import { AuthProvider } from '../hooks';

function swrOnErrorRetry(error, _key, _config, revalidate, { retryCount }) {
  // 401/403 on /api/admin/* are not flaky — retrying them looks like brute-force
  // logins and gets the visitor IP banned by the server firewall.
  if (error?.status === 401 || error?.status === 403) return;
  if (retryCount >= 2) return;
  setTimeout(() => revalidate({ retryCount }), 3000);
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminRoute =
    (typeof router.pathname === 'string' && router.pathname.startsWith('/admin')) ||
    (typeof router.asPath === 'string' && router.asPath.startsWith('/admin'));
  const [adsScriptLoaded, setAdsScriptLoaded] = useState(false);
  // Only from Admin → AdSense (API). Never hardcode / env pub IDs.
  const [adsenseClient, setAdsenseClient] = useState('');
  const [adsEnabled, setAdsEnabled] = useState(false);

  useEffect(() => {
    initTheme({ defaultTheme: 'dark' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAdsenseConfig().then((cfg) => {
      if (cancelled) return;
      const client = String(cfg.clientId || '').trim();
      setAdsEnabled(!!cfg.enabled && !!client);
      setAdsenseClient(client);
    });
    return () => {
      cancelled = true;
    };
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
    if (!adsEnabled || !adsenseClient) return;

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
  }, [isAdminRoute, refreshAds, adsenseClient, adsEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAdminRoute) return;
    if (!adsEnabled) return;
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
  }, [router.events, isAdminRoute, adsScriptLoaded, refreshAds, adsEnabled]);

  return (
    <SWRConfig value={{ onErrorRetry: swrOnErrorRetry, errorRetryCount: 2 }}>
      <AuthProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <Component {...pageProps} />
      </AuthProvider>
    </SWRConfig>
  );
}
