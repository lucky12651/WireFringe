import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'cnb_theme';

function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved || 'dark');
  return document.documentElement.dataset.theme || 'dark';
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
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

export default function PostPage() {
  const [themeLabel, setThemeLabel] = useState('Light');
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  const id = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search || '').get('id') || '';
  }, []);

  useEffect(() => {
    document.getElementById('year').textContent = String(new Date().getFullYear());
    const t = initTheme();
    setThemeLabel(t === 'light' ? 'Dark' : 'Light');
  }, []);

  useEffect(() => {
    if (!id) {
      setError('Invalid post URL.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/post?id=${encodeURIComponent(id)}`, {
          headers: { Accept: 'application/json' },
        });
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
  }, [id]);

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
        <main>
          <section className="post-page" id="postPage">
            <div className="post-page-head">
              <Link className="pill-btn" href="/">
                ← Back
              </Link>
              <div className="accent-line"></div>
            </div>

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
