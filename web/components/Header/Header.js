import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './Header.module.css';

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

function LogoMark() {
  return (
    <span className={styles.logoText} aria-label="Coffee n Blog">
      Coffee<span className={styles.logoN}>n</span>Blog
    </span>
  );
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
      <header className={styles.header}>
        {/*
          Same max-width shell so top (Subscribe/Sign In) and bottom (nav line)
          end at the same right edge — like The Verge.
        */}
        <div className={styles.shell}>
          {/* TOP row — Subscribe + Sign In (right aligned) */}
          <div className={styles.utility}>
            <a href="#newsletter" className={styles.subscribe}>
              SUBSCRIBE
            </a>
            {user ? (
              <div className={styles.profile} ref={dropRef}>
                <button
                  type="button"
                  className={styles.signIn}
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  <UserIcon />
                  <span>SIGN IN</span>
                </button>
                {dropdownOpen && (
                  <div className={styles.dropdown}>
                    <Link
                      href="/for-you"
                      className={styles.dropItem}
                      onClick={() => setDropdownOpen(false)}
                    >
                      For You
                    </Link>
                    {user.role !== 'user' && (
                      <>
                        <Link
                          href="/admin"
                          className={styles.dropItem}
                          onClick={() => setDropdownOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/admin/post"
                          className={styles.dropItem}
                          onClick={() => setDropdownOpen(false)}
                        >
                          New Post
                        </Link>
                      </>
                    )}
                    <button type="button" className={styles.dropItem} onClick={logout}>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={styles.signIn}>
                <UserIcon />
                <span>SIGN IN</span>
              </Link>
            )}
          </div>

          {/* BOTTOM row — logo left corner | nav links + search/icons right */}
          <div className={styles.navRow}>
            <nav className={styles.nav} aria-label="Main">
              <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
                <LogoMark />
              </Link>

              <div className={styles.navRight}>
                <div className={styles.navLinks}>
                  {NAV.map((item, index) => (
                    <span key={item.label} className={styles.navItem}>
                      {index > 0 ? (
                        <span className={styles.slash} aria-hidden="true">
                          /
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className={`${styles.navLink} ${
                          activeCategory === item.cat ? styles.navActive : ''
                        }`}
                        onClick={() => goCat(item.cat)}
                      >
                        {item.label}
                      </button>
                    </span>
                  ))}
                </div>

                <span className={styles.navIcons}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="Search"
                    onClick={() => {
                      setSearchOpen((v) => !v);
                      setTimeout(() => searchRef.current?.focus(), 40);
                    }}
                  >
                    <SearchIcon />
                  </button>
                  <button type="button" className={styles.iconBtn} aria-label="Notifications">
                    <BellIcon />
                  </button>
                  <button
                    type="button"
                    className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnOpen : ''}`}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <span className={styles.menuBar} />
                    <span className={styles.menuBar} />
                    <span className={styles.menuBar} />
                  </button>
                </span>
              </div>
            </nav>
          </div>
        </div>

        {searchOpen && (
          <div className={styles.searchBar}>
            <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
              <SearchIcon className={styles.searchIcon} />
              <input
                ref={searchRef}
                type="search"
                className={styles.searchInput}
                placeholder="Search stories…"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <button
                type="button"
                className={styles.searchClose}
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
        className={`${styles.drawerBackdrop} ${menuOpen ? styles.drawerBackdropOpen : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <aside
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!menuOpen}
        aria-label="Site menu"
      >
        <div className={styles.drawerHeader}>
          <LogoMark />
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className={styles.drawerBody}>
          <a href="#newsletter" className={styles.drawerSubscribe} onClick={() => setMenuOpen(false)}>
            SUBSCRIBE
          </a>
          {!user ? (
            <Link href="/login" className={styles.drawerSignIn} onClick={() => setMenuOpen(false)}>
              <UserIcon /> Sign in / Sign up
            </Link>
          ) : (
            <button type="button" className={styles.drawerSignIn} onClick={logout}>
              <UserIcon /> Log out
            </button>
          )}
          {DRAWER_SECTIONS.map((section) => (
            <div key={section.title} className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>{section.title}</h3>
              <ul className={styles.drawerList}>
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <button type="button" className={styles.drawerLink} onClick={() => goHref(item.href)}>
                        {item.label}
                        <span className={styles.drawerArrow}>→</span>
                      </button>
                    ) : (
                      <button type="button" className={styles.drawerLink} onClick={() => goCat(item.cat)}>
                        {item.label}
                        <span className={styles.drawerArrow}>→</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className={styles.drawerSection}>
            <h3 className={styles.drawerSectionTitle}>Follow</h3>
            <div className={styles.drawerSocial}>
              <a href="https://x.com" target="_blank" rel="noreferrer">
                X
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
                YT
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                IG
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                FB
              </a>
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
