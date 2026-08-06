import React from 'react';
import { formatRelativeDate } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import { tw } from '../../../../lib/tw';

export default function RecentCache({ items }) {
  if (!items || items.length === 0) {
    return (
      <section className={cn(tw.card, tw.mt32)}>
        <header className={tw.cardHeader}>
          <h2 className={tw.cardTitle}>Recently Published (Cache)</h2>
        </header>
        <div>
          <p className={tw.textMuted} style={{ fontSize: '0.9rem' }}>No recent cache items found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn(tw.card, tw.mt32)}>
      <header className={tw.cardHeader}>
        <div>
          <h2 className={tw.cardTitle}>Recently Published (Cache)</h2>
          <span className={tw.cardSubtitle}>Last 50 items handled by the bot</span>
        </div>
      </header>

      <div>
        <div className={tw.tableWrap} style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th className={tw.th}>Title</th>
                <th className={tw.th}>Status</th>
                <th className={tw.th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className={tw.td}>
                    <div>
                      {item.title}
                    </div>
                  </td>
                  <td className={tw.td}>
                    <span className={cn(tw.statusBadge, 'bg-mint/15 text-mint border border-mint/30')}>
                      Cached
                    </span>
                  </td>
                  <td className={cn(tw.td, tw.textMuted)} style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
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
