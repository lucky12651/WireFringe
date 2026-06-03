import React from 'react';

export function StatCard({ title, value, subtitle, trend, icon: Icon, color = 'blue' }) {
  return (
    <div className={`admin-metric-v2 admin-metric-${color}`}>
      <div className="metric-icon-wrapper">
        {Icon && <Icon size={20} />}
      </div>
      <div className="metric-content">
        <h3 className="metric-title">{title}</h3>
        <p className="metric-subtitle">{subtitle}</p>
        <div className="metric-footer">
          <span className="metric-value">{value}</span>
          {trend && (
            <div className={`metric-trend ${trend > 0 ? 'up' : 'down'}`}>
              <span className="trend-arrow">{trend > 0 ? '↑' : '↓'}</span>
              <span className="trend-value">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
