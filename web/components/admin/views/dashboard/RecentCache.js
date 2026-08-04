import React from 'react';
import { formatRelativeDate } from '../../../../lib/utils';

export default function RecentCache({ items }) {
  if (!items || items.length === 0) {
    return (
      <section className="dashboard-card-v2 latest-posts-card-v2" style={{ marginTop: '32px' }}>
        <header className="card-header-v2">
          <h2 className="card-title-v2">Recently Published (Cache)</h2>
        </header>
        <div className="card-body-v2">
          <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>No recent cache items found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-card-v2 latest-posts-card-v2" style={{ marginTop: '32px' }}>
      <header className="card-header-v2">
        <div className="header-left-v2">
          <h2 className="card-title-v2">Recently Published (Cache)</h2>
          <span className="card-subtitle-v2">Last 50 items handled by the bot</span>
        </div>
      </header>

      <div className="card-body-v2">
        <div className="v2-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="v2-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="post-title-info">

                      {item.title}

                    </div>
                  </td>
                  <td>
                    <span className="status-badge-v2 published">Cached</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>
                    {formatRelativeDate(new Date(item.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
