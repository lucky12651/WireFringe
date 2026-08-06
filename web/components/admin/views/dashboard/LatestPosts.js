import React from 'react';
import { EmptyState, ActionButton } from '../../shared';
import { formatDateShort, postExcerpt } from '../../../../lib/utils';
import { Icons } from '../../Layout/icons';
import { tw } from '../../../../lib/tw';
import { cn } from '../../../../lib/utils';

export default function LatestPosts({ latestPosts }) {
  const EditIcon = Icons.edit;
  const EyeIcon = Icons.eye;

  return (
    <section className={tw.card} aria-label="Latest posts">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className={tw.cardTitle}>Latest Articles</h3>
        <button className={tw.secondaryBtn} type="button">View All</button>
      </div>

      <div className="flex flex-col gap-3">
        {latestPosts.length ? (
          latestPosts.map((p) => (
            <div key={p.id} className="flex gap-3 items-start p-3 rounded-md border border-line bg-[#101010]">
              <div className={cn(tw.postThumb, 'w-16 h-12')}>
                <img src={p.ogImg || '/placeholder-post.jpg'} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="m-0 text-sm font-semibold text-white truncate">{p.title}</h4>
                  <span className="font-mono text-[10px] text-mint uppercase">{p.bucket}</span>
                </div>
                <p className="m-0 text-xs text-[#888] line-clamp-2">
                  {postExcerpt(p, 140) || 'No description available for this article...'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#666]">
                  <div className="flex items-center gap-1">
                    <Icons.users size={14} />
                    <span>By {p.creatorName || 'Admin'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.clock size={14} />
                    <span>{formatDateShort(p.date)}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <span
                  className={cn(
                    tw.statusBadge,
                    p.date
                      ? 'bg-mint/15 text-mint border border-mint/30'
                      : 'bg-[#e8b342]/15 text-[#e8b342] border border-[#e8b342]/30'
                  )}
                >
                  {p.date ? 'Active' : 'Pending'}
                </span>
              </div>
              <div className={tw.actionGroup}>
                <ActionButton
                  icon={EditIcon}
                  href={`/admin/post?id=${encodeURIComponent(p.id)}`}
                  size="sm"
                >
                  Update
                </ActionButton>
                <ActionButton
                  icon={EyeIcon}
                  href={`/post/${p.id}`}
                  size="sm"
                >
                  Preview
                </ActionButton>
              </div>
            </div>
          ))
        ) : (
          <EmptyState>No posts yet.</EmptyState>
        )}
      </div>
    </section>
  );
}
