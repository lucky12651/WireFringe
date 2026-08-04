import Link from 'next/link';
import { postUrl, postExcerpt } from '../../lib/utils';
import styles from './SearchResults.module.css';

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SearchResults({ results = [], query = '' }) {
  return (
    <div className={styles.searchResults}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          Search Results for "{query}"
        </h2>
        <p className={styles.count}>{results.length} articles found</p>
      </header>

      {results.length > 0 ? (
        <div className={styles.grid}>
          {results.map((post) => (
            <Link key={post.id} href={postUrl(post)} className={styles.card}>
              <article className={styles.cardContent}>
               
                <div className={styles.body}>
                  <div className={styles.meta}>
                    <span className={styles.category}>{post.bucket}</span>
                    <span className={styles.dot}>•</span>
                    <time>{formatDate(post.date)}</time>
                  </div>
                  <h3 className={styles.cardTitle}>{post.title}</h3>
                  {postExcerpt(post, 180) ? (
                    <p className={styles.excerpt}>{postExcerpt(post, 180)}</p>
                  ) : null}
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.noResults}>
          <h3>No results found</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}
