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
  const pending = Number(queueCount) || 0;
  const media = Number(mediaCount) || 0;
  const growthDelta = postGrowth30?.delta;
  const teamCount = Array.isArray(memberStats) ? memberStats.length : 0;

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
      {/* Overview stats */}
      <section
        className="grid grid-cols-2 min-[900px]:grid-cols-4 gap-3 mb-6"
        aria-label="Overview stats"
      >
        {[
          {
            label: 'Published',
            value: published,
            sub: 'All live articles',
            go: 'posts',
          },
          {
            label: 'Pending comments',
            value: pendingComments,
            sub: 'Awaiting review',
            go: 'comments',
            warn: pendingComments > 0,
          },
          {
            label: 'Categories',
            value: Number(categoriesCount) || 0,
            sub: 'Taxonomy buckets',
            go: 'categories',
          },
          {
            label: 'Media library',
            value: media,
            sub: 'Uploaded assets',
            go: 'media',
          },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigate?.(card.go)}
            className="text-left bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.05] cursor-pointer"
          >
            <div className="text-[10px] tracking-[0.12em] uppercase text-white/35 font-medium mb-2">
              {card.label}
            </div>
            <div
              className={
                'text-[28px] font-semibold tracking-tight leading-none ' +
                (card.warn ? 'text-[#e8b342]' : 'text-white')
              }
            >
              {card.value}
            </div>
            <div className="text-[11px] text-white/35 mt-2">{card.sub}</div>
          </button>
        ))}
      </section>

      {/* Quick actions + growth */}
      <section
        className="grid grid-cols-1 min-[901px]:grid-cols-[1.4fr_1fr] gap-3 mb-6"
        aria-label="Quick actions"
      >
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl py-5 px-5 backdrop-blur-sm">
          <div className="text-[10px] tracking-[0.14em] uppercase text-white/35 font-medium mb-3">
            Quick actions
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'posts', label: 'Manage posts', hint: 'Edit & publish' },
              { id: 'comments', label: 'Moderate', hint: pendingComments ? `${pendingComments} waiting` : 'Inbox clear' },
              me?.role === 'admin'
                ? { id: 'bot', label: 'News bot', hint: pending ? `${pending} in queue` : 'Pipeline' }
                : null,
              { id: 'media', label: 'Upload media', hint: 'Library' },
              { id: 'settings', label: 'Settings', hint: me?.username ? `@${me.username}` : 'Profile' },
              me?.role === 'admin' ? { id: 'users', label: 'Team', hint: teamCount ? `${teamCount} members` : 'Users' } : null,
            ]
              .filter(Boolean)
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onNavigate?.(a.id)}
                  className="group flex flex-col items-start gap-0.5 min-w-[132px] flex-1 py-3 px-3.5 rounded-xl border border-white/10 bg-black/30 text-left cursor-pointer transition-all hover:bg-white hover:border-white hover:text-black"
                >
                  <span className="text-[13px] font-semibold text-white group-hover:text-black">
                    {a.label}
                  </span>
                  <span className="text-[10px] text-white/40 group-hover:text-black/50">{a.hint}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl py-5 px-5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-white/35 font-medium mb-3">
              30-day growth
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-[32px] font-semibold tracking-tight text-white leading-none">
                {postGrowth30?.current != null ? postGrowth30.current : '—'}
              </span>
              {growthDelta != null && Number.isFinite(growthDelta) ? (
                <span
                  className={
                    'text-[13px] font-semibold mb-1 ' +
                    (growthDelta >= 0 ? 'text-white' : 'text-[#ff6b6b]')
                  }
                >
                  {growthDelta > 0 ? '↑' : growthDelta < 0 ? '↓' : '·'} {Math.abs(growthDelta)}%
                </span>
              ) : null}
            </div>
            <p className="m-0 mt-2 text-[12px] text-white/35 leading-snug">
              Articles published in the last 30 days
              {postGrowth30?.prev != null ? ` · prev period ${postGrowth30.prev}` : ''}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('posts')}
            className="mt-4 self-start text-[12px] font-medium text-white/50 bg-transparent border-none cursor-pointer hover:text-white transition-colors p-0"
          >
            View all posts →
          </button>
        </div>
      </section>

      {/* Workspace: activity + signals */}
      <div className="grid grid-cols-1 min-[1151px]:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <section className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden min-w-0 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm" aria-label="Activity">
          <div className="flex justify-between items-center py-5 px-[22px] pb-4 border-b border-white/[0.06] gap-3.5 flex-wrap max-[720px]:p-4">
            <div>
              <h2 className="text-[15.5px] m-0 mb-1 font-semibold text-white tracking-tight">Activity</h2>
              <p className="m-0 text-[11.5px] text-white/35">
                Bot output and published articles, most recent first.
              </p>
            </div>
            <div className="flex gap-1 p-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]" role="tablist" aria-label="Activity filters">
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
                    'text-[10px] tracking-wide rounded-full py-1.5 px-3 cursor-pointer transition-all border-0',
                    filter === f.id
                      ? 'text-black bg-white font-semibold shadow-[0_0_16px_rgba(255,255,255,0.12)]'
                      : 'text-white/50 bg-transparent hover:text-white'
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
              <div className="py-10 px-[22px] text-center text-white/30 text-[12.5px]">
                No activity items for this filter.
              </div>
            ) : (
              visible.map((item) => {
                const isLive = item.kind === 'active';
                return (
                  <article
                    key={item.key}
                    className="flex gap-3.5 py-4 px-[22px] border-b border-white/[0.05] last:border-b-0 items-start transition-colors hover:bg-white/[0.03] max-[720px]:flex-wrap max-[720px]:py-3.5 max-[720px]:px-4"
                  >
                    <div className="w-[52px] h-[52px] rounded-xl shrink-0 bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden relative">
                      {item.ogImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.ogImg} alt="" className="w-full h-full object-cover block" />
                      ) : (
                        <>
                          <span
                            className={cn(
                              'absolute inset-0 opacity-45 pointer-events-none',
                              isLive ? categoryTint(item.bucket) : 'bg-gradient-to-br from-white/50 to-transparent'
                            )}
                          />
                          <span className="relative z-[1] w-[18px] h-[18px] text-white/40 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px]">
                            {isLive ? <IconArticle /> : <IconShield />}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[13px] font-medium text-white leading-snug">{item.title}</span>
                        {isLive && item.bucket ? (
                          <span className="text-[8.5px] tracking-wide py-0.5 px-1.5 rounded-md uppercase font-semibold whitespace-nowrap text-white/70 bg-white/[0.06] border border-white/12">
                            {item.bucket}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            'text-[8.5px] tracking-wide py-0.5 px-1.5 rounded-md uppercase font-semibold whitespace-nowrap border bg-transparent',
                            isLive ? 'text-white border-white/40' : 'text-white/45 border-white/12'
                          )}
                        >
                          {isLive ? 'Active' : 'Cached'}
                        </span>
                      </div>

                      {item.excerpt ? (
                        <p className="text-[11.5px] text-white/35 leading-normal m-0 mb-1.5 line-clamp-1">
                          {item.excerpt}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-3 text-[10.5px] text-white/30 flex-wrap [&_span]:flex [&_span]:items-center [&_span]:gap-1 [&>span>svg]:w-2.5 [&>span>svg]:h-2.5 [&>span>svg]:shrink-0">
                        {isLive ? (
                          <>
                            <span>By {item.author}</span>
                            <span>
                              <IconCal />
                              {formatDateShort(item.date) || '—'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              <IconClock />
                              {formatRelativeDate(item.date) || '—'}
                            </span>
                            <span>Handled by bot</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isLive && item.id ? (
                      <div className="flex gap-1.5 shrink-0 self-center max-[720px]:ml-[66px] max-[720px]:w-full">
                        <a
                          className="text-[10px] text-white/50 bg-white/[0.03] border border-white/10 rounded-lg py-1.5 px-2.5 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap no-underline transition-all hover:text-black hover:bg-white hover:border-white [&>svg]:w-[11px] [&>svg]:h-[11px] [&>svg]:shrink-0"
                          href={`/admin/post?id=${encodeURIComponent(item.id)}`}
                        >
                          <IconEdit />
                          Update
                        </a>
                        <a
                          className="text-[10px] text-white/50 bg-white/[0.03] border border-white/10 rounded-lg py-1.5 px-2.5 cursor-pointer inline-flex items-center gap-1 whitespace-nowrap no-underline transition-all hover:text-black hover:bg-white hover:border-white [&>svg]:w-[11px] [&>svg]:h-[11px] [&>svg]:shrink-0"
                          href={postUrl({ id: item.id, title: item.title })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <IconEye />
                          Preview
                        </a>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>

          <div className="py-3.5 px-[22px] text-center border-t border-white/[0.06]">
            <button
              type="button"
              className="text-[11px] text-white/45 bg-transparent border-none cursor-pointer tracking-wide hover:text-white transition-colors"
              onClick={() => onNavigate?.('posts')}
            >
              View all articles →
            </button>
          </div>
        </section>

        <aside className="flex flex-col gap-3.5 sticky top-7 max-[1150px]:static max-[1150px]:flex-row max-[1150px]:flex-wrap" aria-label="Signals">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl py-[18px] px-5 max-[1150px]:flex-1 max-[1150px]:min-w-[260px] backdrop-blur-sm">
            <div className="text-[10px] tracking-[0.14em] text-white/35 mb-3 uppercase font-medium">
              Moderation &amp; taxonomy
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-black/40 border border-white/[0.07] rounded-xl py-3 px-3">
                <div className="font-semibold text-xl text-white leading-none tracking-tight">
                  {Number(categoriesCount) || 0}
                </div>
                <div className="text-[10px] text-white/50 mt-1.5">Categories</div>
                <div className="text-[9px] text-white/25 mt-px uppercase tracking-wide">Buckets used</div>
              </div>
              <div className="bg-black/40 border border-white/[0.07] rounded-xl py-3 px-3">
                <div
                  className={cn(
                    'font-semibold text-xl leading-none tracking-tight',
                    pendingComments > 0 ? 'text-[#e8b342]' : 'text-white'
                  )}
                >
                  {pendingComments}
                </div>
                <div className="text-[10px] text-white/50 mt-1.5">Pending comments</div>
                <div className="text-[9px] text-white/25 mt-px uppercase tracking-wide">
                  Awaiting approval
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl py-[18px] px-5 max-[1150px]:flex-1 max-[1150px]:min-w-[260px] backdrop-blur-sm">
            <div className="text-[10px] tracking-[0.14em] text-white/35 mb-3 uppercase font-medium">
              Comments trend
            </div>
            <p className="text-[10.5px] text-white/35 m-0 mb-2.5 leading-snug">
              Top liked comments from the last 15 days.
            </p>

            {trendingHint ? (
              <div className="flex flex-col items-center justify-center gap-2 py-[22px] px-2.5 text-center [&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:text-white/25">
                <IconChat />
                <p className="m-0 text-[11px] text-white/30">{trendingHint}</p>
              </div>
            ) : trends.length ? (
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
                {trends.map((c) => (
                  <div key={c.id} className="bg-black/40 border border-white/[0.07] rounded-xl py-2.5 px-2.5">
                    <div className="flex justify-between gap-2 mb-1">
                      <span className="text-[10.5px] font-medium text-white/90 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                        {c.postTitle || c.postId}
                      </span>
                      <span className="text-[9.5px] text-white shrink-0 font-medium">+{c.likes || 0} likes</span>
                    </div>
                    <p className="m-0 text-[10.5px] text-white/35 leading-snug line-clamp-2">
                      <strong className="text-white/70">{c.name || 'Anonymous'}:</strong> {c.commentPreview || ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-[22px] px-2.5 text-center [&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:text-white/25">
                <IconChat />
                <p className="m-0 text-[11px] text-white/30">No trending comments found.</p>
              </div>
            )}
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl py-[18px] px-5 max-[1150px]:flex-1 max-[1150px]:min-w-[260px] backdrop-blur-sm">
            <div className="text-[10px] tracking-[0.14em] text-white/35 mb-3 uppercase font-medium">
              Post growth
            </div>
            <p className="text-[10.5px] text-white/35 m-0 mb-2.5 leading-snug">
              Articles published over the last 6 months.
            </p>

            {months.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-[22px] px-2.5 text-center">
                <p className="m-0 text-[11px] text-white/30">No growth data available yet.</p>
              </div>
            ) : (
              <div className="flex items-end gap-2 h-[110px] mt-3.5" role="img" aria-label="Post growth by month">
                {months.map((m) => {
                  const count = Number(m.count) || 0;
                  const pct = maxMonth ? Math.round((count / maxMonth) * 100) : 0;
                  return (
                    <div
                      key={m.key || m.label}
                      className="group flex-1 flex flex-col items-center gap-2 h-full justify-end min-w-0"
                      title={`${m.label}: ${count}`}
                    >
                      <div className="w-full h-full bg-black/40 border border-white/[0.07] rounded-t-lg relative flex items-end justify-center overflow-visible">
                        <div
                          className="w-full bg-white/20 rounded-t-lg relative min-h-1 transition-all duration-200 group-hover:bg-white group-hover:shadow-[0_0_14px_rgba(255,255,255,0.35)]"
                          style={{ height: `${Math.max(count > 0 ? 8 : 2, pct)}%` }}
                        >
                          <span className="absolute -top-4 left-0 right-0 text-center text-[8.5px] text-white/30 transition-colors group-hover:text-white group-hover:font-semibold">
                            {count}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] text-white/30 tracking-wide uppercase">
                        {shortMonth(m.label)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
