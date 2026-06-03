import React from 'react';

export default function PostGrowth({ postsByMonth }) {
  return (
    <div className="admin-card-v2 dashboard-card-v2">
      <h3 className="card-title-v2">Post Growth</h3>
      <p className="card-desc-v2">Articles published over the last 6 months.</p>

      <div className="v2-bars-container">
        {(() => {
          const max = Math.max(0, ...postsByMonth.map((m) => m.count));
          return postsByMonth.map((m) => {
            const pct = max ? Math.round((m.count / max) * 100) : 0;
            return (
              <div key={m.key} className="v2-bar-item">
                <div className="v2-bar-wrapper">
                  <div className="v2-bar-fill" style={{ height: `${Math.max(10, pct)}%` }}>
                    <span className="v2-bar-value">{m.count}</span>
                  </div>
                </div>
                <span className="v2-bar-label">{m.label}</span>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
