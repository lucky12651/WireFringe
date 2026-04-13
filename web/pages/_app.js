import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/variables.css';
import '../styles/admin.css';

import Head from 'next/head';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Basic view tracking
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      fetch('/api/views/increment', { method: 'POST' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshAds = () => {
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
    };

    // Initial load
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
  }, [router.events]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
