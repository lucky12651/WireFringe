import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import HeroSection from '../components/HeroSection/HeroSection';
import { fetcher } from '../lib/api';
import { postUrl, postExcerpt } from '../lib/utils';
import Loader from '../components/Loader/Loader';
import AuthorByline from '../components/AuthorByline/AuthorByline';
import { tw } from '../lib/tw';

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
  return postExcerpt(post, max);
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
        <div className="h-[70vh] flex items-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout headerProps={{ activeCategory: 'For You', user }}>
        <div className="text-center px-4 py-12 text-[#888] min-h-[50vh] pt-20">
          <h1 className="mb-3 text-[32px] font-extrabold text-white">For You</h1>
          <p className="mb-5">Sign in to see your personalized feed.</p>
          <Link href="/login" className={tw.btnAccent}>
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
        <div className="h-[70vh] flex items-center">
          <Loader />
        </div>
      ) : (
        <div className="pb-0 bg-transparent">
          <div className="grid grid-cols-1 min-[1001px]:grid-cols-[minmax(0,1fr)_var(--stream-width,380px)] gap-0 items-start min-h-[60vh] relative">
            <div
              className="hidden min-[1001px]:block absolute top-0 bottom-0 right-[var(--stream-width,380px)] w-0 border-l border-dotted border-[#333] pointer-events-none z-[1]"
              aria-hidden="true"
            />
            <div className="min-w-0 pt-6 pr-0 pb-16 min-[1001px]:pr-9">
              <div className="h-0.5 bg-gradient-to-r from-mint from-0% via-mint via-[12%] to-transparent to-[90%] w-full mb-3.5" />
              <h2 className="text-[22px] font-extrabold tracking-tight mb-5 text-white leading-tight">
                For you
              </h2>
              <HeroSection posts={posts.slice(0, 5)} />
            </div>
            <aside className="min-w-0 sticky top-[var(--header-height,88px)] h-[calc(100vh-var(--header-height,88px))] max-h-[calc(100vh-var(--header-height,88px))] overflow-y-auto flex flex-col self-start bg-black max-[1000px]:static max-[1000px]:h-auto max-[1000px]:max-h-none max-[1000px]:overflow-visible pt-[18px] px-[22px] max-md:px-0">
              <div className="flex gap-0 mx-auto mb-4 bg-gradient-to-b from-[#161616] to-[#0e0e0e] rounded-pill p-[3px] w-fit shrink-0 border border-white/[0.06]">
                <div className="bg-mint text-black font-mono text-[10px] font-bold tracking-[0.12em] uppercase px-[18px] py-2.5 rounded-pill">
                  FOR YOU
                </div>
              </div>
              {posts.slice(5).map((post) => (
                <article
                  key={post.id}
                  className="group pt-[22px] pb-[22px] border-b border-dotted border-[#333]"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <AuthorByline
                      post={post}
                      size="sm"
                      showAvatar
                      time={formatRelative(post.date)}
                    />
                  </div>
                  <Link
                    href={postUrl(post)}
                    className="block text-base font-extrabold leading-snug tracking-tight text-white mb-2 transition-colors hover:text-mint"
                  >
                    {post.title}
                  </Link>
                  {excerpt(post) ? (
                    <p className="text-sm leading-relaxed text-[#a0a0a0] tracking-tight">
                      {excerpt(post)}
                    </p>
                  ) : null}
                </article>
              ))}
              {!posts.length && (
                <div className="text-center px-4 py-12 text-[#888]">
                  No recommendations yet. Start reading!
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </Layout>
  );
}
