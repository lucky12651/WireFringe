import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import HeroSection from '../components/HeroSection/HeroSection';
import { fetcher, api } from '../lib/api';
import Loader from '../components/Loader/Loader';
import styles from '../styles/Home.module.css';
import AdsenseAd from '../components/AdsenseAd/AdsenseAd';

function stripHtml(html) {
  if (!html) return '';
  if (typeof window === 'undefined') return String(html).replace(/<[^>]+>/g, ' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatRelativeDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function safeExcerpt(post) {
  const raw = String(post?.excerpt || '').trim();
  if (raw) return raw;
  const fromContent = stripHtml(post?.content || '').replace(/\s+/g, ' ').trim();
  if (!fromContent) return '';
  return fromContent.slice(0, 180) + (fromContent.length > 180 ? '…' : '');
}

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

export default function ForYouPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
        // Not logged in
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const { data: postsData, error: postsError } = useSWR(user ? '/api/posts/for-you' : null, fetcher, {
    revalidateOnFocus: false,
  });

  const posts = useMemo(() => {
    return (postsData || []).map((p) => ({
      ...p,
      date: p.date ? new Date(p.date) : null,
    }));
  }, [postsData]);

  const heroPosts = useMemo(() => posts.slice(0, 13), [posts]);
  const latestPosts = useMemo(() => posts.slice(13, 25), [posts]);
  const mostRead = useMemo(() => {
    return [...posts].sort((a, b) => (b.readMinutes || 0) - (a.readMinutes || 0)).slice(0, 6);
  }, [posts]);

  if (authLoading) {
    return (
      <Layout headerProps={{ activeCategory: 'For You', user }}>
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center' }}>
          <Loader />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout headerProps={{ activeCategory: 'For You', user }}>
        <div className={styles.container} style={{ minHeight: '60vh', textAlign: 'center', paddingTop: '100px' }}>
          <h1>For You</h1>
          <p>Please log in to see your personalized news feed.</p>
          <div style={{ marginTop: '20px' }}>
            <Link href="/login" className={styles.categoryButton} style={{ display: 'inline-block' }}>
              Log In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const loading = !postsData && !postsError;

  return (
    <Layout headerProps={{ activeCategory: 'For You', user }} showInlineAd={false}>
      {loading ? (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center' }}>
          <Loader />
        </div>
      ) : (
        <>
          {/* Breaking bar */}
          {posts?.[0] && (
            <div className={styles.breakingBar} role="region" aria-label="Breaking">
              <div className={styles.breakingPill} aria-hidden="true">FOR YOU</div>
              <div className={styles.breakingText}>
                <span className={styles.breakingLabel}>Top recommendation</span>
                <Link href={postUrl(posts[0])} className={styles.breakingLink}>
                  {posts[0].title}
                </Link>
              </div>
              <div className={styles.breakingMeta}>
                <span className={styles.breakingCategory}>{posts[0].bucket || 'News'}</span>
                <span aria-hidden="true">•</span>
                <span>{formatRelativeDate(posts[0].date)}</span>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <HeroSection posts={heroPosts} />

          {/* Secondary Grid */}
          {!postsError && latestPosts.length > 0 && (
            <section className={styles.secondaryGrid} aria-label="Your personalized feed">
              <div className={styles.latestCard}>
                <header className={styles.sectionHeaderRow}>
                  <h2 className={styles.sectionTitle}>More for you</h2>
                  <span className={styles.sectionHint}>Picked based on your reading</span>
                </header>

                <div className={styles.latestList}>
                  {latestPosts.map((post) => (
                    <Link key={post.id} href={postUrl(post)} className={styles.latestItem}>
                      <article className={styles.latestBody}>
                        <div className={styles.latestMeta}>
                          <span className={styles.latestCategory}>{post.bucket || 'News'}</span>
                          <span aria-hidden="true">•</span>
                          <span className={styles.latestTime}>{formatRelativeDate(post.date)}</span>
                          {post.readMinutes ? (
                            <>
                              <span aria-hidden="true">•</span>
                              <span className={styles.latestRead}>{post.readMinutes} min read</span>
                            </>
                          ) : null}
                        </div>
                        <h3 className={styles.latestTitle}>{post.title}</h3>
                        {safeExcerpt(post) && (
                          <p className={styles.latestExcerpt}>{safeExcerpt(post)}</p>
                        )}
                      </article>

                      {post.ogImg ? (
                        <div className={styles.latestThumb}>
                          <img src={post.ogImg} alt="" loading="lazy" />
                        </div>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>

              <aside className={styles.rail} aria-label="Sidebar">
                <div className={styles.railCard}>
                  <header className={styles.railHeader}>
                    <h2 className={styles.railTitle}>Most relevant</h2>
                    <span className={styles.railHint}>Deep dives</span>
                  </header>

                  <ol className={styles.rankList}>
                    {mostRead.map((post, idx) => (
                      <li key={post.id} className={styles.rankItem}>
                        <Link href={postUrl(post)} className={styles.rankLink}>
                          <span className={styles.rankNumber} aria-hidden="true">{idx + 1}</span>
                          <span className={styles.rankText}>
                            <span className={styles.rankHeadline}>{post.title}</span>
                            <span className={styles.rankMeta}>
                              {post.bucket || 'News'} • {formatRelativeDate(post.date)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={styles.railCard} style={{ background: 'transparent', padding: 0 }}>
                  <AdsenseAd
                    slot="4810585579"
                    format="auto"
                    fullWidthResponsive={true}
                  />
                </div>
              </aside>
            </section>
          )}

          {postsError && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error)' }}>
              {postsError.message || 'An error occurred while loading posts.'}
            </div>
          )}

          {posts.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No personalized recommendations yet. Start reading some news!</p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
