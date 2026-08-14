import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

const PURPLE = '#5B4FE8';

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

export function CommentsCta({ count = 0, onClick }) {
  const n = Number(count) || 0;
  return (
    <button
      type="button"
      id="comments"
      onClick={onClick}
      className="w-full my-8 py-[13px] border bg-transparent cursor-pointer font-sans text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-[#5B4FE8]/[0.06]"
      style={{ borderColor: PURPLE, color: PURPLE }}
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
  const [copied, setCopied] = useState(false);
  const composerRef = useRef(null);

  const signedIn = Boolean(user);
  const loginHref = `/login?next=${encodeURIComponent(nextPath || '/')}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextPath || '/')}`;

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`);
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
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const sorted = useMemo(() => {
    const list = [...comments];
    if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [comments, sort]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signedIn) return;
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ comment: body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Sign in to comment');
      }
      setBody('');
      setNotice('Thanks! Your comment was submitted and is pending approval.');
      await fetchComments();
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (commentId, direction) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      }
    } catch {
      // ignore
    }
  };

  const shareComment = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const focusComposer = () => {
    if (!signedIn) return;
    composerRef.current?.focus();
  };

  const count = comments.length || Number(commentCount) || 0;

  return (
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
          'fixed top-0 right-0 bottom-0 z-[13001] w-[min(400px,100vw)] bg-white text-[#222] shadow-[-8px_0_28px_rgba(0,0,0,0.16)] flex flex-col transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!open}
        aria-label="Comments"
        inert={!open ? '' : undefined}
      >
        <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-1">
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-[#d0d0d0] text-[#444] bg-white flex items-center justify-center"
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white border-0 cursor-pointer"
            style={{ background: PURPLE }}
            aria-label="Close comments"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5">
          <div
            className="inline-flex items-center gap-1.5 pb-2 border-b-2"
            style={{ borderColor: PURPLE, color: PURPLE }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[13px] font-semibold">Comments</span>
          </div>
          <div className="h-px bg-[#e8e8e8] -mx-5" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8">
          <p className="text-[13.5px] text-[#444] m-0 mb-2.5 leading-relaxed">
            Welcome to our comments section!
          </p>
          <p className="text-[13.5px] text-[#444] m-0 mb-2.5 leading-relaxed">
            Please read{' '}
            <Link href="/community-guidelines" className="underline" style={{ color: PURPLE }}>
              Wirefringe&apos;s Community Guidelines
            </Link>{' '}
            before participating.
          </p>
          <p className="text-[13.5px] text-[#444] m-0 mb-4 leading-relaxed">
            If you&apos;re having any issues, email{' '}
            <a href="mailto:contact@wirefringe.com" className="underline" style={{ color: PURPLE }}>
              contact@wirefringe.com
            </a>
            . Visit{' '}
            <Link href="/account" className="underline" style={{ color: PURPLE }}>
              your profile
            </Link>{' '}
            to change your username.
          </p>

          <div className="flex items-center gap-2 bg-[#ececec] text-[#555] text-[12.5px] px-3 py-2 mb-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>1 person viewing this discussion</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="border border-[#d6d6d6] rounded-[2px] overflow-hidden mb-2 bg-white">
              <textarea
                ref={composerRef}
                className="w-full min-h-[96px] border-0 p-3 text-[14px] text-[#222] outline-none resize-y bg-white placeholder:text-[#9a9a9a]"
                placeholder="Post a comment"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={!signedIn}
                maxLength={5000}
              />
              <div className="flex items-center gap-3.5 px-3 py-2 border-t border-[#eee] text-[#666] text-[14px]">
                <span className="font-bold select-none">B</span>
                <span className="italic select-none">I</span>
                <span className="select-none" aria-hidden="true">
                  ”
                </span>
                <span className="select-none" aria-hidden="true">
                  ≡
                </span>
                <span className="select-none">Spoiler</span>
              </div>
            </div>

            {error ? <p className="text-[#c0392b] text-[13px] m-0 mb-2">{error}</p> : null}
            {notice ? <p className="text-[#0b8f72] text-[13px] m-0 mb-2">{notice}</p> : null}

            {signedIn ? (
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="w-full h-11 border-0 text-white text-[14px] font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: PURPLE }}
              >
                {submitting ? 'Posting…' : 'Post comment'}
              </button>
            ) : (
              <Link
                href={loginHref}
                className="flex items-center justify-center w-full h-11 text-white text-[14px] font-semibold no-underline"
                style={{ background: PURPLE }}
              >
                Sign in and Join the Conversation
              </Link>
            )}
          </form>

          {!signedIn ? (
            <p className="text-[12.5px] text-[#666] mt-2 mb-0">
              New here?{' '}
              <Link href={signupHref} className="underline" style={{ color: PURPLE }}>
                Create an account
              </Link>{' '}
              to comment.
            </p>
          ) : (
            <p className="text-[12.5px] text-[#666] mt-2 mb-0">
              Commenting as <strong>{user.displayName || user.username}</strong>
            </p>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: PURPLE }}>
              <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: PURPLE }}>
                All Comments
                <span
                  className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white rounded-[2px]"
                  style={{ background: PURPLE }}
                >
                  {count}
                </span>
              </span>
            </div>
            <div className="mt-3 mb-4">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full h-9 border border-[#ccc] rounded-[2px] px-2 text-[13px] bg-white text-[#222]"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {loading ? (
              <p className="text-[13px] text-[#777]">Loading comments…</p>
            ) : sorted.length === 0 ? (
              <p className="text-[13px] text-[#777]">No comments yet. Be the first to join the conversation.</p>
            ) : (
              <div>
                {sorted.map((c) => (
                  <article key={c.id} className="py-3.5 border-b border-[#eee]">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="w-3 shrink-0 border-t border-[#bbb] translate-y-[-4px]" aria-hidden="true" />
                      <span className="font-bold text-[14px] text-[#111]">{c.name}</span>
                      <span className="text-[12px] text-[#888]">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="m-0 mb-2.5 text-[14px] leading-relaxed text-[#222] whitespace-pre-wrap">
                      {c.comment}
                    </p>
                    <div className="flex items-center justify-between text-[12px] text-[#666]">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 hover:text-[#111]"
                          onClick={() => vote(c.id, 'like')}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                          Rec {c.likes || 0}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 hover:text-[#111]"
                          onClick={focusComposer}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4l-4 4z" />
                          </svg>
                          Reply
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0 hover:text-[#111]"
                          onClick={shareComment}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                          </svg>
                          {copied ? 'Copied' : 'Share'}
                        </button>
                      </div>
                      <a
                        href={`mailto:contact@wirefringe.com?subject=${encodeURIComponent('Report a comment')}`}
                        className="inline-flex items-center gap-1 no-underline text-[#666] hover:text-[#111]"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                        Report
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
