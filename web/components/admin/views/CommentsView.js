import React, { useState } from 'react';
import { PillButton } from '../shared/PillButton';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort, truncateText } from '../../../lib/utils';

export function CommentsView({
  comments,
  onRefresh,
  onApprove,
  onDisapprove,
  onDelete,
  canModerateComments,
  canManageUsers,
}) {
  const [hint, setHint] = useState('');

  const handleRefresh = async () => {
    setHint('');
    await onRefresh();
  };

  const handleApprove = async (id) => {
    setHint('');
    const result = await onApprove(id);
    if (!result.success) setHint(result.error);
  };

  const handleDisapprove = async (id) => {
    if (!confirm('Disapprove this comment? This will delete it.')) return;
    setHint('');
    const result = await onDisapprove(id);
    if (!result.success) setHint(result.error);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment? This cannot be undone.')) return;
    setHint('');
    const result = await onDelete(id);
    if (!result.success) setHint(result.error);
  };

  return (
    <>
      <div className="admin-title-row">
        <h2>Comments</h2>
        <div className="accent-line"></div>
      </div>

      <section className="side-card" aria-label="All comments">
        <div className="side-header">
          <h3>All Comments</h3>
          <span>{Array.isArray(comments) ? comments.length : 0}</span>
        </div>

        <div className="row">
          <PillButton onClick={handleRefresh}>Refresh</PillButton>
          <div className="hint">{hint}</div>
        </div>

        <div className="admin-table" aria-label="Comments table">
          <div className="admin-table-head">
            <div>Comment</div>
            <div>Post</div>
            <div>Votes</div>
            <div>Date</div>
          </div>

          {Array.isArray(comments) && comments.length ? (
            comments.map((c) => (
              <div key={c.id} className="admin-table-row">
                <div className="title">
                  <div style={{ fontWeight: 700 }}>
                    {c.name || 'Anonymous'}{' '}
                    <span className={`status ${c.approved ? 'published' : 'draft'}`}>
                      {c.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div className="meta" style={{ marginTop: 2 }}>
                    {c.email || ''}
                  </div>
                  <div className="meta" style={{ marginTop: 6 }}>
                    {truncateText(c.comment, 160)}
                  </div>
                  {!c.approved && canModerateComments && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <PillButton onClick={() => handleApprove(c.id)} title="Approve this comment">
                        Approve
                      </PillButton>
                      <PillButton
                        variant="danger"
                        onClick={() => handleDisapprove(c.id)}
                        title="Disapprove (delete) this comment"
                      >
                        Disapprove
                      </PillButton>
                    </div>
                  )}
                  {c.approved && canManageUsers && (
                    <div style={{ marginTop: 10 }}>
                      <PillButton
                        variant="danger"
                        onClick={() => handleDelete(c.id)}
                        title="Delete this comment"
                      >
                        Delete
                      </PillButton>
                    </div>
                  )}
                </div>
                <div className="meta">{c.postTitle || c.postId}</div>
                <div className="meta">
                  {c.likes || 0} like / {c.dislikes || 0} dislike
                </div>
                <div className="meta">{formatDateShort(c.createdAt)}</div>
              </div>
            ))
          ) : (
            <EmptyState>No comments yet.</EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
