import React from 'react';
import { cn } from '../../../lib/utils';

export function StatCard({ title, value, subtitle, trend, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 border border-line bg-bg-elevated p-4">
      {Icon ? (
        <div className="grid size-9 shrink-0 place-items-center border border-line bg-[var(--chip)] text-ink">
          <Icon size={16} />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-[11px] font-medium uppercase tracking-wide text-ink-muted">{title}</h3>
        {subtitle ? <p className="m-0 mt-0.5 text-[11px] text-ink-tertiary">{subtitle}</p> : null}
        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold leading-none tracking-tight text-ink">{value}</span>
          {trend != null && (
            <div
              className={cn(
                'text-[11px] font-semibold',
                trend > 0 ? 'text-mint' : 'text-[var(--danger)]'
              )}
            >
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
