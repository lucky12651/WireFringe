import { useEffect } from 'react';
import '../styles/variables.css';
import '../styles/admin.css';

import Head from 'next/head';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Basic view tracking
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      fetch('/api/views/increment', { method: 'POST' }).catch(() => {});
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
