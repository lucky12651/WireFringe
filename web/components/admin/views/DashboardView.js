import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for code splitting
const StatsSection = dynamic(() => import('./dashboard/StatsSection'));
const CommentsTrend = dynamic(() => import('./dashboard/CommentsTrend'));
const PostGrowth = dynamic(() => import('./dashboard/PostGrowth'));

const LatestPosts = dynamic(() => import('./dashboard/LatestPosts'));
const RecentCache = dynamic(() => import('./dashboard/RecentCache'));

export function DashboardView({
  postsCount,
  categoriesCount,
  queueCount,
  pendingCommentsCount,
  canViewPendingCommentsCount,
  postGrowth30,
  postsByMonth,
  trendingComments,
  trendingHint,
  memberStats,
  latestPosts,
  me,
  recentCache,
}) {
  const postGrowthCardRef = useRef(null);
  const [trendCardHeight, setTrendCardHeight] = useState(null);
  const isAuthor = me?.role === 'author';

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
    <div className="admin-dashboard-v2">
      <div className="admin-dashboard-head">
        <StatsSection
          postsCount={postsCount}
          categoriesCount={categoriesCount}
          queueCount={queueCount}
          pendingCommentsCount={pendingCommentsCount}
          canViewPendingCommentsCount={canViewPendingCommentsCount}
          postGrowthDelta={postGrowth30.delta}
        />
      </div>

      <LatestPosts
        latestPosts={latestPosts}
      />

      <RecentCache
        items={recentCache}
      />

      {/* Secondary stats grid */}
      <section className="admin-dashboard-grid-v2" aria-label="Dashboard panels">
        <CommentsTrend
          trendingComments={trendingComments}
          trendingHint={trendingHint}
        />

        <PostGrowth
          postsByMonth={postsByMonth}
        />

      
      </section>
    </div>
  );
}
