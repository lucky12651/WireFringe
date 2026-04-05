import '../styles/styles.css';
import '../styles/admin.css';

import Head from 'next/head';
import { useEffect } from 'react';

import { initTheme } from '../lib/theme';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    initTheme({ defaultTheme: 'dark' });
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
