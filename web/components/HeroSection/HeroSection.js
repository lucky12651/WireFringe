import Link from 'next/link';
import styles from './HeroSection.module.css';

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
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

export default function HeroSection({ posts = [], loading }) {
  if (loading) {
    return (
      <section className={styles.hero}>
        <div className={styles.grid}>
          <div className={`${styles.skeleton} ${styles.mainStage}`} style={{ height: '500px' }} />
          <div className={`${styles.skeleton} ${styles.sidebar}`} style={{ height: '500px' }} />
        </div>
      </section>
    );
  }

  if (!posts.length) {
    return (
      <section className={styles.hero}>
        <div className={styles.empty}>No stories available</div>
      </section>
    );
  }

  const featured = posts[0];
  const subHeadlines = posts.slice(1, 7);
  const picksForYou = posts.slice(7, 12);

  return (
    <div className={styles.hero}>
      <div className={styles.grid}>
        {/* Main Stage (Left Column) */}
        <section className={styles.mainStage}>
          <div className={styles.sectionHeader}>
            Top stories
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <header className={styles.featuredBox}>
            <Link href={postUrl(featured)} className={styles.featuredRow}>
              <div className={styles.featuredImage}>
                {featured.ogImg ? (
                  <img src={featured.ogImg} alt={featured.title} loading="eager" />
                ) : (
                  <div className={styles.skeleton} style={{ height: '100%' }} />
                )}
              </div>
              <article className={styles.featuredText}>
                <span className={styles.source}>{featured.bucket || 'Top News'}</span>
                <h2 className={styles.titleLarge}>{featured.title}</h2>
                <span className={styles.time}>{formatDate(featured.date)}</span>
              </article>
            </Link>
          </header>

          <div className={styles.subHeadlines}>
            {subHeadlines.map((post) => (
              <Link key={post.id} href={postUrl(post)} className={styles.subItem}>
                <span className={styles.source} style={{ fontSize: '11px' }}>{post.bucket || 'News'}</span>
                <h3 className={styles.subTitle}>{post.title}</h3>
                <span className={styles.time}>{formatDate(post.date)}</span>
              </Link>
            ))}
          </div>

          <Link href="/?category=all" className={styles.moreHeadlines}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            See more headlines and perspectives
          </Link>
        </section>

        {/* Sidebar (Right Column) - Picks For You */}
        <aside className={styles.sidebar}>
          <div className={styles.sectionHeader} style={{ color: 'var(--text-primary)', cursor: 'default', justifyContent: 'space-between', width: '100%' }}>
            Picks for you
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, width: 20, height: 20 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <div className={styles.sidebarList}>
            {picksForYou.map((post) => (
              <Link key={post.id} href={postUrl(post)} className={styles.compactCard}>
                <div className={styles.compactContent}>
                  <span className={styles.source} style={{ fontSize: '11px' }}>{post.bucket || 'Latest'}</span>
                  <h4 className={styles.compactTitle}>{post.title}</h4>
                  <span className={styles.time}>{formatDate(post.date)}</span>
                </div>
                {post.ogImg && (
                  <div className={styles.compactThumb}>
                    <img src={post.ogImg} alt="" loading="lazy" />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
