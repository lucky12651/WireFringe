import { useEffect, useState } from 'react';
import Link from 'next/link';
import { postExcerpt } from '../../lib/utils';
import { authorPath, sectionPath } from '../../lib/sections';
import { SITE_NAME } from '../../lib/site';
import AuthorByline from '../AuthorByline/AuthorByline';
import FollowBar from '../FollowBar/FollowBar';
import { CommentsCta } from '../CommentDrawer/CommentDrawer';

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

export function StickyTitleBar({ title, tone = 'light' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dark = tone === 'dark' || tone === 'purple';
  const bg =
    tone === 'purple'
      ? 'bg-[rgba(91,27,228,0.97)] text-white'
      : tone === 'dark'
        ? 'bg-[rgba(17,17,17,0.97)] text-white border-b border-[#2a2a2a]'
        : 'bg-white/97 text-[#1a1a1a] border-b border-[#e0e0e0]';

  return (
    <div
      className={`fixed left-0 right-0 top-[var(--header-height,96px)] z-[200] h-[52px] items-center gap-4 px-6 backdrop-blur-[8px] ${bg} ${
        show ? 'flex' : 'hidden'
      }`}
    >
      <Link
        href="/"
        className={`shrink-0 font-heading text-[18px] font-black italic tracking-[-0.04em] ${
          dark ? 'text-white' : 'text-[#3ae0b5]'
        }`}
      >
        {SITE_NAME}
      </Link>
      <span className={`min-w-0 flex-1 truncate text-center text-[13px] font-semibold ${dark ? 'text-white/80' : 'text-[#333]'}`}>
        {title}
      </span>
    </div>
  );
}

export function Watermark({ text = SITE_NAME, stroke = 'rgba(58,224,181,0.28)', className = '' }) {
  return (
    <div className={`relative h-[110px] overflow-hidden pointer-events-none select-none ${className}`}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-heading text-[80px] md:text-[155px] font-black italic leading-none tracking-[-0.06em]"
        style={{ color: 'transparent', WebkitTextStroke: `2.5px ${stroke}` }}
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
      : tone === 'dark'
        ? 'text-[#a0a0a0] hover:text-[#00d4aa]'
        : 'text-[#5b1be4] hover:opacity-70';

  return (
    <div className="mb-3.5 flex flex-wrap gap-2.5">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={tag === bucket ? sectionPath(bucket) : `/search?q=${encodeURIComponent(tag)}`}
          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${text}`}
        >
          <span className="inline-flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#00d4aa] text-[10px] font-black leading-none text-[#00d4aa] transition-transform hover:rotate-90">
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

  const dark = tone === 'dark' || tone === 'purple';
  const btn =
    tone === 'purple'
      ? 'border-white/30 text-white/75 hover:border-white/70 hover:text-white'
      : tone === 'dark'
        ? 'border-[#2a2a2a] text-[#a0a0a0] hover:border-[#666] hover:text-white'
        : 'border-[#d0d0d0] text-[#5b1be4] hover:border-[#5b1be4] hover:bg-[rgba(91,27,228,0.05)]';

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
              dark ? 'border-white/30 hover:border-[#00d4aa]' : 'border-[#d0d0d0] hover:border-[#00d4aa]'
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

export function StoryFlags({ post, tone = 'light' }) {
  const muted = tone === 'dark' ? 'text-[#a0a0a0]' : 'text-[#888]';
  const body = tone === 'dark' ? 'text-[#ccc]' : 'text-[#333]';
  return (
    <>
      {post?.isBreaking ? (
        <p className="m-0 mb-3 text-[12px] font-bold uppercase tracking-wide text-[#c0392b]">Breaking</p>
      ) : null}
      {post?.isSponsored ? (
        <p className={`m-0 mb-3 text-[12px] font-bold uppercase tracking-wide ${muted}`}>Paid / branded content</p>
      ) : null}
      {post?.correction ? (
        <div
          className={`mb-6 border border-[#e8b342] bg-[#e8b342]/10 p-4 text-[14px] ${
            tone === 'dark' ? 'text-[#f0f0f0]' : 'text-[#1a1a1a]'
          }`}
        >
          <strong>Correction</strong>
          {post.correctedAt || post.updatedAt ? (
            <span className={muted}> · {new Date(post.correctedAt || post.updatedAt).toLocaleString()}</span>
          ) : null}
          <p className="m-0 mt-2 whitespace-pre-wrap">{post.correction}</p>
        </div>
      ) : null}
      {post?.sourceUrl || post?.sourceName || post?.isBot ? (
        <p className={`m-0 mb-5 text-[13px] ${muted}`}>
          Rewritten from{' '}
          {post.sourceUrl ? (
            <a href={post.sourceUrl} className="text-[#00d4aa]" target="_blank" rel="noreferrer">
              {post.sourceName || post.sourceUrl}
            </a>
          ) : (
            <span>{post.sourceName || 'a partner wire'}</span>
          )}
          . Editors review these stories before they go live.{' '}
          <Link href="/sourcing" className={body}>
            Sourcing policy
          </Link>
        </p>
      ) : null}
    </>
  );
}

export function AuthorBioRow({ post, tone = 'light' }) {
  const { name, avatarUrl, initials } = authorBits(post);
  if (!name) return null;
  const secondary = tone === 'dark' ? 'text-[#a0a0a0]' : 'text-[#333]';
  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5b3cf5] to-[#c46af5] text-[14px] font-extrabold text-white">
          {initials}
        </div>
      )}
      <p className={`m-0 text-[12.5px] leading-relaxed ${secondary}`}>
        <AuthorByline post={post} name={name} avatarUrl={avatarUrl} size="md" label="" className="inline-flex" />{' '}
        covers <Link href={sectionPath(post.bucket)}>{post.bucket || 'the news'}</Link> at Wirefringe.{' '}
        <Link href={authorPath(post)} className="font-semibold text-[#00d4aa]">
          More by {name}
        </Link>
      </p>
    </div>
  );
}

export function StoryFooter({ post, router, onOpenComments, tone = 'light' }) {
  const tagColor = tone === 'dark' ? 'text-[#00d4aa]' : 'text-[#5b1be4]';
  return (
    <>
      <CommentsCta count={post.commentCount} onClick={onOpenComments} />
      {(post.tags || []).length ? (
        <p className={`mt-6 text-[13px] ${tone === 'dark' ? 'text-[#a0a0a0]' : 'text-[#888]'}`}>
          Tags:{' '}
          {post.tags.map((tag) => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className={`mr-2 ${tagColor}`}>
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
    <div className={`relative w-full overflow-hidden bg-[#0c0c0c] ${className}`} style={{ aspectRatio: ratio }}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent_50%),linear-gradient(145deg,#161616_0%,#050505_100%)]" />
      )}
    </div>
  );
}
