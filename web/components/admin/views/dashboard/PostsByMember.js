import React from 'react';
import { EmptyState } from '../../shared/EmptyState';

export default function PostsByMember({ memberStats }) {
  return (
    <div className="side-card dashboard-item-right-span" aria-label="Posts by member">
      <div className="side-header">
        <h3>Posts by Member</h3>
        <span>{memberStats.length} members</span>
      </div>

      {memberStats.length ? (
        <div className="admin-member-grid">
          {memberStats.map((m) => (
            <div key={m.username} className="admin-member-card">
              <div className="admin-member-top">
                <div className="admin-member-name">{m.username}</div>
                {m.role ? <div className="admin-member-role">{m.role}</div> : null}
              </div>
              <div className="admin-member-count">{m.count}</div>
              <div className="admin-member-sub">posts</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>No stats yet.</EmptyState>
      )}
    </div>
  );
}
