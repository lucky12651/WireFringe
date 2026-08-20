import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks';
import { LoginPage } from '../components/admin/Login';
import { newsroomApi } from '../lib/api';
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

  const handleLogin2fa = async (ticket, code) => {
    const result = await auth.login2fa(ticket, code);
    if (result.success) {
      router.push(destinationAfterAuth(router, result.user));
    }
    return result;
  };

  const handleForgot = async (email) => {
    try {
      const out = await newsroomApi.forgotPassword(email);
      return { success: true, resetUrl: out?.resetUrl };
    } catch (err) {
      return { success: false, error: err?.message || 'Could not start reset.' };
    }
  };

  const next = safeNextPath(router.query?.next, '');
  const initialPanel = router.query?.view === 'forgot' ? 'forgot' : 'login';

  if (isAuthed || isInitialLoading) return null;

  return (
    <LoginPage
      key={initialPanel}
      initialPanel={initialPanel}
      onLogin={handleLogin}
      onLogin2fa={handleLogin2fa}
      onForgot={handleForgot}
      onToggleMode={() => router.push(`/signup${nextQuery(next)}`)}
      error={auth.error}
    />
  );
}
