import Link from 'next/link';
import styles from './LiveTicker.module.css';

export default function LiveTicker({ posts = [] }) {
  const items = (posts || []).slice(0, 5).map((p, i) => ({
    id: p.id || `i${i}`,
    title: p.title || '',
    url: `/post/${encodeURIComponent((p.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-'))}`,
    bucket: p.bucket || 'News'
  }));

  if (!items.length) return null;

  const content = (
    <div className={styles.track} aria-hidden="true">
      {items.map((it) => (
        <span key={it.id} className={styles.item}>
          <Link href={it.url} className={styles.link}>
            <strong className={styles.cat}>{it.bucket}</strong>
            <span className={styles.sep}>•</span>
            <span className={styles.title}>{it.title}</span>
          </Link>
        </span>
      ))}
    </div>
  );

  return (
    <div className={styles.ticker} role="region" aria-label="Live headlines">
      <div className={styles.viewport}>
        {content}
        {content}
      </div>
    </div>
  );
}
