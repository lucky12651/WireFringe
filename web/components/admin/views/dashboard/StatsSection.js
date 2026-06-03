import React from 'react';
import { StatCard } from '../../shared/StatCard';

export default function StatsSection({
  postsCount,
  categoriesCount,
  queueCount,
  pendingCommentsCount,
  canViewPendingCommentsCount,
  postGrowthDelta,
}) {
  return (
    <section className="admin-stats" aria-label="Stats">
      <div className="admin-stat-row">
        <StatCard
          title="Total Posts"
          value={postsCount}
          subtitle="Last 30 days"
          trend={postGrowthDelta}
        />
        <StatCard
          title="Total Categories"
          value={categoriesCount}
          subtitle="Buckets used in posts"
        />
        <StatCard
          title="Pending News"
          value={queueCount}
          subtitle="In processing queue"
        />
        <StatCard
          title="Pending Comments"
          value={canViewPendingCommentsCount ? pendingCommentsCount : 0}
          subtitle="Awaiting approval"
        />
      </div>
    </section>
  );
}
