import React from 'react';
import { EmptyState, ActionButton } from '../../shared';
import { formatDateShort, postExcerpt } from '../../../../lib/utils';
import { Icons } from '../../Layout/icons';

export default function LatestPosts({ latestPosts }) {
  const EditIcon = Icons.edit;
  const EyeIcon = Icons.eye;

  return (
    <section className="admin-latest-posts-v2" aria-label="Latest posts">
      <div className="section-header">
        <h3 className="section-title">Latest Articles</h3>
        <button className="view-all-btn">View All</button>
      </div>

      <div className="posts-list">
        {latestPosts.length ? (
          latestPosts.map((p) => (
            <div key={p.id} className="post-item-v2">
              <div className="post-thumbnail">
                <img src={p.ogImg || '/placeholder-post.jpg'} alt={p.title} />
              </div>
              <div className="post-info">
                <div className="post-title-row">
                  <h4 className="post-title">{p.title}</h4>
                  <span className="post-category">{p.bucket}</span>
                </div>
                <p className="post-excerpt">
                  {postExcerpt(p, 140) || 'No description available for this article...'}
                </p>
                <div className="post-meta">
                  <div className="meta-item">
                    <Icons.users size={14} />
                    <span>By {p.creatorName || 'Admin'}</span>
                  </div>
                  <div className="meta-item">
                    <Icons.clock size={14} />
                    <span>{formatDateShort(p.date)}</span>
                  </div>
                  
                </div>
              </div>
              <div className="post-status-col">
                <span className={`status-badge ${p.date ? 'active' : 'pending'}`}>
                  {p.date ? 'Active' : 'Pending'}
                </span>
              </div>
              <div className="post-actions">
                <ActionButton
                  icon={EditIcon}
                  href={`/admin/post?id=${encodeURIComponent(p.id)}`}
                  className="action-btn-outline"
                >
                  Update 
                </ActionButton>
                <ActionButton
                  icon={EyeIcon}
                  href={`/post/${p.id}`}
                  className="action-btn-ghost"
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
