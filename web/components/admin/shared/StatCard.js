import React from 'react';

export function StatCard({ title, value, subtitle, trend }) {
  return (
    <div className="admin-metric">
      <div className="admin-metric-top">
        <div className="t">{title}</div>

      </div>
      <div className="n">{value}</div>
      <div className="sub">
        {subtitle}
        {trend && <span className={`trend ${trend.dir}`}>{trend.text}</span>}
      </div>
    </div>
  );
}
