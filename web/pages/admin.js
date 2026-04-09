import { useEffect, useState } from 'react';
import { initTheme } from '../lib/theme';
import { useAuth, usePosts, useCategories, useUsers, useComments, useMedia } from '../hooks';
import { AdminLayout } from '../components/admin/Layout';
import { LoginPage } from '../components/admin/Login';
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
  const [activeView, setActiveView] = useState('dashboard');

  // Initialize hooks
  const auth = useAuth();
  const posts = usePosts();
  const categories = useCategories();
  const comments = useComments();
  const media = useMedia();
  const users = useUsers(posts.posts);

  const { me, isAuthed, canManageUsers, canModerateComments, canViewPendingCommentsCount } = auth;

  // Initialize theme and auth on mount
  useEffect(() => {
    (async () => {
      initTheme({ defaultTheme: 'dark' });
      const user = await auth.refreshMe();
      if (!user) return;

      // Load initial data
      await Promise.all([
        posts.refreshPosts(),
        media.refreshMedia(),
        comments.refreshTrendingComments(),
        comments.refreshPendingCount(),
        categories.refreshCategoriesWithCounts(),
      ]);

      if (user.role === 'admin') {
        await users.refreshUsers();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh data when view changes
  useEffect(() => {
    if (!isAuthed) return;

    if (activeView === 'dashboard') {
      comments.refreshTrendingComments();
      comments.refreshPendingCount();
      categories.refreshCategoriesWithCounts();
    }
    if (activeView === 'comments') {
      comments.refreshComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, isAuthed]);

  const handleLogin = async (username, password) => {
    const result = await auth.login(username, password);
    if (result.success) {
      setActiveView('dashboard');
      // Load data after login
      await Promise.all([
        posts.refreshPosts(),
        media.refreshMedia(),
        comments.refreshTrendingComments(),
        categories.refreshCategoriesWithCounts(),
      ]);
      if (result.user?.role === 'admin') {
        await users.refreshUsers();
      }
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
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            posts={posts.posts}
            postsCount={posts.postsCount}
            categoriesCount={categories.categoriesWithCounts.length}
            mediaCount={media.mediaCount}
            pendingCommentsCount={comments.pendingCount}
            canViewPendingCommentsCount={canViewPendingCommentsCount}
            postGrowth30={posts.postGrowth30}
            postsByMonth={posts.postsByMonth}
            trendingComments={comments.trendingComments}
            trendingHint={comments.error}
            memberStats={users.memberStats}
            latestPosts={posts.latestPosts}
            me={me}
          />
        );

      case 'posts':
        return (
          <PostsView
            posts={posts.sortedPosts}
            postsCount={posts.postsCount}
            onPublish={posts.publishPost}
            me={me}
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

  // When not authenticated, render login page without the admin layout
  if (!isAuthed) {
    return <LoginPage onLogin={handleLogin} error={auth.error} />;
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
