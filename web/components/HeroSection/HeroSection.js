import Link from 'next/link';
import { postUrl, postExcerpt } from '../../lib/utils';
import styles from './HeroSection.module.css';

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

function authorName(post) {
  return String(post?.creatorName || post?.creator || 'Staff').toUpperCase();
}

function excerpt(post, max = 110) {
  return postExcerpt(post, max);
}

/** Purple highlight only on hover (CSS .hl) */
function HighlightTitle({ title, className }) {
  const t = String(title || '');
  if (t.length < 24) {
    return (
      <h1 className={className}>
        <span className={styles.hl}>{t}</span>
      </h1>
    );
  }
  const mid = Math.floor(t.length * 0.42);
  let split = t.indexOf(' ', mid);
  if (split < 0) split = mid;
  const first = t.slice(0, split).trimEnd();
  const second = t.slice(split).trimStart();
  return (
    <h1 className={className}>
      {first}{' '}
      <span className={styles.hl}>{second}</span>
    </h1>
  );
}

export default function HeroSection({ posts = [] }) {
  if (!posts.length) {
    return (
      <section className={styles.hero}>
        <div className={styles.empty}>No stories available</div>
      </section>
    );
  }

  const featured = posts[0];
  const grid = posts.slice(1, 5);

  return (
    <section className={styles.hero}>
      <Link href={postUrl(featured)} className={styles.featured}>
        <div className={styles.media}>
          {featured.ogImg ? (
            <img src={featured.ogImg} alt="" loading="eager" />
          ) : (
            <div className={styles.ph} />
          )}
          <div className={styles.shade} />
          <div className={styles.overlay}>
            <HighlightTitle title={featured.title} className={styles.title} />
            {excerpt(featured) ? <p className={styles.dek}>{excerpt(featured)}</p> : null}
            <div className={styles.meta}>
              <span className={styles.author}>{authorName(featured)}</span>
              {featured.date ? <span className={styles.date}>{formatDate(featured.date)}</span> : null}
              <span className={styles.comments} title="Comments">
                <CommentIcon /> {Number(featured.commentCount) || 0}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {grid.length > 0 && (
        <div className={styles.grid}>
          {grid.map((post) => (
            <article key={post.id} className={styles.card}>
              <Link href={postUrl(post)} className={styles.thumb}>
                {post.ogImg ? <img src={post.ogImg} alt="" loading="lazy" /> : <div className={styles.ph} />}
              </Link>
              <div className={styles.cardBody}>
                <Link href={postUrl(post)} className={styles.cardTitle}>
                  {post.title}
                </Link>
                <div className={styles.cardMeta}>
                  <span className={styles.author}>{authorName(post)}</span>
                  <span className={styles.comments} title="Comments">
                    <CommentIcon /> {Number(post.commentCount) || 0}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
