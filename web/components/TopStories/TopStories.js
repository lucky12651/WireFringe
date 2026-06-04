import Link from 'next/link';
import styles from './TopStories.module.css';

function formatDateDeterministic(date) {
  if (!date) return '';
  const d = new Date(date);
  if (!d || Number.isNaN(d.getTime && d.getTime())) return '';
  const mm = d.getMonth() + 1; // 1-12
  const dd = d.getDate();
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function TopStories({ posts = [] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className={styles.topStories} aria-label="Top stories">
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Top stories</h2>
        <span className={styles.hint}>Editor's picks</span>
      </div>

      <div className={styles.scroller}>
        {posts.map((p) => (
          <Link key={p.id} href={`/post/${encodeURIComponent((p.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-'))}`} className={styles.card}>
            {p.ogImg ? (
              <div className={styles.thumb} style={{ backgroundImage: `url(${p.ogImg})` }} />
            ) : (
              <div className={styles.thumbPlaceholder} />
            )}

            <div className={styles.info}>
              <div className={styles.meta}>{p.bucket || 'News'} • {formatDateDeterministic(p.date)}</div>
              <h3 className={styles.headline}>{p.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
