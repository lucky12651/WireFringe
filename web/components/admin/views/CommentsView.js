import React, { useState } from 'react';
import { ActionButton } from '../shared/ActionButton';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort, truncateText } from '../../../lib/utils';
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

                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentName}>{c.name || 'Anonymous'}</span>
                      </div>
                      {c.email ? <div className={`meta ${styles.commentMeta}`}>{c.email}</div> : null}
                      <div className={`meta ${styles.commentText}`}>{truncateText(c.comment, 160)}</div>
                    </TableCell>
                    <TableCell className="meta">{c.postTitle || c.postId}</TableCell>
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
                              size="sm"
                              icon={CheckIcon}
                              onClick={() => handleApprove(c.id)}
                              title="Approve this comment"
                            >
                              Approve
                            </ActionButton>
                            <ActionButton
                              size="sm"
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
                            size="sm"
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
