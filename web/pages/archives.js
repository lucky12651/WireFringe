import Link from 'next/link';
import useSWR from 'swr';
import StaticPage from '../components/StaticPage/StaticPage';
import { fetcher, api } from '../lib/api';
import { postUrl } from '../lib/utils';
import { SITE_NAME } from '../lib/site';

function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export async function getStaticProps() {
  try {
    const data = await api('/api/posts');
    const initialPosts = (data || []).slice(0, 200).map((p) => ({
      id: p.id,
      title: p.title,
      bucket: p.bucket,
      date: p.date ?? null,
      ogImg: p.ogImg ?? null,
    }));
    return { props: { initialPosts }, revalidate: 120 };
  } catch {
    return { props: { initialPosts: [] }, revalidate: 30 };
  }
}

export default function ArchivesPage({ initialPosts }) {
  const { data } = useSWR('/api/posts', fetcher, {
    fallbackData: initialPosts,
    revalidateOnFocus: false,
  });

  const posts = (data || [])
    .map((p) => ({ ...p, date: p.date ? new Date(p.date) : null }))
    .sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0));

  return (
    <StaticPage
      title="Archives"
      description={`Browse all stories published on ${SITE_NAME}.`}
      lead="A chronological index of our published stories. Click any headline to read the full article."
      showUpdated={false}
    >
      <p>
        Looking for something specific? Try the search bar on the{' '}
        <Link href="/">home page</Link>, or filter by category from the navigation.
      </p>

      {posts.length === 0 ? (
        <p>No posts yet. Check back soon.</p>
      ) : (
        <div className="flex flex-col gap-0 border-t border-[#222]">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={postUrl(post)}
              className="group grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-1.5 sm:gap-4 py-4 border-b border-[#1c1c1c] no-underline text-inherit"
            >
              <span className="font-mono text-[11px] text-[#666] pt-1">
                {formatDate(post.date) || '—'}
              </span>
              <div>
                {post.bucket ? (
                  <div className="font-mono text-[10px] font-bold tracking-wide uppercase text-mint mb-1">
                    {post.bucket}
                  </div>
                ) : null}
                <div className="text-base font-bold text-white leading-snug transition-colors group-hover:text-mint">
                  {post.title}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </StaticPage>
  );
}
