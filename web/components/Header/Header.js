import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './Header.module.css';

const CATEGORY_TABS = ['All', 'AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];

function slugifyCategory(cat) {
  return cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function Header({
  searchQuery = '',
  onSearchChange,
  activeCategory = 'All',
  onCategoryChange,
  user = null
}) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleCategoryClick = (category) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    } else {
      // Default navigation logic if no handler provided (e.g., on post pages)
      if (category === 'All') {
        router.push('/');
      } else {
        router.push(`/?category=${slugifyCategory(category)}`);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
      <div className={styles.top}>
        <div className={styles.container}>
          <div className={styles.inner}>

            {/* Left: Logo */}
            <div className={styles.leftSection}>
              <Link href="/" className={styles.logo}>
                <span className={styles.logoText}>
                  Coffee N Blog
                </span>
              </Link>
            </div>

            {/* Center: Search */}
            <div className={styles.centerSection}>
              <div className={styles.searchWrapper}>
                <form
                  className={styles.search}
                  onSubmit={(e) => e.preventDefault()}
                  role="search"
                >
                  <label htmlFor="gn-search" className="visually-hidden">Search for topics, locations & sources</label>
                  <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    id="gn-search"
                    type="search"
                    className={styles.searchInput}
                    placeholder="Search for topics, locations & sources"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                  <kbd className={styles.searchKbd} aria-hidden="true">Ctrl K</kbd>
                </form>
              </div>
            </div>

            {/* Right: Actions */}
            <div className={styles.rightSection}>
              <div className={styles.actions}>
                {user ? (
                  <div className={styles.profileWrapper} ref={dropdownRef}>
                    <button
                      className={styles.profileBtn}
                      aria-label="Account"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="true"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                        <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm146.5-204.5Q340-521 340-580t40.5-99.5Q421-720 480-720t99.5 40.5Q620-639 620-580t-40.5 99.5Q539-440 480-440t-99.5-40.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm100-95.5q47-15.5 86-44.5-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160q53 0 100-15.5ZM523-537q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm-43-43Zm0 360Z" />
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        <Link href="/admin" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                          Dashboard
                        </Link>
                        <Link href="/admin/post" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                          New Post
                        </Link>
                        <div className={styles.dropdownDivider} />
                        <button className={styles.dropdownItem} onClick={handleLogout}>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/admin" className={styles.signInBtn}>
                    Sign in
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className={styles.nav} aria-label="Categories">
        <div className={styles.container}>
          <div className={styles.navCentered}>
            <div className={styles.navScroll}>
              {CATEGORY_TABS.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`${styles.navItem} ${activeCategory === category ? styles.navItemActive : ''}`}
                  onClick={() => handleCategoryClick(category)}
                  aria-current={activeCategory === category ? 'page' : undefined}
                >
                  {category}
                  {activeCategory === category && <div className={styles.navActiveLine} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
