import '../styles/styles.css';
import '../styles/admin.css';

import Head from 'next/head';
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Script
        id="google-adsense"
        async
        strategy="afterInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9036526646235532"
        crossOrigin="anonymous"
      />
      <Component {...pageProps} />
    </>
  );
}
