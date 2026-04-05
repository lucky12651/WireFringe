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
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    saved = null;
  }
  applyTheme(saved || 'dark');
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // ignore
  }
  applyTheme(next);
  return next;
}

const CATEGORY_TABS = ['All', 'AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];

function slugifyTitle(title) {
  const s = String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return s.slice(0, 90) || 'post';
}

function postUrl(post) {
  const id = post?.id;
  if (!id) return '/';
  const slug = slugifyTitle(post?.title);
  return `/post/${encodeURIComponent(slug)}`;
}

async function fetchJsonWithRetry(url, options, { retries = 6, baseDelayMs = 250 } = {}) {
  let lastErr = null;
  const transientStatuses = new Set([502, 503, 504]);

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (!res.ok) {
        if (transientStatuses.has(res.status) && attempt < retries - 1) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(`Failed to load posts: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      lastErr = err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastErr;
}

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [themeLabel, setThemeLabel] = useState('Light');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const adEls = document.querySelectorAll('ins.adsbygoogle');
      adEls.forEach((el) => {
        if (el.getAttribute('data-adsbygoogle-status') === 'done') return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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
        const data = await fetchJsonWithRetry(
          '/api/posts',
          { headers: { Accept: 'application/json' } },
          { retries: 6, baseDelayMs: 250 }
        );

        setPosts(
          data.map((p) => ({
            ...p,
            date: p.date ? new Date(p.date) : null,
          }))
        );
      } catch (err) {
        console.error(err);
        setError(
          'Could not load posts from the backend. Make sure FastAPI is running on :8000, then refresh.\n' +
            String(err?.message || err)
        );
      } finally {
        setLoading(false);
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

  const listBase = filtered.length ? filtered : posts;
  const hero = listBase[0] || null;
  const rest = hero ? listBase.slice(1) : [];
  const leftRail = rest.slice(0, 6);
  const rightRail = rest.slice(6, 12);
  const centerFeed = rest.slice(12, 18);
  const moreFeed = rest.slice(18, 30);

  function openPost(post) {
    const id = post?.id;
    if (!id) return;
    window.location.href = postUrl(post);
  }

  return (
    <>
      <Head>
        <title>Coffee n Blog – Latest News, Tech, Business & Trending</title>
      </Head>

      <div className="ad-rails" aria-hidden="false">
        <aside className="ad-rail ad-rail-left" aria-label="Advertisement">
          <div className="ad-rail-card">
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-9036526646235532"
              data-ad-slot="4810585579"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
          </div>
        </aside>
        <aside className="ad-rail ad-rail-right" aria-label="Advertisement">
          <div className="ad-rail-card">
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-9036526646235532"
              data-ad-slot="4810585579"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
          </div>
        </aside>
      </div>

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
        <main className="home-layout">
          <aside className="left-rail" aria-label="Left sidebar headlines">
            <section className="side-card">
              <div className="side-header">
                <h3>Headlines</h3>
                <span>{leftRail.length} stories</span>
              </div>
              {loading ? (
                <div className="empty-state">Loading…</div>
              ) : leftRail.length ? (
                <div className="mini-list">
                  {leftRail.map((p) => (
                    <div
                      key={p.id}
                      className="mini-item with-thumb"
                      onClick={() => openPost(p)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openPost(p);
                      }}
                    >
                      <div className="mini-thumb" aria-hidden="true">
                        {p.ogImg && p.ogImg.startsWith('http') ? (
                          <img src={p.ogImg} alt="" loading="lazy" />
                        ) : (
                          <div className="mini-thumb-fallback">{p.bucket || 'News'}</div>
                        )}
                      </div>

                      <div className="mini-body">
                        <span className="title">{p.title}</span>
                        <div className="meta">
                          {p.bucket} • {formatDate(p.date) || ''}
                        </div>
                      </div>

                      <span className="meta mini-right">{(p.readMinutes || 3) + 'm'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No posts yet.</div>
              )}
            </section>
          </aside>

          <section className="center-rail" aria-label="Main news content">
            {hero ? (
              <article
                className="feature-square"
                id="featureSquare"
                onClick={() => openPost(hero)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openPost(hero);
                }}
              >
                <div className="feature-media">
                  {hero.ogImg && hero.ogImg.startsWith('http') ? (
                    <img src={hero.ogImg} alt={hero.title} />
                  ) : (
                    <div className="feature-media-fallback">
                      <div className="feature-orbit"></div>
                      <div className="feature-fallback-text">No photo in export</div>
                    </div>
                  )}
                </div>

                <div className="feature-content">
                  <div className="feature-meta">
                    <span className="feature-pill">{hero.bucket || 'News'}</span>
                    <span className="feature-sep">•</span>
                    <span>{formatDate(hero.date) || ''}</span>
                    <span className="feature-sep">•</span>
                    <span>{(hero.readMinutes || 3) + ' min read'}</span>
                  </div>
                  <h2 className="feature-title">{hero.title}</h2>
                  <p className="feature-excerpt">{hero.excerpt}</p>
                </div>
              </article>
            ) : null}

            <div className="section-title-row">
              <h2>Latest News</h2>
              <div className="accent-line"></div>
            </div>

            {error ? (
              <div className="empty-state">{error}</div>
            ) : loading ? (
              <div className="empty-state">Loading posts…</div>
            ) : listBase.length ? (
              <div className="center-feed" id="centerFeed">
                {(centerFeed.length ? centerFeed : rest.slice(0, 8)).map((post) => (
                  <article
                    key={post.id}
                    className="center-card"
                    onClick={() => openPost(post)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openPost(post);
                    }}
                  >
                    <div className="center-thumb" aria-hidden="true">
                      {post.ogImg && post.ogImg.startsWith('http') ? (
                        <img src={post.ogImg} alt="" loading="lazy" />
                      ) : (
                        <div className="center-thumb-fallback">{post.bucket || 'News'}</div>
                      )}
                    </div>

                    <div className="center-body">
                      <div className="center-card-meta">
                        <span className="tag">{post.bucket}</span>
                        <span className="dot"></span>
                        <span>{formatDate(post.date) || ''}</span>
                      </div>
                      <h3 className="center-card-title">{post.title}</h3>
                      <p className="center-card-excerpt">{post.excerpt}</p>
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

            {moreFeed.length ? (
              <>
                <div className="section-title-row">
                  <h2>More Latest</h2>
                  <div className="accent-line"></div>
                </div>

                <div className="more-grid" id="moreGrid">
                  {moreFeed.map((post) => (
                    <article
                      key={post.id}
                      className="more-card"
                      onClick={() => openPost(post)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openPost(post);
                      }}
                    >
                      <div className="more-thumb">
                        {post.ogImg && post.ogImg.startsWith('http') ? (
                          <img src={post.ogImg} alt={post.title} loading="lazy" />
                        ) : (
                          <div className="no-thumb">{post.bucket}</div>
                        )}
                      </div>
                      <div className="more-body">
                        <div className="more-meta">
                          {post.bucket} • {formatDate(post.date) || ''}
                        </div>
                        <div className="more-title">{post.title}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
          </section>

          <aside className="right-rail" aria-label="Right sidebar headlines">
            <section className="side-card">
              <div className="side-header">
                <h3>More Headlines</h3>
                <span>{rightRail.length} stories</span>
              </div>

              {loading ? (
                <div className="empty-state">Loading…</div>
              ) : rightRail.length ? (
                <div className="mini-list">
                  {rightRail.map((p) => (
                    <div
                      key={p.id}
                      className="mini-item with-thumb"
                      onClick={() => openPost(p)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openPost(p);
                      }}
                    >
                      <div className="mini-thumb" aria-hidden="true">
                        {p.ogImg && p.ogImg.startsWith('http') ? (
                          <img src={p.ogImg} alt="" loading="lazy" />
                        ) : (
                          <div className="mini-thumb-fallback">{p.bucket || 'News'}</div>
                        )}
                      </div>

                      <div className="mini-body">
                        <span className="title">{p.title}</span>
                        <div className="meta">
                          {p.bucket} • {formatDate(p.date) || ''}
                        </div>
                      </div>

                      <span className="meta mini-right">{(p.readMinutes || 3) + 'm'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No posts yet.</div>
              )}
            </section>
          </aside>
        </main>

        <footer>
          <div>
            © <span id="year"></span> Coffee n Blog. All rights reserved.
          </div>
          <div></div>
        </footer>
      </div>
    </>
  );
}
