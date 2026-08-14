import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer border',
  {
    variants: {
      variant: {
        default:
          'rounded-sm bg-mint text-black border-transparent font-mono text-[10px] font-bold uppercase tracking-[0.08em] shadow-mint hover:bg-mint-hover hover:-translate-y-px',
        secondary:
          'rounded-sm bg-bg-elevated text-ink-secondary border-line font-mono text-xs font-semibold uppercase tracking-wide hover:border-mint hover:text-mint hover:-translate-y-px',
        outline:
          'rounded-sm bg-transparent text-ink border-line hover:border-mint hover:text-mint',
        ghost:
          'rounded-md border-transparent bg-transparent text-ink-secondary hover:text-mint hover:bg-mint/10',
        destructive:
          'rounded-sm bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25',
        link: 'border-transparent bg-transparent text-mint underline-offset-4 hover:underline rounded-none px-0',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
