import React from 'react';
import { tw } from '../../../../lib/tw';

export default function PostsByMember({ memberStats }) {
  return (
    <div className={tw.card}>
      <h3 className={tw.cardTitle}>Posts by Member</h3>
      <p className={tw.cardDesc}>Contribution summary by team members.</p>

      {memberStats.length ? (
        <div className={tw.memberList}>
          {memberStats.map((m) => (
            <div key={m.username} className={tw.memberItem}>
              <div>
                <span className={tw.memberName}>{m.username}</span>
                <span className={tw.memberRole}>{m.role || 'Member'}</span>
              </div>
              <div>
                <span className={tw.memberCount}>{m.count}</span>
                <span className={tw.memberUnit}>Posts</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={tw.emptyState}>No member statistics available.</div>
      )}
    </div>
  );
}
