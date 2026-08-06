import React from 'react';

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  posts: 'Posts',
  categories: 'Categories',
  media: 'Media',
  comments: 'Comments',
  users: 'Users',
  settings: 'Settings',
  logs: 'System Logs',
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
    <header className="flex items-end justify-between gap-4 mb-7 pb-4 border-b border-line-dim">
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase text-mint m-0 mb-1.5">
          Admin
        </p>
        <h1 className="text-[28px] max-[600px]:text-[22px] font-extrabold tracking-tight text-white m-0 leading-tight">
          {title}
        </h1>
      </div>
      <a
        href="/"
        className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase text-[#888] no-underline py-2 px-3 border border-line rounded-sm whitespace-nowrap transition-colors duration-200 hover:text-mint hover:border-mint hover:bg-mint/10"
        target="_blank"
        rel="noreferrer"
      >
        View site →
      </a>
    </header>
  );
}
