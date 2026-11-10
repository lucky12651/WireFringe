import { useState } from 'react';
import Link from 'next/link';
import { postUrl, postExcerpt, cn } from '../../lib/utils';
import AuthorByline from '../AuthorByline/AuthorByline';

function sourceHost(link) {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function formatRelative(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 2) return 'JUST NOW';
  if (m < 60) return `${m} MINUTES AGO`;
  if (h === 1) return 'AN HOUR AGO';
  if (h < 24) return `${h} HOURS AGO`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function excerpt(post, max = 180) {
  return postExcerpt(post, max);
}

/**
 * Verge-style right stream: LATEST / FOLLOWING with rich post cards
 */
export default function StreamFeed({
  posts = [],
  feedTab = 'latest',
  onTabChange,
  user = null,
  followCount = 0,
  followsLoading = false,
  showNewsletter = true,
  NewsletterComponent = null,
  topics = [],
}) {
  const emptyState = (() => {
    if (feedTab === 'following' && !user) {
      return (
        <div className="text-center px-3 py-10 text-ink-tertiary text-sm flex-1">
          <p>Sign in to follow writers and topics.</p>
          <Link
            href="/login?next=/"
            className="inline-block mt-3.5 bg-mint text-black font-mono text-[11px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-sm transition-all hover:bg-mint-hover hover:-translate-y-0.5"
          >
            SIGN IN
          </Link>
        </div>
      );
    }
    if (feedTab === 'following' && followsLoading) {
      return (
        <div className="text-center px-3 py-10 text-ink-tertiary text-sm flex-1">
          Loading your follows…
        </div>
      );
    }
    if (feedTab === 'following' && followCount === 0) {
      return (
        <div className="text-center px-3 py-10 text-ink-tertiary text-sm flex-1">
          <p>You&apos;re not following anyone yet.</p>
          <p className="mt-2 text-[13px] leading-relaxed">
            Open a story and tap Follow topic or Follow author. Those posts will show up here.
          </p>
        </div>
      );
    }
    if (feedTab === 'following' && posts.length === 0) {
      return (
        <div className="text-center px-3 py-10 text-ink-tertiary text-sm flex-1">
          <p>No stories from your follows yet.</p>
          <Link href="/for-you" className="inline-block mt-3 text-mint font-semibold">
            Open For You
          </Link>
        </div>
      );
    }
    if (posts.length === 0) {
      return (
        <div className="text-center px-3 py-10 text-ink-tertiary text-sm flex-1">No posts yet.</div>
      );
    }
    return null;
  })();

  const tabClass = (active) =>
    cn(
      'appearance-none border-0 font-mono text-[9.5px] font-bold tracking-[0.1em] uppercase px-4 py-2.5 min-w-[72px] rounded-pill cursor-pointer transition-colors',
      active ? 'bg-mint text-bg' : 'bg-transparent text-ink-muted hover:text-ink'
    );

  const headline =
    'block text-[15px] font-bold leading-[1.2] tracking-tight text-ink transition-colors hover:text-mint';
  const dek = 'font-serif text-[14px] leading-[1.45] text-ink-tertiary mt-1.5';
  const sourceLink =
    'inline-block mt-2 font-sans text-[12.5px] font-bold text-ink underline decoration-mint underline-offset-2 hover:text-mint';

  return (
    <aside
      className="min-w-0 flex-1 min-h-0 h-full max-h-full flex flex-col pt-[18px] pb-5 pl-6 overflow-hidden bg-bg max-[1000px]:h-auto max-[1000px]:max-h-none max-[1000px]:overflow-visible max-[1000px]:pt-7 max-[1000px]:px-0 max-[1000px]:pb-0"
      aria-label={feedTab === 'following' ? 'Following stream' : 'Latest stream'}
    >
      <div
        className="flex gap-0 mx-auto mb-3 bg-bg-secondary rounded-pill w-fit shrink-0 z-[5] justify-center"
        role="tablist"
        aria-label="Feed"
      >
        <button
          type="button"
          role="tab"
          aria-selected={feedTab === 'latest'}
          className={tabClass(feedTab === 'latest')}
          onClick={() => onTabChange?.('latest')}
        >
          Latest
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={feedTab === 'following'}
          className={tabClass(feedTab === 'following')}
          onClick={() => onTabChange?.('following')}
        >
          Following
        </button>
      </div>
      {Array.isArray(topics) && topics.length ? (
        <div className="flex flex-wrap gap-1.5 mb-2 shrink-0">
          {topics.map((t) => (
            <Link
              key={t.id || t.href}
              href={t.href || '/'}
              className="font-mono text-[10px] tracking-wide uppercase no-underline px-2 py-1 rounded-pill border border-line text-ink-secondary hover:border-mint hover:text-mint"
            >
              {t.label}
            </Link>
          ))}
        </div>
      ) : null}

      {emptyState ? (
        emptyState
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2 max-md:overflow-visible max-md:max-h-none">
          {posts.map((post, idx) => {
            const mode = idx % 4;
            const quick = mode === 0 || mode === 2;
            const body = excerpt(post, quick ? 260 : 130);

            return (
              <article
                key={post.id}
                className="group py-4 border-b border-line animate-fade-up shrink-0 last:border-b-0"
              >
                {quick ? (
                  <>
                    <div className="flex items-center mb-2.5">
                      <AuthorByline
                        post={post}
                        size="sm"
                        showAvatar
                        time={formatRelative(post.date)}
                      />
                    </div>
                    <p className="font-serif text-[14.5px] leading-[1.45] text-ink">
                      <Link
                        href={postUrl(post)}
                        className="font-sans font-bold tracking-tight text-ink transition-colors hover:text-mint"
                      >
                        {post.title}.
                      </Link>{' '}
                      {body}
                    </p>
                    {post.link ? (
                      <a href={post.link} target="_blank" rel="noreferrer" className={sourceLink}>
                        Read the original story
                        <span className="block mt-0.5 font-mono text-[9px] font-normal tracking-wide uppercase text-ink-muted no-underline">
                          [{sourceHost(post.link) || String(post.bucket || 'Source')}]
                        </span>
                      </a>
                    ) : null}
                    {mode === 0 && post.ogImg ? (
                      <Link
                        href={postUrl(post)}
                        className="block w-full aspect-[16/10] overflow-hidden bg-bg-card mt-4 border border-line"
                      >
                        <img
                          src={post.ogImg}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <div className="grid grid-cols-[minmax(0,1fr)_48px] gap-3 items-start">
                    <div className="min-w-0">
                      <Link href={postUrl(post)} className={headline}>
                        {post.title}
                      </Link>
                      {body ? <p className={dek}>{body}</p> : null}
                      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-2">
                        <AuthorByline post={post} size="sm" />
                        <span className="font-mono text-[9.5px] tracking-wide uppercase text-ink-muted whitespace-nowrap">
                          {formatRelative(post.date)}
                        </span>
                      </div>
                    </div>
                    {post.ogImg ? (
                      <Link href={postUrl(post)} className="w-12 h-12 shrink-0 overflow-hidden bg-bg-card">
                        <img
                          src={post.ogImg}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                        />
                      </Link>
                    ) : null}
                  </div>
                )}

                <div className="flex items-center gap-3.5 mt-2.5 text-ink-muted">
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-muted"
                    title="Comments"
                  >
                    <ChatIcon /> {Number(post.commentCount) || 0}
                  </span>
                  <CopyLinkButton href={postUrl(post)} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showNewsletter && NewsletterComponent ? (
        <div id="newsletter" className="mt-3 pt-3.5 border-t border-line shrink-0">
          {NewsletterComponent}
        </div>
      ) : null}
    </aside>
  );
}

function CopyLinkButton({ href }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center bg-transparent border-0 p-0 cursor-pointer transition-colors hover:text-mint',
        copied ? 'text-mint' : 'text-ink-muted'
      )}
      title={copied ? 'Link copied' : 'Copy link'}
      aria-label="Copy link"
      onClick={() => {
        const url = new URL(href, window.location.origin).toString();
        navigator.clipboard?.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      <LinkIcon />
    </button>
  );
}

function ChatIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
    </svg>
  );
}
