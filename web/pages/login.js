import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks';
import { LoginPage } from '../components/admin/Login';
import { nextQuery, safeNextPath } from '../lib/utils';

function destinationAfterAuth(router, user) {
  const next = safeNextPath(router.query?.next, '');
  if (next) return next;
  return user?.role === 'user' ? '/' : '/admin';
}

export default function LoginPageContainer() {
  const router = useRouter();
  const auth = useAuth();
  const { isAuthed, me, isInitialLoading } = auth;

  useEffect(() => {
    if (!router.isReady || !isAuthed) return;
    router.replace(destinationAfterAuth(router, me));
  }, [isAuthed, me, router, router.isReady, router.query?.next]);

  const handleLogin = async (username, password) => {
    const result = await auth.login(username, password);
    if (result.success) {
      router.push(destinationAfterAuth(router, result.user));
    }
    return result;
  };

  const next = safeNextPath(router.query?.next, '');

  if (isAuthed || isInitialLoading) return null;

  return (
    <LoginPage
      onLogin={handleLogin}
      onToggleMode={() => router.push(`/signup${nextQuery(next)}`)}
      error={auth.error}
    />
  );
}
