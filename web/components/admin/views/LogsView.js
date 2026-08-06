import React, { useEffect, useState } from 'react';
import { Icons } from '../Layout/icons';
import { EmptyState } from '../shared/EmptyState';

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
      case 'ERROR': return 'role-badge admin'; // reuse admin red
      case 'WARNING': return 'role-badge author'; // reuse author orange
      case 'INFO': return 'role-badge editor'; // reuse editor blue
      default: return 'role-badge user';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">System & Bot Logs</h2>
        <div className="header-actions-v2">
          <select 
            className="v2-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
          </select>
          <button 
            className="secondary-btn-v2" 
            onClick={() => onRefresh()}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="admin-card-v2 full-width">
        <div className="v2-table-wrapper">
          {filteredLogs.length === 0 ? (
            <EmptyState>No logs found matching the criteria.</EmptyState>
          ) : (
            <table className="v2-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Timestamp</th>
                  <th style={{ width: '100px' }}>Level</th>
                  <th style={{ width: '150px' }}>Module</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-muted" style={{ fontSize: '12px', color: '#a0a0a0' }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td>
                      <span className={getLevelBadgeClass(log.level)}>
                        {log.level}
                      </span>
                    </td>
                    <td>
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
                    <td style={{ fontSize: '13px', lineHeight: '1.45', color: '#e8e8e8' }}>
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
