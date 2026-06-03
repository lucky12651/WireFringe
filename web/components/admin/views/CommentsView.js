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
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">Comments Moderation</h2>
        <span className="title-count-v2">{Array.isArray(comments) ? comments.length : 0} Total</span>
      </div>

      <div className="admin-card-v2">
        {hint && <p className="form-hint-v2 error">{hint}</p>}
        
        <div className="v2-table-wrapper">
          <table className="v2-table">
            <thead>
              <tr>
                <th>Commenter</th>
                <th>Message</th>
                <th>Post</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(comments) && comments.length ? (
                comments.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="commenter-info">
                        <span className="commenter-name">{c.name || 'Guest'}</span>
                        <span className="comment-date">{formatDateShort(c.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="comment-content-cell">
                        <p className="comment-text-v2">{c.comment}</p>
                      </div>
                    </td>
                    <td>
                      <span className="post-link-v2">{c.postTitle || 'View Post'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${c.approved ? 'active' : 'pending'}`}>
                        {c.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-group-v2">
                        {!c.approved && (
                          <button
                            className="approve-btn-v2"
                            onClick={() => handleApprove(c.id)}
                            title="Approve"
                          >
                            <CheckIcon size={16} />
                          </button>
                        )}
                        <button
                          className="delete-btn-v2"
                          onClick={() => c.approved ? handleDelete(c.id) : handleDisapprove(c.id)}
                          title="Delete"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState>No comments to moderate.</EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
