import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Link from 'next/link';
import BrandLogo from '../BrandLogo/BrandLogo';
import { SOCIAL_LINKS } from '../SocialIcons/SocialIcons';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { fetcher } from '../../lib/api';

const NAV = [
  { label: 'Tech', href: '/section/tech' },
  { label: 'AI', href: '/section/ai' },
  { label: 'Business', href: '/section/business' },
  { label: 'Finance', href: '/section/finance' },
  { label: 'India', href: '/section/india' },
  { label: 'Sports', href: '/section/sports' },
];

const DRAWER_SECTIONS = [
  {
    title: 'Sections',
    items: [
      { label: 'Tech', href: '/section/tech' },
      { label: 'AI', href: '/section/ai' },
      { label: 'Business', href: '/section/business' },
      { label: 'Finance', href: '/section/finance' },
      { label: 'India', href: '/section/india' },
      { label: 'Sports', href: '/section/sports' },
      { label: 'Masthead', href: '/masthead' },
      { label: 'Sourcing', href: '/sourcing' },
    ],
  },
  {
    title: 'Features',
    items: [
      { label: 'Latest', href: '/' },
      { label: 'Most Popular', href: '/#most-popular' },
      { label: 'For You', href: '/for-you' },
    ],
  },
];

function slugifyCategory(cat) {
  return cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function Header({
  searchQuery = '',
  onSearchChange,
  activeCategory = 'All',
  onCategoryChange,
  user = null,
  accentColor = null,
  articleTitle = '',
  headerVariant = 'theme',
}) {
  const router = useRouter();
  const { logout: authLogout } = useAuth();
  const { data: catalog } = useSWR('/api/catalog', fetcher, { revalidateOnFocus: false });
  const navItems =
    Array.isArray(catalog?.header) && catalog.header.length
      ? catalog.header.map((s) => ({ label: s.label, href: s.href }))
      : NAV;
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const headerRef = useRef(null);
  const compactRef = useRef(false);

  useEffect(() => setLocalSearch(searchQuery), [searchQuery]);
  useEffect(() => {
    const t = setTimeout(() => onSearchChange?.(localSearch), 350);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 40);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const track = Boolean(articleTitle || accentColor);
    if (!track || typeof window === 'undefined') {
      setScrolled(false);
      return;
    }

    let frame = 0;
    const apply = () => {
      const next = window.scrollY > 24;
      setScrolled((prev) => (prev === next ? prev : next));
      frame = 0;
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [articleTitle, accentColor]);

  const compact = Boolean(articleTitle) && scrolled;
  compactRef.current = compact;

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof window === 'undefined') return;

    const applyHeight = () => {
      if (compactRef.current) return;
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--header-height', `${h}px`);
    };

    applyHeight();
    const ro = new ResizeObserver(applyHeight);
    ro.observe(el);
    window.addEventListener('resize', applyHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', applyHeight);
    };
  }, [searchOpen, accentColor, articleTitle]);

  const goCat = (cat) => {
    setMenuOpen(false);
    if (typeof cat === 'string' && cat.startsWith('/')) {
      router.push(cat);
      return;
    }
    if (onCategoryChange) onCategoryChange(cat);
    else if (cat === 'All') router.push('/');
    else router.push(`/?category=${slugifyCategory(cat)}`);
  };

  const goHref = (href) => {
    setMenuOpen(false);
    router.push(href);
  };

  const logout = async () => {
    try {
      await authLogout();
    } finally {
      window.location.href = '/';
    }
  };

  const painted =
    headerVariant === 'solid' || headerVariant === 'solid-inverse' || headerVariant === 'overlay';

  const headerClass = cn(
    'sticky top-0 z-[11000] w-full',
    headerVariant === 'solid' && 'post-header-solid on-accent',
    headerVariant === 'overlay' && !compact && 'post-header on-accent',
    headerVariant === 'overlay' && compact && 'post-header-solid on-accent',
    headerVariant === 'solid-inverse' && 'post-header-solid post-header-inverse',
    !painted && 'site-header-bar'
  );

  const iconBtn =
    'inline-flex w-[34px] h-[30px] items-center justify-center bg-transparent border-0 text-ink cursor-pointer p-0 rounded-md transition-all hover:text-mint hover:bg-mint/10';

  const actionIcons = (
    <span className="inline-flex items-center shrink-0">
      <button
        type="button"
        className={cn(iconBtn, 'hidden min-[1001px]:inline-flex')}
        aria-label="Search"
        onClick={() => {
          setSearchOpen((v) => !v);
          setTimeout(() => searchRef.current?.focus(), 40);
        }}
      >
        <SearchIcon />
      </button>
      <button type="button" className={iconBtn} aria-label="Notifications">
        <BellIcon />
      </button>
      <button
        type="button"
        className="group w-8 h-7 inline-flex flex-col items-center justify-center gap-1 bg-transparent border-0 cursor-pointer p-0"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span
          className={cn(
            'block w-[18px] h-[1.5px] bg-ink transition-all duration-200 group-hover:bg-mint',
            menuOpen && 'translate-y-[5.5px] rotate-45'
          )}
        />
        <span
          className={cn(
            'block w-[18px] h-[1.5px] bg-ink transition-all duration-200 group-hover:bg-mint',
            menuOpen && 'opacity-0 w-0'
          )}
        />
        <span
          className={cn(
            'block w-[18px] h-[1.5px] bg-ink transition-all duration-200 group-hover:bg-mint',
            menuOpen && '-translate-y-[5.5px] -rotate-45'
          )}
        />
      </button>
    </span>
  );

  return (
    <>
      <header
        ref={headerRef}
        className={headerClass}
        style={painted && accentColor ? { backgroundColor: accentColor } : undefined}
      >
        {compact ? (
          <div className="relative flex h-[52px] w-full max-w-site mx-auto items-center gap-3 px-4 md:px-6">
            <Link
              href="/"
              className="flex items-center no-underline text-ink shrink-0"
              onClick={() => setMenuOpen(false)}
            >
              <BrandLogo size="sm" />
            </Link>
            <span className="min-w-0 flex-1 truncate text-center text-[13px] font-semibold text-ink">
              {articleTitle}
            </span>
            {actionIcons}
          </div>
        ) : (
          <div className="relative w-full max-w-site mx-auto px-4 pt-1.5 pb-1.5 box-border md:px-6 md:pt-2 md:pb-1.5">
            <div className="hidden min-[1001px]:flex justify-end items-center gap-3.5 w-full mb-1">
              <a
                href="#newsletter"
                className="inline-block bg-mint text-black font-mono text-[10px] font-bold tracking-[0.08em] uppercase px-[11px] pt-1.5 pb-[5px] rounded-sm leading-tight transition-all duration-150 whitespace-nowrap hover:bg-mint-hover hover:shadow-mint hover:-translate-y-px"
              >
                SUBSCRIBE
              </a>
              {user ? (
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 bg-transparent border-0 text-mint font-mono text-[10px] font-semibold tracking-[0.08em] uppercase cursor-pointer p-0 no-underline whitespace-nowrap transition-opacity hover:opacity-85 [&_svg]:text-mint"
                >
                  <UserIcon />
                  <span>ACCOUNT</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 bg-transparent border-0 text-mint font-mono text-[10px] font-semibold tracking-[0.08em] uppercase cursor-pointer p-0 no-underline whitespace-nowrap transition-opacity hover:opacity-85 [&_svg]:text-mint"
                >
                  <UserIcon />
                  <span>SIGN IN</span>
                </Link>
              )}
            </div>

            <div className="w-full flex justify-stretch">
              <nav
                className="flex items-end justify-between flex-nowrap w-full gap-4"
                aria-label="Main"
              >
                <Link
                  href="/"
                  className="flex items-center no-underline text-ink shrink-0 max-md:text-xl pb-[7px]"
                  onClick={() => setMenuOpen(false)}
                >
                  <BrandLogo size="md" />
                </Link>

                <div className="inline-flex items-center justify-end flex-nowrap gap-1 ml-auto min-w-0 border-b-[1.5px] border-mint pb-[7px]">
                  <div className="hidden min-[1001px]:inline-flex items-center flex-nowrap gap-0">
                    {navItems.map((item, index) => (
                      <span key={item.label} className="inline-flex items-center">
                        {index > 0 ? (
                          <span
                            className="text-ink-tertiary text-sm ml-[5px] mr-px select-none leading-none"
                            aria-hidden="true"
                          >
                            /
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className={cn(
                            'appearance-none bg-transparent border-0 text-ink text-[14.5px] font-semibold px-2 py-0.5 cursor-pointer whitespace-nowrap font-sans transition-colors leading-tight tracking-tight',
                            'hover:text-mint'
                          )}
                          onClick={() => goHref(item.href)}
                        >
                          {item.label}
                        </button>
                      </span>
                    ))}
                  </div>

                  <span className="inline-flex items-center shrink-0 pl-0 min-[1001px]:pl-2.5 min-[1001px]:ml-0.5 min-[1001px]:border-l min-[1001px]:border-line">
                    {actionIcons}
                  </span>
                </div>
              </nav>
            </div>
          </div>
        )}

        {searchOpen && (
          <div
            className={cn(
              'border-t px-5 pt-3 pb-3.5 animate-drop-in',
              painted && !compact && headerVariant !== 'theme'
                ? 'border-black/10 bg-transparent'
                : 'border-line-light bg-bg'
            )}
          >
            <form
              className="max-w-site mx-auto relative flex items-center"
              onSubmit={(e) => {
                e.preventDefault();
                const q = localSearch.trim();
                if (q) {
                  setSearchOpen(false);
                  router.push(`/search?q=${encodeURIComponent(q)}`);
                }
              }}
            >
              <SearchIcon className="absolute left-3 text-ink-muted pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                className="w-full h-[42px] pl-10 pr-[72px] border border-line rounded-sm bg-bg-elevated text-ink text-[15px] outline-none focus:border-mint"
                placeholder="Search stories…"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2.5 bg-transparent border-0 text-ink-tertiary font-mono text-[11px] uppercase tracking-wide cursor-pointer hover:text-mint"
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange?.('');
                  setSearchOpen(false);
                }}
              >
                Close
              </button>
            </form>
          </div>
        )}
      </header>

      <div
        className={cn(
          'fixed inset-0 bg-black/55 z-[12000] transition-all duration-300 backdrop-blur-[2px]',
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 w-[min(400px,92vw)] bg-bg border-l border-line z-[12001] transition-transform duration-300 ease-out flex flex-col',
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!menuOpen}
        aria-label="Site menu"
      >
        <div className="flex items-center justify-between px-[22px] py-5 border-b border-line-dim">
          <BrandLogo size="md" className="!text-[22px]" />
          <button
            type="button"
            className="w-9 h-9 border border-line rounded-full bg-transparent text-ink-secondary text-base cursor-pointer flex items-center justify-center hover:text-ink hover:border-mint hover:bg-mint/10"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[22px] pt-5 pb-10">
          <a
            href="#newsletter"
            className="block text-center bg-mint text-black font-mono text-xs font-bold tracking-widest uppercase p-3.5 rounded-sm mb-3.5 hover:bg-mint-hover"
            onClick={() => setMenuOpen(false)}
          >
            SUBSCRIBE
          </a>
          {!user ? (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full p-3 mb-3.5 border border-line rounded-sm bg-transparent text-ink text-sm cursor-pointer no-underline hover:border-mint hover:text-mint"
              onClick={() => setMenuOpen(false)}
            >
              <UserIcon /> Sign in / Sign up
            </Link>
          ) : (
            <div className="mb-3.5 flex flex-col gap-2">
              <Link
                href="/account"
                className="flex items-center justify-center gap-2 w-full p-3 border border-line rounded-sm bg-transparent text-ink text-sm cursor-pointer no-underline hover:border-mint hover:text-mint"
                onClick={() => setMenuOpen(false)}
              >
                <UserIcon /> Account
              </Link>
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full p-3 border border-line rounded-sm bg-transparent text-ink text-sm cursor-pointer hover:border-mint hover:text-mint"
                onClick={logout}
              >
                Log out
              </button>
            </div>
          )}
          <ThemeToggle className="w-full justify-center mb-7" />
          {(catalog?.header?.length
            ? [
                { title: 'Sections', items: catalog.header.map((s) => ({ label: s.label, href: s.href })) },
                DRAWER_SECTIONS.find((s) => s.title === 'Features') || DRAWER_SECTIONS[1],
              ]
            : DRAWER_SECTIONS
          ).map((section) => (
            <div key={section.title} className="mb-7">
              <h3 className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase text-ink-muted mb-2.5 pb-2 border-b border-line-dim">
                {section.title}
              </h3>
              <ul className="list-none m-0 p-0">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className="group flex items-center justify-between w-full py-3 bg-transparent border-0 border-b border-line-light text-ink text-lg font-semibold cursor-pointer text-left transition-all hover:text-mint hover:pl-1.5"
                      onClick={() => (item.href ? goHref(item.href) : goCat(item.cat))}
                    >
                      {item.label}
                      <span className="text-ink-muted transition-all group-hover:text-mint group-hover:translate-x-[3px]">
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mb-7">
            <h3 className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase text-ink-muted mb-2.5 pb-2 border-b border-line-dim">
              Follow
            </h3>
            <div className="flex gap-2.5 flex-wrap">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 border-[1.5px] border-mint rounded-full text-mint flex items-center justify-center transition-all hover:bg-mint hover:text-black hover:scale-110"
                >
                  <s.Icon size={17} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function UserIcon() {
  return (
    <svg width="11" height="14" viewBox="0 0 18 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.063 4.872c0 2.69-2.267 4.872-5.063 4.872S3.937 7.563 3.937 4.872C3.937 2.182 6.204 0 9 0s5.063 2.181 5.063 4.872ZM2.778 13.598c1.65-1.588 3.888-2.48 6.222-2.48 2.334 0 4.572.892 6.223 2.48 1.65 1.588 2.577 3.742 2.577 5.988V23.2H.2v-3.614c0-2.246.927-4.4 2.578-5.988Z"
      />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
