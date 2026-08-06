import React from 'react';
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
}) {
  return (
    <>
      <Head>
        <title>Wirefringe – Admin</title>
      </Head>

      <div className={tw.pageShellAdmin}>
        <div className="admin-xai-noise" aria-hidden="true" />
        <div className={tw.adminShell}>
          <Sidebar
            me={me}
            isAuthed={isAuthed}
            activeView={activeView}
            onNavigate={onNavigate}
            onLogout={onLogout}
            pendingCommentsCount={pendingCommentsCount}
          />

          <main className={tw.adminContent} aria-label="Admin content">
            <div className={tw.adminContentInner}>
              <TopBar activeView={activeView} />
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
