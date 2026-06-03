import React from 'react';
import { StatCard } from '../../shared/StatCard';
import { Icons } from '../../Layout/icons';

export default function StatsSection({
  postsCount,
  queueCount,
  pendingCommentsCount,
  canViewPendingCommentsCount,
  postGrowthDelta,
  categoriesCount,
}) {
  return (
    <section className="admin-stats-v2" aria-label="Stats">
      <div className="admin-stat-row-v2">
        <StatCard
          title="Published Articles"
          value={postsCount}
          subtitle="Live Content"
          icon={Icons.posts}
          color="blue"
      
        />
        <StatCard
          title="Pending Queue"
          value={queueCount}
          subtitle="Processing"
          icon={Icons.clock}
          color="purple"
         
        />
        <StatCard
          title="Pending Comments"
          value={canViewPendingCommentsCount ? pendingCommentsCount : 0}
          subtitle="Awaiting Approval"
          icon={Icons.comments}
          color="red"
         
        />
        <StatCard
          title="Total Categories"
          value={categoriesCount}
          subtitle="Buckets Used"
          icon={Icons.categories}
          color="green"
         
        />
      </div>
    </section>
  );
}
