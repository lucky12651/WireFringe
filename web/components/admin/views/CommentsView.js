import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort, cn } from '../../../lib/utils';
import { CheckIcon, TrashIcon } from '../Layout/icons';
import { tw } from '../../../lib/tw';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';
import { REPORT_REASONS, reportReasonCategory } from '../../../lib/reportReasons';

export function CommentsView({
  comments,
  reports = [],
  loadError = '',
  onApprove,
  onDisapprove,
  onDelete,
  onDismissReport,
  canModerateComments,
  canManageUsers,
}) {
  const [hint, setHint] = useState('');
  const [openCommentId, setOpenCommentId] = useState(null);
  const [reasonFilter, setReasonFilter] = useState('all');

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

  const handleDismissReport = async (id) => {
    if (!onDismissReport) return;
    setHint('');
    const result = await onDismissReport(id);
    if (!result.success) setHint(result.error);
  };

  const filteredReports = useMemo(() => {
    const list = Array.isArray(reports) ? reports : [];
    if (reasonFilter === 'all') return list;
    return list.filter((r) => reportReasonCategory(r.reason) === reasonFilter);
  }, [reports, reasonFilter]);

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Comments" />
      {hint || loadError ? <Notice type="error">{hint || loadError}</Notice> : null}
      {canModerateComments ? (
      <section className="postbox">
        <h2 className="hndle">Reports</h2>
        <div className="inside">
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>
              What users reported, on which comment, and why.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <label className="sr-only" htmlFor="report-reason-filter">
              Filter reports by reason
            </label>
            <select
              id="report-reason-filter"
              className={cn(tw.formSelect, 'w-auto min-w-[200px]')}
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
            >
              <option value="all">All reasons</option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            <span className="text-[12px] text-ink-tertiary whitespace-nowrap">
              {filteredReports.length}
              {reasonFilter !== 'all' && Array.isArray(reports) ? ` / ${reports.length}` : ''}
            </span>
          </div>
        </div>
        <div className={tw.tableWrap}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Reason</th>
                <th>Comment</th>
                <th>On post</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length ? (
                filteredReports.map((r) => (
                  <tr key={r.id}>
                    <td className={tw.td}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-ink">{r.reporterName || 'Guest'}</span>
                        <span className="text-xs text-ink-tertiary">{formatDateShort(r.createdAt)}</span>
                      </div>
                    </td>
                    <td className={tw.td}>
                      <p className="m-0 text-sm text-ink">{r.reason}</p>
                    </td>
                    <td className={tw.td}>
                      <p className="m-0 text-sm text-ink-dek line-clamp-3">
                        <span className="font-semibold text-ink">{r.commentAuthor}: </span>
                        {r.comment}
                      </p>
                    </td>
                    <td className={tw.td}>
                      <span className="text-sm text-ink-secondary">{r.postTitle || r.postId}</span>
                    </td>
                    <td className={cn(tw.td, tw.textRight)}>
                      <div className={tw.actionGroup}>
                        {canModerateComments || canManageUsers ? (
                          <button
                            className={tw.iconBtnDanger}
                            onClick={() => handleDelete(r.commentId)}
                            title="Delete reported comment"
                          >
                            <TrashIcon size={16} />
                          </button>
                        ) : null}
                        {onDismissReport ? (
                          <button
                            className={tw.secondaryBtn}
                            onClick={() => handleDismissReport(r.id)}
                            title="Dismiss report"
                          >
                            Dismiss
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={tw.td}>
                    <EmptyState>
                      {reasonFilter === 'all'
                        ? 'No comment reports yet.'
                        : `No reports with reason “${reasonFilter}”.`}
                    </EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </section>
      ) : null}

      <section className="postbox">
        <h2 className="hndle">Moderation</h2>
        <div className="inside">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>
              {canModerateComments
                ? 'Approve or remove comments before they appear on the site.'
                : 'Comments on your stories. Editors approve or remove them.'}
            </p>
          </div>
          <span className="text-[12px] text-ink-tertiary">
            {Array.isArray(comments) ? comments.length : 0}
          </span>
        </div>
        <div className={tw.tableWrap}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th>Commenter</th>
                <th>Message</th>
                <th>Post</th>
                <th>Status</th>
                <th></th>
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
                      {canModerateComments ? (
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
                      ) : null}
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
        </div>
      </section>
    </div>
  );
}
