import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.theme='dark';try{localStorage.setItem('cnb_theme','dark');localStorage.setItem('cnb_theme_mode','manual');}catch(e){}`,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
