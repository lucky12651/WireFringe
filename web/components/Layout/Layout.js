import Head from 'next/head';
import Link from 'next/link';
import Header from '../Header/Header';
import AdRails from '../AdRails/AdRails';
import BrandLogo from '../BrandLogo/BrandLogo';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '../../lib/site';

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

      <div className="min-h-screen flex flex-col bg-transparent text-white">
        <Header {...headerProps} />
        {showAdRails ? <AdRails /> : null}
        <main className="flex-1 bg-transparent" id="content">
          <div className="max-w-site mx-auto w-full px-4 sm:px-7">{children}</div>
        </main>

        <footer className="relative bg-gradient-to-b from-transparent from-0% via-black via-[18%] to-black border-t border-white/[0.06] pt-[72px] px-6 pb-[52px] text-center">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(420px,60%)] h-px bg-gradient-to-r from-transparent via-mint/45 to-transparent"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-center gap-10 flex-wrap mb-7 max-w-site mx-auto">
            <div className="flex items-center max-sm:[&_span]:text-[32px]">
              <BrandLogo size="xl" href="/" />
            </div>
            <div className="flex gap-3.5 items-center">
              {[
                { href: 'https://facebook.com', label: 'Facebook', icon: 'f' },
                { href: 'https://threads.net', label: 'Threads', icon: '◎' },
                { href: 'https://instagram.com', label: 'Instagram', icon: '⌂' },
                { href: 'https://youtube.com', label: 'YouTube', icon: '▶' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-[38px] h-[38px] border-[1.5px] border-mint/70 rounded-full text-mint flex items-center justify-center text-sm transition-all duration-200 ease-out hover:bg-mint hover:text-black hover:border-mint hover:scale-110 hover:-translate-y-0.5 hover:shadow-mint"
                >
                  {s.icon}
                </a>
              ))}
              <Link
                href="/archives"
                aria-label="Archives"
                className="w-[38px] h-[38px] border-[1.5px] border-mint/70 rounded-full text-mint flex items-center justify-center text-sm transition-all duration-200 ease-out hover:bg-mint hover:text-black hover:border-mint hover:scale-110 hover:-translate-y-0.5 hover:shadow-mint"
              >
                ≈
              </Link>
            </div>
          </div>

          <nav
            className="flex flex-wrap justify-center gap-x-2.5 gap-y-2 text-sm text-[#ccc] mb-4 [&_a:hover]:text-mint [&_span]:text-[#444]"
            aria-label="Footer"
          >
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

          <div className="flex flex-wrap justify-center gap-2 text-xs text-[#666] mb-4 [&_a]:text-[#888] [&_a:hover]:text-mint [&_span]:text-[#555]">
            <Link href="/terms">Terms of Use</Link>
            <span>|</span>
            <Link href="/privacy">Privacy Notice</Link>
            <span>|</span>
            <Link href="/cookies">Cookie Policy</Link>
          </div>

          <p className="text-[11px] text-[#555] tracking-wide">
            © {new Date().getFullYear()} {SITE_NAME.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
        </footer>
      </div>
    </>
  );
}
