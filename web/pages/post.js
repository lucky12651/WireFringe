import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getTheme, initTheme, toggleTheme } from '../lib/theme';

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

function initialsFromName(name) {
  const s = String(name || '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/g).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
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

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentHint, setCommentHint] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [voteAnim, setVoteAnim] = useState(null);

  function triggerVoteAnim(commentId, direction) {
    const nonce = `${Date.now()}-${Math.random()}`;
    setVoteAnim({ commentId, direction, nonce });
    window.setTimeout(() => {
      setVoteAnim((cur) => (cur && cur.nonce === nonce ? null : cur));
    }, 260);
  }

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
    initTheme({ defaultTheme: 'dark' });
    const t = getTheme();
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

  async function refreshComments(postId) {
    if (!postId) return;
    setCommentsLoading(true);
    setCommentsError('');
    try {
      const res = await fetchWithRetry(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to load comments: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setComments([]);
      setCommentsError('Could not load comments.');
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    if (!post?.id) return;
    refreshComments(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  async function onSubmitComment(e) {
    e.preventDefault();
    if (!post?.id) return;

    setCommentHint('');
    const name = commentName.trim();
    const email = commentEmail.trim();
    const body = commentText.trim();

    if (!name) {
      setCommentHint('Name is required.');
      return;
    }
    if (!email) {
      setCommentHint('Email is required.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setCommentHint('Email looks invalid.');
      return;
    }
    if (!body) {
      setCommentHint('Comment is required.');
      return;
    }

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, email, comment: body }),
      });

      if (!res.ok) {
        let detail = `${res.status} ${res.statusText}`;
        try {
          const data = await res.json();
          if (data && data.detail) detail = data.detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      setCommentText('');
      setCommentHint('Comment posted.');
      await refreshComments(post.id);
      setShowCommentForm(false);
    } catch (err) {
      console.error(err);
      setCommentHint(String(err?.message || err));
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function voteComment(commentId, direction) {
    if (!commentId) return;
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(String(commentId))}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ direction }),
      });

      if (!res.ok) {
        let detail = `${res.status} ${res.statusText}`;
        try {
          const data = await res.json();
          if (data && data.detail) detail = data.detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      const updated = await res.json();
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      triggerVoteAnim(updated.id, direction);
    } catch (err) {
      console.error(err);
    }
  }

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
                      {[formatDate(post.date), post.bucket || ''].filter(Boolean).join(' • ')}
                    </div>

                    <div className="post-author-line" aria-label="Author">
                      <div className="post-author-avatar">
                        {post.creatorAvatarUrl ? (
                          <img
                            src={post.creatorAvatarUrl}
                            alt={post.creatorName || post.creator || 'Author'}
                            loading="lazy"
                          />
                        ) : (
                          <div className="post-author-avatar-fallback">
                            {initialsFromName(post.creatorName || post.creator)}
                          </div>
                        )}
                      </div>

                      <div className="post-author-name">
                        By <span className="post-author-name-strong">{post.creatorName || post.creator || 'Unknown'}</span>
                      </div>
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

            <section className="side-card post-comments-card" aria-label="Comments">
              <div className="side-header">
                <h3>Comments</h3>
                <span>{Array.isArray(comments) ? comments.length : 0}</span>
              </div>

              <div className="post-comments-actions">
                <button
                  className="pill-btn"
                  type="button"
                  onClick={() => {
                    setCommentHint('');
                    setShowCommentForm((v) => !v);
                  }}
                  disabled={!post?.id}
                >
                  <span className="dot" style={{ background: 'var(--accent)' }}></span>
                  Comment
                </button>

                <button
                  className="pill-btn"
                  type="button"
                  onClick={() => refreshComments(post?.id)}
                  disabled={!post?.id || commentsLoading}
                >
                  <span className="dot" style={{ background: '#4cd4ff' }}></span>
                  Refresh
                </button>

                {commentsError ? <div className="hint">{commentsError}</div> : null}
              </div>

              {showCommentForm ? (
                <form className="post-comment-form" onSubmit={onSubmitComment}>
                  <div className="post-comment-grid">
                    <label>
                      <span className="label">Name</span>
                      <input
                        className="input"
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        placeholder="Your name"
                      />
                    </label>

                    <label>
                      <span className="label">Email</span>
                      <input
                        className="input"
                        type="email"
                        value={commentEmail}
                        onChange={(e) => setCommentEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </label>
                  </div>

                  <label>
                    <span className="label">Comment</span>
                    <textarea
                      className="input textarea"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write your comment…"
                    ></textarea>
                  </label>

                  <div className="row">
                    <button className="hero-cta" type="submit" disabled={commentSubmitting}>
                      {commentSubmitting ? 'Posting…' : 'Post comment'}
                    </button>
                    <div className="hint">{commentHint}</div>
                  </div>
                </form>
              ) : null}

              <div className="post-comment-list" aria-label="Comment list">
                {commentsLoading ? (
                  <div className="empty-state">Loading…</div>
                ) : Array.isArray(comments) && comments.length ? (
                  comments.map((c) => (
                    <article key={c.id} className="post-comment-item">
                      <div className="post-comment-meta">
                        <div className="post-comment-name">{c.name || 'Anonymous'}</div>
                        <div className="post-comment-date">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </div>
                      </div>
                      <div className="post-comment-body">{c.comment || ''}</div>
                      <div className="post-comment-actions">
                        <button
                          type="button"
                          className={`pill-btn vote-btn like ${c?.myVote === 'like' ? 'voted' : ''} ${
                            voteAnim?.commentId === c.id && voteAnim?.direction === 'like' ? 'pop' : ''
                          }`}
                          onClick={() => voteComment(c.id, 'like')}
                          aria-pressed={c?.myVote === 'like'}
                        >
                          <span className="vote-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path
                                d="M7 10L12 5L17 10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span>Like</span>
                          <span className="vote-count">{c.likes || 0}</span>
                        </button>
                        <button
                          type="button"
                          className={`pill-btn vote-btn dislike ${c?.myVote === 'dislike' ? 'voted' : ''} ${
                            voteAnim?.commentId === c.id && voteAnim?.direction === 'dislike' ? 'pop' : ''
                          }`}
                          onClick={() => voteComment(c.id, 'dislike')}
                          aria-pressed={c?.myVote === 'dislike'}
                        >
                          <span className="vote-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path
                                d="M7 14L12 19L17 14"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span>Dislike</span>
                          <span className="vote-count">{c.dislikes || 0}</span>
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No comments yet. Be the first to comment.</div>
                )}
              </div>
            </section>

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
          <div></div>
        </footer>
      </div>
    </>
  );
}
