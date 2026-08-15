import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import { newsroomApi } from '../lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const token = String(router.query.token || '');
  const [status, setStatus] = useState('Checking…');

  useEffect(() => {
    if (!router.isReady) return;
    if (!token) {
      setStatus('Missing verification token.');
      return;
    }
    newsroomApi
      .verifyEmail(token)
      .then(() => setStatus('Email verified. Thank you.'))
      .catch((err) => setStatus(err.message || 'Could not verify that link.'));
  }, [router.isReady, token]);

  return (
    <Layout title="Verify email">
      <div className="max-w-[480px] mx-auto px-5 py-16">
        <h1 className="text-[28px] font-extrabold">Verify email</h1>
        <p className="text-ink-secondary">{status}</p>
        <Link href="/account">Go to your account</Link>
      </div>
    </Layout>
  );
}
