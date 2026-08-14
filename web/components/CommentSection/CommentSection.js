import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function VoteIcon({ direction, filled }) {
  if (direction === 'like') {
    return (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, comment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to post comment');
      }

      setName('');
      setEmail('');
      setComment('');
      setNotice('Thanks! Your comment was submitted and is pending approval.');
      await fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId, direction) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (res.ok) {
        const updatedComment = await res.json();
        setComments((prev) => prev.map((c) => (c.id === commentId ? updatedComment : c)));
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  return (
    <section className="mt-12 pt-7 border-t border-line">
      <h3 className="flex items-center gap-2.5 mb-5 text-xl font-extrabold text-ink">
        Comments ({comments.length})
        <svg
          className="w-[18px] h-[18px] text-mint"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </h3>

      <form
        className="flex flex-col gap-3 mb-7 p-[18px] bg-bg-elevated border border-line"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="bg-bg border border-line rounded-sm p-3 text-[15px] text-ink outline-none w-full focus:border-mint"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
          />
          <input
            className="bg-bg border border-line rounded-sm p-3 text-[15px] text-ink outline-none w-full focus:border-mint"
            type="email"
            placeholder="Email (private)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={160}
          />
        </div>
        <textarea
          className="bg-bg border border-line rounded-sm p-3 text-[15px] text-ink outline-none w-full min-h-[110px] resize-y leading-normal focus:border-mint"
          placeholder="Join the conversation..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          maxLength={5000}
        />
        {error && <p className="text-[#ff6b6b] text-sm">{error}</p>}
        {notice && <p className="text-mint text-sm">{notice}</p>}
        <button
          className="self-start bg-mint text-black border-0 rounded-sm px-4 py-2.5 font-mono text-[11px] font-bold tracking-wide uppercase cursor-pointer hover:bg-mint-hover disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      <div className="flex flex-col">
        {loading ? (
          <p className="text-ink-tertiary text-sm py-3">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-ink-tertiary text-sm py-3">
            No comments yet. Be the first to join the conversation!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="py-[18px] border-b border-line">
              <div className="flex justify-between gap-3 mb-2">
                <span className="font-bold text-[13px] text-mint tracking-wide uppercase">
                  {c.name}
                </span>
                <span className="text-xs text-ink-muted">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-ink-dek mb-2.5">{c.comment}</p>
              <div className="flex gap-2">
                <button
                  className={cn(
                    'inline-flex items-center gap-1.5 bg-transparent border border-line rounded-sm text-ink-tertiary px-2.5 py-1 text-xs cursor-pointer hover:text-ink hover:border-line-strong',
                    c.myVote === 'like' && 'text-mint border-mint/40'
                  )}
                  onClick={() => handleVote(c.id, 'like')}
                  title="Like"
                >
                  <VoteIcon direction="like" filled={c.myVote === 'like'} />
                  {c.likes || 0}
                </button>
                <button
                  className={cn(
                    'inline-flex items-center gap-1.5 bg-transparent border border-line rounded-sm text-ink-tertiary px-2.5 py-1 text-xs cursor-pointer hover:text-ink hover:border-line-strong',
                    c.myVote === 'dislike' && 'text-mint border-mint/40'
                  )}
                  onClick={() => handleVote(c.id, 'dislike')}
                  title="Dislike"
                >
                  <VoteIcon direction="dislike" filled={c.myVote === 'dislike'} />
                  {c.dislikes || 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
