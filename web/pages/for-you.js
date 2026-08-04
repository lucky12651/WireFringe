import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import HeroSection from '../components/HeroSection/HeroSection';
import { fetcher } from '../lib/api';
import { postUrl } from '../lib/utils';
import Loader from '../components/Loader/Loader';
import styles from '../styles/Home.module.css';

function author(post) {
  return String(post?.creatorName || post?.creator || 'Staff').toUpperCase();
}

function formatRelative(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 2) return 'JUST NOW';
  if (m < 60) return `${m} MINUTES AGO`;
  if (h < 24) return h === 1 ? 'AN HOUR AGO' : `${h} HOURS AGO`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function excerpt(post, max = 160) {
  const raw = String(post?.excerpt || '').trim();
  if (raw) return raw.length > max ? raw.slice(0, max) + '…' : raw;
  return '';
}

function initials(name) {
  const p = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function ForYouPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { headers: { Accept: 'application/json' } });
        if (res.ok) setUser(await res.json());
      } catch (_) {
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const { data: postsData, error } = useSWR(user ? '/api/posts/for-you' : null, fetcher, {
    revalidateOnFocus: false,
  });

  const posts = useMemo(
    () => (postsData || []).map((p) => ({ ...p, date: p.date ? new Date(p.date) : null })),
    [postsData]
  );

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
        <div className={styles.emptyState} style={{ minHeight: '50vh', paddingTop: 80 }}>
          <h1 style={{ marginBottom: 12, fontSize: 32, fontWeight: 800, color: '#fff' }}>For You</h1>
          <p style={{ marginBottom: 20 }}>Sign in to see your personalized feed.</p>
          <Link href="/login" className="btn-accent">
            SIGN IN
          </Link>
        </div>
      </Layout>
    );
  }

  const loading = !postsData && !error;

  return (
    <Layout headerProps={{ activeCategory: 'For You', user }}>
      {loading ? (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center' }}>
          <Loader />
        </div>
      ) : (
        <div className={styles.page}>
          <div className={styles.homeGrid}>
            <div className={styles.leftCol}>
              <div className={styles.packageRule} />
              <h2 className={styles.packageHead} style={{ marginBottom: 20 }}>
                For you
              </h2>
              <HeroSection posts={posts.slice(0, 5)} />
            </div>
            <aside className={styles.rightCol}>
              <div className={styles.feedTabs}>
                <div className={`${styles.feedTab} ${styles.feedTabActive}`}>FOR YOU</div>
              </div>
              {posts.slice(5).map((post) => (
                <article key={post.id} className={styles.feedItem}>
                  <div className={styles.authorRow}>
                    <div className={styles.avatar}>{initials(author(post))}</div>
                    <div>
                      <div className={styles.authorName}>{author(post)}</div>
                      <div className={styles.authorTime}>{formatRelative(post.date)}</div>
                    </div>
                  </div>
                  <Link href={postUrl(post)} className={styles.feedTitle}>
                    {post.title}
                  </Link>
                  {excerpt(post) ? <p className={styles.feedBody}>{excerpt(post)}</p> : null}
                </article>
              ))}
              {!posts.length && (
                <div className={styles.emptyState}>No recommendations yet. Start reading!</div>
              )}
            </aside>
          </div>
        </div>
      )}
    </Layout>
  );
}
