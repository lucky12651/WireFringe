import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '../../lib/api';
import { postUrl } from '../../lib/utils';

export default function BreakingStrip() {
  const { data } = useSWR('/api/frontpage', fetcher, { revalidateOnFocus: false });
  const story = data?.breaking;
  if (!story?.title) return null;
  return (
    <Link
      href={postUrl(story)}
      className="block bg-[#c0392b] px-4 py-1.5 text-center font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white no-underline hover:bg-[#a93226]"
    >
      Breaking · {story.title}
    </Link>
  );
}
