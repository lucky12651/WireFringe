import Link from 'next/link';
import styles from './CategoryCluster.module.css';

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function slugifyTitle(title) {
  const s = String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return s.slice(0, 90) || 'post';
}

function postUrl(post) {
  const id = post?.id;
  if (!id) return '/';
  const slug = slugifyTitle(post?.title);
  return `/post/${encodeURIComponent(slug)}`;
}

function NewsIcon() {
  return (
    <svg className={styles.newsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </svg>
  );
}

function Card({ post }) {
  if (!post) return null;
  
  return (
    <Link href={postUrl(post)} className={styles.card}>
      <article className={styles.cardContent}>
        {/* Source info at top */}
        <div className={styles.cardMetaTop}>
          <div className={styles.sourceIcon} aria-hidden="true">
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--brand-primary)' }}>
              {(post.bucket || 'N')[0]}
            </span>
          </div>
          <span className={styles.sourceName}>{post.bucket || 'Coffee N Blog'}</span>
        </div>

        {/* Title */}
        <h3 className={styles.cardTitle}>{post.title}</h3>

        {/* Bottom meta + News icon */}
        <div className={styles.cardMetaBottom}>
          <div className={styles.timeInfo}>
            <span>{formatDate(post.date)}</span>
            {post.creator && (
              <>
                <span aria-hidden="true">•</span>
                <span>By {post.creator}</span>
              </>
            )}
          </div>
          <NewsIcon />
        </div>
      </article>

      {/* Thumbnail on the right */}
      {post.ogImg && (
        <div className={styles.cardMedia}>
          <img src={post.ogImg} alt="" loading="lazy" />
        </div>
      )}
    </Link>
  );
}

function slugifyCategory(cat) {
  return cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function CategoryCluster({ title, posts = [], loading }) {
  if (loading || !posts.length) return null;

  // Render 6 posts in 2 columns (3 per column)
  const gridPosts = posts.slice(0, 6);

  return (
    <section className={styles.cluster}>
      <header className={styles.header}>
        <Link href={`/?category=${slugifyCategory(title)}`} className={styles.titleLink}>
          <h2 className={styles.title}>{title}</h2>
        </Link>
        <Link href={`/?category=${slugifyCategory(title)}`} className={styles.moreLink}>
          View all
        </Link>
      </header>
      
      <div className={styles.layout}>
        {gridPosts.map((post) => (
          <Card key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
