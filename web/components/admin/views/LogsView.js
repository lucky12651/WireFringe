import React, { useEffect, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

/**
 * System / bot logs panel.
 * Use as a full page (`embedded={false}`) or inside News Bot tabs (`embedded`).
 */
export function LogsView({ logs, onRefresh, isLoading, embedded = false }) {
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    onRefresh?.();
    const interval = setInterval(() => onRefresh?.(), 30000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter((log) => {
    if (filter === 'ALL') return true;
    return log.level === filter;
  });

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-500/15 text-[#ff6b6b] border border-red-500/30';
      case 'WARNING':
        return 'bg-[#e8b342]/15 text-[#e8b342] border border-[#e8b342]/30';
      case 'INFO':
        return 'bg-white/[0.08] text-white/80 border border-white/15';
      default:
        return 'bg-white/[0.04] text-[#aaa] border border-line';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const toolbar = (
    <div className={cn(tw.headerActions, embedded && 'w-full justify-end')}>
      <select
        className={cn(tw.formSelect, 'w-auto min-w-[140px]')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Log level filter"
      >
        <option value="ALL">All Levels</option>
        <option value="INFO">Info</option>
        <option value="WARNING">Warning</option>
        <option value="ERROR">Error</option>
      </select>
      <button
        type="button"
        className={tw.secondaryBtn}
        onClick={() => onRefresh?.()}
        disabled={isLoading}
      >
        {isLoading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );

  const table = (
    <div className={tw.cardFull}>
      <div className={tw.tableWrap}>
        {filteredLogs.length === 0 ? (
          <EmptyState>No logs found matching the criteria.</EmptyState>
        ) : (
          <table className={tw.table}>
            <thead>
              <tr>
                <th className={tw.th} style={{ width: '180px' }}>
                  Timestamp
                </th>
                <th className={tw.th} style={{ width: '100px' }}>
                  Level
                </th>
                <th className={tw.th} style={{ width: '150px' }}>
                  Module
                </th>
                <th className={tw.th}>Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className={cn(tw.td, tw.textMuted)} style={{ fontSize: '12px', color: '#a0a0a0' }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td className={tw.td}>
                    <span className={cn(tw.statusBadge, getLevelBadgeClass(log.level))}>
                      {log.level}
                    </span>
                  </td>
                  <td className={tw.td}>
                    <code className="text-xs bg-white/[0.06] py-0.5 px-1.5 rounded text-white">
                      {log.module || 'root'}
                    </code>
                  </td>
                  <td className={tw.td} style={{ fontSize: '13px', lineHeight: '1.45', color: '#e8e8e8' }}>
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="m-0 text-[13px] text-white/40">
            Live bot and system activity. Auto-refreshes every 30s.
          </p>
          {toolbar}
        </div>
        {table}
      </div>
    );
  }

  return (
    <div className={tw.adminView}>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="m-0 text-xl font-extrabold text-white tracking-tight">System & Bot Logs</h2>
        {toolbar}
      </div>
      {table}
    </div>
  );
}
