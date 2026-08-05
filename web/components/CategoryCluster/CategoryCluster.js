import Link from 'next/link';
import { postUrl } from '../../lib/utils';
import AuthorByline from '../AuthorByline/AuthorByline';
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
    month: 'short',
    day: 'numeric',
  });
}

function Card({ post }) {
  if (!post) return null;

  return (
    <article className={styles.card}>
      {post.ogImg ? (
        <Link href={postUrl(post)} className={styles.thumb}>
          <img src={post.ogImg} alt="" loading="lazy" />
        </Link>
      ) : (
        <div className={styles.thumb} />
      )}
      <div className={styles.body}>
        <Link href={postUrl(post)}>
          <h3 className={styles.cardTitle}>{post.title}</h3>
        </Link>
        <div className={styles.meta}>
          <AuthorByline post={post} size="sm" />
          <span aria-hidden="true">•</span>
          <span>{formatDate(post.date)}</span>
        </div>
      </div>
    </article>
  );
}

function slugifyCategory(cat) {
  return cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function CategoryCluster({ title, posts = [] }) {
  if (!posts.length) return null;

  const gridPosts = posts.slice(0, 4);

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
