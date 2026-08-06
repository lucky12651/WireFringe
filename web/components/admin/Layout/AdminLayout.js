import React from 'react';
import Head from 'next/head';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

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

      <div className="page-shell page-shell-admin">
        <div className="admin-shell">
          <Sidebar
            me={me}
            isAuthed={isAuthed}
            activeView={activeView}
            onNavigate={onNavigate}
            onLogout={onLogout}
            pendingCommentsCount={pendingCommentsCount}
          />

          <main className="admin-content" aria-label="Admin content">
            <div className="admin-content-inner">
              <TopBar activeView={activeView} />
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
