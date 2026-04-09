import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { PillButton } from '../shared/PillButton';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort } from '../../../lib/utils';

export function PostsView({ posts, postsCount, onPublish, me }) {
  const postsScrollRef = useRef(null);
  const postsScrollHideTimerRef = useRef(null);
  const isAuthor = me?.role === 'author';

  // Auto-hide scrollbar for posts list
  useEffect(() => {
    const el = postsScrollRef.current;
    if (!el) return;

    const showTemporarily = () => {
      el.classList.add('show-scrollbar');
      if (postsScrollHideTimerRef.current) {
        window.clearTimeout(postsScrollHideTimerRef.current);
      }
      postsScrollHideTimerRef.current = window.setTimeout(() => {
        el.classList.remove('show-scrollbar');
      }, 800);
    };

    el.addEventListener('scroll', showTemporarily, { passive: true });
    return () => {
      el.removeEventListener('scroll', showTemporarily);
      el.classList.remove('show-scrollbar');
      if (postsScrollHideTimerRef.current) {
        window.clearTimeout(postsScrollHideTimerRef.current);
      }
    };
  }, [posts.length]);

  return (
    <>
      <div className="admin-title-row">
        <h2>Posts</h2>
        <div className="accent-line"></div>
        <span className="admin-title-count">{postsCount}</span>
        <Link className="pill-btn" href="/admin/post">
          <span className="dot" style={{ background: 'var(--accent)' }}></span>
          Write new post
        </Link>
      </div>

      <div className="side-card admin-posts-card" aria-label="All posts">
        <div className="admin-posts-scroll" ref={postsScrollRef}>
          <div className="admin-table-head admin-posts-table-head">
            <div>Title</div>
            <div>Author</div>
            <div>Status</div>
            <div>Date</div>
            <div></div>
          </div>

          {posts.length ? (
            posts.map((p) => (
              <div key={p.id} className="admin-table-row admin-posts-table-row">
                <div className="title">{p.title}</div>
                <div className="meta author">{String(p.creator || '').trim() || 'Unknown'}</div>
                <div>
                  <span className={`status ${p.date ? 'published' : 'draft'}`}>
                    {p.date ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="meta">{formatDateShort(p.date)}</div>
                <div className="actions">
                  {!p.date && !isAuthor && (
                    <PillButton onClick={() => onPublish(p.id)} title="Publish this draft">
                      Publish
                    </PillButton>
                  )}
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
      </div>
    </>
  );
}
