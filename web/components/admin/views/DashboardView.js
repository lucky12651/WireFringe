import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '../shared/StatCard';
import { EmptyState } from '../shared/EmptyState';
import { PillButton } from '../shared/PillButton';
import { formatDateShort } from '../../../lib/utils';

export function DashboardView({
  posts,
  postsCount,
  categoriesCount,
  mediaCount,
  pendingCommentsCount,
  canViewPendingCommentsCount,
  postGrowth30,
  postsByMonth,
  trendingComments,
  trendingHint,
  memberStats,
  latestPosts,
  me,
}) {
  const postGrowthCardRef = useRef(null);
  const [trendCardHeight, setTrendCardHeight] = useState(null);
  const trendListRef = useRef(null);
  const trendScrollHideTimerRef = useRef(null);

  // Sync trend card height with post growth card
  useEffect(() => {
    const el = postGrowthCardRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const h = Math.round(rect.height);
      if (h) setTrendCardHeight((prev) => (prev === h ? prev : h));
    };

    update();

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    }

    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      if (ro) ro.disconnect();
    };
  }, []);

  // Auto-hide scrollbar for trending list
  useEffect(() => {
    const el = trendListRef.current;
    if (!el) return;

    const showTemporarily = () => {
      el.classList.add('show-scrollbar');
      if (trendScrollHideTimerRef.current) {
        window.clearTimeout(trendScrollHideTimerRef.current);
      }
      trendScrollHideTimerRef.current = window.setTimeout(() => {
        el.classList.remove('show-scrollbar');
      }, 800);
    };

    el.addEventListener('scroll', showTemporarily, { passive: true });
    return () => {
      el.removeEventListener('scroll', showTemporarily);
      el.classList.remove('show-scrollbar');
      if (trendScrollHideTimerRef.current) {
        window.clearTimeout(trendScrollHideTimerRef.current);
      }
    };
  }, [trendingComments.length, trendingHint]);

  return (
    <>
      <div className="admin-dashboard-head">
        <div className="admin-dashboard-title">
          <h2>Dashboard</h2>
        </div>

        <section className="admin-stats" aria-label="Stats">
          <div className="admin-stat-row">
            <StatCard
              title="Total Posts"
              value={postsCount}
              subtitle="Last 30 days"
              trend={postGrowth30.delta}
            />
            <StatCard
              title="Total Categories"
              value={categoriesCount}
              subtitle="Buckets used in posts"
            />
            <StatCard
              title="Total Media Files"
              value={mediaCount}
              subtitle="Uploads in /static/uploads"
            />
            <StatCard
              title="Pending Comments"
              value={canViewPendingCommentsCount ? pendingCommentsCount : 0}
              subtitle="Awaiting approval"
            />
          </div>
        </section>
      </div>

      <section className="admin-dashboard-grid" aria-label="Dashboard panels">
        {/* Comments Trend */}
        <div
          className="side-card admin-chart-card dashboard-item-left-top"
          style={trendCardHeight ? { height: trendCardHeight } : undefined}
        >
          <div className="admin-card-head">
            <div>
              <div className="h">Comments Trend</div>
              <div className="hint">Top liked comments</div>
            </div>
            <div className="pill-btn" aria-hidden="true">
              <span className="dot" style={{ background: 'var(--accent)' }}></span>
              Last 15 days
            </div>
          </div>

          {trendingHint ? <div className="admin-chart-empty">{trendingHint}</div> : null}

          {!trendingHint && Array.isArray(trendingComments) && trendingComments.length ? (
            <div className="admin-trend-list" ref={trendListRef}>
              {trendingComments.map((c) => (
                <div key={c.id} className="admin-trend-item">
                  <div className="admin-trend-top">
                    <div className="admin-trend-post">{c.postTitle || c.postId}</div>
                    <div className="admin-trend-likes">Likes: {c.likes || 0}</div>
                  </div>
                  <div className="admin-trend-body">
                    <span className="admin-trend-name">{c.name || 'Anonymous'}:</span>{' '}
                    {c.commentPreview || ''}
                  </div>
                </div>
              ))}
            </div>
          ) : !trendingHint ? (
            <div className="admin-chart-empty">No comments yet.</div>
          ) : null}
        </div>

        {/* Post Growth */}
        <div className="side-card admin-chart-card dashboard-item-center-top" ref={postGrowthCardRef}>
          <div className="admin-card-head">
            <div>
              <div className="h">Post Growth</div>
              <div className="hint">Last 6 months</div>
            </div>
            <div className="pill-btn" aria-hidden="true">
              <span className="dot" style={{ background: 'var(--accent)' }}></span>
              6 months
            </div>
          </div>

          <div className="admin-bars" aria-label="Post growth chart">
            {(() => {
              const max = Math.max(0, ...postsByMonth.map((m) => m.count));
              return postsByMonth.map((m) => {
                const pct = max ? Math.round((m.count / max) * 100) : 0;
                const h = Math.max(10, Math.min(85, pct));
                return (
                  <div key={m.key} className="admin-bar">
                    <div className="admin-bar-fill" style={{ height: `${h}%` }}>
                      <span className="admin-bar-tip">{m.count} posts</span>
                    </div>
                    <div className="admin-bar-label">{m.label}</div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Posts by Member */}
        <div className="side-card dashboard-item-right-span" aria-label="Posts by member">
          <div className="side-header">
            <h3>Posts by Member</h3>
            <span>{memberStats.length} members</span>
          </div>

          {memberStats.length ? (
            <div className="admin-member-grid">
              {memberStats.map((m) => (
                <div key={m.username} className="admin-member-card">
                  <div className="admin-member-top">
                    <div className="admin-member-name">{m.username}</div>
                    {m.role ? <div className="admin-member-role">{m.role}</div> : null}
                  </div>
                  <div className="admin-member-count">{m.count}</div>
                  <div className="admin-member-sub">posts</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No stats yet.</EmptyState>
          )}
        </div>
      </section>

      {/* Latest Posts */}
      <section className="side-card admin-mini-table" aria-label="Latest posts">
        <div className="side-header">
          <h3>Latest Posts</h3>
          <span>{latestPosts.length}</span>
        </div>

        <div className="admin-table">
          <div className="admin-table-head">
            <div>Title</div>
            <div>Status</div>
            <div>Date</div>
            <div></div>
          </div>

          {latestPosts.length ? (
            latestPosts.map((p) => (
              <div key={p.id} className="admin-table-row">
                <div className="title">{p.title}</div>
                <div>
                  <span className={`status ${p.date ? 'published' : 'draft'}`}>
                    {p.date ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="meta">{formatDateShort(p.date)}</div>
                <div className="actions">
                  <PillButton
                    onClick={() => {
                      window.location.href = `/admin/post?id=${encodeURIComponent(p.id)}`;
                    }}
                  >
                    Edit
                  </PillButton>
                </div>
              </div>
            ))
          ) : (
            <EmptyState>No posts yet.</EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
