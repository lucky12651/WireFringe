import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'cnb_theme';

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
  return document.documentElement.dataset.theme || 'dark';
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

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function stripHtml(html) {
  if (!html) return '';
  if (typeof window === 'undefined') return String(html).replace(/<[^>]+>/g, ' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

async function fetchWithRetry(url, options, { retries = 6, baseDelayMs = 250 } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastErr = err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export default function PostPage() {
  const [themeLabel, setThemeLabel] = useState('Light');
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState([]);
  const [latestError, setLatestError] = useState('');

  const slugFromPath = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const m = String(window.location.pathname || '').match(/^\/post\/([^/?#]+)/);
    if (!m) return '';
    try {
      return decodeURIComponent(m[1] || '');
    } catch {
      return m[1] || '';
    }
  }, []);

  const id = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search || '').get('id') || '';
  }, []);

  useEffect(() => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    const t = initTheme();
    setThemeLabel(t === 'light' ? 'Dark' : 'Light');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const url = slugFromPath
          ? `/api/post/by-slug?slug=${encodeURIComponent(slugFromPath)}`
          : id
            ? `/api/post?id=${encodeURIComponent(id)}`
            : '';

        if (!url) {
          setError('Invalid post URL.');
          return;
        }

        const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Failed to load post: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setPost({
          ...data,
          date: data.date ? new Date(data.date) : null,
        });

        if (data?.title) {
          document.title = `${data.title} – Coffee n Blog`;
        }
      } catch (err) {
        console.error(err);
        setError('Could not load this post. Go back and try another.');
      }
    })();
  }, [id, slugFromPath]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!post?.title) return;

    const cleanPath = `/post/${encodeURIComponent(slugifyTitle(post.title))}`;
    const currentPath = String(window.location.pathname || '');
    const hasQuery = String(window.location.search || '') !== '';

    if (currentPath !== cleanPath || hasQuery) {
      const hash = String(window.location.hash || '');
      window.history.replaceState(null, '', `${cleanPath}${hash}`);
    }
  }, [post]);

  useEffect(() => {
    (async () => {
      setLatestError('');
      try {
        const res = await fetchWithRetry('/api/posts', {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`Failed to load posts: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setLatest(
          (data || []).map((p) => ({
            ...p,
            date: p.date ? new Date(p.date) : null,
          }))
        );
      } catch (err) {
        console.error(err);
        setLatest([]);
        setLatestError('Could not load latest posts.');
      }
    })();
  }, []);

  function openPost(p) {
    const postId = p?.id;
    if (!postId) return;
    window.location.href = postUrl(p);
  }

  const sidebarPosts = useMemo(() => {
    const currentId = String(post?.id || id || '');
    return (latest || []).filter((p) => String(p?.id || '') !== currentId).slice(0, 8);
  }, [latest, id, post]);

  const bottomPosts = useMemo(() => {
    const currentId = String(post?.id || id || '');
    return (latest || []).filter((p) => String(p?.id || '') !== currentId).slice(0, 5);
  }, [latest, id, post]);

  return (
    <>
      <Head>
        <title>Coffee n Blog – Post</title>
      </Head>

      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="Back to home">
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
          </Link>

          <div className="search-group">
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
      </header>

      <div className="page-shell">
        <main className="post-main-layout">
          <section className="post-page" id="postPage">
            <div className="post-page-head">
              <Link className="pill-btn" href="/">
                ← Back
              </Link>
              <div className="accent-line"></div>
            </div>

            <div className="post-layout">
              <div className="post-main">
                {error ? (
                  <div className="empty-state" id="postError">
                    {error}
                  </div>
                ) : post ? (
                  <article className="post-page-card" aria-live="polite">
                    <div className="post-page-meta" id="postMeta">
                      {[
                        formatDate(post.date),
                        post.creator ? `By ${post.creator}` : '',
                        post.bucket || '',
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                    <h2 className="post-page-title" id="postTitle">
                      {post.title}
                    </h2>

                    <div className="post-hero" aria-label="Post image">
                      {post.ogImg && String(post.ogImg).startsWith('http') ? (
                        <img src={post.ogImg} alt={post.title || 'Post image'} loading="eager" />
                      ) : (
                        <div className="post-hero-fallback">
                          <div className="post-hero-orbit"></div>
                          <div className="post-hero-fallback-text">No image in export</div>
                        </div>
                      )}
                    </div>

                    <div
                      className="post-page-content"
                      id="postContent"
                      dangerouslySetInnerHTML={{
                        __html: post.content || `<p>${stripHtml(post.excerpt || '')}</p>`,
                      }}
                    ></div>
                  </article>
                ) : (
                  <div className="empty-state">Loading…</div>
                )}
              </div>

              <aside className="post-side" aria-label="Latest headlines">
                <section className="side-card post-side-card">
                  <div className="side-header">
                    <h3>Latest Headlines</h3>
                    <span>{sidebarPosts.length} stories</span>
                  </div>

                  {latestError ? <div className="post-side-hint">{latestError}</div> : null}

                  <div className="post-latest-list">
                    {sidebarPosts.map((p) => (
                      <div
                        key={p.id}
                        className="post-latest-item"
                        onClick={() => openPost(p)}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') openPost(p);
                        }}
                      >
                        <div className="post-latest-thumb">
                          {p.ogImg && p.ogImg.startsWith('http') ? (
                            <img src={p.ogImg} alt={p.title} loading="lazy" />
                          ) : (
                            <div className="post-latest-thumb-fallback">{p.bucket || 'News'}</div>
                          )}
                        </div>
                        <div className="post-latest-body">
                          <div className="post-latest-title">{p.title}</div>
                          <div className="post-latest-meta">
                            {p.bucket} • {formatDate(p.date) || ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>

            {bottomPosts.length ? (
              <div className="post-bottom" aria-label="More latest posts">
                <div className="section-title-row">
                  <h2>Latest Posts</h2>
                  <div className="accent-line"></div>
                </div>
                <div className="post-bottom-grid">
                  {bottomPosts.map((p) => (
                    <article
                      key={p.id}
                      className="post-bottom-card"
                      onClick={() => openPost(p)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openPost(p);
                      }}
                    >
                      <div className="post-bottom-thumb">
                        {p.ogImg && p.ogImg.startsWith('http') ? (
                          <img src={p.ogImg} alt={p.title} loading="lazy" />
                        ) : (
                          <div className="post-bottom-thumb-fallback">{p.bucket || 'News'}</div>
                        )}
                      </div>
                      <div className="post-bottom-body">
                        <div className="post-bottom-meta">
                          {p.bucket} • {formatDate(p.date) || ''}
                        </div>
                        <div className="post-bottom-title">{p.title}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
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
