import React from 'react';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

export function PillButton({
  children,
  variant = 'default',
  dotColor,
  onClick,
  disabled,
  type = 'button',
  className = '',
  title,
  ...props
}) {
  const defaultDotColor = variant === 'danger' ? 'var(--danger)' : 'var(--accent)';
  const finalDotColor = dotColor || defaultDotColor;

  return (
    <button
      type={type}
      className={cn(
        tw.pillBtn,
        variant === 'danger' && 'border-[rgba(255,107,107,0.35)] text-[#ff6b6b] hover:border-[#ff6b6b] hover:text-[#ff6b6b]',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      <span className={tw.dot} style={{ background: finalDotColor }}></span>
      {children}
    </button>
  );
}
