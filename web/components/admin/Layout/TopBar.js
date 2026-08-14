import React from 'react';

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  posts: 'Posts',
  categories: 'Categories',
  media: 'Media',
  comments: 'Comments',
  users: 'Users',
  settings: 'Settings',
  logs: 'News Bot',
  adsense: 'AdSense',
  bot: 'News Bot',
};

export function TopBar({ activeView }) {
  const title = VIEW_TITLES[activeView] || (
    activeView
      ? activeView.charAt(0).toUpperCase() + activeView.slice(1)
      : 'Dashboard'
  );

  return (
    <header className="flex items-end justify-between gap-4 mb-8 pb-5 border-b border-line">
      <div>
        <p className="text-[11px] font-medium tracking-[0.16em] uppercase text-ink-muted m-0 mb-2">
          Control center
        </p>
        <h1 className="text-[30px] max-[600px]:text-[22px] font-semibold tracking-[-0.03em] text-ink m-0 leading-none">
          {title}
        </h1>
      </div>
      <a
        href="/"
        className="text-[12px] font-medium tracking-wide text-ink-secondary no-underline py-2.5 px-4 border border-line rounded-full whitespace-nowrap transition-all duration-200 hover:text-ink hover:border-ink/30"
        target="_blank"
        rel="noreferrer"
      >
        View site →
      </a>
    </header>
  );
}
