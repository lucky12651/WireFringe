import Head from 'next/head';
import Header from '../Header/Header';
import AdRails from '../AdRails/AdRails';
import styles from './Layout.module.css';

export default function Layout({ 
  children, 
  title = 'Coffee n Blog – Latest News, Tech, Business & Trending',
  description = 'Stay informed with the latest stories from Coffee n Blog. We cover AI, technology, markets, and more with a focus on quality and verified facts.',
  headerProps = {}
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      
      <div className={styles.layout}>
        <Header {...headerProps} />
        
        <AdRails />
        
        <main className={styles.main}>
          <div className={styles.container}>
            {children}
          </div>
        </main>
        
        
      </div>
    </>
  );
}
