import React from 'react';
import { tw } from '../../../../lib/tw';

export default function PostGrowth({ postsByMonth }) {
  const months = Array.isArray(postsByMonth) ? postsByMonth : [];
  const max = Math.max(0, ...months.map((m) => Number(m.count) || 0));

  return (
    <div className={tw.card}>
      <h3 className={tw.cardTitle}>Post Growth</h3>
      <p className={tw.cardDesc}>Articles published over the last 6 months.</p>

      {months.length === 0 ? (
        <div className={tw.emptyState}>No growth data available yet.</div>
      ) : (
        <div className={tw.barsContainer} role="img" aria-label="Post growth by month">
          {months.map((m) => {
            const count = Number(m.count) || 0;
            const pct = max ? Math.round((count / max) * 100) : 0;
            return (
              <div key={m.key || m.label} className={tw.barItem} title={`${m.label}: ${count}`}>
                <div className={tw.barWrapper}>
                  <div
                    className={tw.barFill}
                    style={{ height: `${Math.max(count > 0 ? 14 : 8, pct)}%` }}
                  >
                    <span className={tw.barValue}>{count}</span>
                  </div>
                </div>
                <span className={tw.barLabel}>{m.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
