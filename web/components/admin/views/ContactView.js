import React, { useMemo, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { formatDateShort, cn } from '../../../lib/utils';
import { TrashIcon } from '../Layout/icons';
import { tw } from '../../../lib/tw';
import { CONTACT_SUBJECTS } from '../../../lib/contactSubjects';

export function ContactView({
  messages = [],
  loadError = '',
  onMarkRead,
  onDelete,
}) {
  const [hint, setHint] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    if (subjectFilter === 'all') return list;
    return list.filter((m) => m.subject === subjectFilter);
  }, [messages, subjectFilter]);

  const handleOpen = async (row) => {
    setOpenId((prev) => (prev === row.id ? null : row.id));
    if (!row.isRead && onMarkRead) {
      const result = await onMarkRead(row.id);
      if (!result.success) setHint(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact message?')) return;
    setHint('');
    const result = await onDelete(id);
    if (!result.success) setHint(result.error);
    if (openId === id) setOpenId(null);
  };

  return (
    <div className={tw.adminView}>
      {hint || loadError ? (
        <p className={cn(tw.formHint, 'text-[#ff8a8a] mb-3')}>{hint || loadError}</p>
      ) : null}
      <section className={tw.adminSection}>
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h3 className={cn(tw.adminSectionTitle, 'mb-1')}>Contact us</h3>
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>
              Messages sent from the public Contact page.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <label className="sr-only" htmlFor="contact-subject-filter">
              Filter by subject
            </label>
            <select
              id="contact-subject-filter"
              className={cn(tw.formSelect, 'w-auto min-w-[200px]')}
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">All subjects</option>
              {CONTACT_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <span className="text-[12px] text-ink-tertiary whitespace-nowrap">
              {filtered.length}
              {subjectFilter !== 'all' && Array.isArray(messages) ? ` / ${messages.length}` : ''}
            </span>
          </div>
        </div>
        <div className={tw.tableWrap}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th className={tw.th}>From</th>
                <th className={tw.th}>Subject</th>
                <th className={tw.th}>Message</th>
                <th className={cn(tw.th, tw.textRight)}> </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((m) => {
                  const open = openId === m.id;
                  return (
                    <tr key={m.id} className={m.isRead ? '' : 'bg-mint/5'}>
                      <td className={tw.td}>
                        <div className="flex flex-col gap-0.5">
                          <span className={cn('text-ink', !m.isRead && 'font-semibold')}>
                            {m.name}
                          </span>
                          <a
                            href={`mailto:${m.email}`}
                            className="text-xs text-ink-tertiary no-underline hover:text-mint"
                          >
                            {m.email}
                          </a>
                          <span className="text-xs text-ink-tertiary">{formatDateShort(m.createdAt)}</span>
                        </div>
                      </td>
                      <td className={tw.td}>
                        <span className="text-sm text-ink">{m.subject}</span>
                      </td>
                      <td className={tw.td}>
                        <button
                          type="button"
                          className="border-0 bg-transparent p-0 text-left cursor-pointer w-full"
                          onClick={() => handleOpen(m)}
                        >
                          <p
                            className={cn(
                              'm-0 text-sm text-ink-dek',
                              open ? 'whitespace-pre-wrap' : 'line-clamp-2'
                            )}
                          >
                            {m.message}
                          </p>
                          <span className="text-[11px] text-mint">
                            {open ? 'Hide' : 'Read'}
                          </span>
                        </button>
                      </td>
                      <td className={cn(tw.td, tw.textRight)}>
                        <div className={tw.actionGroup}>
                          <button
                            className={tw.iconBtnDanger}
                            onClick={() => handleDelete(m.id)}
                            title="Delete message"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className={tw.td}>
                    <EmptyState>
                      {subjectFilter === 'all'
                        ? 'No contact messages yet.'
                        : `No messages with subject “${subjectFilter}”.`}
                    </EmptyState>
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
