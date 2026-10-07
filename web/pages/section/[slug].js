import { useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { api, fetcher } from '../../lib/api';
import { postUrl, postExcerpt } from '../../lib/utils';
import { SECTIONS } from '../../lib/sections';
import AuthorByline from '../../components/AuthorByline/AuthorByline';

export async function getServerSideProps({ params }) {
  const slug = String(params?.slug || '').toLowerCase();
  const hardcoded = SECTIONS.find((s) => s.slug === slug);
  try {
    const cat = await api('/api/catalog');
    const page = (cat.sections || []).find((s) => s.pageSlug === slug && s.enabled);
    if (page) return { props: { slug, name: page.name } };
  } catch {
    // Fall back to the built-in section list if the catalog API is down.
  }
  if (hardcoded) return { props: { slug, name: hardcoded.name } };
  return { notFound: true };
}

export default function SectionPage({ slug, name }) {
  const { data, isLoading } = useSWR(`/api/section/${encodeURIComponent(slug)}`, fetcher, {
    revalidateOnFocus: false,
  });
  const posts = useMemo(() => data?.posts || [], [data]);
  const [lead, ...rest] = posts;

  return (
    <Layout title={`${name} – Wirefringe`} description={`Latest ${name} stories from Wirefringe.`}>
      <div className="py-8 md:py-10">
        <div className="h-0.5 bg-mint w-full mb-2.5" />
        <h1 className="m-0 text-[28px] md:text-[34px] font-extrabold tracking-tight leading-tight">{name}</h1>

        {isLoading && !posts.length ? (
          <p className="mt-8 text-ink-tertiary">Loading stories…</p>
        ) : !posts.length ? (
          <p className="mt-8 text-ink-tertiary">No stories in this section yet.</p>
        ) : (
          <>
            {lead ? (
              <Link href={postUrl(lead)} className="group mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-5 md:gap-8 items-start text-inherit">
                <div className="aspect-[16/10] overflow-hidden bg-bg-card">
                  {lead.ogImg ? (
                    <img
                      src={lead.ogImg}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 md:pt-2">
                  <h2 className="m-0 [font-family:var(--font-hero)] font-normal text-[34px] md:text-[46px] leading-[0.98] text-ink transition-colors group-hover:text-mint">
                    {lead.title}
                  </h2>
                  {postExcerpt(lead, 180) ? (
                    <p className="mt-3 mb-0 font-serif text-[18px] md:text-[20px] leading-[1.35] text-ink">
                      {postExcerpt(lead, 180)}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <AuthorByline post={lead} name={lead.creatorName} size="sm" />
                  </div>
                </div>
              </Link>
            ) : null}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2">
              {rest.map((p, i) => (
                <Link
                  key={p.id}
                  href={postUrl(p)}
                  className={`group grid grid-cols-[56px_minmax(0,1fr)] gap-3.5 items-start py-4 border-b border-line text-inherit ${i % 2 === 0 ? 'md:pr-5 md:mr-5 md:border-r' : ''}`}
                >
                  <div className="w-14 h-14 overflow-hidden bg-bg-card">
                    {p.ogImg ? (
                      <img src={p.ogImg} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h2 className="m-0 text-[16px] font-bold leading-[1.2] tracking-tight text-ink transition-colors group-hover:text-mint">
                      {p.title}
                    </h2>
                    {postExcerpt(p, 110) ? (
                      <p className="mt-1.5 mb-0 font-serif text-[14px] leading-[1.4] text-ink-tertiary line-clamp-2">
                        {postExcerpt(p, 110)}
                      </p>
                    ) : null}
                    <div className="mt-2">
                      <AuthorByline post={p} name={p.creatorName} size="sm" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
