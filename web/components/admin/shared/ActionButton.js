import React from 'react';
import Link from 'next/link';
import styles from './ActionButton.module.css';

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
 */
export function ActionButton({ 
  icon: Icon, 
  children, 
  href, 
  onClick, 
  type = 'button', 
  className = '',
  ...props 
}) {
  const combinedClassName = `${styles.actionButton} ${className}`.trim();

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
