import Link from 'next/link';

export default function LiveTicker({ posts = [] }) {
  const items = (posts || []).slice(0, 5).map((p, i) => ({
    id: p.id || `i${i}`,
    title: p.title || '',
    url: `/post/${encodeURIComponent((p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`,
    bucket: p.bucket || 'News',
  }));

  if (!items.length) return null;

  const content = (
    <div className="inline-flex gap-7 max-sm:gap-[18px] items-center whitespace-nowrap pl-4 animate-ticker" aria-hidden="true">
      {items.map((it) => (
        <span key={it.id} className="inline-flex items-center gap-2">
          <Link href={it.url} className="text-white no-underline inline-flex gap-2 items-center">
            <strong className="text-mint font-bold text-xs">{it.bucket}</strong>
            <span className="text-ink-tertiary">•</span>
            <span className="font-heading font-bold text-white text-sm max-sm:text-[13px]">{it.title}</span>
          </Link>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="border-t border-b border-line-light bg-gradient-to-r from-black/[0.02] to-transparent py-1.5"
      role="region"
      aria-label="Live headlines"
    >
      <div className="overflow-hidden w-full">
        {content}
        {content}
      </div>
    </div>
  );
}
