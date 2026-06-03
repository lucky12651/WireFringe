import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { initTheme } from '../lib/theme';
import { fetcher } from '../lib/api';
import { useAuth, usePosts, useCategories, useUsers, useComments, useMedia } from '../hooks';
import { LoginPage } from '../components/admin/Login';

export default function LoginPageContainer() {
  const router = useRouter();
  const auth = useAuth();
  const posts = usePosts();
  const categories = useCategories();
  const comments = useComments();
  const media = useMedia();
  const { isAuthed, me, isInitialLoading } = auth;

  const creatorCountsOverride = useMemo(() => {
    return new Map();
  }, []);

  const users = useUsers(posts.posts, creatorCountsOverride);

  useEffect(() => {
    initTheme({ defaultTheme: 'dark' });
  }, []);

  useEffect(() => {
    if (isAuthed) {
      if (me?.role === 'user') {
        router.replace('/');
      } else {
        router.replace('/admin');
      }
    }
  }, [isAuthed, me, router]);

  const handleLogin = async (username, password) => {
    const result = await auth.login(username, password);
    if (result.success) {
      if (result.user?.role === 'user') {
        router.push('/');
      } else {
        router.push('/admin');
      }
    }
    return result;
  };

  if (isAuthed || isInitialLoading) return null;

  return (
    <LoginPage 
      onLogin={handleLogin} 
      onToggleMode={() => router.push('/signup')} 
      error={auth.error} 
    />
  );
}
