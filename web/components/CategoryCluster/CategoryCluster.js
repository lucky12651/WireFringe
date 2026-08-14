import Link from 'next/link';
import { postUrl } from '../../lib/utils';
import AuthorByline from '../AuthorByline/AuthorByline';

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
    <article className="group grid grid-cols-[100px_1fr] gap-3 items-start">
      {post.ogImg ? (
        <Link
          href={postUrl(post)}
          className="w-[100px] aspect-[4/3] overflow-hidden bg-bg-card block"
        >
          <img
            src={post.ogImg}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      ) : (
        <div className="w-[100px] aspect-[4/3] overflow-hidden bg-bg-card" />
      )}
      <div className="min-w-0">
        <Link href={postUrl(post)}>
          <h3 className="text-[15px] font-bold leading-snug mb-2 text-ink line-clamp-3 hover:shadow-[inset_0_-0.12em_0_0_var(--mint)]">
            {post.title}
          </h3>
        </Link>
        <div className="text-xs text-ink-secondary flex items-center gap-2 flex-wrap">
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
    <section className="mb-9">
      <header className="flex items-baseline justify-between gap-4 mb-4 pb-2.5 border-b border-line">
        <Link href={`/?category=${slugifyCategory(title)}`}>
          <h2 className="text-lg font-extrabold tracking-wide text-ink hover:shadow-[inset_0_-0.12em_0_0_var(--mint)]">
            {title}
          </h2>
        </Link>
        <Link
          href={`/?category=${slugifyCategory(title)}`}
          className="font-mono text-[11px] font-semibold tracking-wide uppercase text-ink-secondary hover:text-mint"
        >
          View all
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-[22px] gap-x-6">
        {gridPosts.map((post) => (
          <Card key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
