import React from 'react';
import { cn } from '../../../lib/utils';

export function Table({ children, className = '', ...props }) {
  return (
    <div className="w-full overflow-x-auto border border-line bg-bg-elevated">
      <table className={cn('wp-table', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={cn('align-middle', className)} {...props}>
      {children}
    </td>
  );
}
