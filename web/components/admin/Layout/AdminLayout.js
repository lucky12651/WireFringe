import React from 'react';
import Head from 'next/head';
import { Sidebar } from './Sidebar';

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
        <title>Coffee n Blog – Admin</title>
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
            {children}
          </main>
        </div>

        
      </div>
    </>
  );
}
