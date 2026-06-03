import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { initTheme } from '../lib/theme';
import { useAuth } from '../hooks';
import { SignupPage } from '../components/admin/Login';

export default function SignupPageContainer() {
  const router = useRouter();
  const auth = useAuth();
  const { isAuthed, isInitialLoading } = auth;

  useEffect(() => {
    initTheme({ defaultTheme: 'dark' });
  }, []);

  useEffect(() => {
    if (isAuthed) {
      router.replace('/');
    }
  }, [isAuthed, router]);

  const handleSignup = async (username, password, displayName) => {
    const result = await auth.signup(username, password, displayName);
    if (result.success) {
      router.push('/');
    }
    return result;
  };

  if (isAuthed || isInitialLoading) return null;

  return (
    <SignupPage 
      onSignup={handleSignup} 
      onToggleMode={() => router.push('/login')} 
      error={auth.error} 
    />
  );
}
