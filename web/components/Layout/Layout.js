import Head from 'next/head';
import Link from 'next/link';
import Header from '../Header/Header';
import AdRails from '../AdRails/AdRails';
import styles from './Layout.module.css';

export default function Layout({
  children,
  title = 'Coffee n Blog – Tech, Science, Culture',
  description = 'Coffee n Blog is about technology and how it makes us feel.',
  keywords = 'tech, AI, science, culture, news',
  headerProps = {},
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#0a0a0a" />
      </Head>

      <div className={styles.layout}>
        <Header {...headerProps} />
        <AdRails />
        <main className={styles.main} id="content">
          <div className={styles.container}>{children}</div>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerTop}>
            <div className={styles.footerLogo}>
              Coffee<span>n</span>Blog
            </div>
            <div className={styles.social}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                f
              </a>
              <a href="https://threads.net" target="_blank" rel="noreferrer" aria-label="Threads">
                ◎
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                ⌂
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                ▶
              </a>
              <a href="/api/health" aria-label="RSS">
                ≈
              </a>
            </div>
          </div>

          <nav className={styles.footerLinks}>
            <Link href="/">Contact</Link>
            <span>|</span>
            <Link href="/">Tip Us</Link>
            <span>|</span>
            <Link href="/">Community Guidelines</Link>
            <span>|</span>
            <Link href="/">Archives</Link>
            <span>|</span>
            <Link href="/">About</Link>
            <span>|</span>
            <Link href="/admin">Admin</Link>
            <span>|</span>
            <Link href="/login">Sign In</Link>
          </nav>

          <div className={styles.footerLegal}>
            <span>Terms of Use</span>
            <span>|</span>
            <span>Privacy Notice</span>
            <span>|</span>
            <span>Cookie Policy</span>
          </div>

          <p className={styles.copyright}>
            © {new Date().getFullYear()} COFFEE N BLOG. ALL RIGHTS RESERVED.
          </p>
        </footer>
      </div>
    </>
  );
}
