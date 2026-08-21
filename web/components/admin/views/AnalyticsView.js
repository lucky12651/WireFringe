import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { newsroomApi } from '../../../lib/api';
import { tw } from '../../../lib/tw';
import { cn, postUrl } from '../../../lib/utils';
import { EmptyState } from '../shared/EmptyState';
import { Icons } from '../Layout/icons';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';

function formatCount(n) {
  const value = Number(n) || 0;
  return value.toLocaleString('en-US');
}

function formatRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (!value) return 'Member';
  if (value === 'unassigned') return 'No account';
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  const users = useMemo(() => {
    const rows = Array.isArray(data?.byUser) ? data.byUser : [];
    const maxPosts = Math.max(1, ...rows.map((r) => Number(r.posts) || 0));
    return rows
      .slice()
      .sort((a, b) => (Number(b.posts) || 0) - (Number(a.posts) || 0))
      .map((row) => ({
        ...row,
        pct: Math.round(((Number(row.posts) || 0) / maxPosts) * 100),
      }));
  }, [data]);
  const totalViews = Number(data?.totalViews) || 0;
  const totalPosts = sections.reduce((sum, row) => sum + (Number(row.posts) || 0), 0);
  const sectionCount = sections.length;
  const topViews = Number(stories[0]?.views) || 0;
  const usersWithPosts = users.filter((row) => (Number(row.posts) || 0) > 0).length;

  if (loading) {
    return (
      <div className="wp-wrap">
        <ScreenTitle title="Analytics" />
        <section className={tw.adminSection}>
          <h3 className={tw.adminSectionTitle}>Overview</h3>
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
      <div className="wp-wrap">
        <ScreenTitle title="Analytics" />
        <Notice type="error">{error}</Notice>
      </div>
    );
  }

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Analytics" />
      <section className="postbox">
        <h2 className="hndle">Overview</h2>
        <div className="inside">
        <p className={tw.adminSectionDesc}>
          Views are counted when someone opens a published story on the site.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
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
            label="Users with posts"
            value={formatCount(usersWithPosts)}
            hint={`${formatCount(users.length)} account${users.length === 1 ? '' : 's'} total`}
            Icon={Icons.users}
          />
          <StatTile
            label="Top story"
            value={formatCount(topViews)}
            hint={stories[0]?.title || 'No views yet'}
            Icon={Icons.draft}
          />
        </div>
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">Views by section</h2>
        <div className="inside">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
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
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">Posts by user</h2>
        <div className="inside">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <p className={cn(tw.adminSectionDesc, 'mb-0')}>
              How many stories each account has written, plus views on those stories.
            </p>
            <span className="text-[12px] text-ink-tertiary">{users.length}</span>
          </div>
          {users.length ? (
            <div className={tw.tableWrap}>
              <table className={cn(tw.table, 'table-fixed')}>
                <colgroup>
                  <col />
                  <col className="w-[120px]" />
                  <col className="w-[88px]" />
                  <col className="w-[110px]" />
                  <col className="w-[28%]" />
                  <col className="w-[88px]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className={cn(tw.th, 'whitespace-nowrap')}>User</th>
                    <th className={cn(tw.th, 'whitespace-nowrap')}>Role</th>
                    <th className={cn(tw.th, 'whitespace-nowrap')}>Posts</th>
                    <th className={cn(tw.th, 'whitespace-nowrap')}>Published</th>
                    <th className={cn(tw.th, 'whitespace-nowrap')}>Share</th>
                    <th className={cn(tw.th, 'whitespace-nowrap')}>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => {
                    const name = row.displayName || row.username || 'Unknown';
                    const handle = row.username && row.username !== name ? row.username : '';
                    return (
                      <tr key={row.username}>
                        <td className={cn(tw.td, 'align-middle min-w-0')}>
                          <div className="flex min-w-0 items-baseline gap-2">
                            <span className="font-semibold text-ink shrink-0">{name}</span>
                            {handle ? (
                              <span className="min-w-0 truncate text-[12px] text-ink-tertiary">@{handle}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className={cn(tw.td, 'align-middle whitespace-nowrap')}>
                          <span className={cn(tw.statusBadge, 'bg-mint/10 text-mint border border-mint/25')}>
                            {formatRole(row.role)}
                          </span>
                        </td>
                        <td className={cn(tw.td, 'align-middle whitespace-nowrap font-semibold tabular-nums text-ink')}>
                          {formatCount(row.posts)}
                        </td>
                        <td className={cn(tw.td, 'align-middle whitespace-nowrap tabular-nums text-ink-secondary')}>
                          {formatCount(row.published)}
                        </td>
                        <td className={cn(tw.td, 'align-middle')}>
                          <div className="h-2 w-full rounded-full bg-bg-hover border border-line overflow-hidden">
                            <div
                              className="h-full rounded-full bg-mint"
                              style={{ width: `${Math.max(row.posts ? 6 : 0, row.pct)}%` }}
                            />
                          </div>
                        </td>
                        <td className={cn(tw.td, 'align-middle whitespace-nowrap tabular-nums text-ink')}>
                          {formatCount(row.views)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No user post counts yet.</EmptyState>
          )}
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">Top stories</h2>
        <div className="inside">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
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
