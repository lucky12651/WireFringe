import React from 'react';

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
    <div className="admin-card-v2 dashboard-card-v2">
      <h3 className="card-title-v2">Comments Trend</h3>
      <p className="card-desc-v2">Top liked comments from the last 15 days.</p>

      {trendingHint ? <div className="v2-empty-state">{trendingHint}</div> : null}

      {!trendingHint && Array.isArray(trendingComments) && trendingComments.length ? (
        <div className="v2-trend-list">
          {trendingComments.map((c) => (
            <div key={c.id} className="v2-trend-item">
              <div className="v2-trend-header">
                <span className="v2-trend-post">{c.postTitle || c.postId}</span>
                <span className="v2-trend-likes">+{c.likes || 0} Likes</span>
              </div>
              <p className="v2-trend-preview">
                <strong>{c.name || 'Anonymous'}:</strong> {c.commentPreview || ''}
              </p>
            </div>
          ))}
        </div>
      ) : !trendingHint ? (
        <div className="v2-empty-state">No trending comments found.</div>
      ) : null}
    </div>
  );
}
