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
import { postMatchesFollows } from '../lib/follows';
import { AD_SLOTS } from '../lib/ads';
import SearchResults from '../components/SearchResults/SearchResults';
import AuthorByline from '../components/AuthorByline/AuthorByline';
import { useAuth } from '../hooks';

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
  const { data: frontpage } = useSWR('/api/frontpage', fetcher, { revalidateOnFocus: false });
  const { data: catalog } = useSWR('/api/catalog', fetcher, { revalidateOnFocus: false });

  const posts = useMemo(
    () => (postsData || []).map((p) => ({ ...p, date: p.date ? new Date(p.date) : null })),
    [postsData]
  );

  const { me: user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedTab, setFeedTab] = useState('latest');
  const { data: follows, isLoading: followsLoading } = useSWR(
    user ? '/api/me/follows' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

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

  const programmedHero = (frontpage?.hero || []).map((p) => ({
    ...p,
    date: p.date ? new Date(p.date) : null,
  }));
  const heroPosts = (programmedHero.length ? programmedHero : filtered.slice(0, 5));
  const latestFeed = (filtered.slice(5).length ? filtered.slice(5) : filtered).slice(0, 20);
  const followingFeed = useMemo(
    () => filtered.filter((p) => postMatchesFollows(p, follows)).slice(0, 30),
    [filtered, follows]
  );
  const feedPosts = feedTab === 'following' ? followingFeed : latestFeed;
  const mostRead = useMemo(() => {
    return [...filtered]
      .sort((a, b) => Number(b.readMinutes || 0) - Number(a.readMinutes || 0))
      .slice(0, 5);
  }, [filtered]);

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
  const catalogHome = Array.isArray(catalog?.home) ? catalog.home.filter((s) => s.kind !== 'hero') : [];

  const postsForSection = (section) => {
    const cats = new Set(section.categories || []);
    const featured = filtered.filter((p) => (p.featuredIn || []).includes(section.id));
    const rest = filtered.filter((p) => {
      if ((p.featuredIn || []).includes(section.id)) return false;
      if (!cats.size) return true;
      const bags = [p.bucket, ...(p.extraCategories || [])];
      return bags.some((b) => cats.has(b));
    });
    const seen = new Set();
    const out = [];
    for (const p of [...featured, ...rest]) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= (section.maxPosts || 4)) break;
    }
    return out;
  };
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
        <div className="pb-0 bg-transparent">
          <div className="grid grid-cols-1 min-[1001px]:grid-cols-[minmax(0,1fr)_var(--stream-width,380px)] gap-0 items-start min-h-[60vh] relative">
            <div
              className="hidden min-[1001px]:block absolute top-6 bottom-0 right-[var(--stream-width,380px)] w-0 border-l border-dotted border-line pointer-events-none z-[1]"
              aria-hidden="true"
            />
            <div className="min-w-0 pt-6 pr-0 pb-16 pl-0 min-[1001px]:pr-9 min-[1001px]:border-0 max-[1000px]:border-b max-[1000px]:border-dotted max-[1000px]:border-line max-[1000px]:pb-7">
              {frontpage?.breaking ? (
                <Link
                  href={postUrl(frontpage.breaking)}
                  className="block mb-4 px-3 py-2 bg-[#c0392b] text-white no-underline text-[13px] font-semibold"
                >
                  Breaking: {frontpage.breaking.title}
                </Link>
              ) : null}
              <Reveal as="div" className="w-full">
                <HeroSection posts={heroPosts} />
              </Reveal>

              <div className="my-7 mb-8 w-full">
                <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
              </div>

              {catalogHome.length
                ? catalogHome.map((sec, i) => (
                    <div key={sec.id}>
                      {sec.kind === 'package' ? (
                        <PackageBlock title={sec.name} subtitle={sec.subtitle} posts={postsForSection(sec)} />
                      ) : null}
                      {sec.kind === 'most_popular' && mostRead.length ? (
                        <Reveal as="section" className="mt-[52px] scroll-mt-[90px]" id="most-popular">
                          <PackageRule />
                          <h2 className="text-2xl font-extrabold mb-1.5 tracking-tight">{sec.name || 'Most Popular'}</h2>
                          <ol className="list-none m-3 mt-3 p-0">
                            {mostRead.map((post, idx) => (
                              <li
                                key={post.id}
                                className="group grid grid-cols-[44px_1fr] gap-4 items-start py-[18px] border-b border-dotted border-line"
                              >
                                <span className="w-[38px] h-[38px] bg-bg-elevated text-ink flex items-center justify-center font-extrabold text-[15px] font-mono rounded-sm border border-line transition-all group-hover:scale-110 group-hover:bg-mint group-hover:text-black group-hover:border-transparent">
                                  {idx + 1}
                                </span>
                                <div>
                                  <Link
                                    href={postUrl(post)}
                                    className="text-lg font-extrabold leading-snug text-ink block mb-2 tracking-tight transition-colors group-hover:text-mint"
                                  >
                                    {post.title}
                                  </Link>
                                  <div className="flex items-center gap-2.5 text-[11px] flex-wrap">
                                    <AuthorByline post={post} size="sm" />
                                    <span className="text-ink-muted">{formatDate(post.date)}</span>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </Reveal>
                      ) : null}
                      {sec.kind === 'category_row' ? (
                        <CategoryRow title={sec.name} posts={postsForSection(sec)} href={sec.href} />
                      ) : null}
                      {i % 2 === 1 ? (
                        <div className="my-7 mb-8 w-full">
                          <AdUnit
                            variant={i % 4 === 1 ? 'multipath' : 'banner'}
                            slot={i % 4 === 1 ? AD_SLOTS.multipath : AD_SLOTS.leaderboard}
                            label="Advertisement"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))
                : (
                  <>
                    {packageA.length > 0 && (
                      <PackageBlock
                        title="AI frontline"
                        subtitle="Enterprise AI, cyber security, and the tools rewriting how we work."
                        posts={packageA}
                      />
                    )}
                    {packageC.length > 0 && (
                      <PackageBlock
                        title="Market pulse"
                        subtitle="Business moves, markets, and the strategy stories behind the numbers."
                        posts={packageC}
                      />
                    )}
                    {mostRead.length > 0 && (
                      <Reveal as="section" className="mt-[52px] scroll-mt-[90px]" id="most-popular">
                        <PackageRule />
                        <h2 className="text-2xl font-extrabold mb-1.5 tracking-tight">Most Popular</h2>
                      </Reveal>
                    )}
                    {packageB.length > 0 && (
                      <PackageBlock
                        title="India desk"
                        subtitle="Politics, policy, and national headlines from across the country."
                        posts={packageB}
                      />
                    )}
                    {packageD.length > 0 && (
                      <PackageBlock
                        title="Wallet watch"
                        subtitle="Personal finance, tax, gold, and money moves that hit home."
                        posts={packageD}
                      />
                    )}
                    <CategoryRow title="Latest from Tech" posts={catTech} href="/?category=tech" />
                    <CategoryRow title="Latest from AI & Future Tech" posts={catAI} href="/?category=ai-future-tech" />
                    <CategoryRow title="Latest from Business & Markets" posts={catBiz} href="/?category=business-markets" />
                    <CategoryRow title="Latest from Personal Finance" posts={catFinance} href="/?category=personal-finance" />
                  </>
                )}
            </div>

            <div className="min-w-0 sticky top-[var(--header-height,88px)] h-[calc(100vh-var(--header-height,88px))] max-h-[calc(100vh-var(--header-height,88px))] overflow-hidden flex flex-col self-start bg-bg max-[1000px]:static max-[1000px]:h-auto max-[1000px]:max-h-none max-[1000px]:overflow-visible">
              <StreamFeed
                posts={feedPosts}
                feedTab={feedTab}
                onTabChange={setFeedTab}
                user={user}
                followCount={Array.isArray(follows) ? follows.length : 0}
                followsLoading={Boolean(user) && followsLoading}
                topics={catalog?.sidebar || []}
                NewsletterComponent={<NewsletterSignup />}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function PackageRule() {
  return (
    <div className="h-0.5 bg-gradient-to-r from-mint from-0% via-mint via-[12%] to-transparent to-[90%] w-full mb-3.5 origin-left" />
  );
}

function PackageBlock({ title, subtitle, posts }) {
  if (!posts?.length) return null;
  const feature = posts[0];
  const rest = posts.slice(1, 4);

  return (
    <Reveal as="section" className="mt-12 pt-0 animate-fade-up">
      <PackageRule />
      <h2 className="text-[22px] font-extrabold tracking-tight mb-[22px] text-ink leading-tight">
        {title} <span className="text-ink-tertiary font-medium tracking-tight">/ {subtitle}</span>
      </h2>
      <div className="grid grid-cols-1 min-[1001px]:grid-cols-[1.2fr_1fr] gap-7 items-start">
        <Link
          href={postUrl(feature)}
          className="group block text-inherit transition-transform duration-300 ease-out hover:-translate-y-[3px]"
        >
          <div className="w-full aspect-[4/3] overflow-hidden bg-bg-card mb-4 rounded-md shadow-md outline outline-1 outline-line transition-all group-hover:shadow-lg group-hover:outline-mint/20">
            {feature.ogImg ? (
              <img
                src={feature.ogImg}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : null}
          </div>
          <h3 className="text-2xl font-extrabold leading-tight tracking-tight mb-2.5 text-ink transition-colors group-hover:text-mint">
            {feature.title}
          </h3>
          {excerpt(feature, 120) ? (
            <p className="text-[15px] text-ink-secondary mb-3 leading-normal tracking-tight">
              {excerpt(feature, 120)}
            </p>
          ) : null}
          <div className="flex items-center gap-2.5 text-[11px] flex-wrap">
            <AuthorByline post={feature} size="sm" />
          </div>
        </Link>

        <div className="flex flex-col gap-0">
          {rest.map((post, idx) => (
            <Link
              key={post.id}
              href={postUrl(post)}
              className={`group grid grid-cols-[1fr_84px] gap-4 px-2 py-[18px] -mx-2 border-b border-dotted border-line text-inherit rounded-sm transition-colors hover:bg-bg-hover/60 ${idx === 0 ? 'pt-0' : ''}`}
            >
              <div>
                <h4 className="text-[16.5px] font-extrabold leading-snug text-ink mb-1.5 transition-colors tracking-tight group-hover:text-mint">
                  {post.title}
                </h4>
                {excerpt(post, 90) ? (
                  <p className="text-[13.5px] text-ink-tertiary mb-2 leading-snug">{excerpt(post, 90)}</p>
                ) : null}
                <div className="flex items-center gap-2.5 text-[11px] flex-wrap">
                  <AuthorByline post={post} size="sm" />
                </div>
              </div>
              {post.ogImg ? (
                <div className="w-[84px] h-[84px] overflow-hidden bg-bg-card rounded-sm shadow-sm outline outline-1 outline-line">
                  <img
                    src={post.ogImg}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                </div>
              ) : (
                <div className="w-[84px] h-[84px] overflow-hidden bg-bg-card rounded-sm" />
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
    <Reveal as="section" className="mt-14">
      <div className="flex items-baseline justify-between mb-[22px] border-t-2 border-mint pt-4">
        <h2 className="text-[22px] font-extrabold tracking-tight">{title}</h2>
        <Link
          href={href}
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-muted font-bold transition-all py-1 hover:text-mint hover:tracking-[0.14em]"
        >
          MORE
        </Link>
      </div>
      <div className="grid grid-cols-1 max-sm:grid-cols-1 sm:grid-cols-2 min-[1001px]:grid-cols-4 gap-[22px]">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={postUrl(post)}
            className="group block text-inherit transition-transform duration-300 ease-out hover:-translate-y-[5px]"
          >
            <div className="w-full aspect-[16/10] overflow-hidden bg-bg-card mb-3 rounded-md shadow-sm outline outline-1 outline-line transition-all group-hover:shadow-lg group-hover:outline-mint/15">
              {post.ogImg ? (
                <img
                  src={post.ogImg}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : null}
            </div>
            <h3 className="text-[15.5px] font-extrabold leading-snug text-ink mb-2.5 tracking-tight transition-colors group-hover:text-mint">
              {post.title}
            </h3>
            <div className="flex items-center gap-2.5 text-[11px] flex-wrap">
              <AuthorByline post={post} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </Reveal>
  );
}
