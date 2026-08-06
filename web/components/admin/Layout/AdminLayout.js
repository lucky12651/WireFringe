import React from 'react';
import Head from 'next/head';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '../../../lib/utils';
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
        <div className={tw.adminShell}>
          <Sidebar
            me={me}
            isAuthed={isAuthed}
            activeView={activeView}
            onNavigate={onNavigate}
            onLogout={onLogout}
            pendingCommentsCount={pendingCommentsCount}
          />

          <main
            className={cn(
              tw.adminContent,
              activeView === 'adsense' && 'max-w-none'
            )}
            aria-label="Admin content"
          >
            <div
              className={cn(
                tw.adminContentInner,
                activeView === 'adsense' && 'max-w-none'
              )}
            >
              <TopBar activeView={activeView} />
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
