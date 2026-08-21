import { useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import FollowBar from '../../components/FollowBar/FollowBar';
import AuthorByline from '../../components/AuthorByline/AuthorByline';
import { fetcher } from '../../lib/api';
import { postUrl, postExcerpt } from '../../lib/utils';
import { PAGE } from '../../components/PostDesigns/shared';

export default function AuthorPage() {
  const router = useRouter();
  const slug = String(router.query.slug || '');
  const { data, error } = useSWR(slug ? `/api/authors/${encodeURIComponent(slug)}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const posts = useMemo(() => data?.posts || [], [data]);
  const name = data?.name || 'Author';
  const initial = String(name).trim().slice(0, 1).toUpperCase() || 'W';

  return (
    <Layout title={`${name} – Wirefringe`} description={data?.bio || `Stories by ${name} at Wirefringe.`}>
      <div className={`${PAGE} py-10 md:py-14`}>
        {error ? <p className="text-ink-secondary">Author not found.</p> : null}
        <header className="grid grid-cols-1 items-center gap-8 border-b border-line pb-10 md:grid-cols-[200px_1fr] md:gap-12">
          {data?.avatarUrl ? (
            <img src={data.avatarUrl} alt="" className="h-[200px] w-[200px] rounded-full object-cover" />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full bg-mint font-display text-5xl text-black">
              {initial}
            </div>
          )}
          <div>
            <p className="m-0 mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-mint">Staff</p>
            <h1 className="m-0 mb-3 text-[clamp(2rem,4vw,3.2rem)] font-black leading-tight">{name}</h1>
            {data?.bio ? <p className="m-0 max-w-[42rem] text-[17px] leading-relaxed text-ink-dek">{data.bio}</p> : null}
            <p className="mt-3 font-mono text-[12px] text-ink-tertiary">
              {posts.length} {posts.length === 1 ? 'story' : 'stories'}
            </p>
            <div className="mt-5">
              <FollowBar author={name} loginNext={`/author/${encodeURIComponent(slug)}`} />
            </div>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="mb-6 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-mint">Stories</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 min-[1001px]:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={postUrl(p)} className="group block text-inherit no-underline">
                <div className="mb-3 aspect-[16/10] overflow-hidden bg-bg-elevated">
                  {p.ogImg ? (
                    <img
                      src={p.ogImg}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-mint">{p.bucket}</div>
                <h3 className="m-0 mt-1 text-[18px] font-extrabold leading-snug group-hover:text-mint">{p.title}</h3>
                <p className="m-0 mt-1.5 line-clamp-2 text-[14px] text-ink-secondary">{postExcerpt(p, 140)}</p>
                <div className="mt-2">
                  <AuthorByline post={p} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
