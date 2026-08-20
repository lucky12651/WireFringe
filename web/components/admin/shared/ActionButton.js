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
    'inline-flex items-center justify-center gap-1.5 flex-none h-9 px-3.5',
    'border border-line-strong rounded-sm bg-bg-elevated text-ink text-[13px] font-medium',
    'no-underline cursor-pointer whitespace-nowrap',
    'transition-colors duration-150',
    'enabled:hover:bg-bg-hover',
    'disabled:opacity-45 disabled:cursor-not-allowed',
    size === 'sm' && 'h-8 px-2.5 text-[12px] gap-1',
    grow && 'flex-auto w-full',
    variant === 'danger' &&
      'border-[var(--danger)]/35 text-[var(--danger)] bg-[var(--danger-soft)] enabled:hover:bg-[var(--danger-soft)]',
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
