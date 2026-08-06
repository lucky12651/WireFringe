import React from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';

export function SidebarHeader({ isAuthed, me, collapsed }) {
  return (
    <div className={styles.header}>
      <div className={styles.brand}>
        <Link
          href="/"
          className={styles.brandMark}
          title="Wirefringe"
          aria-label="Wirefringe home"
        >
          <img
            src="/logo.png"
            alt="Wirefringe"
            className={styles.brandLogoImg}
            width={32}
            height={32}
          />
        </Link>
        {!collapsed ? (
          <Link href="/" className={styles.brandText} title="Wirefringe">
            Wirefringe
          </Link>
        ) : null}
      </div>
    </div>
  );
}
