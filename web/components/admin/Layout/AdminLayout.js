import React, { useState } from 'react';
import Head from 'next/head';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { tw } from '../../../lib/tw';

export function AdminLayout({
  children,
  me,
  isAuthed,
  activeView,
  onNavigate,
  onLogout,
  pendingCommentsCount,
  unreadContactCount,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Wirefringe – Admin</title>
      </Head>

      <div className={`${tw.pageShellAdmin} flex h-screen flex-col`}>
        <TopBar me={me} onLogout={onLogout} onOpenMenu={() => setMenuOpen(true)} />
        <div className={tw.adminShell}>
          <Sidebar
            me={me}
            isAuthed={isAuthed}
            activeView={activeView}
            onNavigate={(id) => {
              setMenuOpen(false);
              onNavigate(id);
            }}
            onLogout={onLogout}
            pendingCommentsCount={pendingCommentsCount}
            unreadContactCount={unreadContactCount}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
          />

          <div className={tw.adminContent} aria-label="Admin content">
            <div className={tw.adminContentInner}>{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
