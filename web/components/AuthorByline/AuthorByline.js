import {
  brandLogoUrl,
  authorAvatarUrl,
  authorDisplayName,
  isBrandBylineAuthor,
} from '../../lib/author';
import AuthorAvatar from '../AuthorAvatar/AuthorAvatar';
import { cn } from '../../lib/utils';

/**
 * Public author credit on posts/feeds.
 * When creatorBrandByline is enabled for that user → show brand logo (not username text).
 * Site header/footer logo is separate and unaffected.
 */
export default function AuthorByline({
  post = null,
  name = '',
  avatarUrl = '',
  size = 'md',
  showAvatar = false,
  label = '',
  className = '',
  time = null,
}) {
  const displayName = String(name || authorDisplayName(post) || '').trim();
  const brand = isBrandBylineAuthor(post);
  const logoSrc = brandLogoUrl(post) || String(post?.creatorBrandLogoUrl || '').trim();
  const resolvedAvatar = String(avatarUrl || authorAvatarUrl(post) || '').trim();

  const nameSize =
    size === 'lg' ? 'text-xs' : size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const wordmarkSize =
    size === 'lg'
      ? 'h-[26px] max-w-[234px]'
      : size === 'sm'
        ? 'h-[18px] max-w-[156px]'
        : 'h-[21px] max-w-[195px]';
  const labelSize = size === 'lg' ? 'text-[11px] mr-1' : 'text-[10px]';

  if (brand && logoSrc) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 min-w-0 max-w-full align-middle',
          time ? 'flex-col items-start gap-[5px]' : '',
          className
        )}
        title={displayName || 'Brand'}
      >
        {label ? (
          <span
            className={cn(
              'font-mono tracking-wide uppercase text-ink-tertiary shrink-0',
              labelSize
            )}
          >
            {label}
          </span>
        ) : null}
        <span className="inline-flex items-center justify-center leading-none bg-transparent border-0 p-0 shadow-none">
          <img
            src={logoSrc}
            alt={displayName || 'Brand'}
            className={cn('block w-auto object-contain bg-transparent border-0', wordmarkSize)}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.dataset.fallback === '1') return;
              el.dataset.fallback = '1';
              el.src = resolvedAvatar || '/wirefringe.png';
            }}
          />
        </span>
        {time ? (
          <span className="font-mono text-[10px] tracking-wide uppercase text-ink-muted">
            {time}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5 min-w-0 max-w-full align-middle', className)}>
      {showAvatar ? (
        <AuthorAvatar
          name={displayName}
          src={resolvedAvatar}
          size={size === 'lg' ? 'md' : 'sm'}
        />
      ) : null}
      <span className="inline-flex flex-col gap-0.5 min-w-0">
        {label ? (
          <span
            className={cn(
              'font-mono tracking-wide uppercase text-ink-tertiary shrink-0',
              labelSize
            )}
          >
            {label}
          </span>
        ) : null}
        <span
          className={cn(
            'font-mono font-bold tracking-wide uppercase text-mint whitespace-nowrap overflow-hidden text-ellipsis',
            nameSize
          )}
        >
          {displayName || 'Staff'}
        </span>
        {time ? (
          <span className="font-mono text-[10px] tracking-wide uppercase text-ink-muted">
            {time}
          </span>
        ) : null}
      </span>
    </span>
  );
}
