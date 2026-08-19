import { useEffect, useState } from 'react';
import { isWirefringeAuthor } from '../../lib/author';
import { cn } from '../../lib/utils';

function getInitials(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

/**
 * Attractive author photo with graceful fallback initials.
 * Logo-like images (e.g. Wirefringe mark) use contain + brand ring.
 */
export default function AuthorAvatar({
  name = '',
  src = '',
  size = 'md',
  className = '',
  brand = false,
}) {
  const [failed, setFailed] = useState(false);
  const label = String(name || '').trim() || 'Author';
  const isBrand = brand || isWirefringeAuthor(label) || isWirefringeAuthor(src);
  const url = String(src || '').trim();

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const sizeClass =
    size === 'lg' ? 'w-[52px] h-[52px]' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  const fallbackSize =
    size === 'lg' ? 'text-sm' : size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden inline-flex items-center justify-center border transition-all duration-200',
        sizeClass,
        isBrand
          ? 'bg-bg-elevated border-mint/45'
          : 'bg-bg-card border-line',
        className
      )}
      title={label}
      aria-label={label}
    >
      {url && !failed ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            'block',
            isBrand ? 'w-[78%] h-[78%] object-contain' : 'w-full h-full object-cover'
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={cn(
            'font-mono font-bold tracking-wide text-mint leading-none select-none',
            fallbackSize
          )}
          aria-hidden="true"
        >
          {getInitials(label)}
        </span>
      )}
    </div>
  );
}
