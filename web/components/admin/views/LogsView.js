import React, { useEffect, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

export function LogsView({ logs, onRefresh, isLoading }) {
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    onRefresh();
    // Refresh every 30 seconds
    const interval = setInterval(onRefresh, 30000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const filteredLogs = logs.filter(log => {
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
        return 'bg-[rgba(91,141,239,0.12)] text-[#8ab4ff] border border-[rgba(91,141,239,0.3)]';
      default:
        return 'bg-[#222] text-[#aaa] border border-line';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className={tw.adminView}>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="m-0 text-xl font-extrabold text-white tracking-tight">System & Bot Logs</h2>
        <div className={tw.headerActions}>
          <select 
            className={tw.formSelect} 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
          </select>
          <button 
            className={tw.secondaryBtn} 
            onClick={() => onRefresh()}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className={tw.cardFull}>
        <div className={tw.tableWrap}>
          {filteredLogs.length === 0 ? (
            <EmptyState>No logs found matching the criteria.</EmptyState>
          ) : (
            <table className={tw.table}>
              <thead>
                <tr>
                  <th className={tw.th} style={{ width: '180px' }}>Timestamp</th>
                  <th className={tw.th} style={{ width: '100px' }}>Level</th>
                  <th className={tw.th} style={{ width: '150px' }}>Module</th>
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
                      <code
                        style={{
                          fontSize: '12px',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: '#3cffd0',
                        }}
                      >
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
    </div>
  );
}
