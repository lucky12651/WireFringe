import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import { pctChange } from '../lib/utils';
import {
  useAuth,
  usePosts,
  useCategories,
  useUsers,
  useComments,
  useMedia,
  useLogs,
  useAdsenseSettings,
  useBotSettings,
  useContact,
} from '../hooks';
import { AdminLayout } from '../components/admin/Layout';
import { LoginPage, SignupPage } from '../components/admin/Login';
import {
  DashboardView,
  PostsView,
  CategoriesView,
  MediaView,
  CommentsView,
  UsersView,
  SettingsView,
  AdsenseView,
  BotView,
  ContactView,
  FrontpageView,
  NewsletterAdminView,
  TipsView,
  AnalyticsView,
  RedirectsView,
  MastheadView,
} from '../components/admin/views';

export default function AdminPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // Initialize hooks
  const auth = useAuth();
  const posts = usePosts();
  const categories = useCategories();
  const comments = useComments();
  const media = useMedia();
  const logs = useLogs();
  const adsense = useAdsenseSettings();
  const bot = useBotSettings();
  const contact = useContact();
  const { me, isAuthed, isLoading, isInitialLoading, access, canManageUsers, canModerateComments, canViewPendingCommentsCount } = auth;

  // Correct dashboard stats: don't derive growth/by-member/monthly counts from the paginated posts page.
  const shouldLoadDashboardStats = isAuthed && activeView === 'dashboard';
  const { data: postsByMemberCounts } = useSWR(
    shouldLoadDashboardStats ? '/api/admin/stats/posts-by-member' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: postGrowthCounts } = useSWR(
    shouldLoadDashboardStats ? '/api/admin/stats/post-growth?days=30' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: postsByMonthCounts } = useSWR(
    shouldLoadDashboardStats ? '/api/admin/stats/posts-by-month?months=6' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const dashboardPostGrowth30 = useMemo(() => {
    const current = Number(postGrowthCounts?.current);
    const prev = Number(postGrowthCounts?.prev);
    if (!Number.isFinite(current) || !Number.isFinite(prev)) return null;
    return { current, prev, delta: pctChange(current, prev) };
  }, [postGrowthCounts]);

  const dashboardPostsByMonth = useMemo(() => {
    if (!Array.isArray(postsByMonthCounts)) return null;
    return postsByMonthCounts.map((m) => {
      const key = String(m?.key || '').trim();
      const rawCount = Number(m?.count || 0);
      const count = Number.isFinite(rawCount) ? rawCount : 0;

      const [yStr, mStr] = String(key).split('-');
      const year = Number(yStr);
      const monthIndex = Number(mStr) - 1;
      const label =
        Number.isFinite(year) && monthIndex >= 0 && monthIndex <= 11
          ? new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' })
          : key;

      return { key, label, count };
    });
  }, [postsByMonthCounts]);

  const creatorCountsOverride = useMemo(() => {
    if (!Array.isArray(postsByMemberCounts)) return null;
    const map = new Map();
    for (const row of postsByMemberCounts) {
      const username = String(row?.username || '').trim();
      if (!username) continue;
      const count = Number(row?.count || 0);
      map.set(username, Number.isFinite(count) ? count : 0);
    }
    return map;
  }, [postsByMemberCounts]);

  const users = useUsers(posts.posts, creatorCountsOverride);

  // Restrict access for normal users
  useEffect(() => {
    if (isAuthed && me?.role === 'user') {
      router.replace('/');
    }
  }, [isAuthed, me, router]);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (!isAuthed || isInitialLoading) return;

    (async () => {
      await Promise.all([
        posts.refreshPosts(),
        media.refreshMedia(),
        comments.refreshTrendingComments(),
        comments.refreshPendingCount(),
        contact.refreshUnreadCount(),
        categories.refreshCategoriesWithCounts(),
      ]);

      if (me?.role === 'admin') {
        await users.refreshUsers();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, isInitialLoading]);

  // Refresh data when view changes
  useEffect(() => {
    if (!isAuthed) return;

    if (activeView === 'dashboard') {
      if (posts.source !== 'editorial') posts.setSource('editorial');
      posts.resetFilters?.();
      comments.refreshTrendingComments();
      comments.refreshPendingCount();
      categories.refreshCategoriesWithCounts();
      if (access.canProcessQueue) posts.refreshQueue();
      if (access.canSeeBotCache) posts.refreshRecentCache();
    }
    if ((activeView === 'bot' || activeView === 'logs') && access.canRunBot) {
      posts.refreshQueue();
      posts.refreshRecentCache();
      bot.refresh();
      logs.refreshLogs();
    }
    if (activeView === 'comments') {
      comments.refreshComments();
      if (access.canSeeReports) comments.refreshReports();
    }
    if (activeView === 'contact') {
      contact.refreshMessages();
      contact.refreshUnreadCount();
    }
    if (activeView === 'users' && me?.role === 'admin') {
      users.refreshUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, isAuthed, access.canProcessQueue, access.canSeeBotCache, access.canSeeReports, access.canRunBot]);

  const handleLogin = async (username, password) => {
    const result = await auth.login(username, password);
    if (result.success) {
      // Redirect normal users to home
      if (result.user?.role === 'user') {
        router.push('/');
        return result;
      }

      setActiveView('dashboard');
      // Load data after login
      await Promise.all([
        posts.refreshPosts(),
        media.refreshMedia(),
        comments.refreshTrendingComments(),
        categories.refreshCategoriesWithCounts(),
      ]);
      if (result.user?.role === 'admin' || result.user?.role === 'editor') {
        await users.refreshUsers();
      }
    }
    return result;
  };

  const handleSignup = async (username, password, displayName) => {
    const result = await auth.signup(username, password, displayName);
    if (result.success) {
      // Signups are always normal users, redirect to home
      router.push('/');
    }
    return result;
  };

  const handleLogout = async () => {
    await auth.logout();
    posts.setPosts([]);
    users.setUsers([]);
    media.setMedia([]);
    comments.setPendingCount(0);
    setActiveView('dashboard');
  };

  useEffect(() => {
    if (!isAuthed || !me) return;
    if (!access.canAccessView(activeView) && activeView !== 'settings') {
      setActiveView('dashboard');
    }
  }, [activeView, isAuthed, me, access]);

  // Render the active view (only called when authenticated)
  const renderView = () => {
    if (isInitialLoading) {
      return (
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="w-7 h-7 rounded-full border-2 border-line border-t-mint animate-spin" aria-label="Loading" />
        </div>
      );
    }
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            posts={posts.posts}
            postsCount={posts.postsCount}
            categoriesCount={categories.categoriesWithCounts.length}
            queueCount={posts.queue.length}
            pendingCommentsCount={comments.pendingCount}
            canViewPendingCommentsCount={canViewPendingCommentsCount}
            postGrowth30={dashboardPostGrowth30 || posts.postGrowth30}
            postsByMonth={dashboardPostsByMonth || posts.postsByMonth}
            trendingComments={comments.trendingComments}
            trendingHint={comments.error}
            memberStats={users.memberStats}
            latestPosts={posts.latestPosts}
            recentCache={posts.recentCache}
            mediaCount={media.mediaCount}
            me={me}
            access={access}
            onNavigate={setActiveView}
          />
        );

      case 'posts':
        return (
          <PostsView
            posts={posts.sortedPosts}
            postsCount={posts.postsCount}
            onPublish={posts.publishPost}
            onDelete={posts.deletePost}
            onProcessQueue={posts.processQueueItem}
            onDeleteQueue={posts.deleteQueueItem}
            onBulkDeleteQueue={posts.bulkDeleteQueueItems}
            onBulkProcessQueue={posts.bulkProcessQueueItems}
            onRefreshFeeds={posts.refreshQueueFeeds}
            me={me}
            access={access}
            page={posts.page}
            onPageChange={posts.setPage}
            limit={posts.limit}
            isLoading={posts.isLoading}
            queue={posts.queue}
            refreshQueue={posts.refreshQueue}
            source={posts.source}
            onSourceChange={posts.setSource}
            filters={posts.filters}
            onFiltersChange={posts.setFilters}
          />
        );

      case 'categories':
        if (!access.canAccessView('categories')) return null;
        return (
          <CategoriesView
            categoriesWithCounts={categories.categoriesWithCounts}
            onCreate={categories.createCategory}
            onDelete={categories.deleteCategory}
            canManageUsers={access.canManageCategories}
          />
        );

      case 'media':
        return (
          <MediaView
            media={media.media}
            mediaCount={media.mediaCount}
            onUpload={media.uploadMedia}
            onRefresh={media.refreshMedia}
          />
        );

      case 'comments':
        return (
          <CommentsView
            comments={comments.comments}
            reports={comments.reports}
            loadError={comments.error}
            onRefresh={comments.refreshComments}
            onApprove={comments.approveComment}
            onDisapprove={comments.disapproveComment}
            onDelete={comments.deleteComment}
            onDismissReport={comments.dismissReport}
            canModerateComments={canModerateComments}
            canManageUsers={canManageUsers}
          />
        );

      case 'contact':
        if (!access.canAccessView('contact')) return null;
        return (
          <ContactView
            messages={contact.messages}
            loadError={contact.error}
            onMarkRead={contact.markRead}
            onDelete={contact.deleteMessage}
          />
        );

      case 'tips':
        if (!access.canAccessView('tips')) return null;
        return <TipsView />;

      case 'frontpage':
        if (!access.canAccessView('frontpage')) return null;
        return <FrontpageView />;

      case 'newsletter':
        if (!access.canAccessView('newsletter')) return null;
        return <NewsletterAdminView />;

      case 'analytics':
        if (!access.canAccessView('analytics')) return null;
        return <AnalyticsView />;

      case 'redirects':
        if (!access.canAccessView('redirects')) return null;
        return <RedirectsView />;

      case 'masthead':
        if (!access.canAccessView('masthead')) return null;
        return <MastheadView />;

      case 'users':
        if (!access.canManageUsers) return null;
        return (
          <UsersView
            users={users.users}
            onCreate={users.createUser}
            onDelete={users.deleteUser}
            onSetPassword={users.setUserPassword}
            onSetRole={users.setUserRole}
            onTransferPosts={users.transferPosts}
            onClaimOrphan={users.claimOrphan}
            onReassignOrphan={users.reassignOrphan}
            onDeleteOrphanPosts={users.deleteOrphanPosts}
            canManageUsers={canManageUsers}
          />
        );

      case 'settings':
        return (
          <SettingsView
            me={me}
            onUpdateProfile={auth.updateProfile}
            onUploadPhoto={auth.uploadPhoto}
            onUpdateBrandByline={auth.updateBrandByline}
            onChangePassword={auth.changePassword}
          />
        );

      case 'logs':
        // System Logs is a tab inside News Bot (legacy nav / deep links)
        if (!access.canRunBot) return null;
        return (
          <BotView
            settings={bot.settings}
            isLoading={bot.isLoading}
            onRefresh={bot.refresh}
            onSave={bot.save}
            onHideArticles={bot.hideArticles}
            onUnhideArticles={bot.unhideArticles}
            queueCount={posts.queue.length}
            recentCache={posts.recentCache}
            logs={logs.logs}
            onRefreshLogs={logs.refreshLogs}
            logsLoading={logs.isLoading}
            initialTab="logs"
          />
        );

      case 'adsense':
        if (!access.canManageAds) return null;
        return (
          <AdsenseView
            settings={adsense.settings}
            isLoading={adsense.isLoading}
            onRefresh={adsense.refresh}
            onSave={adsense.save}
            onClear={adsense.clear}
          />
        );

      case 'bot':
        if (!access.canRunBot) return null;
        return (
          <BotView
            settings={bot.settings}
            isLoading={bot.isLoading}
            onRefresh={bot.refresh}
            onSave={bot.save}
            onHideArticles={bot.hideArticles}
            onUnhideArticles={bot.unhideArticles}
            queueCount={posts.queue.length}
            recentCache={posts.recentCache}
            logs={logs.logs}
            onRefreshLogs={logs.refreshLogs}
            logsLoading={logs.isLoading}
            initialTab="engine"
          />
        );

      default:
        return null;
    }
  };

  // When not authenticated, redirect to login
  if (!isAuthed && !isInitialLoading) {
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return null;
  }

  // Show loading state while checking auth
  if (isInitialLoading) {
    return (
      <div className="admin-xai grid min-h-screen place-items-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="font-serif text-xl tracking-tight text-ink">
            Wire<span className="admin-brand-f italic font-extrabold">F</span>ringe
          </span>
          <p className="m-0 text-[13px] text-ink-secondary">Loading admin…</p>
        </div>
      </div>
    );
  }

  // Double guard: If user is authenticated but role is 'user', don't render anything while redirecting
  if (me?.role === 'user') {
    return null;
  }

  return (
    <AdminLayout
      me={me}
      isAuthed={isAuthed}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={handleLogout}
      pendingCommentsCount={comments.pendingCount}
      unreadContactCount={contact.unreadCount}
    >
      {renderView()}
    </AdminLayout>
  );
}
