import React from 'react';
import { tw } from '../../../../lib/tw';

export default function CommentsTrend({ trendingComments, trendingHint, height }) {
  const trendListRef = React.useRef(null);
  const trendScrollHideTimerRef = React.useRef(null);

  // Auto-hide scrollbar for trending list
  React.useEffect(() => {
    const el = trendListRef.current;
    if (!el) return;

    const showTemporarily = () => {
      el.classList.add('show-scrollbar');
      if (trendScrollHideTimerRef.current) {
        window.clearTimeout(trendScrollHideTimerRef.current);
      }
      trendScrollHideTimerRef.current = window.setTimeout(() => {
        el.classList.remove('show-scrollbar');
      }, 800);
    };

    el.addEventListener('scroll', showTemporarily, { passive: true });
    return () => {
      el.removeEventListener('scroll', showTemporarily);
      el.classList.remove('show-scrollbar');
      if (trendScrollHideTimerRef.current) {
        window.clearTimeout(trendScrollHideTimerRef.current);
      }
    };
  }, [trendingComments?.length, trendingHint]);

  return (
    <div className={tw.card}>
      <h3 className={tw.cardTitle}>Comments Trend</h3>
      <p className={tw.cardDesc}>Top liked comments from the last 15 days.</p>

      {trendingHint ? <div className={tw.emptyState}>{trendingHint}</div> : null}

      {!trendingHint && Array.isArray(trendingComments) && trendingComments.length ? (
        <div className={tw.trendList} ref={trendListRef}>
          {trendingComments.map((c) => (
            <div key={c.id} className={tw.trendItem}>
              <div className={tw.trendHeader}>
                <span className={tw.trendPost}>{c.postTitle || c.postId}</span>
                <span className={tw.trendLikes}>+{c.likes || 0} Likes</span>
              </div>
              <p className={tw.trendPreview}>
                <strong>{c.name || 'Anonymous'}:</strong> {c.commentPreview || ''}
              </p>
            </div>
          ))}
        </div>
      ) : !trendingHint ? (
        <div className={tw.emptyState}>No trending comments found.</div>
      ) : null}
    </div>
  );
}
