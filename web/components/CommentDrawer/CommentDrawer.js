import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { REPORT_REASONS } from '../../lib/reportReasons';
import { newsroomApi } from '../../lib/api';

function timeAgo(dateString) {
  if (!dateString) return '';
  const t = new Date(dateString).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function wrapSelection(value, start, end, before, after) {
  const selected = value.slice(start, end) || 'text';
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  const caret = start + before.length + selected.length + after.length;
  return { next, caret };
}

function CommentBody({ text }) {
  const [openSpoilers, setOpenSpoilers] = useState(() => new Set());

  const nodes = useMemo(() => {
    const src = String(text || '');
    const parts = [];
    const re = /(\|\|[\s\S]+?\|\||\*\*[\s\S]+?\*\*|\*[^*\n]+\*|`[^`]+`|^> .+$|^- .+$)/gm;
    let last = 0;
    let m;
    let key = 0;
    while ((m = re.exec(src))) {
      if (m.index > last) parts.push({ type: 'text', value: src.slice(last, m.index), key: key++ });
      const chunk = m[0];
      if (chunk.startsWith('||') && chunk.endsWith('||')) {
        parts.push({ type: 'spoiler', value: chunk.slice(2, -2), key: key++ });
      } else if (chunk.startsWith('**') && chunk.endsWith('**')) {
        parts.push({ type: 'bold', value: chunk.slice(2, -2), key: key++ });
      } else if (chunk.startsWith('*') && chunk.endsWith('*')) {
        parts.push({ type: 'italic', value: chunk.slice(1, -1), key: key++ });
      } else if (chunk.startsWith('`') && chunk.endsWith('`')) {
        parts.push({ type: 'code', value: chunk.slice(1, -1), key: key++ });
      } else if (chunk.startsWith('> ')) {
        parts.push({ type: 'quote', value: chunk.slice(2), key: key++ });
      } else if (chunk.startsWith('- ')) {
        parts.push({ type: 'li', value: chunk.slice(2), key: key++ });
      } else {
        parts.push({ type: 'text', value: chunk, key: key++ });
      }
      last = m.index + chunk.length;
    }
    if (last < src.length) parts.push({ type: 'text', value: src.slice(last), key: key++ });
    return parts;
  }, [text]);

  return (
    <p className="m-0 mb-2.5 text-[14px] leading-relaxed text-ink-dek whitespace-pre-wrap">
      {nodes.map((n) => {
        if (n.type === 'bold') return <strong key={n.key}>{n.value}</strong>;
        if (n.type === 'italic') return <em key={n.key}>{n.value}</em>;
        if (n.type === 'code') {
          return (
            <code key={n.key} className="px-1 py-0.5 rounded-sm bg-bg-hover text-[13px]">
              {n.value}
            </code>
          );
        }
        if (n.type === 'quote') {
          return (
            <span key={n.key} className="block border-l-2 border-mint pl-2 my-1 text-ink-secondary italic">
              {n.value}
            </span>
          );
        }
        if (n.type === 'li') {
          return (
            <span key={n.key} className="block pl-2 before:content-['•_']">
              {n.value}
            </span>
          );
        }
        if (n.type === 'spoiler') {
          const open = openSpoilers.has(n.key);
          return (
            <button
              key={n.key}
              type="button"
              onClick={() =>
                setOpenSpoilers((prev) => {
                  const next = new Set(prev);
                  if (next.has(n.key)) next.delete(n.key);
                  else next.add(n.key);
                  return next;
                })
              }
              className={cn(
                'border-0 cursor-pointer px-1 rounded-sm font-sans text-[13px]',
                open ? 'bg-bg-hover text-ink' : 'bg-ink text-ink select-none'
              )}
              title={open ? 'Hide spoiler' : 'Reveal spoiler'}
            >
              {open ? n.value : 'Spoiler'}
            </button>
          );
        }
        return <span key={n.key}>{n.value}</span>;
      })}
    </p>
  );
}

export function CommentsCta({ count = 0, onClick }) {
  const n = Number(count) || 0;
  return (
    <button
      type="button"
      id="comments"
      onClick={onClick}
      className="w-full my-8 py-[13px] border border-mint text-mint bg-transparent cursor-pointer font-sans text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-mint/10"
    >
      {n} {n === 1 ? 'COMMENT' : 'COMMENTS'}
    </button>
  );
}

export default function CommentDrawer({
  open,
  onClose,
  postId,
  commentCount = 0,
  user = null,
  nextPath = '',
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [sort, setSort] = useState('newest');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [mounted, setMounted] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [notify, setNotify] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [reportFor, setReportFor] = useState(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const composerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const notifyKey = postId ? `wf_notify_${postId}` : '';

  useEffect(() => {
    if (!notifyKey || typeof window === 'undefined') return;
    setNotify(localStorage.getItem(notifyKey) === '1');
  }, [notifyKey]);

  const signedIn = Boolean(user);
  const loginHref = `/login?next=${encodeURIComponent(nextPath || '/')}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextPath || '/')}`;

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        credentials: 'include',
      });
      if (res.ok) setComments((await res.json()) || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && postId) fetchComments();
  }, [open, postId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (reportFor) {
          closeReport();
          return;
        }
        if (notifyOpen) {
          setNotifyOpen(false);
          return;
        }
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, reportFor, notifyOpen]);

  const sorted = useMemo(() => {
    const list = [...comments];
    if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [comments, sort]);

  const applyWrap = (before, after = before) => {
    if (!signedIn) {
      setError('Sign in to format and post a comment.');
      return;
    }
    const el = composerRef.current;
    const start = el ? el.selectionStart : body.length;
    const end = el ? el.selectionEnd : body.length;
    const { next, caret } = wrapSelection(body, start, end, before, after);
    setBody(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signedIn) return;
    const text = body.trim();
    if (!text) {
      setError('Write a comment first.');
      return;
    }
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const payload = replyTo ? `@${replyTo.name} ${text}` : text;
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ comment: payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Sign in to comment');
      }
      setBody('');
      setReplyTo(null);
      setNotice('Thanks! Your comment was submitted and is pending approval.');
      await fetchComments();
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (commentId, direction) => {
    setError('');
    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ direction }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Could not register that rec.');
      }
      const updated = await res.json();
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c)));
    } catch (err) {
      setError(err.message || 'Could not rec this comment.');
    }
  };

  const startReply = (comment) => {
    if (!signedIn) {
      setError('Sign in to reply.');
      return;
    }
    setReplyTo({ id: comment.id, name: comment.name });
    setError('');
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  const shareComment = async (comment) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${comment.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Comment by ${comment.name}`,
          text: String(comment.comment || '').slice(0, 140),
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiedId(comment.id);
      window.setTimeout(() => setCopiedId(''), 1600);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(comment.id);
        window.setTimeout(() => setCopiedId(''), 1600);
      } catch {
        setError('Could not copy the share link.');
      }
    }
  };

  const closeReport = () => {
    setReportFor(null);
    setReportCategory('');
    setReportReason('');
    setReportError('');
    setReportSending(false);
  };

  const openReport = (comment) => {
    setReportFor(comment);
    setReportCategory('');
    setReportReason('');
    setReportError('');
    setNotice('');
    setError('');
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportFor) return;
    const category = reportCategory.trim();
    const details = reportReason.trim();
    if (!category) {
      setReportError('Pick a reason for this report.');
      return;
    }
    if (!details) {
      setReportError('Write a comment explaining the report.');
      return;
    }
    const reason = `${category}: ${details}`.slice(0, 2000);
    setReportError('');
    setReportSending(true);
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(reportFor.id)}/report`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Could not send report.');
      }
      closeReport();
      setNotice('Report sent. Admins can review it in the Comments tab.');
    } catch (err) {
      setReportError(err.message || 'Could not send report.');
    } finally {
      setReportSending(false);
    }
  };

  const toggleNotify = () => {
    if (!notifyKey) return;
    const next = !notify;
    setNotify(next);
    try {
      localStorage.setItem(notifyKey, next ? '1' : '0');
    } catch {
      // ignore
    }
    setNotice(
      next
        ? 'You will be notified when you reopen comments, and in account email prefs if you are signed in.'
        : 'Comment notifications turned off for this story.'
    );
    setNotifyOpen(false);
    if (user) {
      newsroomApi.saveNotify({ notifyReplies: next }).catch(() => {});
    }
  };

  const count = comments.length || Number(commentCount) || 0;

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={cn(
          'fixed inset-0 z-[13000] bg-black/35 transition-opacity duration-300',
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        data-comment-drawer
        className={cn(
          'fixed top-0 right-0 bottom-0 z-[13001] w-[min(400px,100vw)] bg-bg-elevated text-ink border-l border-line flex flex-col overflow-hidden transition-[transform,box-shadow] duration-300 ease-out',
          open
            ? 'translate-x-0 shadow-[-8px_0_28px_rgba(0,0,0,0.16)]'
            : 'translate-x-full shadow-none'
        )}
        aria-hidden={!open}
        aria-label="Comments"
        inert={!open ? '' : undefined}
      >
        {reportFor ? (
          <div className="flex flex-col h-full min-h-0 bg-bg-elevated">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line shrink-0">
              <h3 className="m-0 text-[16px] font-semibold text-ink">Report comment</h3>
              <button
                type="button"
                onClick={closeReport}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-mint text-black border-0 cursor-pointer"
                aria-label="Close report"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submitReport} className="flex flex-col flex-1 min-h-0 p-5 overflow-y-auto">
              <p className="m-0 mb-3 text-[13px] text-ink-secondary leading-relaxed">
                Reporting <strong className="text-ink">{reportFor.name}</strong>. Pick a reason, then
                write a comment so we can review it.
              </p>
              <blockquote className="m-0 mb-4 p-3 border border-line rounded-sm bg-bg text-[13px] text-ink-dek leading-relaxed">
                <span className="block mb-1 text-[12px] font-semibold text-ink">{reportFor.name}</span>
                {String(reportFor.comment || '').trim() || 'This comment has no text.'}
              </blockquote>
              <label className="m-0 mb-2 text-[13px] font-semibold text-ink" htmlFor="report-reason">
                Reason
              </label>
              <select
                id="report-reason"
                value={reportCategory}
                onChange={(e) => {
                  setReportCategory(e.target.value);
                  setReportError('');
                }}
                required
                className="w-full h-11 mb-4 border border-line rounded-sm px-3 text-[14px] bg-bg text-ink cursor-pointer outline-none"
              >
                <option value="">Select a reason</option>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <label className="m-0 mb-2 text-[13px] font-semibold text-ink" htmlFor="report-comment">
                Your comment
              </label>
              <textarea
                id="report-comment"
                className="w-full flex-1 min-h-[120px] p-3 border border-line rounded-sm bg-bg text-ink text-[14px] outline-none resize-y"
                placeholder="Explain what is wrong with this comment."
                value={reportReason}
                onChange={(e) => {
                  setReportReason(e.target.value);
                  if (reportError) setReportError('');
                }}
                required
              />
              {reportError ? (
                <p className="text-[#c0392b] text-[13px] m-0 mt-3">{reportError}</p>
              ) : null}
              <div className="flex gap-2 mt-4 shrink-0">
                <button
                  type="button"
                  className="flex-1 h-11 border border-line bg-transparent text-ink cursor-pointer"
                  onClick={closeReport}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSending}
                  className="flex-1 h-11 border-0 bg-mint text-black font-semibold cursor-pointer disabled:opacity-60"
                >
                  {reportSending ? 'Sending…' : 'Send report'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
        <div className="relative flex items-center justify-end gap-2 px-4 pt-3 pb-1 shrink-0">
          <button
            type="button"
            className={cn(
              'w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer',
              notify
                ? 'border-mint text-mint bg-mint/10'
                : 'border-line text-ink-secondary bg-bg-elevated'
            )}
            aria-label="Comment notifications"
            aria-pressed={notify}
            onClick={() => setNotifyOpen((v) => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-mint text-black border-0 cursor-pointer"
            aria-label="Close comments"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {notifyOpen ? (
            <div className="absolute top-12 right-14 z-10 w-[240px] p-3 rounded-md border border-line bg-bg-elevated shadow-lg">
              <p className="m-0 mb-2 text-[13px] text-ink">
                {notify ? 'Notifications are on for this story.' : 'Get a reminder when you return to comments.'}
              </p>
              <button
                type="button"
                onClick={toggleNotify}
                className="w-full h-9 border-0 bg-mint text-black text-[13px] font-semibold cursor-pointer rounded-sm"
              >
                {notify ? 'Turn off' : 'Notify me'}
              </button>
            </div>
          ) : null}
        </div>

        <div className="px-5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 pb-2 border-0 border-b-2 border-mint text-mint bg-transparent cursor-pointer p-0"
            onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[13px] font-semibold">Comments</span>
          </button>
          <div className="h-px bg-line -mx-5" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8">
          <p className="text-[13.5px] text-ink-secondary m-0 mb-2.5 leading-relaxed">
            Welcome to our comments section!
          </p>
          <p className="text-[13.5px] text-ink-secondary m-0 mb-2.5 leading-relaxed">
            Please read{' '}
            <Link href="/community-guidelines" className="underline text-mint">
              Wirefringe&apos;s Community Guidelines
            </Link>{' '}
            before participating.
          </p>
          <p className="text-[13.5px] text-ink-secondary m-0 mb-4 leading-relaxed">
            If you&apos;re having any issues, email{' '}
            <a href="mailto:contact@wirefringe.com" className="underline text-mint">
              contact@wirefringe.com
            </a>
            . Visit{' '}
            <Link href="/account" className="underline text-mint">
              your profile
            </Link>{' '}
            to change your name.
          </p>

          <div className="flex items-center gap-2 bg-bg-hover text-ink-tertiary text-[12.5px] px-3 py-2 mb-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>{Math.max(1, comments.length ? 1 : 1)} person viewing this discussion</span>
          </div>

          <form onSubmit={handleSubmit}>
            {replyTo ? (
              <div className="flex items-center justify-between gap-2 mb-2 px-2 py-1.5 rounded-sm bg-mint/10 text-[12.5px] text-ink">
                <span>
                  Replying to <strong>{replyTo.name}</strong>
                </span>
                <button
                  type="button"
                  className="border-0 bg-transparent text-ink-secondary cursor-pointer"
                  onClick={() => setReplyTo(null)}
                >
                  Cancel
                </button>
              </div>
            ) : null}
            <div className="border border-line rounded-[2px] overflow-hidden mb-2 bg-bg">
              <textarea
                ref={composerRef}
                className="w-full min-h-[96px] border-0 p-3 text-[14px] text-ink outline-none resize-y bg-bg placeholder:text-ink-muted"
                placeholder={signedIn ? 'Post a comment' : 'Sign in to post a comment'}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={!signedIn}
                maxLength={5000}
              />
              <div className="flex items-center gap-1 px-2 py-1.5 border-t border-line text-ink-tertiary text-[14px]">
                <button type="button" className={toolBtn} title="Bold" onClick={() => applyWrap('**')}>
                  <span className="font-bold">B</span>
                </button>
                <button type="button" className={toolBtn} title="Italic" onClick={() => applyWrap('*')}>
                  <span className="italic">I</span>
                </button>
                <button type="button" className={toolBtn} title="Quote" onClick={() => applyWrap('> ', '')}>
                  ”
                </button>
                <button type="button" className={toolBtn} title="List" onClick={() => applyWrap('- ', '')}>
                  ≡
                </button>
                <button type="button" className={toolBtn} title="Spoiler" onClick={() => applyWrap('||')}>
                  Spoiler
                </button>
              </div>
            </div>

            {error ? <p className="text-[#c0392b] text-[13px] m-0 mb-2">{error}</p> : null}
            {notice ? <p className="text-mint text-[13px] m-0 mb-2">{notice}</p> : null}

            {signedIn ? (
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="w-full h-11 border-0 bg-mint text-black text-[14px] font-semibold cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Posting…' : replyTo ? 'Post reply' : 'Post comment'}
              </button>
            ) : (
              <Link
                href={loginHref}
                className="flex items-center justify-center w-full h-11 bg-mint text-black text-[14px] font-semibold no-underline"
              >
                Sign in and Join the Conversation
              </Link>
            )}
          </form>

          {!signedIn ? (
            <p className="text-[12.5px] text-ink-tertiary mt-2 mb-0">
              New here?{' '}
              <Link href={signupHref} className="underline text-mint">
                Create an account
              </Link>{' '}
              to comment.
            </p>
          ) : (
            <p className="text-[12.5px] text-ink-tertiary mt-2 mb-0">
              Commenting as <strong className="text-ink">{user.displayName || user.username}</strong>
            </p>
          )}

          <div className="mt-6" ref={listRef}>
            <div className="flex items-center justify-between pb-2 border-b-2 border-mint">
              <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-mint">
                All Comments
                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-black bg-mint rounded-[2px]">
                  {count}
                </span>
              </span>
            </div>
            <div className="mt-3 mb-4">
              <label className="sr-only" htmlFor="comment-sort">
                Sort comments
              </label>
              <select
                id="comment-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full h-9 border border-line rounded-[2px] px-2 text-[13px] bg-bg text-ink"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {loading ? (
              <p className="text-[13px] text-ink-tertiary">Loading comments…</p>
            ) : sorted.length === 0 ? (
              <p className="text-[13px] text-ink-tertiary">No comments yet. Be the first to join the conversation.</p>
            ) : (
              <div>
                {sorted.map((c) => (
                  <article key={c.id} id={`comment-${c.id}`} className="py-3.5 border-b border-line">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="w-3 shrink-0 border-t border-line-strong translate-y-[-4px]" aria-hidden="true" />
                      <span className="font-bold text-[14px] text-ink">{c.name}</span>
                      <span className="text-[12px] text-ink-muted">{timeAgo(c.createdAt)}</span>
                    </div>
                    <CommentBody text={c.comment} />
                    <div className="flex items-center justify-between text-[12px] text-ink-tertiary">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          className={cn(
                            'inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 hover:text-ink',
                            c.myVote === 'like' && 'text-mint'
                          )}
                          onClick={() => vote(c.id, 'like')}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                          Rec {c.likes || 0}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 hover:text-ink"
                          onClick={() => startReply(c)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4l-4 4z" />
                          </svg>
                          Reply
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 hover:text-ink"
                          onClick={() => shareComment(c)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                          </svg>
                          {copiedId === c.id ? 'Copied' : 'Share'}
                        </button>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 border-0 bg-transparent cursor-pointer p-0 text-ink-tertiary hover:text-ink"
                        onClick={() => openReport(c)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                        Report
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </aside>
    </>,
    document.body
  );
}

const toolBtn =
  'inline-flex items-center justify-center min-w-8 h-8 px-1.5 border-0 bg-transparent text-ink-secondary cursor-pointer rounded-sm hover:bg-bg-hover hover:text-ink';
