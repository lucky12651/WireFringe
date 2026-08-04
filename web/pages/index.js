import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import HeroSection from '../components/HeroSection/HeroSection';
import NewsletterSignup from '../components/NewsletterSignup/NewsletterSignup';
import StreamFeed from '../components/StreamFeed/StreamFeed';
import { fetcher, api } from '../lib/api';
import { postUrl } from '../lib/utils';
import Loader from '../components/Loader/Loader';
import SearchResults from '../components/SearchResults/SearchResults';
import styles from '../styles/Home.module.css';

const CATEGORIES = ['All', 'AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];

function slugifyCategory(cat) {
  return cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

function unslugifyCategory(slug) {
  if (!slug) return 'All';
  return CATEGORIES.find((c) => slugifyCategory(c) === slug) || 'All';
}

function stripHtml(html) {
  if (!html) return '';
  if (typeof window === 'undefined') return String(html).replace(/<[^>]+>/g, ' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function excerpt(post, max = 160) {
  const raw = String(post?.excerpt || '').trim();
  if (raw) return raw.length > max ? raw.slice(0, max) + '…' : raw;
  const from = stripHtml(post?.content || '').replace(/\s+/g, ' ').trim();
  if (!from) return '';
  return from.slice(0, max) + (from.length > max ? '…' : '');
}

function author(post) {
  return String(post?.creatorName || post?.creator || 'Staff').toUpperCase();
}

export async function getStaticProps() {
  try {
    const data = await api('/api/posts');
    const initialPosts = (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      creator: p.creator ?? null,
      creatorName: p.creatorName ?? null,
      creatorAvatarUrl: p.creatorAvatarUrl ?? null,
      excerpt: p.excerpt,
      bucket: p.bucket,
      readMinutes: p.readMinutes ?? null,
      ogImg: p.ogImg ?? null,
      date: p.date ?? null,
    }));
    return { props: { initialPosts }, revalidate: 60 };
  } catch (err) {
    console.error(err);
    return { props: { initialPosts: [] }, revalidate: 10 };
  }
}

export default function HomePage({ initialPosts }) {
  const router = useRouter();
  const { data: postsData, error: postsError } = useSWR('/api/posts', fetcher, {
    fallbackData: initialPosts,
    revalidateOnFocus: false,
  });

  const posts = useMemo(
    () => (postsData || []).map((p) => ({ ...p, date: p.date ? new Date(p.date) : null })),
    [postsData]
  );

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [feedTab, setFeedTab] = useState('latest');

  useEffect(() => {
    if (!router.isReady) return;
    const c = unslugifyCategory(router.query.category);
    if (c !== activeCategory) setActiveCategory(c);
  }, [router.query.category, router.isReady]);

  const handleCategoryChange = (cat) => {
    if (cat === 'All') {
      const { category, ...rest } = router.query;
      router.push({ pathname: '/', query: rest }, undefined, { shallow: true });
    } else {
      router.push(
        { pathname: '/', query: { ...router.query, category: slugifyCategory(cat) } },
        undefined,
        { shallow: true }
      );
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { headers: { Accept: 'application/json' } });
        if (res.ok) setUser(await res.json());
      } catch (_) {}
    })();
  }, []);

  const loading = !postsData && !postsError;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...posts];
    if (activeCategory !== 'All') list = list.filter((p) => p.bucket === activeCategory);
    if (q) {
      list = list.filter((p) =>
        (p.title + ' ' + p.excerpt + ' ' + stripHtml(p.content)).toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, activeCategory, searchQuery]);

  const heroPosts = filtered.slice(0, 5);
  const feedPosts = (filtered.slice(5).length ? filtered.slice(5) : filtered).slice(0, 20);
  const mostRead = useMemo(() => {
    return [...filtered]
      .sort((a, b) => Number(b.readMinutes || 0) - Number(a.readMinutes || 0))
      .slice(0, 5);
  }, [filtered]);

  const packageA = filtered.slice(5, 9);
  const packageB = filtered.slice(9, 13);
  const catTech = filtered.filter((p) => p.bucket === 'Tech').slice(0, 4);
  const catAI = filtered.filter((p) => p.bucket === 'AI & Future Tech').slice(0, 4);
  const catBiz = filtered.filter((p) => p.bucket === 'Business & Markets').slice(0, 4);

  return (
    <Layout
      headerProps={{
        searchQuery,
        onSearchChange: setSearchQuery,
        activeCategory,
        onCategoryChange: handleCategoryChange,
        user,
      }}
      showInlineAd={false}
    >
      {loading ? (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center' }}>
          <Loader />
        </div>
      ) : searchQuery.trim() ? (
        <SearchResults results={filtered} query={searchQuery} />
      ) : (
        <div className={styles.page}>
          <div className={styles.homeGrid}>
            {/* LEFT — Top stories + packages */}
            <div className={styles.leftCol}>
              <HeroSection posts={heroPosts} />

              {/* Package 1 */}
              {packageA.length > 0 && (
                <PackageBlock
                  title="Dynamic range"
                  subtitle="The latest ways to take photos and record video."
                  posts={packageA}
                />
              )}

              {/* Most Popular */}
              {mostRead.length > 0 && (
                <section className={styles.mostPopular} id="most-popular">
                  <div className={styles.packageRule} />
                  <h2>Most Popular</h2>
                  <ol className={styles.rankList}>
                    {mostRead.map((post, i) => (
                      <li key={post.id} className={styles.rankItem}>
                        <span className={styles.rankNum}>{i + 1}</span>
                        <div>
                          <Link href={postUrl(post)} className={styles.rankTitle}>
                            {post.title}
                          </Link>
                          <div className={styles.metaRow}>
                            <span className={styles.author}>{author(post)}</span>
                            <span style={{ color: '#666' }}>{formatDate(post.date)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Package 2 */}
              {packageB.length > 0 && (
                <PackageBlock
                  title="Consoles in crisis"
                  subtitle="The future looks increasingly expensive and digital."
                  posts={packageB}
                />
              )}

              <CategoryRow title="Latest from Tech" posts={catTech} href="/?category=tech" />
              <CategoryRow title="Latest from AI" posts={catAI} href="/?category=ai-future-tech" />
              <CategoryRow
                title="Latest from Business"
                posts={catBiz}
                href="/?category=business-markets"
              />
            </div>

            {/* RIGHT — polished LATEST stream */}
            <div className={styles.rightCol}>
              <StreamFeed
                posts={feedPosts}
                feedTab={feedTab}
                onTabChange={setFeedTab}
                user={user}
                NewsletterComponent={<NewsletterSignup />}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function PackageBlock({ title, subtitle, posts }) {
  if (!posts?.length) return null;
  const feature = posts[0];
  const rest = posts.slice(1, 4);

  return (
    <section className={styles.package}>
      <div className={styles.packageRule} />
      <h2 className={styles.packageHead}>
        {title} <span>/ {subtitle}</span>
      </h2>
      <div className={styles.packageLayout}>
        <Link href={postUrl(feature)} className={styles.packageFeature}>
          <div className={styles.packageFeatureImg}>
            {feature.ogImg ? <img src={feature.ogImg} alt="" loading="lazy" /> : null}
          </div>
          <h3 className={styles.packageFeatureTitle}>{feature.title}</h3>
          {excerpt(feature, 120) ? (
            <p className={styles.packageFeatureDek}>{excerpt(feature, 120)}</p>
          ) : null}
          <div className={styles.metaRow}>
            <span className={styles.author}>{author(feature)}</span>
          </div>
        </Link>

        <div className={styles.packageList}>
          {rest.map((post) => (
            <Link key={post.id} href={postUrl(post)} className={styles.packageItem}>
              <div>
                <h4 className={styles.packageItemTitle}>{post.title}</h4>
                {excerpt(post, 90) ? (
                  <p className={styles.packageItemDek}>{excerpt(post, 90)}</p>
                ) : null}
                <div className={styles.metaRow}>
                  <span className={styles.author}>{author(post)}</span>
                </div>
              </div>
              {post.ogImg ? (
                <div className={styles.packageThumb}>
                  <img src={post.ogImg} alt="" loading="lazy" />
                </div>
              ) : (
                <div className={styles.packageThumb} />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryRow({ title, posts, href }) {
  if (!posts?.length) return null;
  return (
    <section className={styles.catSection}>
      <div className={styles.catHeader}>
        <h2>{title}</h2>
        <Link href={href} className={styles.catMore}>
          MORE
        </Link>
      </div>
      <div className={styles.catGrid}>
        {posts.map((post) => (
          <Link key={post.id} href={postUrl(post)} className={styles.catCard}>
            <div className={styles.catCardImg}>
              {post.ogImg ? <img src={post.ogImg} alt="" loading="lazy" /> : null}
            </div>
            <h3 className={styles.catCardTitle}>{post.title}</h3>
            <div className={styles.metaRow}>
              <span className={styles.author}>{author(post)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
