import React from 'react';

export default function PostGrowth({ postsByMonth }) {
  const months = Array.isArray(postsByMonth) ? postsByMonth : [];
  const max = Math.max(0, ...months.map((m) => Number(m.count) || 0));

  return (
    <div className="admin-card-v2 dashboard-card-v2">
      <h3 className="card-title-v2">Post Growth</h3>
      <p className="card-desc-v2">Articles published over the last 6 months.</p>

      {months.length === 0 ? (
        <div className="v2-empty-state">No growth data available yet.</div>
      ) : (
        <div className="v2-bars-container" role="img" aria-label="Post growth by month">
          {months.map((m) => {
            const count = Number(m.count) || 0;
            const pct = max ? Math.round((count / max) * 100) : 0;
            return (
              <div key={m.key || m.label} className="v2-bar-item" title={`${m.label}: ${count}`}>
                <div className="v2-bar-wrapper">
                  <div
                    className="v2-bar-fill"
                    style={{ height: `${Math.max(count > 0 ? 14 : 8, pct)}%` }}
                  >
                    <span className="v2-bar-value">{count}</span>
                  </div>
                </div>
                <span className="v2-bar-label">{m.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
