import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import CommentDrawer from '../components/CommentDrawer/CommentDrawer';
import { PostSkeleton } from '../components/Skeleton/Skeleton';
import PostHero from '../components/PostHero/PostHero';
import MagazinePost from '../components/PostDesigns/MagazinePost';
import SplitPost from '../components/PostDesigns/SplitPost';
import BannerPost from '../components/PostDesigns/BannerPost';
import DarkPost from '../components/PostDesigns/DarkPost';
import { fetcher, api } from '../lib/api';
import { slugifyTitle, postUrl } from '../lib/utils';
import { DEFAULT_ACCENT, normalizeAccentColor } from '../lib/accents';
import { normalizePostDesign, postHeaderConfig } from '../lib/postDesigns';
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
  const design = normalizePostDesign(post?.design);
  const isMagazine = !post || design === 'magazine';
  const headerCfg = postHeaderConfig(design, post?.accentColor);
  const openComments = () => setCommentsOpen(true);

  return (
    <Layout
      title={post?.title ? `${post.title} – Wirefringe` : undefined}
      description={post?.metaDescription || post?.excerpt || undefined}
      keywords={post?.keywords || undefined}
      headerProps={{ user: me, activeCategory: post?.bucket || 'All' }}
      accentColor={headerCfg.accent || (isMagazine ? accent : null)}
      headerVariant={post ? headerCfg.variant : 'theme'}
      articleTitle={post && !loading && !error ? post.title : ''}
      fullWidth
      mainClassName={!isMagazine ? '!pt-0 md:!pt-0' : ''}
      headerHero={
        !loading && !error && post && isMagazine ? (
          <PostHero post={post} commentCount={post.commentCount} onOpenComments={openComments} />
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
            {design === 'split' ? (
              <SplitPost
                post={post}
                router={router}
                onOpenComments={openComments}
                sidebarPosts={sidebarPosts}
                moreInBucket={moreInBucket}
              />
            ) : design === 'banner' ? (
              <BannerPost
                post={post}
                router={router}
                onOpenComments={openComments}
                sidebarPosts={sidebarPosts}
                moreInBucket={moreInBucket}
              />
            ) : design === 'dark' ? (
              <DarkPost
                post={post}
                router={router}
                onOpenComments={openComments}
                sidebarPosts={sidebarPosts}
                moreInBucket={moreInBucket}
              />
            ) : (
              <MagazinePost
                post={post}
                router={router}
                onOpenComments={openComments}
                sidebarPosts={sidebarPosts}
                moreInBucket={moreInBucket}
              />
            )}

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
