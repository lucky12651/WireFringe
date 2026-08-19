import { useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import FollowBar from '../../components/FollowBar/FollowBar';
import { fetcher } from '../../lib/api';
import { postUrl, postExcerpt } from '../../lib/utils';

export default function AuthorPage() {
  const router = useRouter();
  const slug = String(router.query.slug || '');
  const { data, error } = useSWR(slug ? `/api/authors/${encodeURIComponent(slug)}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const posts = useMemo(() => data?.posts || [], [data]);

  return (
    <Layout title={`${data?.name || 'Author'} – Wirefringe`} description={data?.bio || ''}>
      <div className="max-w-[900px] mx-auto px-5 md:px-10 py-10">
        {error ? <p>Author not found.</p> : null}
        <h1 className="text-[34px] font-extrabold m-0 mb-2">{data?.name || 'Author'}</h1>
        {data?.bio ? <p className="text-ink-secondary leading-relaxed">{data.bio}</p> : null}
        <div className="mt-4 mb-8">
          <FollowBar
            author={data?.name || slug}
            loginNext={`/author/${encodeURIComponent(slug)}`}
          />
        </div>
        {posts.map((p) => (
          <Link key={p.id} href={postUrl(p)} className="block py-4 border-b border-line no-underline text-ink">
            <div className="text-[11px] uppercase text-mint font-mono">{p.bucket}</div>
            <h2 className="text-[20px] font-bold m-0 mt-1">{p.title}</h2>
            <p className="m-0 mt-1 text-ink-secondary">{postExcerpt(p, 160)}</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
