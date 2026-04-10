import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for code splitting
const StatsSection = dynamic(() => import('./dashboard/StatsSection'));
const CommentsTrend = dynamic(() => import('./dashboard/CommentsTrend'));
const PostGrowth = dynamic(() => import('./dashboard/PostGrowth'));
const PostsByMember = dynamic(() => import('./dashboard/PostsByMember'));
const LatestPosts = dynamic(() => import('./dashboard/LatestPosts'));

export function DashboardView({
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

  return (
    <>
      <div className="admin-dashboard-head">
        <div className="admin-dashboard-title">
          <h2>Dashboard</h2>
        </div>

        <StatsSection
          postsCount={postsCount}
          categoriesCount={categoriesCount}
          mediaCount={mediaCount}
          pendingCommentsCount={pendingCommentsCount}
          canViewPendingCommentsCount={canViewPendingCommentsCount}
          postGrowthDelta={postGrowth30.delta}
        />
      </div>

      <section className="admin-dashboard-grid" aria-label="Dashboard panels">
        <CommentsTrend
          trendingComments={trendingComments}
          trendingHint={trendingHint}
          height={trendCardHeight}
        />

        <div ref={postGrowthCardRef} className="dashboard-item-center-top">
          <PostGrowth
            postsByMonth={postsByMonth}
          />
        </div>

        <PostsByMember
          memberStats={memberStats}
        />
      </section>

      <LatestPosts
        latestPosts={latestPosts}
      />
    </>
  );
}
