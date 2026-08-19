import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../components/Layout/Layout';
import SearchResults from '../components/SearchResults/SearchResults';
import { fetcher } from '../lib/api';

export default function SearchPage() {
  const router = useRouter();
  const q = String(router.query.q || '');
  const { data } = useSWR(q.trim().length >= 2 ? `/api/search?q=${encodeURIComponent(q)}` : null, fetcher);
  const results = useMemo(() => data || [], [data]);

  return (
    <Layout title={`Search – ${q || 'Wirefringe'}`}>
      <div className="max-w-[900px] mx-auto px-0 sm:px-5 md:px-10 py-5 md:py-10">
        <h1 className="m-0 mb-4 text-[22px] font-extrabold tracking-tight min-[1001px]:hidden">Search</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = new FormData(e.target).get('q');
            router.push(`/search?q=${encodeURIComponent(String(next || ''))}`);
          }}
        >
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Search stories, tags, authors…"
            className="w-full h-12 px-4 border border-line rounded-md bg-bg-elevated text-ink mb-6 outline-none focus:border-mint"
          />
        </form>
        {q.trim().length < 2 ? (
          <p className="text-ink-tertiary">Type at least two characters.</p>
        ) : (
          <SearchResults results={results} query={q} />
        )}
      </div>
    </Layout>
  );
}
