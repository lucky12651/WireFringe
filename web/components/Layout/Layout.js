import Head from 'next/head';
import Link from 'next/link';
import Header from '../Header/Header';
import AdRails from '../AdRails/AdRails';
import BrandLogo from '../BrandLogo/BrandLogo';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '../../lib/site';
import styles from './Layout.module.css';

export default function Layout({
  children,
  title = `${SITE_NAME} – Tech, Science, Culture`,
  description = SITE_DESCRIPTION || SITE_TAGLINE,
  keywords = 'tech, AI, science, culture, news',
  headerProps = {},
  showAdRails = true,
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
        {showAdRails ? <AdRails /> : null}
        <main className={styles.main} id="content">
          <div className={styles.container}>{children}</div>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerTop}>
            <div className={styles.footerLogo}>
              <BrandLogo size="xl" href="/" />
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
              <Link href="/archives" aria-label="Archives">
                ≈
              </Link>
            </div>
          </div>

          <nav className={styles.footerLinks} aria-label="Footer">
            <Link href="/contact">Contact</Link>
            <span>|</span>
            <Link href="/tip-us">Tip Us</Link>
            <span>|</span>
            <Link href="/community-guidelines">Community Guidelines</Link>
            <span>|</span>
            <Link href="/archives">Archives</Link>
            <span>|</span>
            <Link href="/about">About</Link>
            <span>|</span>
            <Link href="/disclaimer">Disclaimer</Link>
            <span>|</span>
            <Link href="/admin">Admin</Link>
            <span>|</span>
            <Link href="/login">Sign In</Link>
          </nav>

          <div className={styles.footerLegal}>
            <Link href="/terms">Terms of Use</Link>
            <span>|</span>
            <Link href="/privacy">Privacy Notice</Link>
            <span>|</span>
            <Link href="/cookies">Cookie Policy</Link>
          </div>

          <p className={styles.copyright}>
            © {new Date().getFullYear()} {SITE_NAME.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
        </footer>
      </div>
    </>
  );
}
