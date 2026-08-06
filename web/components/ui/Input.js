import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-md border border-line bg-bg-elevated px-3.5 py-2 text-sm text-white',
      'placeholder:text-ink-muted',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mint/40 focus-visible:border-mint',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-all',
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
