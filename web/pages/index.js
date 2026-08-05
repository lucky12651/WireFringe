import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import HeroSection from '../components/HeroSection/HeroSection';
import NewsletterSignup from '../components/NewsletterSignup/NewsletterSignup';
import StreamFeed from '../components/StreamFeed/StreamFeed';
import AdUnit from '../components/AdUnit/AdUnit';
import Reveal from '../components/Reveal/Reveal';
import { HomeSkeleton } from '../components/Skeleton/Skeleton';
import { fetcher, api } from '../lib/api';
import { postUrl, postExcerpt, stripHtml } from '../lib/utils';
import { AD_SLOTS } from '../lib/ads';
import SearchResults from '../components/SearchResults/SearchResults';
import AuthorByline from '../components/AuthorByline/AuthorByline';
import styles from '../styles/Home.module.css';

const CATEGORIES = [
  'All',
  'AI & Future Tech',
  'Tech',
  'Business & Markets',
  'Personal Finance',
  'India News',
  'Sports',
];

function slugifyCategory(cat) {
  return cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

function unslugifyCategory(slug) {
  if (!slug) return 'All';
  return CATEGORIES.find((c) => slugifyCategory(c) === slug) || 'All';
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function excerpt(post, max = 160) {
  return postExcerpt(post, max);
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
      creatorBrandByline: !!p.creatorBrandByline,
      creatorBrandLogoUrl: p.creatorBrandLogoUrl ?? null,
      excerpt: p.excerpt,
      bucket: p.bucket,
      readMinutes: p.readMinutes ?? null,
      commentCount: Number(p.commentCount) || 0,
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

  // Package blocks themed to real site content (feature + up to 3 cards)
  const packageA = filtered
    .filter((p) =>
      ['AI & Future Tech', 'Future Tech', 'Tech', 'Technology'].includes(p.bucket)
    )
    .slice(0, 4);
  const packageC = filtered
    .filter((p) => ['Business & Markets', 'Business'].includes(p.bucket))
    .slice(0, 4);
  const packageB = filtered.filter((p) => p.bucket === 'India News').slice(0, 4);
  const packageD = filtered
    .filter((p) => ['Personal Finance', 'Gadgets'].includes(p.bucket))
    .slice(0, 4);

  const catTech = filtered.filter((p) => p.bucket === 'Tech').slice(0, 4);
  const catAI = filtered.filter((p) => p.bucket === 'AI & Future Tech').slice(0, 4);
  const catBiz = filtered.filter((p) => p.bucket === 'Business & Markets').slice(0, 4);
  const catFinance = filtered.filter((p) => p.bucket === 'Personal Finance').slice(0, 4);
  const catIndia = filtered.filter((p) => p.bucket === 'India News').slice(0, 4);
  const catSports = filtered.filter((p) => p.bucket === 'Sports').slice(0, 4);

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
        <HomeSkeleton />
      ) : searchQuery.trim() ? (
        <SearchResults results={filtered} query={searchQuery} />
      ) : (
        <div className={styles.page}>
          <div className={styles.homeGrid}>
            {/* LEFT — Top stories + packages */}
            <div className={styles.leftCol}>
              <Reveal as="div" className={styles.heroReveal}>
                <HeroSection posts={heroPosts} />
              </Reveal>

              {/* 1 — Leaderboard under hero */}
              <div className={styles.homeAd}>
                <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
              </div>

              {packageA.length > 0 && (
                <PackageBlock
                  title="AI frontline"
                  subtitle="Enterprise AI, cyber security, and the tools rewriting how we work."
                  posts={packageA}
                />
              )}

              {/* 2 — Between AI frontline & Market pulse */}
              <div className={styles.homeAd}>
                <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
              </div>

              {packageC.length > 0 && (
                <PackageBlock
                  title="Market pulse"
                  subtitle="Business moves, markets, and the strategy stories behind the numbers."
                  posts={packageC}
                />
              )}

              {/* 3 — Before Most Popular */}
              <div className={styles.homeAd}>
                <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
              </div>

              {mostRead.length > 0 && (
                <Reveal as="section" className={styles.mostPopular} id="most-popular">
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
                            <AuthorByline post={post} size="sm" />
                            <span style={{ color: '#666' }}>{formatDate(post.date)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              )}

              {/* 4 — After Most Popular */}
              <div className={styles.homeAd}>
                <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
              </div>

              {packageB.length > 0 && (
                <PackageBlock
                  title="India desk"
                  subtitle="Politics, policy, and national headlines from across the country."
                  posts={packageB}
                />
              )}

              {/* 5 — Between India desk & Wallet watch */}
              <div className={styles.homeAd}>
                <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
              </div>

              {packageD.length > 0 && (
                <PackageBlock
                  title="Wallet watch"
                  subtitle="Personal finance, tax, gold, and money moves that hit home."
                  posts={packageD}
                />
              )}

              {/* 6 — Before category rows */}
              <div className={styles.homeAd}>
                <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
              </div>

              <CategoryRow title="Latest from Tech" posts={catTech} href="/?category=tech" />
              <CategoryRow
                title="Latest from AI & Future Tech"
                posts={catAI}
                href="/?category=ai-future-tech"
              />

              {/* 7 — Mid category stack */}
              <div className={styles.homeAd}>
                <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
              </div>

              <CategoryRow
                title="Latest from Business & Markets"
                posts={catBiz}
                href="/?category=business-markets"
              />
              <CategoryRow
                title="Latest from Personal Finance"
                posts={catFinance}
                href="/?category=personal-finance"
              />

              {/* 8 — Lower page rectangle */}
              <div className={styles.homeAd}>
                <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
              </div>

              <CategoryRow
                title="Latest from India News"
                posts={catIndia}
                href="/?category=india-news"
              />
              <CategoryRow title="Latest from Sports" posts={catSports} href="/?category=sports" />

              {/* 9 — Bottom of home feed */}
              <div className={styles.homeAd}>
                <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
              </div>
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
    <Reveal as="section" className={styles.package}>
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
            <AuthorByline post={feature} size="sm" />
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
                  <AuthorByline post={post} size="sm" />
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
    </Reveal>
  );
}

function CategoryRow({ title, posts, href }) {
  if (!posts?.length) return null;
  return (
    <Reveal as="section" className={styles.catSection}>
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
              <AuthorByline post={post} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </Reveal>
  );
}
