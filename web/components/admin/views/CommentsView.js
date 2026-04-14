import React, { useEffect, useState } from 'react';
import { ActionButton } from '../shared/ActionButton';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort } from '../../../lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../shared/Table';
import { CheckIcon, TrashIcon } from '../Layout/icons';
import styles from './CommentsView.module.css';

export function CommentsView({
  comments,
  onApprove,
  onDisapprove,
  onDelete,
  canModerateComments,
  canManageUsers,
}) {
  const [hint, setHint] = useState('');
  const [openCommentId, setOpenCommentId] = useState(null);

  useEffect(() => {
    if (openCommentId == null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenCommentId(null);
    };

    const handleMouseDown = (e) => {
      const root = e.target?.closest?.(
        `[data-comment-popover-root="${CSS.escape(String(openCommentId))}"]`
      );
      if (!root) setOpenCommentId(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [openCommentId]);

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

  const toggleViewComment = (id) => {
    setOpenCommentId((prev) => (prev === id ? null : id));
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

        {hint ? <div className="hint">{hint}</div> : null}

        {Array.isArray(comments) && comments.length ? (
          <Table aria-label="Comments table">
            <TableHeader>
              <TableRow>
                <TableHead>Comment</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {comments.map((c) => {
                const canApprove = !c.approved && canModerateComments;
                const canDelete = c.approved && canManageUsers;
                const postTitleText = String(c.postTitle || c.postId || '');
                const isPopoverOpen = openCommentId === c.id;

                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentName}>{c.name || 'Anonymous'}</span>
                        {c.email ? (
                          <span className={styles.commentEmail}>{c.email}</span>
                        ) : null}
                      </div>

                      <div
                        className={styles.viewRow}
                        data-comment-popover-root={String(c.id)}
                      >
                        <ActionButton
                          size="sm"
                          onClick={() => toggleViewComment(c.id)}
                          aria-expanded={isPopoverOpen}
                          aria-controls={`comment-popover-${c.id}`}
                          title={isPopoverOpen ? 'Hide comment' : 'View comment'}
                        >
                          {isPopoverOpen ? 'Hide' : 'View comment'}
                        </ActionButton>

                        {isPopoverOpen ? (
                          <div
                            id={`comment-popover-${c.id}`}
                            className={styles.commentPopover}
                            role="dialog"
                            aria-label="Comment"
                          >
                            <div className={styles.commentPopoverText}>
                              {c.comment || ''}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="meta">
                      <span className={styles.postTitle} title={postTitleText}>
                        {postTitleText}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`status ${c.approved ? 'approved' : 'draft'}`}>
                        {c.approved ? 'Approved' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="meta">
                      {c.likes || 0} like / {c.dislikes || 0} dislike
                    </TableCell>
                    <TableCell className="meta">{formatDateShort(c.createdAt)}</TableCell>
                    <TableCell className={styles.actionsCell}>
                      <div className={styles.actionsWrap}>
                        {canApprove ? (
                          <>
                            <ActionButton
                              icon={CheckIcon}
                              onClick={() => handleApprove(c.id)}
                              title="Approve this comment"
                            >
                              Approve
                            </ActionButton>
                            <ActionButton
                              icon={TrashIcon}
                              variant="danger"
                              onClick={() => handleDisapprove(c.id)}
                              title="Disapprove (delete) this comment"
                            >
                              Disapprove
                            </ActionButton>
                          </>
                        ) : null}

                        {canDelete ? (
                          <ActionButton
                            icon={TrashIcon}
                            variant="danger"
                            onClick={() => handleDelete(c.id)}
                            title="Delete this comment"
                          >
                            Delete
                          </ActionButton>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState>No comments yet.</EmptyState>
        )}
      </section>
    </>
  );
}
