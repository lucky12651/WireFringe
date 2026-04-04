import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'cnb_theme';

function stripHtml(html) {
  if (!html) return '';
  if (typeof window === 'undefined') return String(html).replace(/<[^>]+>/g, ' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved || 'dark');
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  return next;
}

const CATEGORY_TABS = ['All', 'AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [themeLabel, setThemeLabel] = useState('Light');
  const [error, setError] = useState('');

  useEffect(() => {
    document.getElementById('year').textContent = String(new Date().getFullYear());

    initTheme();
    const t = document.documentElement.dataset.theme || 'dark';
    setThemeLabel(t === 'light' ? 'Dark' : 'Light');

    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.id !== 'searchInput') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/posts', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Failed to load posts: ${res.status} ${res.statusText}`);
        const data = await res.json();

        setPosts(
          data.map((p) => ({
            ...p,
            date: p.date ? new Date(p.date) : null,
          }))
        );
      } catch (err) {
        console.error(err);
        setError('Could not load posts from the backend. Start the FastAPI server and refresh.');
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cat = activeCategory;

    let list = [...posts];

    if (cat !== 'All') {
      list = list.filter((p) => p.bucket === cat);
    }

    if (q) {
      list = list.filter((p) => {
        const text = (p.title + ' ' + p.excerpt + ' ' + stripHtml(p.content)).toLowerCase();
        return text.includes(q);
      });
    }

    return list;
  }, [posts, activeCategory, searchQuery]);

  const hero = filtered[0] || posts[0] || null;
  const feed = (filtered.length ? filtered : posts).slice(1);
  const trending = (filtered.length ? filtered : posts).slice(0, 5);

  function openPost(postId) {
    if (!postId) return;
    window.location.href = `/post?id=${encodeURIComponent(postId)}`;
  }

  return (
    <>
      <Head>
        <title>Coffee n Blog – Latest News, Tech, Business & Trending</title>
      </Head>

      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">
              <div className="brand-mark-inner">CnB</div>
            </div>
            <div className="brand-text">
              <h1>Coffee n Blog</h1>
              <span>
                Latest News • Tech • Business • Finance
                <span className="live-pill">
                  <span className="live-dot"></span> Live Feed
                </span>
              </span>
            </div>
          </div>

          <div className="search-group">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                id="searchInput"
                type="search"
                placeholder="Search AI, crypto, marketing, finance…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="kbd">/</span>
            </div>

            <button
              className="pill-btn"
              id="themeToggle"
              type="button"
              aria-label="Toggle light mode"
              onClick={() => {
                const next = toggleTheme();
                setThemeLabel(next === 'light' ? 'Dark' : 'Light');
              }}
            >
              <span className="dot" style={{ background: 'var(--accent)' }}></span>
              <span id="themeToggleText">{themeLabel}</span>
            </button>
          </div>
        </div>

        <div className="pill-filter-row" id="categoryFilters">
          {CATEGORY_TABS.map((c) => (
            <button
              key={c}
              className={`pill-btn ${activeCategory === c ? 'active' : ''}`}
              data-category={c}
              type="button"
              onClick={() => setActiveCategory(c)}
            >
              <span className="dot"></span>
              {c === 'All' ? 'All Stories' : c}
            </button>
          ))}
        </div>
      </header>

      <div className="page-shell">
        <main>
          <section>
            {hero ? (
              <article className="hero-card" id="heroCard" onClick={() => openPost(hero.id)}>
                <div className="hero-gradient-orbit"></div>
                <div className="hero-overlay"></div>

                <div className="hero-meta">
                  <div className="category-pill">
                    <span className="category-dot"></span>
                    <span id="heroCategory">{hero.bucket}</span>
                  </div>
                  <div className="hero-meta-right">
                    <span id="heroDate">{formatDate(hero.date)}</span>
                    <span className="read-time" id="heroReadTime">
                      {(hero.readMinutes || 3) + ' min read'}
                    </span>
                  </div>
                </div>

                <h2 className="hero-title" id="heroTitle">
                  {hero.title}
                </h2>
                <p className="hero-excerpt" id="heroExcerpt">
                  {hero.excerpt}
                </p>

                <div className="hero-footer-row">
                  <div className="hero-author" id="heroAuthor">
                    {'By ' + (hero.creator || 'Coffee n Blog editorial')}
                  </div>
                  <button
                    className="hero-cta"
                    id="heroReadBtn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPost(hero.id);
                    }}
                  >
                    Read story <span>↗</span>
                  </button>
                </div>
              </article>
            ) : null}

            <div className="section-title-row">
              <h2>Latest from Coffee n Blog</h2>
              <div className="accent-line"></div>
            </div>

            {error ? (
              <div className="empty-state">{error}</div>
            ) : feed.length ? (
              <div id="postsContainer" className="feed-list">
                {feed.map((post) => (
                  <article
                    key={post.id}
                    className="post-card"
                    onClick={() => openPost(post.id)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openPost(post.id);
                    }}
                  >
                    <div className="post-headline">
                      <div className="post-meta-top">
                        <span className="tag">{post.bucket}</span>
                        <span className="dot"></span>
                        <span>{formatDate(post.date) || ''}</span>
                      </div>
                      <h3 className="post-title">{post.title}</h3>
                      <p className="post-excerpt">{post.excerpt}</p>
                      <div className="post-footer-row">
                        <small>{'By ' + (post.creator || 'Coffee n Blog')}</small>
                        <span className="read-chip">{(post.readMinutes || 3) + ' min read'}</span>
                      </div>
                    </div>

                    <div className="post-thumb">
                      {post.ogImg && post.ogImg.startsWith('http') ? (
                        <>
                          <img src={post.ogImg} alt={post.title} />
                          <div className="thumb-label">
                            <span className="bullet"></span>
                            {post.bucket}
                          </div>
                        </>
                      ) : (
                        <div className="no-thumb">
                          {post.bucket} insight<br />
                          <span>Image not included in export</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div id="emptyState" className="empty-state">
                No posts match your filters.
                <span>Try clearing search or switching the category tab.</span>
              </div>
            )}
          </section>

          <aside>
            <section className="side-card">
              <div className="side-header">
                <h3>Trending Headlines</h3>
                <span id="trendingCount">{trending.length} stories</span>
              </div>
              <div id="trendingList" className="mini-list">
                {trending.map((p) => (
                  <div key={p.id} className="mini-item" onClick={() => openPost(p.id)}>
                    <div>
                      <span className="title">{p.title}</span>
                      <div className="meta">
                        {p.bucket} • {formatDate(p.date) || ''}
                      </div>
                    </div>
                    <span className="meta">{(p.readMinutes || 3) + 'm'}</span>
                  </div>
                ))}
              </div>
              <div className="badge-chip">
                <span>★</span> Curated from your WordPress export
              </div>
            </section>

            <section className="side-card">
              <div className="side-header">
                <h3>Quick Filters</h3>
                <span>AI • Crypto • SaaS</span>
              </div>
              <div className="mini-list">
                <div
                  className="mini-item quick-filter"
                  onClick={() => {
                    setSearchQuery('AI');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div>
                    <span className="title">AI & agents</span>
                    <div className="meta">Search posts about AI, agents, copilots</div>
                  </div>
                  <span className="meta">⌘ AI</span>
                </div>

                <div
                  className="mini-item quick-filter"
                  onClick={() => {
                    setSearchQuery('Bitcoin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div>
                    <span className="title">Crypto & markets</span>
                    <div className="meta">Tax rules, Bitcoin, macro moves</div>
                  </div>
                  <span className="meta">⌘ ₿</span>
                </div>

                <div
                  className="mini-item quick-filter"
                  onClick={() => {
                    setSearchQuery('marketing automation');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div>
                    <span className="title">Growth & marketing</span>
                    <div className="meta">Automation, email, revenue tools</div>
                  </div>
                  <span className="meta">⌘ M</span>
                </div>
              </div>
            </section>
          </aside>
        </main>

        <footer>
          <div>
            © <span id="year"></span> Coffee n Blog. All rights reserved.
          </div>
          <div>Static front-end built with HTML, CSS & JS.</div>
        </footer>
      </div>
    </>
  );
}
