import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import HeroSection from '../components/HeroSection/HeroSection';
import CategoryCluster from '../components/CategoryCluster/CategoryCluster';
import { fetcher, api } from '../lib/api';
import Loader from '../components/Loader/Loader';
import SearchResults from '../components/SearchResults/SearchResults';
import styles from '../styles/Home.module.css';


const CATEGORIES = ['All', 'AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];

function slugifyCategory(cat) {
  return cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

function unslugifyCategory(slug) {
  if (!slug) return 'All';
  return CATEGORIES.find(cat => slugifyCategory(cat) === slug) || 'All';
}

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

export async function getStaticProps() {
  try {
    const data = await api('/api/posts');

    // Important: avoid shipping full post HTML in SSG payload.
    // The homepage only needs summary fields; SWR will still fetch the full objects client-side.
    const initialPosts = (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      link: p.link ?? null,
      creator: p.creator ?? null,
      creatorName: p.creatorName ?? null,
      creatorAvatarUrl: p.creatorAvatarUrl ?? null,
      excerpt: p.excerpt,
      bucket: p.bucket,
      readMinutes: p.readMinutes ?? null,
      ogImg: p.ogImg ?? null,
      date: p.date ?? null,
      // NOTE: intentionally omit `content` here to keep the SSG payload small.
    }));
    return {
      props: {
        initialPosts,
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (err) {
    console.error('Error in getStaticProps:', err);
    return {
      props: {
        initialPosts: [],
      },
      revalidate: 10,
    };
  }
}

export default function HomePage({ initialPosts }) {
  const router = useRouter();
  const { data: postsData, error: postsError } = useSWR('/api/posts', fetcher, {
    fallbackData: initialPosts,
    revalidateOnFocus: false,
  });

  const posts = useMemo(() => {
    return (postsData || []).map((p) => ({
      ...p,
      date: p.date ? new Date(p.date) : null,
    }));
  }, [postsData]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  // Sync activeCategory with URL query
  useEffect(() => {
    if (!router.isReady) return;
    const catSlug = router.query.category;
    const actualCat = unslugifyCategory(catSlug);
    if (actualCat !== activeCategory) {
      setActiveCategory(actualCat);
    }
  }, [router.query.category, router.isReady]);

  const handleCategoryChange = (cat) => {
    if (cat === 'All') {
      const { category, ...rest } = router.query;
      router.push({ pathname: '/', query: rest }, undefined, { shallow: true });
    } else {
      router.push({ pathname: '/', query: { ...router.query, category: slugifyCategory(cat) } }, undefined, { shallow: true });
    }
  };

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

  const loading = !postsData && !postsError;
  const error = postsError ? 'Could not load posts. Please try again later.' : '';

  // Filter posts
  const filteredPosts = useMemo(() => {
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

  // Group posts by category for clusters
  const postsByCategory = useMemo(() => {
    const categories = ['AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];
    const grouped = {};
    
    categories.forEach(cat => {
      grouped[cat] = filteredPosts.filter(p => p.bucket === cat).slice(0, 6);
    });
    
    return grouped;
  }, [filteredPosts]);

  const heroPosts = useMemo(() => filteredPosts.slice(0, 13), [filteredPosts]);

  const latestPosts = useMemo(() => {
    const rest = filteredPosts.slice(13);
    const list = rest.length ? rest : filteredPosts;
    return list.slice(0, 12);
  }, [filteredPosts]);

  const mostRead = useMemo(() => {
    const usedIds = new Set([...heroPosts, ...latestPosts].map((p) => String(p?.id || '')));
    const candidates = (filteredPosts || []).filter((p) => !usedIds.has(String(p?.id || '')));
    const ranked = [...candidates].sort((a, b) => {
      const ra = Number(a?.readMinutes || 0);
      const rb = Number(b?.readMinutes || 0);
      if (rb !== ra) return rb - ra;
      const ta = a?.date ? a.date.getTime?.() : 0;
      const tb = b?.date ? b.date.getTime?.() : 0;
      return (tb || 0) - (ta || 0);
    });
    const list = ranked.slice(0, 6);
    return list.length ? list : filteredPosts.slice(0, 6);
  }, [filteredPosts, heroPosts, latestPosts]);

  const quickBriefs = useMemo(() => {
    const cats = ['AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];
    const picks = cats
      .map((c) => postsByCategory?.[c]?.[0])
      .filter(Boolean);
    const unique = [];
    const seen = new Set();
    for (const p of picks) {
      const id = String(p?.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      unique.push(p);
    }
    return unique.slice(0, 4);
  }, [postsByCategory]);

  return (
    <Layout
      headerProps={{
        searchQuery,
        onSearchChange: setSearchQuery,
        activeCategory,
        onCategoryChange: handleCategoryChange,
        user
      }}
      showInlineAd={false}
    >
      {loading ? (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center' }}>
          <Loader />
        </div>
      ) : searchQuery.trim() ? (
        <SearchResults 
          results={filteredPosts} 
          query={searchQuery} 
        />
      ) : (
        <>
          {/* Breaking bar */}
          {filteredPosts?.[0] && (
            <div className={styles.breakingBar} role="region" aria-label="Breaking">
              <div className={styles.breakingPill} aria-hidden="true">LIVE</div>
              <div className={styles.breakingText}>
                <span className={styles.breakingLabel}>Top story</span>
                <Link href={postUrl(filteredPosts[0])} className={styles.breakingLink}>
                  {filteredPosts[0].title}
                </Link>
              </div>
              <div className={styles.breakingMeta}>
                <span className={styles.breakingCategory}>{filteredPosts[0].bucket || 'News'}</span>
                <span aria-hidden="true">•</span>
                <span>{formatRelativeDate(filteredPosts[0].date)}</span>
              </div>
            </div>
          )}

          {/* Horizontal banner ad (homepage only) */}
          {/* {filteredPosts?.length > 0 && (
            <div className={styles.horizontalAd} aria-label="Advertisement">
              <AdsenseAd
                slot="4810585579"
                format="auto"
                fullWidthResponsive={true}
                style={{ height: 90 }}
              />
            </div>
          )} */}

          {/* Hero Section: 3-column layout */}
          <HeroSection posts={heroPosts} />

          {/* News-style secondary grid: latest feed + right rail */}
          {!error && latestPosts.length > 0 && (
            <section className={styles.secondaryGrid} aria-label="Latest coverage">
              <div className={styles.latestCard}>
                <header className={styles.sectionHeaderRow}>
                  <h2 className={styles.sectionTitle}>Latest</h2>
                  <span className={styles.sectionHint}>Updated continuously</span>
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
                    <h2 className={styles.railTitle}>Most read</h2>
                    <span className={styles.railHint}>Based on read time</span>
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

                {quickBriefs.length > 0 && (
                  <div className={styles.railCard}>
                    <header className={styles.railHeader}>
                      <h2 className={styles.railTitle}>Quick brief</h2>
                      <span className={styles.railHint}>One from each beat</span>
                    </header>

                    <div className={styles.briefList}>
                      {quickBriefs.map((post) => (
                        <Link key={post.id} href={postUrl(post)} className={styles.briefItem}>
                          <span className={styles.briefCategory}>{post.bucket || 'News'}</span>
                          <span className={styles.briefHeadline}>{post.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </section>
          )}

          {/* Error state */}
          {error && (
            <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-secondary)' }}>
              {error}
            </div>
          )}

          {/* Category Clusters */}
          {!error && (
            <>
              <CategoryCluster
                title="AI & Future Tech"
                posts={postsByCategory['AI & Future Tech']}
              />
              
              <CategoryCluster
                title="Tech"
                posts={postsByCategory['Tech']}
              />
              
              <CategoryCluster
                title="Business & Markets"
                posts={postsByCategory['Business & Markets']}
              />
              
              <CategoryCluster
                title="Personal Finance"
                posts={postsByCategory['Personal Finance']}
              />
            </>
          )}
        </>
      )}
    </Layout>
  );
}
