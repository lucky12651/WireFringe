import React from 'react';
import { cn } from '../../../lib/utils';

export function Table({ children, className = '', ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-line bg-bg-elevated shadow-[0_8px_28px_rgba(0,0,0,0.25)]">
      <table className={cn('w-full border-collapse text-sm text-left', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={cn('bg-[#101010] border-b border-line', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={cn('[&>tr:nth-child(even)]:bg-white/[0.015]', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr
      className={cn(
        'border-b border-line-dim transition-colors duration-200 last:border-b-0 hover:bg-mint/[0.04]',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th
      className={cn(
        'py-3 px-4 font-bold text-[#888] uppercase text-[10px] tracking-[0.08em] font-mono',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={cn('py-3.5 px-4 text-[#e8e8e8] align-middle', className)} {...props}>
      {children}
    </td>
  );
}
