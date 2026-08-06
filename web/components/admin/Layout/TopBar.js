import React from 'react';
import styles from './TopBar.module.css';

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
    <header className={styles.topBar}>
      <div>
        <p className={styles.kicker}>Admin</p>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <a href="/" className={styles.viewSite} target="_blank" rel="noreferrer">
        View site →
      </a>
    </header>
  );
}
