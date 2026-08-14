import React, { useEffect, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort, cn } from '../../../lib/utils';
import { CheckIcon, TrashIcon } from '../Layout/icons';
import { tw } from '../../../lib/tw';

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
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h3 className={cn(tw.adminSectionTitle, 'mb-1')}>Moderation</h3>
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>
              Approve or remove comments before they appear on the site.
            </p>
          </div>
          <span className="text-[12px] text-ink-tertiary">
            {Array.isArray(comments) ? comments.length : 0}
          </span>
        </div>
        {hint ? <p className={cn(tw.formHint, 'text-[#ff8a8a] mb-3')}>{hint}</p> : null}

        <div className={tw.tableWrap}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th className={tw.th}>Commenter</th>
                <th className={tw.th}>Message</th>
                <th className={tw.th}>Post</th>
                <th className={tw.th}>Status</th>
                <th className={cn(tw.th, tw.textRight)}> </th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(comments) && comments.length ? (
                comments.map((c) => (
                  <tr key={c.id}>
                    <td className={tw.td}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-ink">{c.name || 'Guest'}</span>
                        <span className="text-xs text-ink-tertiary">{formatDateShort(c.createdAt)}</span>
                      </div>
                    </td>
                    <td className={tw.td}>
                      <p className="m-0 text-sm text-ink-dek line-clamp-2">{c.comment}</p>
                    </td>
                    <td className={tw.td}>
                      <span className="text-sm text-ink-secondary">{c.postTitle || 'View post'}</span>
                    </td>
                    <td className={tw.td}>
                      <span
                        className={cn(
                          tw.statusBadge,
                          c.approved
                            ? 'bg-mint/15 text-mint border border-mint/30'
                            : 'bg-[#e8b342]/15 text-[#e8b342] border border-[#e8b342]/30'
                        )}
                      >
                        {c.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className={cn(tw.td, tw.textRight)}>
                      <div className={tw.actionGroup}>
                        {!c.approved && (
                          <button
                            className={tw.iconBtnApprove}
                            onClick={() => handleApprove(c.id)}
                            title="Approve"
                          >
                            <CheckIcon size={16} />
                          </button>
                        )}
                        <button
                          className={tw.iconBtnDanger}
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
                  <td colSpan={5} className={tw.td}>
                    <EmptyState>No comments to moderate.</EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
