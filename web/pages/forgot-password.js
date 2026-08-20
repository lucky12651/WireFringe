import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { safeNextPath } from '../lib/utils';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const next = safeNextPath(router.query?.next, '');

  useEffect(() => {
    if (!router.isReady) return;
    const qs = new URLSearchParams();
    if (next) qs.set('next', next);
    qs.set('view', 'forgot');
    router.replace(`/login?${qs.toString()}`);
  }, [next, router, router.isReady]);

  return null;
}
