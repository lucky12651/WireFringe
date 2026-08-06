import Link from 'next/link';
import { postUrl } from '../../lib/utils';

function formatDateDeterministic(date) {
  if (!date) return '';
  const d = new Date(date);
  if (!d || Number.isNaN(d.getTime && d.getTime())) return '';
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function TopStories({ posts = [] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="my-6 mb-2" aria-label="Top stories">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-extrabold tracking-tight">Top stories</h2>
        <span className="text-xs text-ink-secondary">Editor&apos;s picks</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={postUrl(p)}
            className="group flex-[0_0_220px] flex flex-col gap-2.5 no-underline text-inherit"
          >
            {p.ogImg ? (
              <div
                className="w-full aspect-[16/10] rounded-sm bg-[#222] bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${p.ogImg})` }}
              />
            ) : (
              <div className="w-full aspect-[16/10] rounded-sm bg-[#222]" />
            )}

            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] text-ink-secondary uppercase tracking-wide">
                {p.bucket || 'News'} • {formatDateDeterministic(p.date)}
              </div>
              <h3 className="text-[15px] font-bold leading-snug transition-colors group-hover:text-mint">
                {p.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
