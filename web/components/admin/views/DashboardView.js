import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { postUrl } from '../../../lib/utils';
import { newsroomApi } from '../../../lib/api';
import { EmptyState } from '../shared/EmptyState';
import { ScreenTitle, Postbox } from '../wp/ScreenTitle';

function formatCount(n) {
  const value = Number(n) || 0;
  return value.toLocaleString('en-US');
}

function useAnimatedNumber(value, duration = 450) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  shownRef.current = shown;

  useEffect(() => {
    const from = shownRef.current;
    const to = target;
    if (from === to) return undefined;
    const started = performance.now();
    let frame = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return shown;
}

function MonthChartRow({ label, count, max }) {
  const shown = useAnimatedNumber(count);
  const pct = max > 0 ? Math.round((Number(count) / max) * 100) : 0;
  return (
    <tr>
      <td className="whitespace-nowrap text-ink-secondary">{shortMonth(label)}</td>
      <td>
        <div
          className="h-[8px] max-w-[140px] overflow-hidden bg-[var(--chip)]"
          title={`${label}: ${count}`}
        >
          <div
            className="h-full bg-mint transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </td>
      <td className="text-right tabular-nums">{shown}</td>
    </tr>
  );
}

function shortMonth(label) {
  const s = String(label || '');
  if (/^\d{4}-\d{2}$/.test(s)) {
    const m = Number(s.slice(5, 7));
    return ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][
      m - 1
    ] || s;
  }
  return s.slice(0, 3).toUpperCase();
}

export function DashboardView({
  postsCount,
  categoriesCount,
  queueCount,
  pendingCommentsCount,
  canViewPendingCommentsCount,
  postsByMonth,
  postsChartMax,
  postGrowth30,
  trendingComments,
  trendingHint,
  latestPosts,
  recentCache,
  mediaCount,
  botPublishedCount,
  postsSource = 'all',
  onPostsSourceChange,
  memberStats,
  me,
  access,
  onNavigate,
}) {
  const [topStories, setTopStories] = useState([]);

  const published = Number(postsCount) || 0;
  const media = Number(mediaCount) || 0;
  const growthDelta = postGrowth30?.delta;

  useEffect(() => {
    let cancelled = false;
    newsroomApi
      .analytics()
      .then((out) => {
        if (cancelled) return;
        const rows = Array.isArray(out?.topStories) ? out.topStories : [];
        setTopStories(rows.slice(0, 10));
      })
      .catch(() => {
        if (!cancelled) setTopStories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const months = Array.isArray(postsByMonth) ? postsByMonth : [];
  const maxMonth = Math.max(
    0,
    Number(postsChartMax) || 0,
    ...months.map((m) => Number(m.count) || 0)
  );
  const shownGrowth = useAnimatedNumber(postGrowth30?.current ?? 0);

  const pendingComments =
    canViewPendingCommentsCount !== false ? Number(pendingCommentsCount) || 0 : 0;

  const trends = Array.isArray(trendingComments) ? trendingComments : [];
  const dash = access?.dashboard || {};
  const isAuthor = access?.isAuthor;

  const overviewStats = [
    dash.showSiteStats || dash.showMyStats
      ? {
          label: isAuthor ? 'My published' : 'Published',
          value: published,
          sub: isAuthor ? 'Your live articles' : 'Live articles',
          go: 'posts',
        }
      : null,
    dash.showSiteStats && !isAuthor
      ? {
          label: 'Bot published',
          value: Number(botPublishedCount) || 0,
          sub: 'News bot articles',
          go: 'posts',
          extra: { source: 'bot' },
        }
      : null,
    dash.showPendingComments
      ? {
          label: isAuthor ? 'My pending comments' : 'Pending comments',
          value: pendingComments,
          sub: isAuthor ? 'On your stories' : 'Awaiting review',
          go: 'comments',
          warn: pendingComments > 0,
        }
      : null,
    dash.showCategories
      ? { label: 'Categories', value: Number(categoriesCount) || 0, sub: 'Taxonomy', go: 'categories' }
      : null,
    dash.showMedia
      ? { label: 'Media', value: media, sub: 'Uploaded assets', go: 'media' }
      : null,
  ].filter(Boolean);

  return (
    <div className="wp-wrap">
      <ScreenTitle title="Dashboard" />

      <div className="welcome-panel">
        <h2>Welcome to Wirefringe</h2>
        <p>
          {isAuthor
            ? 'Write drafts and send them to review when they are ready.'
            : 'Manage posts, comments, media, and the public site from this dashboard.'}
        </p>
        <a href="/admin/post" className="page-title-action">
          Add a new post
        </a>
      </div>

      <div className="dashboard-widgets">
        <div>
          <Postbox title="At a Glance">
            <ul className="at-a-glance-list">
              {overviewStats.map((stat) => (
                <li key={stat.label}>
                  <button
                    type="button"
                    className="border-0 bg-transparent p-0 text-left text-[14px] text-mint hover:underline"
                    onClick={() => onNavigate?.(stat.go, stat.extra)}
                  >
                    <b className="text-ink">{stat.value}</b> {stat.label.toLowerCase()}
                  </button>
                </li>
              ))}
            </ul>
          </Postbox>

          <Postbox title="Top stories">
            <p className="m-0 mb-3 text-ink-secondary">Most opened articles, ranked by views.</p>
            <table className="wp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Story</th>
                  <th>Section</th>
                  <th className="text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {topStories.length ? (
                  topStories.map((story, index) => (
                    <tr key={story.id}>
                      <td className="w-10 text-ink-tertiary">{String(index + 1).padStart(2, '0')}</td>
                      <td>
                        <Link
                          href={postUrl({ id: story.id, title: story.title })}
                          className="row-title"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {story.title}
                        </Link>
                      </td>
                      <td className="text-ink-secondary">{story.bucket || 'News'}</td>
                      <td className="text-right tabular-nums">{formatCount(story.views)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState>No story views recorded yet.</EmptyState>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="mb-0 mt-3">
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-mint"
                onClick={() => onNavigate?.('analytics')}
              >
                View analytics
              </button>
            </p>
          </Postbox>
        </div>

        <div>
          {dash.showGrowth ? (
            <Postbox title="Posts">
              {!isAuthor ? (
                <fieldset className="m-0 mb-3 border-0 p-0">
                  <legend className="sr-only">Post source</legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
                    {[
                      { id: 'all', label: 'Combined posts' },
                      { id: 'bot', label: 'Bot posts' },
                      { id: 'editorial', label: 'Non-bot posts' },
                    ].map((opt) => (
                      <label key={opt.id} className="inline-flex cursor-pointer items-center gap-1.5 text-ink">
                        <input
                          type="radio"
                          name="dash-posts-source"
                          value={opt.id}
                          checked={postsSource === opt.id}
                          onChange={() => onPostsSourceChange?.(opt.id)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
              <p className="mt-0 mb-3 text-[14px]">
                <b className="text-[18px] font-normal tabular-nums">{shownGrowth}</b>
                {' '}
                {postsSource === 'bot'
                  ? 'bot posts published in the last 30 days'
                  : postsSource === 'editorial'
                    ? 'non-bot posts published in the last 30 days'
                    : 'published in the last 30 days'}
                {growthDelta != null && Number.isFinite(growthDelta) ? (
                  <span className="text-ink-secondary">
                    {' '}
                    ({growthDelta > 0 ? '+' : ''}
                    {growthDelta}% vs previous)
                  </span>
                ) : null}
              </p>
              <table className="wp-table" aria-label="Posts published by month">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="w-[52%]"> </th>
                    <th className="text-right">Posts</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <MonthChartRow
                      key={m.key || m.label}
                      label={m.label}
                      count={Number(m.count) || 0}
                      max={maxMonth}
                    />
                  ))}
                </tbody>
              </table>
            </Postbox>
          ) : (
            <Postbox title="Your desk">
              <p className="m-0 text-ink-secondary">
                Write and save drafts. Send a story to Review when it is ready. An editor publishes it.
              </p>
            </Postbox>
          )}

          {dash.showCommentsTrend ? (
            <Postbox title="Comments">
              {trendingHint ? (
                <p className="m-0 text-ink-secondary">{trendingHint}</p>
              ) : trends.length ? (
                <ul className="m-0 list-none p-0">
                  {trends.slice(0, 6).map((c) => (
                    <li key={c.id} className="border-b border-line py-2 last:border-0">
                      <div className="flex justify-between gap-2">
                        <span className="truncate font-medium">{c.postTitle || c.postId}</span>
                        <span className="shrink-0 text-ink-secondary">+{c.likes || 0}</span>
                      </div>
                      <p className="m-0 line-clamp-2 text-[12px] text-ink-secondary">
                        {c.name || 'Anonymous'}: {c.commentPreview || ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-ink-secondary">No comments yet.</p>
              )}
            </Postbox>
          ) : null}

          <Postbox title="Quick Draft">
            <p className="m-0 mb-3 text-ink-secondary">Start a new article in the block editor.</p>
            <a href="/admin/post" className="button-primary inline-flex min-h-[30px] items-center px-2.5 no-underline">
              Create draft
            </a>
          </Postbox>
        </div>
      </div>
    </div>
  );
}
