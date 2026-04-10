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
    <div
      className="side-card admin-chart-card dashboard-item-left-top"
      style={height ? { height } : undefined}
    >
      <div className="admin-card-head">
        <div>
          <div className="h">Comments Trend</div>
          <div className="hint">Top liked comments</div>
        </div>
        <div className="pill-btn" aria-hidden="true">
          <span className="dot" style={{ background: 'var(--accent)' }}></span>
          Last 15 days
        </div>
      </div>

      {trendingHint ? <div className="admin-chart-empty">{trendingHint}</div> : null}

      {!trendingHint && Array.isArray(trendingComments) && trendingComments.length ? (
        <div className="admin-trend-list" ref={trendListRef}>
          {trendingComments.map((c) => (
            <div key={c.id} className="admin-trend-item">
              <div className="admin-trend-top">
                <div className="admin-trend-post">{c.postTitle || c.postId}</div>
                <div className="admin-trend-likes">Likes: {c.likes || 0}</div>
              </div>
              <div className="admin-trend-body">
                <span className="admin-trend-name">{c.name || 'Anonymous'}:</span>{' '}
                {c.commentPreview || ''}
              </div>
            </div>
          ))}
        </div>
      ) : !trendingHint ? (
        <div className="admin-chart-empty">No comments yet.</div>
      ) : null}
    </div>
  );
}
