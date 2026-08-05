import { useEffect, useState } from 'react';
import { WIREFRINGE_LOGO, isBrandBylineAuthor, isWirefringeAuthor } from '../../lib/author';
import styles from './AuthorAvatar.module.css';

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
  // Prefer public brand logo for Wirefringe circular avatar
  const url = String(src || (isBrand ? WIREFRINGE_LOGO : '') || '').trim();

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const sizeClass =
    size === 'lg' ? styles.lg : size === 'sm' ? styles.sm : styles.md;

  return (
    <div
      className={`${styles.avatar} ${sizeClass} ${isBrand ? styles.brand : ''} ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      {url && !failed ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className={isBrand ? styles.logoImg : styles.photoImg}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.fallback} aria-hidden="true">
          {getInitials(label)}
        </span>
      )}
    </div>
  );
}
