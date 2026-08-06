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
      <header className="mb-6 pb-3.5 border-b border-[#222]">
        <h2 className="text-[28px] font-extrabold mb-1.5 text-white">
          Search Results for &quot;{query}&quot;
        </h2>
        <p className="text-sm text-[#888]">{results.length} articles found</p>
      </header>

      {results.length > 0 ? (
        <div className="flex flex-col">
          {results.map((post) => (
            <Link
              key={post.id}
              href={postUrl(post)}
              className="group block py-5 border-b border-[#222]"
            >
              <article>
                <div>
                  <div className="flex gap-2 text-xs text-[#888] mb-2">
                    <span className="text-mint font-bold uppercase tracking-wide text-[11px]">
                      {post.bucket}
                    </span>
                    <span>•</span>
                    <time>{formatDate(post.date)}</time>
                  </div>
                  <h3 className="text-xl font-bold leading-snug mb-2 text-white group-hover:text-mint transition-colors">
                    {post.title}
                  </h3>
                  {postExcerpt(post, 180) ? (
                    <p className="text-[15px] text-[#aaa] leading-normal max-w-[42em]">
                      {postExcerpt(post, 180)}
                    </p>
                  ) : null}
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-[#888]">
          <h3 className="mb-2 text-white">No results found</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}
