import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var key='cnb_theme';var modeKey='cnb_theme_mode';var mode=localStorage.getItem(modeKey);var saved=localStorage.getItem(key);var theme=null;if(mode==='manual'&&(saved==='light'||saved==='dark')){theme=saved;}if(!theme){var h=(new Date()).getHours();theme=(h>=6&&h<18)?'light':'dark';}document.documentElement.dataset.theme=theme;}catch(e){}})();`,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
