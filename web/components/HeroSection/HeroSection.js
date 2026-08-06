import Link from 'next/link';
import { postUrl, postExcerpt, cn } from '../../lib/utils';
import AuthorByline from '../AuthorByline/AuthorByline';

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

function excerpt(post, max = 110) {
  return postExcerpt(post, max);
}

/** Purple highlight only on hover */
function HighlightTitle({ title, className }) {
  const t = String(title || '');
  const hlClass =
    'bg-transparent [box-decoration-break:clone] px-[0.07em] transition-all duration-300 group-hover:bg-bg-highlight group-hover:shadow-[0_0_0_3px_var(--bg-highlight),0_8px_24px_rgba(91,75,255,0.35)]';
  if (t.length < 24) {
    return (
      <h1 className={className}>
        <span className={hlClass}>{t}</span>
      </h1>
    );
  }
  const mid = Math.floor(t.length * 0.42);
  let split = t.indexOf(' ', mid);
  if (split < 0) split = mid;
  const first = t.slice(0, split).trimEnd();
  const second = t.slice(split).trimStart();
  return (
    <h1 className={className}>
      {first}{' '}
      <span className={hlClass}>{second}</span>
    </h1>
  );
}

export default function HeroSection({ posts = [] }) {
  if (!posts.length) {
    return (
      <section className="w-full animate-fade-up">
        <div className="py-[52px] text-center text-[15px] text-[#777]">No stories available</div>
      </section>
    );
  }

  const featured = posts[0];
  const grid = posts.slice(1, 5);

  return (
    <section className="w-full animate-fade-up">
      <Link
        href={postUrl(featured)}
        className="group block text-inherit mb-1.5 rounded-md max-md:rounded overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.45)] outline outline-1 outline-white/[0.04] transition-all duration-300 hover:shadow-[0_28px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(60,255,208,0.15),0_0_40px_rgba(60,255,208,0.06)] hover:outline-mint/20"
      >
        <div className="relative w-full aspect-video overflow-hidden bg-bg-card">
          {featured.ogImg ? (
            <img
              src={featured.ogImg}
              alt=""
              loading="eager"
              className="w-full h-full object-cover block transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.055] group-hover:brightness-105 group-hover:saturate-105"
            />
          ) : (
            <div className="w-full h-full min-h-[120px] bg-[radial-gradient(circle_at_30%_40%,rgba(60,255,208,0.08),transparent_50%),linear-gradient(145deg,#161616_0%,#050505_100%)]" />
          )}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.62)_36%,rgba(0,0,0,0.2)_62%,transparent_100%),linear-gradient(90deg,rgba(0,0,0,0.35)_0%,transparent_45%)] transition-opacity group-hover:opacity-95" />
          <div className="absolute left-0 right-0 bottom-0 z-[3] p-6 md:p-8 transition-transform duration-300 ease-out group-hover:-translate-y-[3px]">
            <HighlightTitle
              title={featured.title}
              className="text-hero font-black leading-[1.02] tracking-[-0.038em] text-white mb-3.5 max-w-[22ch] max-md:max-w-none shadow-black/50 [text-shadow:0_2px_32px_rgba(0,0,0,0.55)]"
            />
            {excerpt(featured) ? (
              <p className="text-[15px] md:text-[17.5px] font-normal text-[#e4e4e4] mb-4 max-w-[38em] leading-[1.42] tracking-tight [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]">
                {excerpt(featured)}
              </p>
            ) : null}
            <div className="flex items-center gap-3 flex-wrap text-xs text-[#999]">
              <AuthorByline post={featured} size="sm" />
              {featured.date ? (
                <span className="font-mono text-[10px] text-[#7a7a7a] tracking-wide uppercase">
                  {formatDate(featured.date)}
                </span>
              ) : null}
              <span
                className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-[#777] px-2 py-[3px] rounded-pill bg-white/5 border border-white/[0.06]"
                title="Comments"
              >
                <CommentIcon /> {Number(featured.commentCount) || 0}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {grid.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-dotted border-[#2e2e2e] mt-2">
          {grid.map((post, i) => (
            <article
              key={post.id}
              className={cn(
                'group grid grid-cols-[92px_1fr] md:grid-cols-[104px_1fr] gap-4 items-start py-[18px] md:py-[22px] border-b border-dotted border-[#2e2e2e] transition-colors hover:bg-[linear-gradient(90deg,transparent,rgba(60,255,208,0.03),transparent)]',
                i % 2 === 0
                  ? 'md:pr-[22px] md:border-r md:border-dotted md:border-[#2e2e2e] md:pl-0'
                  : 'md:pl-[22px] md:pr-0',
                'px-0'
              )}
            >
              <Link
                href={postUrl(post)}
                className="w-[92px] h-[70px] md:w-[104px] md:h-[78px] overflow-hidden bg-[#111] shrink-0 rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.35)] outline outline-1 outline-white/[0.04]"
              >
                {post.ogImg ? (
                  <img
                    src={post.ogImg}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-[radial-gradient(circle_at_30%_40%,rgba(60,255,208,0.08),transparent_50%),linear-gradient(145deg,#161616_0%,#050505_100%)]" />
                )}
              </Link>
              <div className="min-w-0 pt-0.5">
                <Link
                  href={postUrl(post)}
                  className="block text-[17.5px] font-extrabold leading-[1.22] tracking-tight text-white mb-2.5 transition-colors group-hover:text-mint"
                >
                  {post.title}
                </Link>
                <div className="flex items-center gap-3 text-[11px]">
                  <AuthorByline post={post} size="sm" />
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wide text-[#777] px-1.5 py-0.5 rounded-pill bg-white/5 border border-white/[0.06]"
                    title="Comments"
                  >
                    <CommentIcon /> {Number(post.commentCount) || 0}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
