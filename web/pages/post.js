import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import CommentSection from '../components/CommentSection/CommentSection';
import styles from '../styles/Post.module.css';
import { fetcher, api } from '../lib/api';
import Loader from '../components/Loader/Loader';

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

function getInitials(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return '';

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const first = parts[0]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return `${first}${last}`.toUpperCase();
}

export async function getServerSideProps(context) {
  const { query, req, asPath } = context;
  const isPreview = query.preview === 'true';

  if (isPreview) {
    return { props: { initialPost: null, initialLatest: [], isPreview: true } };
  }

  const slugMatch = asPath.match(/^\/post\/([^/?#]+)/);
  const slug = slugMatch ? decodeURIComponent(slugMatch[1]) : null;
  const id = query.id;

  try {
    const postUrl = slug
      ? `/api/post/by-slug?slug=${encodeURIComponent(slug)}`
      : id
        ? `/api/post?id=${encodeURIComponent(id)}`
        : null;

    const [postData, latestData] = await Promise.all([
      postUrl ? api(postUrl) : Promise.resolve(null),
      api('/api/posts'),
    ]);

    return {
      props: {
        initialPost: postData,
        initialLatest: latestData || [],
        isPreview: false,
      },
    };
  } catch (err) {
    console.error('Error in getServerSideProps:', err);
    return {
      props: {
        initialPost: null,
        initialLatest: [],
        isPreview: false,
        error: 'Could not load this post. Please try again later.',
      },
    };
  }
}

export default function PostPage({ initialPost, initialLatest, isPreview: initialIsPreview, error: initialError }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const slugFromPath = useMemo(() => {
    if (!router.isReady) return '';
    const path = String(router.asPath || '').split('?')[0] || '';
    const m = path.match(/^\/post\/([^/?#]+)/);
    if (!m) return '';
    try {
      return decodeURIComponent(m[1] || '');
    } catch {
      return m[1] || '';
    }
  }, [router.asPath, router.isReady]);

  const id = useMemo(() => {
    if (!router.isReady) return '';
    const q = router.query?.id;
    if (typeof q === 'string') return q;
    return new URLSearchParams(String(router.asPath || '').split('?')[1] || '').get('id') || '';
  }, [router.asPath, router.isReady, router.query?.id]);

  const isPreview = useMemo(() => {
    if (!router.isReady) return initialIsPreview;
    return router.query?.preview === 'true' || new URLSearchParams(String(router.asPath || '').split('?')[1] || '').get('preview') === 'true';
  }, [router.asPath, router.isReady, router.query?.preview, initialIsPreview]);

  const postUrlKey = useMemo(() => {
    if (isPreview) return null;
    if (slugFromPath) return `/api/post/by-slug?slug=${encodeURIComponent(slugFromPath)}`;
    if (id) return `/api/post?id=${encodeURIComponent(id)}`;
    return null;
  }, [slugFromPath, id, isPreview]);

  const { data: postData, error: postError } = useSWR(postUrlKey, fetcher, {
    fallbackData: initialPost,
    revalidateOnFocus: false,
  });

  const { data: latestData } = useSWR('/api/posts', fetcher, {
    fallbackData: initialLatest,
    revalidateOnFocus: false,
  });

  const [previewPost, setPreviewPost] = useState(null);

  useEffect(() => {
    if (isPreview && typeof window !== 'undefined') {
      const data = localStorage.getItem('gn_preview_data');
      if (data) {
        setPreviewPost(JSON.parse(data));
      }
    }
  }, [isPreview]);

  const post = useMemo(() => {
    const raw = isPreview ? previewPost : postData;
    if (!raw) return null;
    return {
      ...raw,
      date: raw.date ? new Date(raw.date) : null,
    };
  }, [isPreview, previewPost, postData]);

  const latest = useMemo(() => {
    return (latestData || []).map((p) => ({
      ...p,
      date: p.date ? new Date(p.date) : null,
    }));
  }, [latestData]);

  const loading = !post && !postError && !initialError;
  const error = initialError || (postError ? 'Could not load this post. Please try again later.' : '');

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

  // Clean URL and metadata management
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!post?.title || isPreview) return;

    const cleanPath = `/post/${encodeURIComponent(slugifyTitle(post.title))}`;
    const currentPath = String(window.location.pathname || '');
    const hasQuery = String(window.location.search || '') !== '';

    if (currentPath !== cleanPath || hasQuery) {
      const hash = String(window.location.hash || '');
      window.history.replaceState(null, '', `${cleanPath}${hash}`);
    }
  }, [post, isPreview]);

  const sidebarPosts = useMemo(() => {
    const currentId = String(post?.id || id || '');
    return (latest || []).filter((p) => String(p?.id || '') !== currentId).slice(0, 6);
  }, [latest, id, post]);

  const relatedPosts = useMemo(() => {
    const currentId = String(post?.id || id || '');
    return (latest || []).filter((p) => String(p?.id || '') !== currentId).slice(0, 4);
  }, [latest, id, post]);

  const authorName = useMemo(() => {
    const name = String(post?.creatorName || post?.creator || '').trim();
    return name || '';
  }, [post]);

  const authorAvatarUrl = useMemo(() => {
    const url = String(post?.creatorAvatarUrl || '').trim();
    return url || '';
  }, [post]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [authorAvatarUrl]);

  return (
    <Layout 
      title={post?.title ? `${post.title} – Coffee n Blog` : undefined}
      description={post?.excerpt || undefined}
      headerProps={{ user, activeCategory: post?.bucket || 'All' }}
    >
      <div className={styles.postPage}>
        {loading ? (
          <div style={{ height: '70vh', display: 'flex', alignItems: 'center', width: '100%' }}>
            <Loader />
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

              {authorName && (
                <div className={styles.authorRow}>
                  <div className={styles.authorAvatar}>
                    {authorAvatarUrl && !avatarFailed ? (
                      <img
                        src={authorAvatarUrl}
                        alt={`Profile photo of ${authorName}`}
                        loading="lazy"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <div className={styles.authorAvatarFallback} aria-hidden="true">
                        {getInitials(authorName) || '—'}
                      </div>
                    )}
                  </div>
                  <div className={styles.authorMeta}>
                    <span className={styles.authorLabel}>By</span>
                    <span className={styles.authorName}>{authorName}</span>
                  </div>
                </div>
              )}

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

                {/* Comment System */}
                <CommentSection postId={post.id} />
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
