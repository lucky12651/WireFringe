import Link from 'next/link';
import { postUrl, postExcerpt, cn } from '../../lib/utils';
import AuthorByline from '../AuthorByline/AuthorByline';

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

function excerpt(post, max = 140) {
  return postExcerpt(post, max);
}

const placeholder =
  'w-full h-full bg-[radial-gradient(circle_at_30%_40%,var(--mint-dim),transparent_55%),linear-gradient(145deg,var(--bg-card)_0%,var(--bg-secondary)_100%)]';

export default function HeroSection({ posts = [] }) {
  if (!posts.length) {
    return (
      <section className="w-full animate-fade-up">
        <div className="py-[52px] text-center text-[15px] text-ink-tertiary">No stories available</div>
      </section>
    );
  }

  const featured = posts[0];
  const grid = posts.slice(1, 5);

  return (
    <section className="w-full animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-[76px_minmax(0,1fr)] items-start">
        <div className="hidden md:block" aria-hidden="true" />

        <Link href={postUrl(featured)} className="group block text-inherit max-w-[640px]">
          <div className="relative w-full aspect-[4/3]">
            <div
              className="absolute top-1/2 left-0 z-[2] hidden -translate-x-1/2 -translate-y-1/2 md:block"
              aria-hidden="true"
            >
              <div className="home-wordmark select-none font-heading font-black text-[96px] leading-none tracking-[-0.065em] text-ink">
                W<span className="text-mint italic inline-block">F</span>
              </div>
            </div>
            <div className="absolute inset-0 overflow-hidden bg-bg-card">
              {featured.ogImg ? (
                <img
                  src={featured.ogImg}
                  alt=""
                  loading="eager"
                  className="w-full h-full object-cover object-center block transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className={placeholder} />
              )}
            </div>
          </div>

          <div className="relative bg-bg -mt-16 md:-mt-[110px] mx-3 md:ml-9 md:mr-12 px-3 pt-3.5 pb-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <h1 className="[font-family:var(--font-hero)] font-normal text-[36px] md:text-[54px] leading-[0.98] tracking-[-0.01em] text-ink transition-colors group-hover:text-mint">
              {featured.title}
            </h1>
            {excerpt(featured) ? (
              <p className="font-serif text-[18px] md:text-[21px] leading-[1.3] text-ink mt-2.5">
                {excerpt(featured)}
              </p>
            ) : null}
            <div className="flex items-center gap-3 flex-wrap mt-2.5">
              <AuthorByline post={featured} size="sm" />
              {featured.date ? (
                <span className="font-mono text-[10px] text-ink-muted tracking-wide uppercase">
                  {formatDate(featured.date)}
                </span>
              ) : null}
              <CommentCount count={featured.commentCount} />
            </div>
          </div>
        </Link>
      </div>

      {grid.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mt-7 md:ml-[76px]">
          {grid.map((post, i) => (
            <article
              key={post.id}
              className={cn(
                'group grid grid-cols-[48px_1fr] gap-3 items-start py-3.5 border-b border-line',
                i % 2 === 0 ? 'md:pr-4 md:mr-4 md:border-r' : ''
              )}
            >
              <Link href={postUrl(post)} className="w-12 h-12 overflow-hidden bg-bg-card shrink-0">
                {post.ogImg ? (
                  <img
                    src={post.ogImg}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className={placeholder} />
                )}
              </Link>
              <div className="min-w-0">
                <Link
                  href={postUrl(post)}
                  className="block text-[15.5px] font-bold leading-[1.18] tracking-tight text-ink mb-1.5 transition-colors group-hover:text-mint"
                >
                  {post.title}
                </Link>
                <div className="flex items-center gap-3 flex-wrap">
                  <AuthorByline post={post} size="sm" />
                  <CommentCount count={post.commentCount} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentCount({ count }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-ink-muted"
      title="Comments"
    >
      <CommentIcon /> {Number(count) || 0}
    </span>
  );
}

function CommentIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
