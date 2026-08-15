import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { cn, postUrl } from '../../../lib/utils';
import { EmptyState } from '../shared/EmptyState';
import { Icons } from '../Layout/icons';

function formatCount(n) {
  const value = Number(n) || 0;
  return value.toLocaleString('en-US');
}

export function AnalyticsView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    newsroomApi
      .analytics()
      .then((out) => {
        if (!cancelled) setData(out || {});
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load analytics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(() => {
    const rows = Array.isArray(data?.bySection) ? data.bySection : [];
    const maxViews = Math.max(1, ...rows.map((r) => Number(r.views) || 0));
    return rows
      .slice()
      .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
      .map((row) => ({
        ...row,
        pct: Math.round(((Number(row.views) || 0) / maxViews) * 100),
      }));
  }, [data]);

  const stories = Array.isArray(data?.topStories) ? data.topStories : [];
  const totalViews = Number(data?.totalViews) || 0;
  const totalPosts = sections.reduce((sum, row) => sum + (Number(row.posts) || 0), 0);
  const sectionCount = sections.length;
  const topViews = Number(stories[0]?.views) || 0;

  if (loading) {
    return (
      <div className={tw.adminView}>
        <section className={tw.adminSection}>
          <h3 className={tw.adminSectionTitle}>Analytics</h3>
          <p className={tw.adminSectionDesc}>Loading story views…</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[92px] rounded-lg border border-line bg-bg-hover animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className={tw.adminView}>
        <section className={tw.adminSection}>
          <h3 className={tw.adminSectionTitle}>Analytics</h3>
          <p className={cn(tw.formHint, 'text-[#ff8a8a]')}>{error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <h3 className={cn(tw.adminSectionTitle, 'mb-1')}>Analytics</h3>
        <p className={tw.adminSectionDesc}>
          Views are counted when someone opens a published story on the site.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <StatTile
            label="Total views"
            value={formatCount(totalViews)}
            hint="All published stories"
            Icon={Icons.eye}
          />
          <StatTile
            label="Published stories"
            value={formatCount(totalPosts)}
            hint={`${sectionCount} section${sectionCount === 1 ? '' : 's'}`}
            Icon={Icons.posts}
          />
          <StatTile
            label="Top story"
            value={formatCount(topViews)}
            hint={stories[0]?.title || 'No views yet'}
            Icon={Icons.draft}
          />
        </div>
      </section>

      <section className={tw.adminSection}>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h3 className={cn(tw.adminSectionTitle, 'mb-1')}>Views by section</h3>
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>How traffic is split across desks.</p>
          </div>
          <span className="text-[12px] text-ink-tertiary">{sectionCount}</span>
        </div>
        {sections.length ? (
          <div className="flex flex-col gap-3.5">
            {sections.map((row) => (
              <div key={row.bucket}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-[13px] font-semibold text-ink">{row.bucket}</span>
                  <span className="text-[12px] text-ink-tertiary whitespace-nowrap">
                    {formatCount(row.views)} views · {formatCount(row.posts)} stories
                  </span>
                </div>
                <div className="h-2 rounded-full bg-bg-hover border border-line overflow-hidden">
                  <div
                    className="h-full rounded-full bg-mint"
                    style={{ width: `${Math.max(row.views ? 6 : 0, row.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No section data yet. Open a published story to start counting views.</EmptyState>
        )}
      </section>

      <section className={tw.adminSection}>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h3 className={cn(tw.adminSectionTitle, 'mb-1')}>Top stories</h3>
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>Most opened articles, ranked by views.</p>
          </div>
          <span className="text-[12px] text-ink-tertiary">{stories.length}</span>
        </div>
        <div className={tw.tableWrap}>
          <table className={tw.table}>
            <thead>
              <tr>
                <th className={tw.th}>#</th>
                <th className={tw.th}>Story</th>
                <th className={tw.th}>Section</th>
                <th className={cn(tw.th, tw.textRight)}>Views</th>
              </tr>
            </thead>
            <tbody>
              {stories.length ? (
                stories.map((story, index) => (
                  <tr key={story.id}>
                    <td className={cn(tw.td, 'w-10 text-ink-tertiary font-mono text-xs')}>
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className={tw.td}>
                      <Link
                        href={postUrl({ id: story.id, title: story.title })}
                        className="text-ink font-semibold no-underline hover:text-mint"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {story.title}
                      </Link>
                    </td>
                    <td className={tw.td}>
                      <span className={cn(tw.statusBadge, 'bg-mint/10 text-mint border border-mint/25')}>
                        {story.bucket || 'News'}
                      </span>
                    </td>
                    <td className={cn(tw.td, tw.textRight, 'font-semibold text-ink')}>
                      {formatCount(story.views)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={tw.td}>
                    <EmptyState>No story views recorded yet.</EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value, hint, Icon }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-line bg-bg-elevated">
      <div className="w-10 h-10 rounded-lg border border-line bg-bg-hover text-mint flex items-center justify-center shrink-0">
        {Icon ? <Icon size={18} /> : null}
      </div>
      <div className="min-w-0">
        <p className="m-0 text-[11px] uppercase tracking-wide text-ink-tertiary font-semibold">{label}</p>
        <p className="m-0 mt-1 text-[26px] leading-none font-semibold tracking-tight text-ink">{value}</p>
        <p className="m-0 mt-1.5 text-[12px] text-ink-tertiary truncate" title={hint}>
          {hint}
        </p>
      </div>
    </div>
  );
}
