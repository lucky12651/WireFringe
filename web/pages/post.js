import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import CommentDrawer, { CommentsCta } from '../components/CommentDrawer/CommentDrawer';
import ArticleBody from '../components/ArticleBody/ArticleBody';
import AdUnit from '../components/AdUnit/AdUnit';
import { PostSkeleton } from '../components/Skeleton/Skeleton';
import PostHero from '../components/PostHero/PostHero';
import { fetcher, api } from '../lib/api';
import { slugifyTitle, postUrl, stripHtml } from '../lib/utils';
import { authorPath, sectionPath } from '../lib/sections';
import { AD_SLOTS } from '../lib/ads';
import AuthorByline from '../components/AuthorByline/AuthorByline';
import FollowBar from '../components/FollowBar/FollowBar';
import { DEFAULT_ACCENT, normalizeAccentColor } from '../lib/accents';
import { useAuth } from '../hooks';

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
  const { me } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);

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
    if (!isPreview || typeof window === 'undefined') return;
    const qid = new URLSearchParams(String(router.asPath || '').split('?')[1] || '').get('id');
    if (qid) {
      api(`/api/admin/post?id=${encodeURIComponent(qid)}`)
        .then(setPreviewPost)
        .catch(() => {
          const data = localStorage.getItem('gn_preview_data');
          if (data) setPreviewPost(JSON.parse(data));
        });
      return;
    }
    const data = localStorage.getItem('gn_preview_data');
    if (data) setPreviewPost(JSON.parse(data));
  }, [isPreview, router.asPath]);

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
    if (!router.isReady) return;
    const q = router.query?.comments;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (q === '1' || q === 'true' || hash === '#comments') {
      setCommentsOpen(true);
    }
  }, [router.isReady, router.query?.comments]);

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

  const authorName = useMemo(() => {
    const name = String(post?.creatorName || post?.creator || '').trim();
    return name || '';
  }, [post]);

  const authorAvatarUrl = useMemo(() => {
    const url = String(post?.creatorAvatarUrl || '').trim();
    return url || '';
  }, [post]);

  const authorInitials = useMemo(() => {
    const parts = authorName.split(/\s+/).filter(Boolean);
    if (!parts.length) return 'W';
    return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }, [authorName]);

  const moreInBucket = useMemo(() => {
    const currentId = String(post?.id || id || '');
    const bucket = post?.bucket;
    const same = (latest || []).filter(
      (p) => String(p?.id || '') !== currentId && p?.bucket && p.bucket === bucket
    );
    const rest = (latest || []).filter((p) => String(p?.id || '') !== currentId);
    return (same.length ? same : rest).slice(0, 6);
  }, [latest, id, post]);

  const accent = normalizeAccentColor(post?.accentColor, DEFAULT_ACCENT);

  return (
    <Layout
      title={post?.title ? `${post.title} – Wirefringe` : undefined}
      description={post?.metaDescription || post?.excerpt || undefined}
      keywords={post?.keywords || undefined}
      headerProps={{ user: me, activeCategory: post?.bucket || 'All' }}
      accentColor={accent}
      fullWidth
      headerHero={
        !loading && !error && post ? (
          <PostHero
            post={post}
            commentCount={post.commentCount}
            onOpenComments={() => setCommentsOpen(true)}
          />
        ) : null
      }
    >
      <div className="relative">
        {loading ? (
          <div className="max-w-[1360px] mx-auto px-5 md:px-10 py-16">
            <PostSkeleton />
          </div>
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
          <>
            <div className="max-w-[1360px] mx-auto px-5 md:px-10 pt-12 md:pt-14 pb-6">
              <div className="grid grid-cols-1 min-[1001px]:grid-cols-[minmax(0,1fr)_320px] gap-12 min-[1001px]:gap-[70px] items-start min-[1001px]:items-stretch">
                <article className="min-w-0">
                  {post.isBreaking ? (
                    <p className="m-0 mb-3 text-[12px] font-bold uppercase tracking-wide text-[#c0392b]">Breaking</p>
                  ) : null}
                  {post.isSponsored ? (
                    <p className="m-0 mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-tertiary">
                      Paid / branded content
                    </p>
                  ) : null}
                  {post.correction ? (
                    <div className="mb-6 p-4 border border-[#e8b342] bg-[#e8b342]/10 text-[14px] text-ink">
                      <strong>Correction</strong>
                      {post.correctedAt || post.updatedAt ? (
                        <span className="text-ink-tertiary">
                          {' '}
                          · {new Date(post.correctedAt || post.updatedAt).toLocaleString()}
                        </span>
                      ) : null}
                      <p className="m-0 mt-2 whitespace-pre-wrap">{post.correction}</p>
                    </div>
                  ) : null}
                  {post.sourceUrl || post.sourceName || post.isBot ? (
                    <p className="m-0 mb-5 text-[13px] text-ink-secondary">
                      Rewritten from{' '}
                      {post.sourceUrl ? (
                        <a href={post.sourceUrl} className="text-mint" target="_blank" rel="noreferrer">
                          {post.sourceName || post.sourceUrl}
                        </a>
                      ) : (
                        <span>{post.sourceName || 'a partner wire'}</span>
                      )}
                      . Editors review these stories before they go live.{' '}
                      <Link href="/sourcing">Sourcing policy</Link>
                    </p>
                  ) : null}
                  {authorName ? (
                    <div className="flex gap-3.5 items-start mb-8">
                      {authorAvatarUrl ? (
                        <img
                          src={authorAvatarUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full shrink-0 bg-mint text-black font-display text-sm flex items-center justify-center">
                          {authorInitials}
                        </div>
                      )}
                      <p className="m-0 text-[15.5px] leading-relaxed text-ink-dek">
                        <AuthorByline
                          post={post}
                          name={authorName}
                          avatarUrl={authorAvatarUrl}
                          size="md"
                          label=""
                          className="inline-flex"
                        />{' '}
                        covers{' '}
                        <Link href={sectionPath(post.bucket)}>{post.bucket || 'the news'}</Link> at
                        Wirefringe.{' '}
                        <Link href={authorPath(post)}>More by {authorName}</Link>
                      </p>
                    </div>
                  ) : null}

                  <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />

                  <ArticleBody
                    html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
                    magazine
                    className="article-body--verge"
                  />

                  <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />

                  <CommentsCta
                    count={post.commentCount}
                    onClick={() => setCommentsOpen(true)}
                  />

                  {(post.tags || []).length ? (
                    <p className="mt-6 text-[13px] text-ink-secondary">
                      Tags:{' '}
                      {post.tags.map((tag) => (
                        <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="mr-2 text-mint">
                          {tag}
                        </Link>
                      ))}
                    </p>
                  ) : null}

                  <FollowBar
                    topic={post.bucket || 'News'}
                    author={post.creatorName || post.creator}
                    loginNext={router.asPath}
                  />
                </article>

                <aside className="relative min-w-0 min-[1001px]:self-stretch">
                  <AdUnit variant="sidebar" slot={AD_SLOTS.sidebar} label="Advertisement" />
                  <div
                    className="relative pt-2 max-[1000px]:static min-[1001px]:sticky min-[1001px]:top-[calc(var(--header-height,96px)+16px)] min-[1001px]:z-[2]"
                  >
                    <span className="wf-mark pointer-events-none select-none hidden min-[1001px]:flex" aria-hidden="true">
                      <span>F</span>
                      <span>W</span>
                    </span>
                    <h3 className="relative z-[1] font-mono text-[13px] tracking-[0.06em] uppercase text-mint font-bold mt-4 mb-1.5">
                      Most Popular
                    </h3>
                    <ol className="relative z-[1] list-none m-0 p-0">
                      {sidebarPosts.map((p, index) => (
                        <li key={p.id} className="border-t border-line py-[18px] last:border-b">
                          <Link
                            href={postUrl(p)}
                            className="flex gap-3 no-underline text-ink font-sans font-bold text-base leading-snug hover:text-mint"
                          >
                            <span className="font-mono text-mint font-bold shrink-0">
                              {index + 1}.
                            </span>
                            <span>{p.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                </aside>
              </div>
            </div>

            {moreInBucket.length > 0 ? (
              <section className="on-accent bg-[#5FF2C0] text-[#111] py-8 mt-6">
                <div className="max-w-[1360px] mx-auto px-5 md:px-10 grid grid-cols-1 min-[1001px]:grid-cols-[1fr_280px] gap-8 min-[1001px]:gap-12">
                  <div>
                    <h3 className="text-[14px] font-semibold mb-3.5 text-[#111]">
                      More in{' '}
                      <Link
                        href={`/?category=${encodeURIComponent(
                          String(post.bucket || '')
                            .toLowerCase()
                            .replace(/ & /g, '-')
                            .replace(/ /g, '-')
                        )}`}
                        className="underline"
                      >
                        {post.bucket || 'News'}
                      </Link>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 min-[1001px]:grid-cols-3 gap-x-5 gap-y-4">
                      {moreInBucket.slice(0, 3).map((p) => (
                        <Link key={p.id} href={postUrl(p)} className="group block text-inherit">
                          <div className="aspect-[16/9] rounded-md mb-2 overflow-hidden bg-[#111]/10">
                            {p.ogImg ? (
                              <img
                                src={p.ogImg}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : null}
                          </div>
                          <h4 className="m-0 font-sans font-extrabold text-sm leading-snug line-clamp-2 text-[#111] group-hover:text-[#0b8f72]">
                            {p.title}
                          </h4>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <aside>
                    <h3 className="text-[14px] font-extrabold mb-1 text-[#111]">Top Stories</h3>
                    <ul className="list-none m-0 p-0">
                      {sidebarPosts.slice(0, 3).map((p) => (
                        <li key={p.id} className="border-t border-black/15 py-2.5">
                          {p.date ? (
                            <span className="block font-mono text-[10.5px] text-black/55 mb-0.5">
                              {p.date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              }).toUpperCase()}
                            </span>
                          ) : null}
                          <Link
                            href={postUrl(p)}
                            className="font-sans font-extrabold text-sm leading-snug line-clamp-2 hover:text-[#0b8f72]"
                          >
                            {p.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </aside>
                </div>
              </section>
            ) : null}

            <CommentDrawer
              open={commentsOpen}
              onClose={() => setCommentsOpen(false)}
              postId={post.id}
              commentCount={post.commentCount}
              user={me}
              nextPath={`${postUrl(post)}#comments`}
            />
          </>
        ) : null}
      </div>
    </Layout>
  );
}
