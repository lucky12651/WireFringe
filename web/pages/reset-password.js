import { useState } from 'react';
import { useRouter } from 'next/router';
import { newsroomApi } from '../lib/api';
import { AuthShell, authInputClass, authSubmitClass } from '../components/admin/Login/AuthShell';

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = String(router.query.token || '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await newsroomApi.resetPassword(token, password);
      setStatus('Password updated. You can sign in now.');
    } catch (err) {
      setError(err.message || 'Reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="m-0 mb-3 text-center text-[26px] max-sm:text-[22px] font-extrabold leading-tight tracking-tight text-ink">
        New
        <br />
        password
      </h1>
      <p className="m-0 mb-6 text-center text-xs leading-normal text-ink-secondary">
        Choose a new password for your Wirefringe account.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reset-password"
            className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-tertiary"
          >
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className={authInputClass}
          />
        </div>
        {status ? (
          <div className="bg-[rgba(0,200,150,0.08)] border border-[rgba(0,200,150,0.28)] text-ink py-2.5 px-3 rounded-sm text-[13px]">
            {status}
          </div>
        ) : null}
        {error ? (
          <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.28)] text-[#c0392b] py-2.5 px-3 rounded-sm text-[13px]">
            {error}
          </div>
        ) : null}
        <button type="submit" className={authSubmitClass} disabled={!token || isLoading}>
          {isLoading ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <p className="mt-[18px] mb-0 text-center text-sm text-ink-secondary">
        <button
          type="button"
          className="border-none bg-transparent p-0 text-mint font-bold cursor-pointer underline underline-offset-2 hover:text-mint-hover"
          onClick={() => router.push('/login')}
        >
          Back to sign in
        </button>
      </p>
    </AuthShell>
  );
}
