import { useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { fetcher } from '../../lib/api';
import { postUrl, postExcerpt } from '../../lib/utils';
import { SECTIONS } from '../../lib/sections';
import AuthorByline from '../../components/AuthorByline/AuthorByline';

export async function getServerSideProps({ params }) {
  const slug = String(params?.slug || '').toLowerCase();
  const section = SECTIONS.find((s) => s.slug === slug);
  if (!section) return { notFound: true };
  return { props: { slug, name: section.name } };
}

export default function SectionPage({ slug, name }) {
  const { data } = useSWR(`/api/section/${encodeURIComponent(slug)}`, fetcher, {
    revalidateOnFocus: false,
  });
  const posts = useMemo(() => data?.posts || [], [data]);

  return (
    <Layout title={`${name} – Wirefringe`} description={`Latest ${name} stories from Wirefringe.`}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-10">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-mint m-0 mb-2">Section</p>
        <h1 className="text-[36px] font-extrabold m-0 mb-8">{name}</h1>
        <div className="flex flex-col">
          {posts.map((p) => (
            <Link key={p.id} href={postUrl(p)} className="block py-5 border-b border-line no-underline">
              <div className="text-[11px] font-mono uppercase tracking-wide text-mint mb-1">{p.bucket}</div>
              <h2 className="text-[22px] font-bold m-0 mb-2 text-ink">{p.title}</h2>
              <p className="m-0 text-ink-secondary text-[15px]">{postExcerpt(p, 180)}</p>
              <div className="mt-2">
                <AuthorByline post={p} name={p.creatorName} size="sm" />
              </div>
            </Link>
          ))}
          {!posts.length ? <p className="text-ink-tertiary">No stories in this section yet.</p> : null}
        </div>
      </div>
    </Layout>
  );
}
