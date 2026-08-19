import Link from 'next/link';
import { cn } from '../../lib/utils';
import { tw } from '../../lib/tw';

/**
 * Site wordmark — styles via Tailwind (no global CSS logo classes).
 * size: xs | sm | md | lg | xl
 */
export default function BrandLogo({
  size = 'md',
  href = null,
  className = '',
  onClick,
  asLink = false,
}) {
  const sizeClass =
    size === 'xs'
      ? tw.logoXs
      : size === 'sm'
        ? tw.logoSm
        : size === 'lg'
          ? tw.logoLg
          : size === 'xl'
            ? tw.logoXl
            : tw.logoMd;

  const mark = (
    <span className={cn(tw.logo, sizeClass, className)} aria-label="Wirefringe">
      Wire<span className={tw.logoF}>F</span>ringe
    </span>
  );

  if (href != null || asLink) {
    return (
      <Link href={href || '/'} className={tw.logoLink} onClick={onClick}>
        {mark}
      </Link>
    );
  }

  return mark;
}
