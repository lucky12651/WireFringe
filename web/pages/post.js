import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import CommentSection from '../components/CommentSection/CommentSection';
import ArticleBody from '../components/ArticleBody/ArticleBody';
import AdUnit from '../components/AdUnit/AdUnit';
import Reveal from '../components/Reveal/Reveal';
import { PostSkeleton } from '../components/Skeleton/Skeleton';
import { fetcher, api } from '../lib/api';
import { slugifyTitle, postUrl, stripHtml, postExcerpt } from '../lib/utils';
import { AD_SLOTS } from '../lib/ads';
import AuthorByline from '../components/AuthorByline/AuthorByline';

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function getServerSideProps(context) {
  const { query, params, asPath } = context;
  const isPreview = query.preview === 'true';

  if (isPreview) {
    return { props: { initialPost: null, initialLatest: [], isPreview: true } };
  }

  const path = String(asPath || '');
  const slugMatch = path.match(/^\/post\/([^/?#]+)/);
  const rawSlug = params?.slug || (slugMatch ? slugMatch[1] : null);
  let slug = null;
  if (rawSlug) {
    try {
      slug = decodeURIComponent(String(rawSlug));
    } catch {
      slug = String(rawSlug);
    }
  }
  const id = query?.id;

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

export default function PostPage({
  initialPost,
  initialLatest,
  isPreview: initialIsPreview,
  error: initialError,
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);

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
    return (
      router.query?.preview === 'true' ||
      new URLSearchParams(String(router.asPath || '').split('?')[1] || '').get('preview') === 'true'
    );
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
  const error =
    initialError || (postError ? 'Could not load this post. Please try again later.' : '');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!post?.id || isPreview) return;

    fetch('/api/views/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, interaction_type: 'view' }),
    }).catch(() => {});

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

  return (
    <Layout
      title={post?.title ? `${post.title} – Wirefringe` : undefined}
      description={post?.metaDescription || post?.excerpt || undefined}
      keywords={post?.keywords || undefined}
      headerProps={{ user, activeCategory: post?.bucket || 'All' }}
      showInlineAd={false}
    >
      <div className="pt-10 pb-20 max-w-[1180px] mx-auto relative max-sm:pt-7 max-sm:pb-14">
        {loading ? (
          <PostSkeleton />
        ) : error ? (
          <div className="text-center py-[100px] px-4">
            <h2 className="mb-5 text-[1.4rem]">{error}</h2>
            <Link
              href="/"
              className="text-mint font-bold font-mono text-xs tracking-wide uppercase hover:text-mint-hover"
            >
              ← Back to Home
            </Link>
          </div>
        ) : post ? (
          <article className="relative z-[1]">
            <header className="m-0 mb-5 max-w-none w-full text-left animate-fade-up max-sm:mb-5">
              <div className="flex flex-wrap gap-2.5 mb-3 items-center font-mono text-[11px] tracking-wide uppercase text-[#777]">
                <span className="font-bold text-mint">+ {post.bucket || 'News'}</span>
                <span className="text-[#444]" aria-hidden="true">
                  •
                </span>
                <time dateTime={post.date?.toISOString()}>{formatDate(post.date)}</time>
                {post.readMinutes ? (
                  <>
                    <span className="text-[#444]" aria-hidden="true">
                      •
                    </span>
                    <span className="text-[#666]">{post.readMinutes} min read</span>
                  </>
                ) : null}
              </div>
              <h1 className="text-[clamp(1.75rem,3.6vw,2.65rem)] max-md:text-[clamp(1.55rem,6vw,2.1rem)] font-black leading-[1.12] max-md:leading-tight tracking-tight m-0 mb-3.5 text-white max-w-full w-full [text-wrap:pretty]">
                {post.title}
              </h1>
              {postExcerpt(post, 200) ? (
                <p className="text-[clamp(1.05rem,1.6vw,1.2rem)] text-[#b0b0b0] leading-snug m-0 mb-[18px] tracking-tight max-w-full w-full font-normal">
                  <span className="text-[#555] font-semibold">/ </span>
                  {postExcerpt(post, 200)}
                </p>
              ) : null}

              {authorName ? (
                <div className="flex items-center gap-3.5 mb-2 pt-1">
                  <AuthorByline
                    post={post}
                    name={authorName}
                    avatarUrl={authorAvatarUrl}
                    size="lg"
                    label="By"
                    className="min-w-0"
                  />
                </div>
              ) : null}
            </header>

            {post.ogImg ? (
              <figure className="mt-1 mb-10 w-full max-w-full bg-bg-card overflow-hidden rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] animate-fade-up max-sm:mb-7 max-sm:rounded-sm">
                <img
                  src={post.ogImg}
                  alt={post.title}
                  className="w-full h-auto block max-h-[480px] max-md:max-h-[360px] object-cover"
                />
                <figcaption className="font-mono text-[10px] tracking-wide uppercase text-[#666] px-4 py-3 border-t border-white/5 bg-[#0a0a0a]">
                  {post.bucket ? `${post.bucket} · ` : ''}
                  {formatDate(post.date)}
                </figcaption>
              </figure>
            ) : null}

            <div className="grid grid-cols-1 min-[1001px]:grid-cols-[minmax(0,1fr)_300px] gap-12 items-start">
              <div className="min-w-0 max-w-[720px] min-[1001px]:max-w-[720px] max-md:max-w-none">
                <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />

                <ArticleBody
                  html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
                  magazine
                />

                <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />

                {relatedPosts.length > 0 ? (
                  <Reveal as="section" className="mt-14 pt-8 border-t border-line-dim">
                    <div className="flex items-center gap-4 mb-[22px]">
                      <h2 className="text-xl font-extrabold tracking-tight m-0 whitespace-nowrap">
                        More to read
                      </h2>
                      <span
                        className="flex-1 h-px bg-gradient-to-r from-mint/40 to-transparent"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                      {relatedPosts.map((p) => (
                        <Link
                          key={p.id}
                          href={postUrl(p)}
                          className="group flex gap-3.5 text-inherit p-3 -m-3 rounded-lg transition-colors hover:bg-white/[0.025]"
                        >
                          {p.ogImg ? (
                            <div className="w-[108px] h-20 overflow-hidden bg-bg-elevated shrink-0 rounded-sm shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
                              <img
                                src={p.ogImg}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="w-[108px] h-20 bg-bg-elevated shrink-0 rounded-sm" />
                          )}
                          <div>
                            <span className="font-mono text-[10px] font-bold tracking-wide uppercase text-mint mb-1.5 block">
                              {p.bucket}
                            </span>
                            <h4 className="text-[15px] font-bold leading-snug text-white tracking-tight transition-colors m-0 group-hover:text-mint">
                              {p.title}
                            </h4>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Reveal>
                ) : null}

                <CommentSection postId={post.id} />
              </div>

              <aside className="flex flex-col gap-5 min-w-0">
                <AdUnit variant="sidebar" slot={AD_SLOTS.sidebar} label="Advertisement" />

                <div className="bg-gradient-to-br from-bg-elevated to-bg-card border border-white/[0.07] rounded-lg p-[18px] shadow-[0_8px_28px_rgba(0,0,0,0.3)]">
                  <h3 className="font-mono text-[11px] font-bold tracking-widest uppercase text-white m-0 mb-3.5 pb-2.5 border-b border-[#222]">
                    Latest Headlines
                  </h3>
                  <div className="flex flex-col gap-3.5">
                    {sidebarPosts.map((p, index) => (
                      <Link
                        key={p.id}
                        href={postUrl(p)}
                        className="group flex gap-3 no-underline text-inherit transition-colors"
                      >
                        <span
                          className="font-extrabold text-mint min-w-[18px] text-sm font-mono"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-mono text-[10px] font-bold tracking-wide uppercase text-mint mb-1.5 block">
                            {p.bucket}
                          </span>
                          <h4 className="text-sm font-bold leading-snug text-white m-1 mt-1 transition-colors tracking-tight group-hover:text-mint">
                            {p.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="sticky top-[calc(var(--header-height,92px)+16px)] max-md:static">
                  <AdUnit variant="sidebar" slot={AD_SLOTS.sidebar} label="Advertisement" />
                </div>
              </aside>
            </div>
          </article>
        ) : null}
      </div>
    </Layout>
  );
}
