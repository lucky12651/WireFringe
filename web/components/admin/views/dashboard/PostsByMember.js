import React from 'react';
import { EmptyState } from '../../shared/EmptyState';

export default function PostsByMember({ memberStats }) {
  return (
    <div className="admin-card-v2 dashboard-card-v2">
      <h3 className="card-title-v2">Posts by Member</h3>
      <p className="card-desc-v2">Contribution summary by team members.</p>

      {memberStats.length ? (
        <div className="v2-member-list">
          {memberStats.map((m) => (
            <div key={m.username} className="v2-member-item">
              <div className="v2-member-info">
                <span className="v2-member-name">{m.username}</span>
                <span className="v2-member-role">{m.role || 'Member'}</span>
              </div>
              <div className="v2-member-stats">
                <span className="v2-member-count">{m.count}</span>
                <span className="v2-member-unit">Posts</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="v2-empty-state">No member statistics available.</div>
      )}
    </div>
  );
}
