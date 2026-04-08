import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import styles from '../styles/Post.module.css';

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
  return `/post/${encodeURIComponent(slug)}?id=${id}`;
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
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
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Fetch user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (_) {
        // Not logged in or error
      }
    })();
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

  const isPreview = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search || '').get('preview') === 'true';
  }, []);

  // Fetch post
  useEffect(() => {
    (async () => {
      try {
        if (isPreview) {
          const data = localStorage.getItem('gn_preview_data');
          if (data) {
            const parsed = JSON.parse(data);
            setPost({
              ...parsed,
              date: parsed.date ? new Date(parsed.date) : new Date(),
            });
            setLoading(false);
            return;
          }
        }

        const url = slugFromPath
          ? `/api/post/by-slug?slug=${encodeURIComponent(slugFromPath)}`
          : id
            ? `/api/post?id=${encodeURIComponent(id)}`
            : '';

        if (!url) {
          setError('Invalid post URL.');
          setLoading(false);
          return;
        }

        const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Failed to load post: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setPost({
          ...data,
          date: data.date ? new Date(data.date) : null,
        });
      } catch (err) {
        console.error(err);
        setError('Could not load this post. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, slugFromPath]);

  // Clean URL and metadata management
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

  // Fetch latest posts for sidebar
  useEffect(() => {
    (async () => {
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
      }
    })();
  }, []);

  const sidebarPosts = useMemo(() => {
    const currentId = String(post?.id || id || '');
    return (latest || []).filter((p) => String(p?.id || '') !== currentId).slice(0, 6);
  }, [latest, id, post]);

  const relatedPosts = useMemo(() => {
    const currentId = String(post?.id || id || '');
    return (latest || []).filter((p) => String(p?.id || '') !== currentId).slice(0, 4);
  }, [latest, id, post]);

  return (
    <Layout 
      title={post?.title ? `${post.title} – Coffee n Blog` : undefined}
      description={post?.excerpt || undefined}
      headerProps={{ user, activeCategory: post?.bucket || 'All' }}
    >
      <div className={styles.postPage}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonImage} />
            {Array(5).fill(0).map((_, i) => <div key={i} className={styles.skeletonText} />)}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <h2 style={{ marginBottom: '20px' }}>{error}</h2>
            <Link href="/" style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>
              ← Back to Home
            </Link>
          </div>
        ) : post ? (
          <article className={styles.post}>
            {/* Post Header */}
            <header className={styles.header}>
              <div className={styles.meta}>
                <span className={styles.category}>{post.bucket || 'News'}</span>
                <span aria-hidden="true">•</span>
                <time dateTime={post.date?.toISOString()}>{formatDate(post.date)}</time>
                {post.readMinutes && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{post.readMinutes} min read</span>
                  </>
                )}
              </div>
              <h1 className={styles.title}>{post.title}</h1>
              {post.excerpt && (
                <p className={styles.excerpt}>{post.excerpt}</p>
              )}
            </header>

            {/* Post Layout */}
            <div className={styles.layout}>
              {/* Main Content */}
              <div className={styles.contentWrapper}>
                {post.ogImg && (
                  <figure className={styles.hero}>
                    <img src={post.ogImg} alt={post.title} />
                  </figure>
                )}

                <div
                  className={styles.content}
                  dangerouslySetInnerHTML={{
                    __html: post.content || `<p>${stripHtml(post.excerpt || '')}</p>`,
                  }}
                />

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <section className={styles.related}>
                    <h2 className={styles.relatedTitle}>More to read</h2>
                    <div className={styles.relatedGrid}>
                      {relatedPosts.map((p) => (
                        <Link key={p.id} href={postUrl(p)} className={styles.relatedCard}>
                          {p.ogImg && (
                            <div className={styles.relatedThumb}>
                              <img src={p.ogImg} alt="" loading="lazy" />
                            </div>
                          )}
                          <div className={styles.relatedBody}>
                            <span className={styles.relatedSource}>{p.bucket}</span>
                            <h4 style={{ fontSize: '14px', fontWeight: '500' }}>{p.title}</h4>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sidebarCard}>
                  <h3 className={styles.sidebarCardTitle}>Latest Headlines</h3>
                  <div className={styles.sidebarList}>
                    {sidebarPosts.map((p, index) => (
                      <Link key={p.id} href={postUrl(p)} className={styles.sidebarItem}>
                        <span className={styles.sidebarItemNum} aria-hidden="true">{index + 1}</span>
                        <div className={styles.sidebarItemContent}>
                          <span className={styles.relatedSource} style={{ fontSize: '10px' }}>{p.bucket}</span>
                          <h4>{p.title}</h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sidebar Ad Slot */}
                <div className={styles.sidebarAd}>
                  <ins
                    className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client="ca-pub-9036526646235532"
                    data-ad-slot="4810585579"
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                  />
                </div>
              </aside>
            </div>
          </article>
        ) : null}
      </div>
    </Layout>
  );
}
