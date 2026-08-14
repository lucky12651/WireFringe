import React from 'react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';

/**
 * ActionButton - A standardized button for admin actions.
 * Supports both button and link behaviors.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component or element to display
 * @param {React.ReactNode} props.children - Button label text
 * @param {string} [props.href] - If provided, renders as a Next.js Link
 * @param {Function} [props.onClick] - Click handler for button type
 * @param {string} [props.type="button"] - Button type (e.g., "submit", "button")
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.variant] - Button variant: "default" or "danger"
 * @param {string} [props.size] - Button size: "md" or "sm"
 */
export function ActionButton({
  icon: Icon,
  children,
  href,
  onClick,
  type = 'button',
  className = '',
  variant = 'default',
  size = 'md',
  grow = false,
  ...props
}) {
  const combinedClassName = cn(
    'inline-flex items-center justify-center gap-2 flex-none py-2.5 px-4',
    'border border-line rounded-lg bg-bg-hover text-ink text-xs font-semibold',
    'tracking-[0.02em] no-underline cursor-pointer whitespace-nowrap',
    'transition-all duration-200 ease-out',
    'enabled:hover:bg-ink enabled:hover:border-ink enabled:hover:text-[var(--bg)] enabled:hover:-translate-y-px',
    'enabled:active:translate-y-0',
    'disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none',
    size === 'sm' && 'flex-none py-2 px-3.5 text-[11px] gap-1.5',
    grow && 'flex-auto w-full',
    variant === 'danger' &&
      'border-[rgba(255,107,107,0.35)] text-[#ff6b6b] bg-[rgba(255,107,107,0.08)] enabled:hover:bg-[rgba(255,107,107,0.16)] enabled:hover:border-[#ff6b6b] enabled:hover:text-[#ff6b6b]',
    className
  );

  const content = (
    <>
      {Icon && (typeof Icon === 'function' ? <Icon /> : Icon)}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={combinedClassName} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={combinedClassName}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}
