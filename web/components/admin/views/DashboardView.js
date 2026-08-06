import React, { useMemo, useState } from 'react';
import {
  formatDateShort,
  formatRelativeDate,
  postExcerpt,
  postUrl,
} from '../../../lib/utils';
import styles from './DashboardView.module.css';

function categoryTint(bucket) {
  const s = String(bucket || '').toLowerCase();
  if (s.includes('sport')) return styles.thumbTintAmber;
  if (s.includes('financ') || s.includes('money') || s.includes('market')) {
    return styles.thumbTintMint;
  }
  if (s.includes('tech') || s.includes('scien')) return styles.thumbTintPurple;
  return styles.thumbTintBlue;
}

function shortMonth(label) {
  const s = String(label || '');
  // "Jun 2025" / "JUN" / "2025-06"
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

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 13l4 4L19 7" />
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
  trendingComments,
  trendingHint,
  latestPosts,
  recentCache,
  onNavigate,
}) {
  const [filter, setFilter] = useState('all');

  const cacheCount = Array.isArray(recentCache) ? recentCache.length : 0;
  const published = Number(postsCount) || 0;
  const pending = Number(queueCount) || 0;
  const isProcessing = pending > 0;

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
    <div className={styles.wrap}>
      {/* Content pipeline */}
      <section className={styles.pipeline} aria-label="Content pipeline">
        <div className={styles.pipelineTop}>
          <span className={styles.pipelineLabel}>Content pipeline — news bot</span>
          <span
            className={`${styles.pipelineLive} ${!isProcessing ? styles.pipelineLiveIdle : ''}`}
          >
            <span className={`${styles.liveDot} ${!isProcessing ? styles.liveDotIdle : ''}`} />
            {isProcessing ? 'PROCESSING' : 'STANDBY'}
          </span>
        </div>

        <div className={styles.pipelineFlow}>
          <div className={styles.pfNode}>
            <div className={styles.pfChip}>
              <span className={styles.pfNum}>{pending}</span>
              <div className={styles.pfIcon}>
                <IconClock />
              </div>
            </div>
            <div className={styles.pfCaption}>
              <strong>Pending queue</strong>
              <span>Processing</span>
            </div>
          </div>

          <div className={`${styles.pfTrace} ${!isProcessing ? styles.pfTraceIdle : ''}`} />

          <div className={`${styles.pfNode} ${styles.pfAccent}`}>
            <div className={styles.pfChip}>
              <span className={styles.pfNum}>{cacheCount}</span>
              <div className={styles.pfIcon}>
                <IconShield />
              </div>
            </div>
            <div className={styles.pfCaption}>
              <strong>Cache</strong>
              <span>Last {cacheCount || 50} handled</span>
            </div>
          </div>

          <div className={`${styles.pfTrace} ${!isProcessing ? styles.pfTraceIdle : ''}`} />

          <div className={styles.pfNode}>
            <div className={styles.pfChip}>
              <span className={styles.pfNum}>{published}</span>
              <div className={styles.pfIcon}>
                <IconCheck />
              </div>
            </div>
            <div className={styles.pfCaption}>
              <strong>Published</strong>
              <span>Live content</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace: activity + signals */}
      <div className={styles.workspace}>
        <section className={styles.feedCard} aria-label="Activity">
          <div className={styles.feedHead}>
            <div>
              <h2>Activity</h2>
              <p>Bot output and published articles, most recent first.</p>
            </div>
            <div className={styles.feedFilters} role="tablist" aria-label="Activity filters">
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
                  className={`${styles.filterBtn} ${
                    filter === f.id ? styles.filterBtnActive : ''
                  }`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.feedList}>
            {visible.length === 0 ? (
              <div className={styles.feedEmpty}>No activity items for this filter.</div>
            ) : (
              visible.map((item) => {
                const isLive = item.kind === 'active';
                return (
                  <article key={item.key} className={styles.feedRow}>
                    <div className={styles.thumb}>
                      {item.ogImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.ogImg} alt="" />
                      ) : (
                        <>
                          <span
                            className={`${styles.thumbTint} ${
                              isLive ? categoryTint(item.bucket) : styles.thumbTintMint
                            }`}
                          />
                          <span className={styles.thumbIcon}>
                            {isLive ? <IconArticle /> : <IconShield />}
                          </span>
                        </>
                      )}
                    </div>

                    <div className={styles.feedBody}>
                      <div className={styles.feedTitleRow}>
                        <span className={styles.feedTitle}>{item.title}</span>
                        {isLive && item.bucket ? (
                          <span className={`${styles.chip} ${styles.chipCat}`}>{item.bucket}</span>
                        ) : null}
                        <span
                          className={`${styles.chip} ${
                            isLive ? styles.chipActive : styles.chipCached
                          }`}
                        >
                          {isLive ? 'Active' : 'Cached'}
                        </span>
                      </div>

                      {item.excerpt ? (
                        <p className={styles.feedSnippet}>{item.excerpt}</p>
                      ) : null}

                      <div className={styles.feedMeta}>
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
                      <div className={styles.feedActions}>
                        <a
                          className={styles.iconBtn}
                          href={`/admin/post?id=${encodeURIComponent(item.id)}`}
                        >
                          <IconEdit />
                          Update
                        </a>
                        <a
                          className={styles.iconBtn}
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

          <div className={styles.feedFoot}>
            <button type="button" onClick={() => onNavigate?.('posts')}>
              View all articles →
            </button>
          </div>
        </section>

        <aside className={styles.signals} aria-label="Signals">
          <div className={styles.sigCard}>
            <div className={styles.sigLabel}>Moderation &amp; taxonomy</div>
            <div className={styles.statPair}>
              <div className={styles.statBlock}>
                <div className={styles.statN}>{Number(categoriesCount) || 0}</div>
                <div className={styles.statL}>Categories</div>
                <div className={styles.statS}>Buckets used</div>
              </div>
              <div className={styles.statBlock}>
                <div
                  className={`${styles.statN} ${
                    pendingComments > 0 ? styles.statNWarn : ''
                  }`}
                >
                  {pendingComments}
                </div>
                <div className={styles.statL}>Pending comments</div>
                <div className={styles.statS}>Awaiting approval</div>
              </div>
            </div>
          </div>

          <div className={styles.sigCard}>
            <div className={styles.sigLabel}>Comments trend</div>
            <p className={styles.trendDesc}>Top liked comments from the last 15 days.</p>

            {trendingHint ? (
              <div className={styles.trendEmpty}>
                <IconChat />
                <p>{trendingHint}</p>
              </div>
            ) : trends.length ? (
              <div className={styles.trendList}>
                {trends.map((c) => (
                  <div key={c.id} className={styles.trendItem}>
                    <div className={styles.trendHeader}>
                      <span className={styles.trendPost}>{c.postTitle || c.postId}</span>
                      <span className={styles.trendLikes}>+{c.likes || 0} likes</span>
                    </div>
                    <p className={styles.trendPreview}>
                      <strong>{c.name || 'Anonymous'}:</strong> {c.commentPreview || ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.trendEmpty}>
                <IconChat />
                <p>No trending comments found.</p>
              </div>
            )}
          </div>

          <div className={styles.sigCard}>
            <div className={styles.sigLabel}>Post growth</div>
            <p className={styles.trendDesc}>Articles published over the last 6 months.</p>

            {months.length === 0 ? (
              <div className={styles.trendEmpty}>
                <p>No growth data available yet.</p>
              </div>
            ) : (
              <div className={styles.chart} role="img" aria-label="Post growth by month">
                {months.map((m) => {
                  const count = Number(m.count) || 0;
                  const pct = maxMonth ? Math.round((count / maxMonth) * 100) : 0;
                  return (
                    <div key={m.key || m.label} className={styles.barCol} title={`${m.label}: ${count}`}>
                      <div className={styles.bar}>
                        <div
                          className={styles.barFill}
                          style={{ height: `${Math.max(count > 0 ? 8 : 2, pct)}%` }}
                        >
                          <span className={styles.barVal}>{count}</span>
                        </div>
                      </div>
                      <span className={styles.barMonth}>{shortMonth(m.label)}</span>
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
