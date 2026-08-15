import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import { newsroomApi } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const out = await newsroomApi.forgotPassword(email.trim());
      setStatus(
        out.resetUrl
          ? `Dev reset link: ${out.resetUrl}`
          : 'If that account exists, a reset link was created. Check with an admin if you do not get email yet.'
      );
    } catch (err) {
      setError(err.message || 'Could not start reset.');
    }
  };

  return (
    <Layout title="Forgot password">
      <div className="max-w-[420px] mx-auto px-5 py-16">
        <h1 className="text-[28px] font-extrabold">Reset password</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 mt-6">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 px-3 border border-line bg-bg-elevated text-ink"
          />
          <button type="submit" className="h-11 bg-mint text-black border-0 font-semibold">
            Send reset link
          </button>
        </form>
        {status ? <p className="text-mint text-sm mt-4 break-all">{status}</p> : null}
        {error ? <p className="text-[#c0392b] text-sm mt-4">{error}</p> : null}
        <p className="mt-6">
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </Layout>
  );
}
