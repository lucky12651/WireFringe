import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import { newsroomApi } from '../lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = String(router.query.token || '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await newsroomApi.resetPassword(token, password);
      setStatus('Password updated. You can sign in now.');
    } catch (err) {
      setError(err.message || 'Reset failed.');
    }
  };

  return (
    <Layout title="Set a new password">
      <div className="max-w-[420px] mx-auto px-5 py-16">
        <h1 className="text-[28px] font-extrabold">New password</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 mt-6">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="h-11 px-3 border border-line bg-bg-elevated text-ink"
          />
          <button type="submit" className="h-11 bg-mint text-black border-0 font-semibold" disabled={!token}>
            Update password
          </button>
        </form>
        {status ? <p className="text-mint text-sm mt-4">{status}</p> : null}
        {error ? <p className="text-[#c0392b] text-sm mt-4">{error}</p> : null}
        <p className="mt-6">
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </Layout>
  );
}
