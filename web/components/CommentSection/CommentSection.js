import { useState, useEffect } from 'react';
import styles from './CommentSection.module.css';

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
      <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  return (
    <section className={styles.commentSection}>
      <h3 className={styles.title}>
        Comments ({comments.length})
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </h3>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <input
            className={styles.input}
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
          />
          <input
            className={styles.input}
            type="email"
            placeholder="Email (private)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={160}
          />
        </div>
        <textarea
          className={styles.textarea}
          placeholder="Join the conversation..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          maxLength={5000}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button 
          className={styles.submitBtn} 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className={styles.empty}>No comments yet. Be the first to join the conversation!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <span className={styles.commentName}>{c.name}</span>
                <span className={styles.commentDate}>{formatDate(c.createdAt)}</span>
              </div>
              <p className={styles.commentBody}>{c.comment}</p>
              <div className={styles.commentFooter}>
                <button 
                  className={`${styles.voteBtn} ${c.myVote === 'like' ? styles.active : ''}`}
                  onClick={() => handleVote(c.id, 'like')}
                  title="Like"
                >
                  <VoteIcon direction="like" filled={c.myVote === 'like'} />
                  {c.likes || 0}
                </button>
                <button 
                  className={`${styles.voteBtn} ${c.myVote === 'dislike' ? styles.active : ''}`}
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
