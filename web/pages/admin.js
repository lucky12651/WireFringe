import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { initTheme } from '../lib/theme';
import { fetcher } from '../lib/api';
import { pctChange } from '../lib/utils';
import { useAuth, usePosts, useCategories, useUsers, useComments, useMedia } from '../hooks';
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
  const { me, isAuthed, isLoading, isInitialLoading, canManageUsers, canModerateComments, canViewPendingCommentsCount } = auth;

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

  // Initialize theme and auth on mount
  useEffect(() => {
    initTheme({ defaultTheme: 'dark' });
  }, []);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (!isAuthed || isInitialLoading) return;

    (async () => {
      await Promise.all([
        posts.refreshPosts(),
        media.refreshMedia(),
        comments.refreshTrendingComments(),
        comments.refreshPendingCount(),
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
      comments.refreshTrendingComments();
      comments.refreshPendingCount();
      categories.refreshCategoriesWithCounts();
      posts.refreshRecentCache();
    }
    if (activeView === 'comments') {
      comments.refreshComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, isAuthed]);

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

  // Render the active view (only called when authenticated)
  const renderView = () => {
    if (isInitialLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="loader">Loading...</div>
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
            me={me}
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
            page={posts.page}
            onPageChange={posts.setPage}
            limit={posts.limit}
            isLoading={posts.isLoading}
            queue={posts.queue}
            refreshQueue={posts.refreshQueue}
          />
        );

      case 'categories':
        return (
          <CategoriesView
            categoriesWithCounts={categories.categoriesWithCounts}
            onCreate={categories.createCategory}
            onDelete={categories.deleteCategory}
            canManageUsers={canManageUsers}
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
            onRefresh={comments.refreshComments}
            onApprove={comments.approveComment}
            onDisapprove={comments.disapproveComment}
            onDelete={comments.deleteComment}
            canModerateComments={canModerateComments}
            canManageUsers={canManageUsers}
          />
        );

      case 'users':
        return (
          <UsersView
            users={users.users}
            onCreate={users.createUser}
            onDelete={users.deleteUser}
            canManageUsers={canManageUsers}
          />
        );

      case 'settings':
        return (
          <SettingsView
            me={me}
            onUpdateProfile={auth.updateProfile}
            onUploadPhoto={auth.uploadPhoto}
            onChangePassword={auth.changePassword}
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111' }}>
        <div className="loader"></div>
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
    >
      {renderView()}
    </AdminLayout>
  );
}
