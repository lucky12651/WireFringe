import React from 'react';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

const colorMap = {
  blue: 'text-[#8ab4ff] bg-[rgba(91,141,239,0.12)] border-[rgba(91,141,239,0.3)]',
  purple: 'text-purple bg-purple/15 border-purple/30',
  red: 'text-[#ff6b6b] bg-red-500/10 border-red-500/25',
  green: 'text-mint bg-mint/10 border-mint/25',
};

export function StatCard({ title, value, subtitle, trend, icon: Icon, color = 'blue' }) {
  return (
    <div className={cn(tw.card, 'flex items-start gap-3.5 p-4')}>
      <div
        className={cn(
          'w-10 h-10 rounded-md border flex items-center justify-center shrink-0',
          colorMap[color] || colorMap.blue
        )}
      >
        {Icon && <Icon size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-xs font-mono uppercase tracking-wide text-[#888]">{title}</h3>
        <p className="m-0 mt-0.5 text-[11px] text-[#666]">{subtitle}</p>
        <div className="flex items-end justify-between gap-2 mt-2">
          <span className="text-2xl font-extrabold text-white leading-none">{value}</span>
          {trend != null && (
            <div
              className={cn(
                'flex items-center gap-0.5 font-mono text-[11px] font-bold',
                trend > 0 ? 'text-mint' : 'text-[#ff6b6b]'
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
