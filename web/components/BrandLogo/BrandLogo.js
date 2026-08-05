import Link from 'next/link';

/**
 * Site wordmark — same everywhere:
 * Wire + mint italic “F” + ringe (matches Header).
 *
 * size: sm | md | lg | xl
 */
export default function BrandLogo({
  size = 'md',
  href = null,
  className = '',
  onClick,
  asLink = false,
}) {
  const mark = (
    <span
      className={`wf-logo wf-logo--${size} ${className}`.trim()}
      aria-label="Wirefringe"
    >
      Wire<span className="wf-logo-f">F</span>ringe
    </span>
  );

  if (href != null || asLink) {
    return (
      <Link
        href={href || '/'}
        className="wf-logo-link"
        onClick={onClick}
      >
        {mark}
      </Link>
    );
  }

  return mark;
}
