import Head from 'next/head';
import Link from 'next/link';
import Header from '../Header/Header';
import AdRails from '../AdRails/AdRails';
import BrandLogo from '../BrandLogo/BrandLogo';
import MobileBottomNav from '../MobileBottomNav/MobileBottomNav';
import { ArchivesIcon, SOCIAL_LINKS } from '../SocialIcons/SocialIcons';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '../../lib/site';
import { DEFAULT_ACCENT, normalizeAccentColor } from '../../lib/accents';
import { useAuth } from '../../hooks';

export default function Layout({
  children,
  title = `${SITE_NAME} – Tech, Science, Culture`,
  description = SITE_DESCRIPTION || SITE_TAGLINE,
  keywords = 'tech, AI, science, culture, news',
  headerProps = {},
  showAdRails = true,
  accentColor = null,
  headerHero = null,
  fullWidth = false,
}) {
  const { me } = useAuth();
  const headerUser = me || null;
  const accent = accentColor ? normalizeAccentColor(accentColor, DEFAULT_ACCENT) : null;

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
        <meta name="theme-color" content={accent || '#0a0a0a'} />
      </Head>

      <div
        className="min-h-screen flex flex-col bg-transparent text-ink"
        style={accent ? { '--header-accent': accent } : undefined}
      >
        <Header {...headerProps} user={headerUser} accentColor={accent} />
        {headerHero ? (
          <div className="relative mt-[calc(var(--header-height)*-1)] pt-[var(--header-height)]">
            {headerHero}
          </div>
        ) : null}
        {showAdRails ? <AdRails /> : null}
        <main className="flex-1 bg-transparent pt-4 md:pt-5 pb-[calc(var(--bottom-nav-height)+12px)] min-[1001px]:pb-0" id="content">
          <div className={fullWidth ? 'w-full' : 'max-w-site mx-auto w-full px-4 sm:px-7'}>
            {children}
          </div>
        </main>

        <footer className="relative bg-gradient-to-b from-transparent from-0% via-bg via-[18%] to-bg border-t border-line pt-[72px] px-6 pb-[calc(52px+var(--bottom-nav-height))] min-[1001px]:pb-[52px] text-center">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(420px,60%)] h-px bg-gradient-to-r from-transparent via-mint/45 to-transparent"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-center gap-10 flex-wrap mb-7 max-w-site mx-auto">
            <div className="flex items-center max-sm:[&_span]:text-[32px]">
              <BrandLogo size="xl" href="/" />
            </div>
            <div className="flex gap-3.5 items-center">
              {SOCIAL_LINKS.filter((s) => s.label !== 'X').map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-[38px] h-[38px] border-[1.5px] border-mint/70 rounded-full text-mint flex items-center justify-center transition-all duration-200 ease-out hover:bg-mint hover:text-black hover:border-mint hover:scale-110 hover:-translate-y-0.5 hover:shadow-mint"
                >
                  <s.Icon />
                </a>
              ))}
              <Link
                href="/archives"
                aria-label="Archives"
                className="w-[38px] h-[38px] border-[1.5px] border-mint/70 rounded-full text-mint flex items-center justify-center transition-all duration-200 ease-out hover:bg-mint hover:text-black hover:border-mint hover:scale-110 hover:-translate-y-0.5 hover:shadow-mint"
              >
                <ArchivesIcon />
              </Link>
            </div>
          </div>

          <nav
            className="flex flex-wrap justify-center gap-x-2.5 gap-y-2 text-sm text-ink-secondary mb-4 [&_a:hover]:text-mint [&_span]:text-ink-muted"
            aria-label="Footer"
          >
            <Link href="/contact">Contact</Link>
            <span>|</span>
            <Link href="/tip-us">Tip Us</Link>
            <span>|</span>
            <Link href="/masthead">Masthead</Link>
            <span>|</span>
            <Link href="/sourcing">Sourcing</Link>
            <span>|</span>
            <Link href="/feed.xml">RSS</Link>
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

          <div className="flex flex-wrap justify-center gap-2 text-xs text-ink-muted mb-5 [&_a]:text-ink-tertiary [&_a:hover]:text-mint [&_span]:text-ink-muted">
            <Link href="/terms">Terms of Use</Link>
            <span>|</span>
            <Link href="/privacy">Privacy Notice</Link>
            <span>|</span>
            <Link href="/cookies">Cookie Policy</Link>
          </div>

          <p className="text-[11px] text-ink-muted tracking-wide">
            © {new Date().getFullYear()} {SITE_NAME.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
        </footer>
        <MobileBottomNav />
      </div>
    </>
  );
}
