import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BrandLogo from '../BrandLogo/BrandLogo';
import { cn } from '../../lib/utils';

const NAV = [
  { label: 'Tech', cat: 'Tech' },
  { label: 'Reviews', cat: 'Tech' },
  { label: 'Science', cat: 'AI & Future Tech' },
  { label: 'Entertainment', cat: 'Business & Markets' },
  { label: 'AI', cat: 'AI & Future Tech' },
  { label: 'Policy', cat: 'Personal Finance' },
];

const DRAWER_SECTIONS = [
  {
    title: 'Sections',
    items: [
      { label: 'Tech', cat: 'Tech' },
      { label: 'Reviews', cat: 'Tech' },
      { label: 'Science', cat: 'AI & Future Tech' },
      { label: 'Entertainment', cat: 'Business & Markets' },
      { label: 'AI', cat: 'AI & Future Tech' },
      { label: 'Policy', cat: 'Personal Finance' },
      { label: 'Business', cat: 'Business & Markets' },
      { label: 'Finance', cat: 'Personal Finance' },
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

function LogoMark({ className }) {
  return <BrandLogo size="md" className={className} />;
}

export default function Header({
  searchQuery = '',
  onSearchChange,
  activeCategory = 'All',
  onCategoryChange,
  user = null,
}) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const dropRef = useRef(null);

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
    const outside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [dropdownOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const goCat = (cat) => {
    setMenuOpen(false);
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
      await fetch('/api/admin/logout', { method: 'POST' });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (_) {}
  };

  return (
    <>
      <header className="sticky top-0 z-[11000] w-full bg-black/80 backdrop-blur-[16px] backdrop-saturate-150 border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <div className="relative w-full max-w-site mx-auto px-4 pt-3 pb-2.5 box-border md:px-6 md:pt-3.5 md:pb-3">
          <div className="flex justify-end items-center gap-3.5 w-full mb-2.5">
            <a
              href="#newsletter"
              className="inline-block bg-mint text-black font-mono text-[10px] font-bold tracking-[0.08em] uppercase px-[11px] pt-1.5 pb-[5px] rounded-sm leading-tight transition-all duration-150 whitespace-nowrap hover:bg-mint-hover hover:shadow-mint hover:-translate-y-px"
            >
              SUBSCRIBE
            </a>
            {user ? (
              <div className="relative" ref={dropRef}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 bg-transparent border-0 text-mint font-mono text-[10px] font-semibold tracking-[0.08em] uppercase cursor-pointer p-0 no-underline whitespace-nowrap transition-opacity hover:opacity-85 [&_svg]:text-mint"
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  <UserIcon />
                  <span>SIGN IN</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute top-[calc(100%+10px)] right-0 w-[200px] bg-bg-elevated border border-line rounded-sm shadow-lg py-1.5 z-[12000] animate-drop-in">
                    <Link
                      href="/for-you"
                      className="block w-full text-left px-3.5 py-2.5 bg-transparent border-0 text-[#bbb] text-sm cursor-pointer no-underline hover:bg-[#1a1a1a] hover:text-mint"
                      onClick={() => setDropdownOpen(false)}
                    >
                      For You
                    </Link>
                    {user.role !== 'user' && (
                      <>
                        <Link
                          href="/admin"
                          className="block w-full text-left px-3.5 py-2.5 bg-transparent border-0 text-[#bbb] text-sm cursor-pointer no-underline hover:bg-[#1a1a1a] hover:text-mint"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/admin/post"
                          className="block w-full text-left px-3.5 py-2.5 bg-transparent border-0 text-[#bbb] text-sm cursor-pointer no-underline hover:bg-[#1a1a1a] hover:text-mint"
                          onClick={() => setDropdownOpen(false)}
                        >
                          New Post
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      className="block w-full text-left px-3.5 py-2.5 bg-transparent border-0 text-[#bbb] text-sm cursor-pointer hover:bg-[#1a1a1a] hover:text-mint"
                      onClick={logout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
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
              className="flex items-center justify-between flex-nowrap w-full border-b-[1.5px] border-mint pb-[7px] gap-4"
              aria-label="Main"
            >
              <Link
                href="/"
                className="flex items-center no-underline text-white shrink-0 max-md:text-xl"
                onClick={() => setMenuOpen(false)}
              >
                <LogoMark />
              </Link>

              <div className="inline-flex items-center justify-end flex-nowrap gap-1 ml-auto min-w-0">
                <div className="hidden min-[1001px]:inline-flex items-center flex-nowrap gap-0">
                  {NAV.map((item, index) => (
                    <span key={item.label} className="inline-flex items-center">
                      {index > 0 ? (
                        <span
                          className="text-[#888] text-sm ml-[5px] mr-px select-none leading-none"
                          aria-hidden="true"
                        >
                          /
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className={cn(
                          'appearance-none bg-transparent border-0 text-[#e8e8e8] text-[14.5px] font-semibold px-2 py-0.5 cursor-pointer whitespace-nowrap font-sans transition-colors leading-tight tracking-tight',
                          activeCategory === item.cat ? 'text-mint' : 'hover:text-mint'
                        )}
                        onClick={() => goCat(item.cat)}
                      >
                        {item.label}
                      </button>
                    </span>
                  ))}
                </div>

                <span className="inline-flex items-center shrink-0 pl-0 min-[1001px]:pl-2.5 min-[1001px]:ml-0.5 min-[1001px]:border-l min-[1001px]:border-[#222]">
                  <button
                    type="button"
                    className="w-[34px] h-[30px] inline-flex items-center justify-center bg-transparent border-0 text-[#e0e0e0] cursor-pointer p-0 rounded-md transition-all hover:text-mint hover:bg-mint/10 hover:shadow-[0_0_16px_rgba(60,255,208,0.12)]"
                    aria-label="Search"
                    onClick={() => {
                      setSearchOpen((v) => !v);
                      setTimeout(() => searchRef.current?.focus(), 40);
                    }}
                  >
                    <SearchIcon />
                  </button>
                  <button
                    type="button"
                    className="w-[34px] h-[30px] inline-flex items-center justify-center bg-transparent border-0 text-[#e0e0e0] cursor-pointer p-0 rounded-md transition-all hover:text-mint hover:bg-mint/10 hover:shadow-[0_0_16px_rgba(60,255,208,0.12)]"
                    aria-label="Notifications"
                  >
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
                        'block w-[18px] h-[1.5px] bg-[#e8e8e8] transition-all duration-200 group-hover:bg-mint',
                        menuOpen && 'translate-y-[5.5px] rotate-45'
                      )}
                    />
                    <span
                      className={cn(
                        'block w-[18px] h-[1.5px] bg-[#e8e8e8] transition-all duration-200 group-hover:bg-mint',
                        menuOpen && 'opacity-0 w-0'
                      )}
                    />
                    <span
                      className={cn(
                        'block w-[18px] h-[1.5px] bg-[#e8e8e8] transition-all duration-200 group-hover:bg-mint',
                        menuOpen && '-translate-y-[5.5px] -rotate-45'
                      )}
                    />
                  </button>
                </span>
              </div>
            </nav>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-line-light px-5 pt-3 pb-3.5 bg-black animate-drop-in">
            <form
              className="max-w-site mx-auto relative flex items-center"
              onSubmit={(e) => e.preventDefault()}
            >
              <SearchIcon className="absolute left-3 text-[#666] pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                className="w-full h-[42px] pl-10 pr-[72px] border border-line rounded-sm bg-bg-elevated text-white text-[15px] outline-none focus:border-mint"
                placeholder="Search stories…"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2.5 bg-transparent border-0 text-[#888] font-mono text-[11px] uppercase tracking-wide cursor-pointer hover:text-mint"
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
          'fixed top-0 right-0 bottom-0 w-[min(400px,92vw)] bg-[#0a0a0a] border-l border-[#222] z-[12001] transition-transform duration-300 ease-out flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.5)]',
          menuOpen ? 'translate-x-0' : 'translate-x-[105%]'
        )}
        aria-hidden={!menuOpen}
        aria-label="Site menu"
      >
        <div className="flex items-center justify-between px-[22px] py-5 border-b border-line-dim">
          <LogoMark className="!text-[22px]" />
          <button
            type="button"
            className="w-9 h-9 border border-[#333] rounded-full bg-transparent text-[#ccc] text-base cursor-pointer flex items-center justify-center hover:text-white hover:border-mint hover:bg-mint/10"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[22px] pt-5 pb-10">
          <a
            href="#newsletter"
            className="block text-center bg-mint text-black font-mono text-xs font-bold tracking-widest uppercase p-3.5 rounded-sm mb-3.5 hover:bg-[#2ee6b8]"
            onClick={() => setMenuOpen(false)}
          >
            SUBSCRIBE
          </a>
          {!user ? (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full p-3 mb-7 border border-[#333] rounded-sm bg-transparent text-[#ddd] text-sm cursor-pointer no-underline hover:border-mint hover:text-mint"
              onClick={() => setMenuOpen(false)}
            >
              <UserIcon /> Sign in / Sign up
            </Link>
          ) : (
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full p-3 mb-7 border border-[#333] rounded-sm bg-transparent text-[#ddd] text-sm cursor-pointer hover:border-mint hover:text-mint"
              onClick={logout}
            >
              <UserIcon /> Log out
            </button>
          )}
          {DRAWER_SECTIONS.map((section) => (
            <div key={section.title} className="mb-7">
              <h3 className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase text-[#666] mb-2.5 pb-2 border-b border-line-dim">
                {section.title}
              </h3>
              <ul className="list-none m-0 p-0">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className="group flex items-center justify-between w-full py-3 bg-transparent border-0 border-b border-line-light text-white text-lg font-semibold cursor-pointer text-left transition-all hover:text-mint hover:pl-1.5"
                      onClick={() => (item.href ? goHref(item.href) : goCat(item.cat))}
                    >
                      {item.label}
                      <span className="text-[#444] transition-all group-hover:text-mint group-hover:translate-x-[3px]">
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mb-7">
            <h3 className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase text-[#666] mb-2.5 pb-2 border-b border-line-dim">
              Follow
            </h3>
            <div className="flex gap-2.5 flex-wrap">
              {[
                { href: 'https://x.com', label: 'X' },
                { href: 'https://youtube.com', label: 'YT' },
                { href: 'https://instagram.com', label: 'IG' },
                { href: 'https://facebook.com', label: 'FB' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 border-[1.5px] border-mint rounded-full text-mint flex items-center justify-center text-[11px] font-bold transition-all hover:bg-mint hover:text-black hover:scale-110"
                >
                  {s.label}
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
