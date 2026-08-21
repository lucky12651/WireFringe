import { useEffect, useState } from 'react';
import Link from 'next/link';
import { postExcerpt, postUrl } from '../../lib/utils';
import { authorPath, sectionPath } from '../../lib/sections';
import { SITE_NAME } from '../../lib/site';
import AuthorByline from '../AuthorByline/AuthorByline';
import FollowBar from '../FollowBar/FollowBar';
import { CommentsCta } from '../CommentDrawer/CommentDrawer';
import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';

export const PAGE = 'max-w-[1360px] mx-auto px-5 md:px-10';

export function formatPubDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function slugifyCategory(cat) {
  return String(cat || '')
    .toLowerCase()
    .replace(/ & /g, '-')
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function authorBits(post) {
  const name = String(post?.creatorName || post?.creator || '').trim();
  const avatarUrl = String(post?.creatorAvatarUrl || '').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.length
    ? parts
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : 'W';
  return { name, avatarUrl, initials };
}

export function ReadingProgress({ color = '#00d4aa' }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setWidth(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 z-[12000] h-[3px] transition-[width] duration-100 ease-linear"
      style={{ width: `${width}%`, background: color }}
    />
  );
}

export function Watermark({ text = SITE_NAME, stroke, className = '' }) {
  return (
    <div className={`relative h-[110px] overflow-hidden pointer-events-none select-none ${className}`}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-heading text-[80px] md:text-[155px] font-black italic leading-none tracking-[-0.06em]"
        style={{
          color: 'transparent',
          WebkitTextStroke: `2.5px ${stroke || 'color-mix(in srgb, var(--mint) 32%, transparent)'}`,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function TagPills({ post, extra = [], tone = 'light' }) {
  const bucket = post?.bucket;
  const tags = Array.from(
    new Set([bucket, ...(post?.tags || []), ...extra].map((t) => String(t || '').trim()).filter(Boolean))
  ).slice(0, 5);
  if (!tags.length) return null;

  const text =
    tone === 'purple'
      ? 'text-white/75 hover:text-white'
      : 'text-ink-secondary hover:text-ink';

  return (
    <div className="mb-3.5 flex flex-wrap gap-2.5">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={tag === bucket ? sectionPath(bucket) : `/search?q=${encodeURIComponent(tag)}`}
          className={`group inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${text}`}
        >
          <span className="inline-flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-mint text-[10px] font-black leading-none text-mint transition-transform group-hover:rotate-90">
            +
          </span>
          {tag}
        </Link>
      ))}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );
}

export function ShareCluster({ post, onOpenComments, commentCount = 0, tone = 'light', showComments = true }) {
  const [toast, setToast] = useState('');

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
      text: postExcerpt(post, 180) || post?.title || '',
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

  const onPurple = tone === 'purple';
  const btn = onPurple
    ? 'border-white/30 text-white/75 hover:border-white/70 hover:text-white'
    : 'border-line text-ink-secondary hover:border-mint hover:text-ink';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Copy link"
          data-tip="Copy"
          onClick={copyLink}
          className={`relative inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] bg-transparent ${btn}`}
        >
          <CopyIcon />
        </button>
        <button
          type="button"
          aria-label="Share"
          onClick={share}
          className={`relative inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] bg-transparent ${btn}`}
        >
          <ShareIcon />
        </button>
        {showComments ? (
          <button
            type="button"
            onClick={onOpenComments}
            className={`inline-flex items-center overflow-hidden rounded-full border-[1.5px] ${
              onPurple ? 'border-white/30 hover:border-[#00d4aa]' : 'border-line hover:border-mint'
            }`}
          >
            <span className="bg-[#00d4aa] px-2.5 py-1 text-[11px] font-extrabold text-black">
              {Number(commentCount) || 0}
            </span>
            <span className="px-3 py-1 text-[11px] font-semibold text-[#00d4aa]">Comments</span>
          </button>
        ) : null}
      </div>
      {toast ? (
        <div className="fixed bottom-7 left-1/2 z-[999] -translate-x-1/2 rounded-md bg-[#333] px-[18px] py-3 font-sans text-[13px] text-white">
          {toast}
        </div>
      ) : null}
    </>
  );
}

export function StoryFlags({ post }) {
  return (
    <>
      {post?.isBreaking ? (
        <p className="m-0 mb-3 text-[12px] font-bold uppercase tracking-wide text-[#c0392b]">Breaking</p>
      ) : null}
      {post?.isSponsored ? (
        <p className="m-0 mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-tertiary">
          Paid / branded content
        </p>
      ) : null}
      {post?.correction ? (
        <div className="mb-6 border border-[#e8b342] bg-[#e8b342]/10 p-4 text-[14px] text-ink">
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
      {post?.sourceUrl || post?.sourceName || post?.isBot ? (
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
          <Link href="/sourcing" className="text-ink">
            Sourcing policy
          </Link>
        </p>
      ) : null}
    </>
  );
}

export function AuthorBioRow({ post }) {
  const { name, avatarUrl, initials } = authorBits(post);
  if (!name) return null;
  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5b3cf5] to-[#c46af5] text-[14px] font-extrabold text-white">
          {initials}
        </div>
      )}
      <p className="m-0 text-[12.5px] leading-relaxed text-ink-dek">
        <AuthorByline post={post} name={name} avatarUrl={avatarUrl} size="md" label="" className="inline-flex" />{' '}
        covers <Link href={sectionPath(post.bucket)}>{post.bucket || 'the news'}</Link> at Wirefringe.{' '}
        <Link href={authorPath(post)} className="font-semibold text-mint">
          More by {name}
        </Link>
      </p>
    </div>
  );
}

export function StoryFooter({ post, router, onOpenComments }) {
  return (
    <>
      <CommentsCta count={post.commentCount} onClick={onOpenComments} />
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
      <FollowBar topic={post.bucket || 'News'} author={post.creatorName || post.creator} loginNext={router.asPath} />
    </>
  );
}

export function HeroImage({ src, ratio = '16/9', className = '' }) {
  return (
    <div className={`relative w-full overflow-hidden bg-bg-elevated ${className}`} style={{ aspectRatio: ratio }}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent_50%),linear-gradient(145deg,#161616_0%,#050505_100%)]" />
      )}
    </div>
  );
}

export function StoryMeta({ post, className = '' }) {
  const mins = Number(post?.readMinutes) || 0;
  const date = post?.date ? formatPubDate(post.date) : '';
  if (!date && !mins) return null;
  return (
    <p className={`m-0 text-[12px] text-ink-tertiary ${className}`}>
      {date}
      {date && mins ? ' · ' : ''}
      {mins ? `${mins} min read` : ''}
    </p>
  );
}

export function MostPopularRail({ posts = [], showMark = false }) {
  const list = (posts || []).slice(0, 6);
  return (
    <aside className="relative min-w-0 min-[1001px]:self-stretch">
      <AdUnit variant="sidebar" slot={AD_SLOTS.sidebar} label="Advertisement" />
      <div className="relative pt-2 max-[1000px]:static min-[1001px]:sticky min-[1001px]:top-[calc(var(--header-height,96px)+16px)] min-[1001px]:z-[2]">
        {showMark ? (
          <span className="wf-mark pointer-events-none select-none hidden min-[1001px]:flex" aria-hidden="true">
            <span>F</span>
            <span>W</span>
          </span>
        ) : null}
        <h3 className="relative z-[1] font-mono text-[13px] tracking-[0.06em] uppercase text-mint font-bold mt-4 mb-1.5">
          Most Popular
        </h3>
        {list.length ? (
          <ol className="relative z-[1] list-none m-0 p-0">
            {list.map((p, index) => (
              <li key={p.id} className="border-t border-line py-[18px] last:border-b">
                <Link
                  href={postUrl(p)}
                  className="flex gap-3 no-underline text-ink font-sans font-bold text-base leading-snug hover:text-mint"
                >
                  <span className="font-mono text-mint font-bold shrink-0">{index + 1}.</span>
                  <span>{p.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="relative z-[1] m-0 mt-3 text-[13px] text-ink-tertiary">More stories coming soon.</p>
        )}
      </div>
    </aside>
  );
}

export function MoreStoriesBand({ post, moreInBucket = [], sidebarPosts = [], tone = 'plain' }) {
  const stories = (moreInBucket || []).slice(0, 3);
  const tops = (sidebarPosts || []).slice(0, 3);
  if (!stories.length && !tops.length) return null;

  const mint = tone === 'mint';
  const purple = tone === 'purple';
  const wrap = mint
    ? 'on-accent bg-[#5FF2C0] text-[#111] py-10 mt-8'
    : purple
      ? 'bg-[#5b1be4] text-white py-10 mt-8'
      : 'border-t border-line bg-bg-elevated py-10 mt-8 text-ink';
  const kicker = mint ? 'text-[#111]' : purple ? 'text-white' : 'text-ink';
  const linkHover = mint ? 'group-hover:text-[#0b8f72]' : purple ? 'group-hover:text-[#00d4aa]' : 'group-hover:text-mint';
  const cardTitle = mint ? 'text-[#111]' : purple ? 'text-white' : 'text-ink';
  const rule = mint ? 'border-black/15' : purple ? 'border-white/20' : 'border-line';
  const dateCls = mint ? 'text-black/55' : purple ? 'text-white/55' : 'text-ink-tertiary';
  const catHref = `/?category=${encodeURIComponent(slugifyCategory(post?.bucket || 'news'))}`;

  return (
    <section className={wrap}>
      <div className={`${PAGE} grid grid-cols-1 min-[1001px]:grid-cols-[1fr_280px] gap-8 min-[1001px]:gap-12`}>
        <div>
          <h3 className={`text-[14px] font-semibold mb-4 ${kicker}`}>
            More in{' '}
            <Link href={catHref} className="underline underline-offset-2">
              {post?.bucket || 'News'}
            </Link>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 min-[1001px]:grid-cols-3 gap-x-5 gap-y-5">
            {stories.map((p) => (
              <Link key={p.id} href={postUrl(p)} className="group block text-inherit">
                <div className={`aspect-[16/9] mb-2 overflow-hidden ${mint || purple ? 'bg-black/10' : 'bg-bg-hover'}`}>
                  {p.ogImg ? (
                    <img
                      src={p.ogImg}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <h4 className={`m-0 font-sans font-extrabold text-sm leading-snug line-clamp-2 ${cardTitle} ${linkHover}`}>
                  {p.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
        <aside>
          <h3 className={`text-[14px] font-extrabold mb-1 ${kicker}`}>Top Stories</h3>
          <ul className="list-none m-0 p-0">
            {tops.map((p) => (
              <li key={p.id} className={`border-t ${rule} py-2.5`}>
                {p.date ? (
                  <span className={`block font-mono text-[10.5px] mb-0.5 ${dateCls}`}>
                    {new Date(p.date)
                      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      .toUpperCase()}
                  </span>
                ) : null}
                <Link
                  href={postUrl(p)}
                  className={`font-sans font-extrabold text-sm leading-snug line-clamp-2 ${cardTitle} hover:opacity-80`}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

export function StoryShell({ children, sidebarPosts, moreInBucket, post, bandTone = 'plain', showMark = false }) {
  return (
    <>
      <div className={`${PAGE} pt-10 md:pt-12 pb-6`}>
        <div className="grid grid-cols-1 min-[1001px]:grid-cols-[minmax(0,1fr)_320px] gap-12 min-[1001px]:gap-[70px] items-start min-[1001px]:items-stretch">
          <div className="min-w-0">{children}</div>
          <MostPopularRail posts={sidebarPosts} showMark={showMark} />
        </div>
      </div>
      <MoreStoriesBand post={post} moreInBucket={moreInBucket} sidebarPosts={sidebarPosts} tone={bandTone} />
    </>
  );
}
