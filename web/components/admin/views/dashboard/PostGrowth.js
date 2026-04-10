import React from 'react';

export default function PostGrowth({ postsByMonth }) {
  return (
    <div className="side-card admin-chart-card h-full">
      <div className="admin-card-head">
        <div>
          <div className="h">Post Growth</div>
          <div className="hint">Last 6 months</div>
        </div>
        <div className="pill-btn" aria-hidden="true">
          <span className="dot" style={{ background: 'var(--accent)' }}></span>
          6 months
        </div>
      </div>

      <div className="admin-bars" aria-label="Post growth chart">
        {(() => {
          const max = Math.max(0, ...postsByMonth.map((m) => m.count));
          return postsByMonth.map((m) => {
            const pct = max ? Math.round((m.count / max) * 100) : 0;
            const h = Math.max(10, Math.min(85, pct));
            return (
              <div key={m.key} className="admin-bar">
                <div className="admin-bar-fill" style={{ height: `${h}%` }}>
                  <span className="admin-bar-tip">{m.count} posts</span>
                </div>
                <div className="admin-bar-label">{m.label}</div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
