import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'bg-mint/15 text-mint border border-mint/25',
        secondary: 'bg-white/5 text-ink-secondary border border-line',
        purple: 'bg-purple/20 text-white border border-purple/40',
        outline: 'border border-line text-ink-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
