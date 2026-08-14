import Link from 'next/link';
import { postUrl, postExcerpt } from '../../lib/utils';

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
    <div className="pt-7 pb-12">
      <header className="mb-6 pb-3.5 border-b border-line">
        <h2 className="text-[28px] font-extrabold mb-1.5 text-ink">
          Search Results for &quot;{query}&quot;
        </h2>
        <p className="text-sm text-ink-tertiary">{results.length} articles found</p>
      </header>

      {results.length > 0 ? (
        <div className="flex flex-col">
          {results.map((post) => (
            <Link
              key={post.id}
              href={postUrl(post)}
              className="group block py-5 border-b border-line"
            >
              <article>
                <div>
                  <div className="flex gap-2 text-xs text-ink-tertiary mb-2">
                    <span className="text-mint font-bold uppercase tracking-wide text-[11px]">
                      {post.bucket}
                    </span>
                    <span>•</span>
                    <time>{formatDate(post.date)}</time>
                  </div>
                  <h3 className="text-xl font-bold leading-snug mb-2 text-ink group-hover:text-mint transition-colors">
                    {post.title}
                  </h3>
                  {postExcerpt(post, 180) ? (
                    <p className="text-[15px] text-ink-secondary leading-normal max-w-[42em]">
                      {postExcerpt(post, 180)}
                    </p>
                  ) : null}
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-ink-tertiary">
          <h3 className="mb-2 text-ink">No results found</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}
