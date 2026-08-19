import {
  authorAvatarUrl,
  authorDisplayName,
  isBrandBylineAuthor,
} from '../../lib/author';
import AuthorAvatar from '../AuthorAvatar/AuthorAvatar';
import BrandLogo from '../BrandLogo/BrandLogo';
import { cn } from '../../lib/utils';

/**
 * Public author credit on posts/feeds.
 * When creatorBrandByline is on → homepage text wordmark (not a photo, not a username).
 * Follows light/dark automatically. Site header/footer logo is separate.
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
  const resolvedAvatar = String(avatarUrl || authorAvatarUrl(post) || '').trim();

  const nameSize =
    size === 'lg' ? 'text-xs' : size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const labelSize = size === 'lg' ? 'text-[11px] mr-1' : 'text-[10px]';
  const wordmarkSize = size === 'lg' ? 'md' : size === 'sm' ? 'xs' : 'sm';

  if (brand) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 min-w-0 max-w-full align-middle',
          time ? 'flex-col items-start gap-[5px]' : '',
          className
        )}
        title={displayName || 'Wirefringe'}
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
        <BrandLogo size={wordmarkSize} />
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
