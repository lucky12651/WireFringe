import { useState } from 'react';
import Link from 'next/link';
import { postExcerpt } from '../../lib/utils';
import AuthorByline from '../AuthorByline/AuthorByline';
import { Watermark } from '../PostDesigns/shared';
import { FadeImg } from '../PostDesigns/reading';
import { heroCredit } from '../../lib/articleExtras';

function formatPubDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function slugifyCategory(cat) {
  return String(cat || '')
    .toLowerCase()
    .replace(/ & /g, '-')
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function PostHero({ post, commentCount = 0, onOpenComments }) {
  const [toast, setToast] = useState('');
  const bucket = post?.bucket || 'News';
  const excerpt = postExcerpt(post, 180);
  const authorName = String(post?.creatorName || post?.creator || '').trim();

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard');
    } catch {
      showToast('Could not copy link');
    }
  };

  const share = async () => {
    const shareData = {
      title: post?.title || document.title,
      text: excerpt || post?.title || '',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* cancelled */
      }
      return;
    }
    copyLink();
  };

  const iconBtn =
    'inline-flex items-center justify-center w-9 h-9 rounded-full text-[#111] bg-transparent border-0 cursor-pointer transition-colors hover:bg-black/10';

  return (
    <section className="on-accent relative overflow-hidden bg-[var(--header-accent,#DEF23A)] text-[#111] pb-2">
      <Watermark stroke="rgba(0,0,0,0.18)" />
      <div className="max-w-[1360px] mx-auto px-5 md:px-10 pt-2 pb-2 grid grid-cols-1 min-[1001px]:grid-cols-[1fr_1.05fr] gap-7 min-[1001px]:gap-14 items-start">
        <div className="relative">
          <div className="border-[10px] md:border-[12px] border-[#1a1a1a] bg-[#0c0c0f] aspect-square overflow-hidden">
            {post?.ogImg ? (
              <FadeImg src={post.ogImg} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full min-h-[200px] bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent_50%),linear-gradient(145deg,#161616_0%,#050505_100%)]" />
            )}
          </div>
          <p className="font-mono text-xs text-black/60 mt-3 tracking-wide">
            {bucket}
            {post?.date ? ` · ${formatPubDate(post.date)}` : ''}
            {post?.readMinutes ? ` · ${post.readMinutes} min read` : ''}
          </p>
          <p className="m-0 mt-1 text-[11px] italic text-black/50">{heroCredit(post)}</p>
        </div>

        <div
          className="min-w-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 45px, rgba(0,0,0,0.14) 45px, 46px)',
          }}
        >
          <div className="flex flex-wrap gap-5 pt-0.5">
            <Link
              href={`/?category=${slugifyCategory(bucket)}`}
              className="inline-flex items-center gap-1.5 font-mono font-bold text-[12.5px] tracking-wide uppercase text-[#111] py-1 border-b-2 border-transparent hover:border-[#111]"
            >
              <span className="inline-flex items-center justify-center w-[17px] h-[17px] rounded-full border-[1.4px] border-current text-xs leading-none">
                +
              </span>
              {bucket}
            </Link>
          </div>

          <h1 className="font-display font-normal text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.08] tracking-[-0.01em] text-[#111] py-5 m-0 [text-wrap:pretty]">
            {post?.title}
          </h1>

          {excerpt ? (
            <p className="font-sans font-normal text-[clamp(1.1rem,2vw,1.5rem)] leading-[1.4] text-[#111] py-[18px] m-0">
              {excerpt}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5 py-4">
            {authorName ? (
              <div className="font-serif text-base">
                <AuthorByline
                  post={post}
                  name={authorName}
                  avatarUrl={post?.creatorAvatarUrl}
                  size="lg"
                  label="by"
                />
              </div>
            ) : null}
            {post?.date ? (
              <time className="font-mono text-xs text-black/55" dateTime={post.date.toISOString()}>
                {formatPubDate(post.date)}
              </time>
            ) : null}
          </div>

          <div className="flex items-center gap-0.5 pt-3 pb-4">
            <button type="button" className={iconBtn} aria-label="Copy link" onClick={copyLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5" />
                <path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5" />
              </svg>
            </button>
            <button type="button" className={iconBtn} aria-label="Share" onClick={share}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v14" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onOpenComments}
              className="inline-flex items-center gap-2 ml-2 font-mono font-bold text-[13px] text-[#111] bg-transparent border-0 cursor-pointer hover:opacity-65"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {Number(commentCount) || 0} Comments
            </button>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed left-1/2 bottom-7 -translate-x-1/2 z-[999] bg-[#111] text-white font-mono text-[13px] px-[18px] py-3 rounded-lg">
          {toast}
        </div>
      ) : null}
    </section>
  );
}
