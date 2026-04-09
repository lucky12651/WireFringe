import React from 'react';

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
  const baseClass = 'pill-btn';
  const variantClass = variant === 'danger' ? 'danger' : '';
  const combinedClass = `${baseClass} ${variantClass} ${className}`.trim();

  const defaultDotColor = variant === 'danger' ? 'var(--danger)' : 'var(--accent)';
  const finalDotColor = dotColor || defaultDotColor;

  return (
    <button
      type={type}
      className={combinedClass}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      <span className="dot" style={{ background: finalDotColor }}></span>
      {children}
    </button>
  );
}
