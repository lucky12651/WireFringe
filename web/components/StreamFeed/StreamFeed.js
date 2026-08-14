import Link from 'next/link';
import { postUrl, postExcerpt, cn } from '../../lib/utils';
import AuthorByline from '../AuthorByline/AuthorByline';

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
  showNewsletter = true,
  NewsletterComponent = null,
}) {
  return (
    <aside
      className="min-w-0 flex-1 min-h-0 h-full max-h-full flex flex-col pt-[18px] pr-2.5 pb-5 pl-[22px] overflow-hidden bg-bg max-md:h-auto max-md:max-h-none max-md:overflow-visible max-md:pt-7 max-md:px-0 max-md:pb-0"
      aria-label="Latest stream"
    >
      <div className="flex gap-0 mx-auto mb-4 bg-bg-secondary rounded-pill p-[3px] w-fit shrink-0 z-[5] justify-center border border-line shadow-[0_8px_28px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <button
          type="button"
          className={cn(
            'appearance-none border-0 font-mono text-[10px] font-bold tracking-[0.12em] uppercase px-[18px] py-2.5 rounded-pill cursor-pointer transition-all',
            feedTab === 'latest'
              ? 'bg-mint text-black shadow-[0_2px_16px_rgba(60,255,208,0.4),0_0_24px_rgba(60,255,208,0.15)] hover:bg-mint-hover hover:text-black'
              : 'bg-transparent text-ink-muted hover:text-ink'
          )}
          onClick={() => onTabChange?.('latest')}
        >
          LATEST
        </button>
        <button
          type="button"
          className={cn(
            'appearance-none border-0 font-mono text-[10px] font-bold tracking-[0.12em] uppercase px-[18px] py-2.5 rounded-pill cursor-pointer transition-all',
            feedTab === 'following'
              ? 'bg-mint text-black shadow-[0_2px_16px_rgba(60,255,208,0.4),0_0_24px_rgba(60,255,208,0.15)] hover:bg-mint-hover hover:text-black'
              : 'bg-transparent text-ink-muted hover:text-ink'
          )}
          onClick={() => onTabChange?.('following')}
        >
          FOLLOWING
        </button>
      </div>

      {feedTab === 'following' && !user ? (
        <div className="text-center px-3 py-10 text-ink-tertiary text-sm flex-1">
          <p>Sign in to follow writers and topics.</p>
          <Link
            href="/login"
            className="inline-block mt-3.5 bg-mint text-black font-mono text-[11px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-sm transition-all hover:bg-mint-hover hover:-translate-y-0.5"
          >
            SIGN IN
          </Link>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center px-3 py-10 text-ink-tertiary text-sm flex-1">No posts yet.</div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1.5 -mr-0.5 max-md:overflow-visible max-md:max-h-none">
          {posts.map((post, idx) => {
            const mode = idx % 4;
            const body = excerpt(post, mode === 1 ? 220 : 140);

            return (
              <article
                key={post.id}
                className="group pt-[22px] pr-1 pb-[22px] pl-0 border-b border-dotted border-line animate-fade-up shrink-0 transition-colors last:border-b-0 last:pb-2 hover:bg-[linear-gradient(90deg,transparent,rgba(60,255,208,0.055),transparent)] hover:rounded-sm"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <AuthorByline
                    post={post}
                    size="sm"
                    showAvatar
                    time={formatRelative(post.date)}
                  />
                </div>

                {mode === 0 && (
                  <div className="flex gap-3.5 items-start">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={postUrl(post)}
                        className="block text-base font-extrabold leading-[1.28] tracking-tight text-ink mb-2 transition-colors hover:text-mint"
                      >
                        {post.title}
                      </Link>
                      {body ? (
                        <p className="text-sm leading-relaxed text-ink-secondary mb-2 tracking-tight group-hover:text-ink-soft">
                          {body}
                        </p>
                      ) : null}
                    </div>
                    {post.ogImg ? (
                      <Link
                        href={postUrl(post)}
                        className="w-20 h-20 shrink-0 overflow-hidden bg-bg-card"
                      >
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

                {mode === 1 && (
                  <div>
                    <p className="text-sm leading-relaxed text-ink-secondary mb-2 tracking-tight group-hover:text-ink-soft">
                      <strong className="text-ink font-extrabold tracking-tight">{post.title}.</strong>{' '}
                      {body}
                    </p>
                    {post.link ? (
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline text-mint text-[13px] font-semibold border-b border-mint/35 transition-colors hover:border-mint hover:text-mint-hover"
                      >
                        {String(post.bucket || 'Source').toUpperCase()}
                      </a>
                    ) : (
                      <Link
                        href={postUrl(post)}
                        className="inline text-mint text-[13px] font-semibold border-b border-mint/35 transition-colors hover:border-mint hover:text-mint-hover"
                      >
                        READ MORE
                      </Link>
                    )}
                    {body.length > 80 ? (
                      <blockquote className="mt-3 mb-1 py-2 pl-3.5 border-l-2 border-line-strong text-ink-tertiary text-[13.5px] leading-normal italic transition-colors group-hover:border-mint/50">
                        {body.slice(0, 120)}
                        {body.length > 120 ? '…' : ''}
                      </blockquote>
                    ) : null}
                  </div>
                )}

                {mode === 2 && (
                  <>
                    <Link
                      href={postUrl(post)}
                      className="block text-base font-extrabold leading-[1.28] tracking-tight text-ink mb-2 transition-colors hover:text-mint"
                    >
                      {post.title}
                    </Link>
                    {post.ogImg ? (
                      <Link
                        href={postUrl(post)}
                        className="block w-full aspect-video overflow-hidden bg-bg-card my-2.5 mb-3 rounded-sm"
                      >
                        <img
                          src={post.ogImg}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </Link>
                    ) : null}
                    {body ? (
                      <p className="text-sm leading-relaxed text-ink-secondary mb-2 tracking-tight group-hover:text-ink-soft">
                        {body}
                      </p>
                    ) : null}
                  </>
                )}

                {mode === 3 && (
                  <div className="flex gap-3.5 items-start">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={postUrl(post)}
                        className="block text-base font-extrabold leading-[1.28] tracking-tight text-ink mb-2 transition-colors hover:text-mint"
                      >
                        {post.title}
                      </Link>
                      {body ? (
                        <p className="text-sm leading-relaxed text-ink-secondary mb-2 tracking-tight group-hover:text-ink-soft">
                          {body}
                        </p>
                      ) : null}
                      {post.link ? (
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline text-mint text-[13px] font-semibold border-b border-mint/35 transition-colors hover:border-mint hover:text-mint-hover"
                        >
                          [{String(post.bucket || 'SOURCE').toUpperCase()}]
                        </a>
                      ) : null}
                    </div>
                    {post.ogImg ? (
                      <Link
                        href={postUrl(post)}
                        className="w-20 h-20 shrink-0 overflow-hidden bg-bg-card"
                      >
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

                <div className="flex items-center gap-3.5 mt-3 text-ink-muted">
                  <span
                    className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors group-hover:text-ink-tertiary hover:!text-mint"
                    title="Comments"
                  >
                    <ChatIcon /> {Number(post.commentCount) || 0}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors group-hover:text-ink-tertiary hover:!text-mint"
                    title="Share"
                  >
                    <ShareIcon />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showNewsletter && NewsletterComponent ? (
        <div id="newsletter" className="mt-3 pt-3.5 border-t border-dotted border-line shrink-0">
          {NewsletterComponent}
        </div>
      ) : null}
    </aside>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}
