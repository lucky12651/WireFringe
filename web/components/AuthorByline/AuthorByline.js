import {
  brandLogoUrl,
  authorAvatarUrl,
  authorDisplayName,
  isBrandBylineAuthor,
} from '../../lib/author';
import AuthorAvatar from '../AuthorAvatar/AuthorAvatar';
import styles from './AuthorByline.module.css';

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
  const sizeClass = size === 'lg' ? styles.lg : size === 'sm' ? styles.sm : styles.md;

  if (brand && logoSrc) {
    return (
      <span
        className={`${styles.byline} ${styles.brand} ${sizeClass} ${className}`.trim()}
        title={displayName || 'Brand'}
      >
        {label ? <span className={styles.label}>{label}</span> : null}
        <span className={styles.logoWrap}>
          <img
            src={logoSrc}
            alt={displayName || 'Brand'}
            className={styles.wordmark}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.dataset.fallback === '1') return;
              el.dataset.fallback = '1';
              // Prefer profile avatar, then default public wordmark
              el.src = resolvedAvatar || '/wirefringe.png';
            }}
          />
        </span>
        {time ? <span className={styles.time}>{time}</span> : null}
      </span>
    );
  }

  return (
    <span className={`${styles.byline} ${sizeClass} ${className}`.trim()}>
      {showAvatar ? (
        <AuthorAvatar
          name={displayName}
          src={resolvedAvatar}
          size={size === 'lg' ? 'md' : 'sm'}
        />
      ) : null}
      <span className={styles.textBlock}>
        {label ? <span className={styles.label}>{label}</span> : null}
        <span className={styles.name}>{displayName || 'Staff'}</span>
        {time ? <span className={styles.time}>{time}</span> : null}
      </span>
    </span>
  );
}
