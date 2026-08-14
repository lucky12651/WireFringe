import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks';
import { SignupPage } from '../components/admin/Login';
import { nextQuery, safeNextPath } from '../lib/utils';

export default function SignupPageContainer() {
  const router = useRouter();
  const auth = useAuth();
  const { isAuthed, isInitialLoading } = auth;
  const next = safeNextPath(router.query?.next, '/');

  useEffect(() => {
    if (!router.isReady || !isAuthed) return;
    router.replace(next);
  }, [isAuthed, next, router, router.isReady]);

  const handleSignup = async (username, password, displayName) => {
    const result = await auth.signup(username, password, displayName);
    if (result.success) {
      router.push(next);
    }
    return result;
  };

  if (isAuthed || isInitialLoading) return null;

  return (
    <SignupPage
      onSignup={handleSignup}
      onToggleMode={() => router.push(`/login${nextQuery(next)}`)}
      error={auth.error}
    />
  );
}
