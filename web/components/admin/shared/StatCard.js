import React from 'react';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

const colorMap = {
  blue: 'text-white bg-white/[0.06] border-white/15',
  purple: 'text-white/80 bg-white/[0.05] border-white/12',
  red: 'text-[#ff6b6b] bg-red-500/10 border-red-500/25',
  green: 'text-white bg-white/[0.08] border-white/20',
};

export function StatCard({ title, value, subtitle, trend, icon: Icon, color = 'blue' }) {
  return (
    <div className={cn(tw.card, 'flex items-start gap-3.5 p-4')}>
      <div
        className={cn(
          'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
          colorMap[color] || colorMap.blue
        )}
      >
        {Icon && <Icon size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-xs uppercase tracking-wide text-white/45 font-medium">{title}</h3>
        <p className="m-0 mt-0.5 text-[11px] text-white/30">{subtitle}</p>
        <div className="flex items-end justify-between gap-2 mt-2">
          <span className="text-2xl font-semibold tracking-tight text-white leading-none">{value}</span>
          {trend != null && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-[11px] font-semibold',
                trend > 0 ? 'text-white' : 'text-[#ff6b6b]'
              )}
            >
              <span>{trend > 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
