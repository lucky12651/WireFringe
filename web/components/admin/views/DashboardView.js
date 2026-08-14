import React, { useMemo, useState } from 'react';
import {
  formatDateShort,
  formatRelativeDate,
  postExcerpt,
  postUrl,
  cn,
} from '../../../lib/utils';

function categoryTint(bucket) {
  const s = String(bucket || '').toLowerCase();
  if (s.includes('sport')) return 'bg-gradient-to-br from-white/50 to-transparent';
  if (s.includes('financ') || s.includes('money') || s.includes('market')) {
    return 'bg-gradient-to-br from-white/60 to-transparent';
  }
  if (s.includes('tech') || s.includes('scien')) return 'bg-gradient-to-br from-white/40 to-transparent';
  return 'bg-gradient-to-br from-white/35 to-transparent';
}

function shortMonth(label) {
  const s = String(label || '');
  if (/^\d{4}-\d{2}$/.test(s)) {
    const m = Number(s.slice(5, 7));
    return ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][
      m - 1
    ] || s;
  }
  return s.slice(0, 3).toUpperCase();
}

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M3 10h18M8 2v4M16 2v4" />
  </svg>
);

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const IconArticle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M4 4h16v16H4z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export function DashboardView({
  postsCount,
  categoriesCount,
  queueCount,
  pendingCommentsCount,
  canViewPendingCommentsCount,
  postsByMonth,
  postGrowth30,
  trendingComments,
  trendingHint,
  latestPosts,
  recentCache,
  mediaCount,
  memberStats,
  me,
  onNavigate,
}) {
  const [filter, setFilter] = useState('all');

  const published = Number(postsCount) || 0;
  const media = Number(mediaCount) || 0;
  const growthDelta = postGrowth30?.delta;

  const feedItems = useMemo(() => {
    const live = (Array.isArray(latestPosts) ? latestPosts : []).map((p) => ({
      key: `live-${p.id}`,
      kind: 'active',
      id: p.id,
      title: p.title || 'Untitled',
      bucket: p.bucket || p.category || '',
      excerpt: postExcerpt(p, 120),
      author: p.creatorName || p.authorName || 'Admin',
      date: p.date || p.publishedAt || p.createdAt,
      ogImg: p.ogImg || p.image || '',
      sortAt: new Date(p.date || p.publishedAt || p.createdAt || 0).getTime() || 0,
    }));

    const cached = (Array.isArray(recentCache) ? recentCache : []).map((item, idx) => ({
      key: `cache-${item.id || item.url || idx}`,
      kind: 'cached',
      id: item.id || null,
      title: item.title || 'Cached item',
      bucket: '',
      excerpt: item.excerpt || item.summary || '',
      author: '',
      date: item.createdAt || item.handledAt || item.date,
      ogImg: item.ogImg || item.image || '',
      sortAt: new Date(item.createdAt || item.handledAt || item.date || 0).getTime() || 0,
    }));

    return [...live, ...cached].sort((a, b) => b.sortAt - a.sortAt);
  }, [latestPosts, recentCache]);

  const visible = useMemo(() => {
    if (filter === 'all') return feedItems;
    return feedItems.filter((i) => i.kind === filter);
  }, [feedItems, filter]);

  const months = Array.isArray(postsByMonth) ? postsByMonth : [];
  const maxMonth = Math.max(0, ...months.map((m) => Number(m.count) || 0));

  const pendingComments =
    canViewPendingCommentsCount !== false ? Number(pendingCommentsCount) || 0 : 0;

  const trends = Array.isArray(trendingComments) ? trendingComments : [];

  return (
    <div className="flex flex-col gap-0 animate-fade-up motion-reduce:animate-none">
      <section className="py-6 border-b border-line" aria-label="Overview stats">
        <div className="grid grid-cols-2 min-[900px]:grid-cols-4 gap-x-8 gap-y-5">
          {[
            { label: 'Published', value: published, sub: 'Live articles', go: 'posts' },
            {
              label: 'Pending comments',
              value: pendingComments,
              sub: 'Awaiting review',
              go: 'comments',
              warn: pendingComments > 0,
            },
            { label: 'Categories', value: Number(categoriesCount) || 0, sub: 'Taxonomy', go: 'categories' },
            { label: 'Media', value: media, sub: 'Uploaded assets', go: 'media' },
          ].map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => onNavigate?.(stat.go)}
              className="text-left bg-transparent border-0 p-0 cursor-pointer group"
            >
              <div className="text-[11px] tracking-[0.1em] uppercase text-ink-muted font-medium mb-1.5">
                {stat.label}
              </div>
              <div
                className={
                  'text-[28px] font-semibold tracking-tight leading-none ' +
                  (stat.warn ? 'text-[#e8b342]' : 'text-ink')
                }
              >
                {stat.value}
              </div>
              <div className="text-[12px] text-ink-tertiary mt-1.5 group-hover:text-ink">{stat.sub}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="py-6 border-b border-line grid grid-cols-1 min-[801px]:grid-cols-2 gap-10 items-start">
        <div aria-label="Post growth">
          <h2 className="text-[15px] m-0 mb-1 font-semibold text-ink tracking-tight">Post growth</h2>
          <p className="m-0 mb-4 text-[12px] text-ink-tertiary">Articles published over the last 6 months.</p>
          {months.length === 0 ? (
            <p className="m-0 text-[13px] text-ink-muted">No growth data yet.</p>
          ) : (
            <div className="flex items-stretch gap-2 h-[160px]" role="img" aria-label="Post growth by month">
              {months.map((m) => {
                const count = Number(m.count) || 0;
                const pct = maxMonth ? Math.max(count > 0 ? 10 : 2, Math.round((count / maxMonth) * 100)) : 2;
                return (
                  <div
                    key={m.key || m.label}
                    className="flex-1 flex flex-col items-center gap-1.5 min-w-0 h-full"
                    title={`${m.label}: ${count}`}
                  >
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: 'var(--text-primary)',
                          minHeight: count > 0 ? 8 : 2,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-ink font-medium leading-none">{count}</span>
                    <span className="text-[10px] text-ink-muted tracking-wide uppercase">
                      {shortMonth(m.label)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div aria-label="Comments trend">
          <h2 className="text-[15px] m-0 mb-1 font-semibold text-ink tracking-tight">Comments trend</h2>
          <p className="m-0 mb-4 text-[12px] text-ink-tertiary">Top liked comments from the last 15 days.</p>
          {trendingHint ? (
            <p className="m-0 text-[13px] text-ink-muted">{trendingHint}</p>
          ) : trends.length ? (
            <div className="flex flex-col max-h-[200px] overflow-y-auto">
              {trends.map((c) => (
                <div key={c.id} className="py-2.5 border-b border-line last:border-0">
                  <div className="flex justify-between gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                      {c.postTitle || c.postId}
                    </span>
                    <span className="text-[12px] text-ink-tertiary shrink-0">+{c.likes || 0}</span>
                  </div>
                  <p className="m-0 text-[12px] text-ink-tertiary leading-snug line-clamp-2">
                    <strong className="text-ink-secondary font-medium">{c.name || 'Anonymous'}:</strong>{' '}
                    {c.commentPreview || ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[13px] text-ink-muted">No trending comments yet.</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 min-[1151px]:grid-cols-[minmax(0,1fr)_280px] gap-10 items-start pt-6">
        <section className="min-w-0" aria-label="Activity">
          <div className="flex justify-between items-end gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="text-[15px] m-0 mb-1 font-semibold text-ink tracking-tight">Activity</h2>
              <p className="m-0 text-[12px] text-ink-tertiary">
                Recent published articles and bot output.
              </p>
            </div>
            <div className="flex gap-3" role="tablist" aria-label="Activity filters">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Live' },
                { id: 'cached', label: 'Cached' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  className={cn(
                    'text-[12px] tracking-wide py-1 px-0 bg-transparent border-0 cursor-pointer',
                    filter === f.id ? 'text-ink font-semibold' : 'text-ink-tertiary hover:text-ink'
                  )}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col max-h-[min(640px,70vh)] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="py-10 text-[13px] text-ink-muted">
                No activity items for this filter.
              </div>
            ) : (
              visible.map((item) => {
                const isLive = item.kind === 'active';
                return (
                  <article
                    key={item.key}
                    className="flex gap-3.5 py-3.5 border-b border-line last:border-b-0 items-start"
                  >
                    <div className="w-12 h-12 shrink-0 bg-bg-hover border border-line flex items-center justify-center overflow-hidden">
                      {item.ogImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.ogImg} alt="" className="w-full h-full object-cover block" />
                      ) : (
                        <span className="w-4 h-4 text-ink-muted flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                          {isLive ? <IconArticle /> : <IconShield />}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[13px] font-medium text-ink leading-snug">{item.title}</span>
                        {isLive && item.bucket ? (
                          <span className="text-[10px] uppercase tracking-wide text-ink-tertiary">
                            {item.bucket}
                          </span>
                        ) : null}
                        <span className="text-[10px] uppercase tracking-wide text-ink-muted">
                          {isLive ? 'Live' : 'Cached'}
                        </span>
                      </div>
                      {item.excerpt ? (
                        <p className="text-[12px] text-ink-tertiary leading-normal m-0 mb-1 line-clamp-1">
                          {item.excerpt}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-3 text-[11px] text-ink-muted flex-wrap">
                        {isLive ? (
                          <>
                            <span>By {item.author}</span>
                            <span>{formatDateShort(item.date) || '—'}</span>
                          </>
                        ) : (
                          <>
                            <span>{formatRelativeDate(item.date) || '—'}</span>
                            <span>Handled by bot</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isLive && item.id ? (
                      <div className="flex gap-3 shrink-0 self-center">
                        <a
                          className="text-[12px] text-ink-secondary no-underline hover:text-ink"
                          href={`/admin/post?id=${encodeURIComponent(item.id)}`}
                        >
                          Edit
                        </a>
                        <a
                          className="text-[12px] text-ink-secondary no-underline hover:text-ink"
                          href={postUrl({ id: item.id, title: item.title })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>

          <div className="pt-4">
            <button
              type="button"
              className="text-[13px] text-ink-secondary bg-transparent border-none cursor-pointer hover:text-ink p-0"
              onClick={() => onNavigate?.('posts')}
            >
              View all articles →
            </button>
          </div>
        </section>

        <aside className="flex flex-col gap-3 pt-1" aria-label="30-day growth">
          <h3 className="text-[11px] tracking-[0.12em] uppercase text-ink-muted font-medium m-0">
            30-day
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-[36px] font-semibold tracking-tight text-ink leading-none">
              {postGrowth30?.current != null ? postGrowth30.current : '—'}
            </span>
            {growthDelta != null && Number.isFinite(growthDelta) ? (
              <span className={'text-[14px] font-semibold mb-1 ' + (growthDelta >= 0 ? 'text-ink' : 'text-[#ff6b6b]')}>
                {growthDelta > 0 ? '↑' : growthDelta < 0 ? '↓' : '·'} {Math.abs(growthDelta)}%
              </span>
            ) : null}
          </div>
          <p className="m-0 text-[12px] text-ink-tertiary leading-snug">
            Articles published in the last 30 days
            {postGrowth30?.prev != null ? ` · previous ${postGrowth30.prev}` : ''}.
          </p>
        </aside>
      </div>
    </div>
  );
}
