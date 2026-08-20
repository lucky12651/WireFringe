import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { cn } from '../../../lib/utils';
import { fieldErrorsFromZod } from '../../../lib/formErrors';
import { AuthShell, authInputClass, authSubmitClass } from './AuthShell';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

const totpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit authenticator code'),
});

export function LoginPage({
  onLogin,
  onLogin2fa,
  onForgot,
  onToggleMode,
  error: serverError,
  initialPanel = 'login',
}) {
  const [panel, setPanel] = useState(initialPanel === 'forgot' ? 'forgot' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      loginSchema.parse({ email, password });
      setErrors({});
    } catch (err) {
      setErrors(fieldErrorsFromZod(err));
      return;
    }

    setIsLoading(true);
    const result = await onLogin(email.trim(), password, rememberMe);
    setIsLoading(false);

    if (result?.requires2fa && result.ticket) {
      setTicket(result.ticket);
      setCode('');
      setPanel('2fa');
      setErrors({});
      return;
    }

    if (!result?.success && result?.error) {
      setErrors({ form: result.error });
    }
  };

  const handle2faSubmit = async (e) => {
    e.preventDefault();
    try {
      totpSchema.parse({ code });
      setErrors({});
    } catch (err) {
      setErrors(fieldErrorsFromZod(err));
      return;
    }
    if (!onLogin2fa) {
      setErrors({ form: 'Authenticator sign-in is not available.' });
      return;
    }

    setIsLoading(true);
    const result = await onLogin2fa(ticket, code.trim());
    setIsLoading(false);

    if (!result?.success && result?.error) {
      setErrors({ form: result.error });
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      forgotSchema.parse({ email });
      setErrors({});
    } catch (err) {
      setErrors(fieldErrorsFromZod(err));
      return;
    }
    if (!onForgot) return;

    setIsLoading(true);
    setForgotStatus('');
    const result = await onForgot(email.trim());
    setIsLoading(false);

    if (result?.success) {
      setForgotStatus(
        result.resetUrl
          ? `If that account exists, use this reset link: ${result.resetUrl}`
          : 'If that account exists, a reset link was sent. Check your email.'
      );
      return;
    }
    setErrors({ form: result?.error || 'Could not start reset.' });
  };

  return (
    <AuthShell>
      {panel === '2fa' ? (
        <>
          <h1 className="m-0 mb-3 text-center text-[26px] max-sm:text-[22px] font-extrabold leading-tight tracking-tight text-ink">
            Authenticator
            <br />
            code
          </h1>
          <p className="m-0 mb-6 text-center text-xs leading-normal text-ink-secondary">
            Open your authenticator app and enter the 6-digit code for this account.
          </p>
          <form onSubmit={handle2faSubmit} className="flex flex-col gap-3.5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-totp"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-tertiary"
              >
                Authenticator code
              </label>
              <input
                id="login-totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className={cn(authInputClass, 'tracking-[0.35em] text-center', errors.code && 'border-[#ff6b6b]')}
              />
              {errors.code ? <span className="text-xs text-[#c0392b]">{errors.code}</span> : null}
            </div>
            {(errors.form || serverError) && (
              <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.28)] text-[#c0392b] py-2.5 px-3 rounded-sm text-[13px]">
                {errors.form || serverError}
              </div>
            )}
            <button type="submit" className={authSubmitClass} disabled={isLoading}>
              {isLoading ? 'Verifying…' : 'Verify and sign in'}
            </button>
          </form>
          <p className="mt-[18px] mb-0 text-center text-sm text-ink-secondary">
            <button
              type="button"
              className="border-none bg-transparent p-0 text-mint font-bold cursor-pointer underline underline-offset-2 hover:text-mint-hover"
              onClick={() => {
                setPanel('login');
                setTicket('');
                setCode('');
                setErrors({});
              }}
            >
              Back to sign in
            </button>
          </p>
        </>
      ) : panel === 'forgot' ? (
        <>
          <h1 className="m-0 mb-3 text-center text-[26px] max-sm:text-[22px] font-extrabold leading-tight tracking-tight text-ink">
            Forgot
            <br />
            password?
          </h1>
          <p className="m-0 mb-6 text-center text-xs leading-normal text-ink-secondary">
            Enter the email on your account. If it exists, we will send a reset link.
          </p>
          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3.5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="forgot-email"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-tertiary"
              >
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={cn(authInputClass, errors.email && 'border-[#ff6b6b]')}
              />
              {errors.email ? <span className="text-xs text-[#c0392b]">{errors.email}</span> : null}
            </div>
            {forgotStatus ? (
              <div className="bg-[rgba(0,200,150,0.08)] border border-[rgba(0,200,150,0.28)] text-ink py-2.5 px-3 rounded-sm text-[13px] break-all">
                {forgotStatus}
              </div>
            ) : null}
            {(errors.form || serverError) && !forgotStatus ? (
              <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.28)] text-[#c0392b] py-2.5 px-3 rounded-sm text-[13px]">
                {errors.form || serverError}
              </div>
            ) : null}
            <button type="submit" className={authSubmitClass} disabled={isLoading}>
              {isLoading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="mt-[18px] mb-0 text-center text-sm text-ink-secondary">
            Remembered it?{' '}
            <button
              type="button"
              className="border-none bg-transparent p-0 text-mint font-bold cursor-pointer underline underline-offset-2 hover:text-mint-hover"
              onClick={() => {
                setPanel('login');
                setForgotStatus('');
                setErrors({});
              }}
            >
              Sign in
            </button>
          </p>
        </>
      ) : (
        <>
          <h1 className="m-0 mb-3 text-center text-[26px] max-sm:text-[22px] font-extrabold leading-tight tracking-tight text-ink">
            Sign in or
            <br />
            create an account
          </h1>
          <p className="m-0 mb-6 text-center text-xs leading-normal text-ink-secondary [&_a]:text-mint [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-mint-hover">
            Your account is used to sign in to Wirefringe. By signing in you agree to our{' '}
            <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.
          </p>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-tertiary"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={cn(authInputClass, errors.email && 'border-[#ff6b6b]')}
              />
              {errors.email ? <span className="text-xs text-[#c0392b]">{errors.email}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-tertiary"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  autoComplete="current-password"
                  className={cn(authInputClass, 'pr-16', errors.password && 'border-[#ff6b6b]')}
                />
                <button
                  type="button"
                  className="absolute right-2 h-8 px-2.5 border-none bg-transparent text-ink-tertiary font-mono text-[11px] font-bold tracking-[0.04em] uppercase cursor-pointer hover:text-mint"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password ? <span className="text-xs text-[#c0392b]">{errors.password}</span> : null}
            </div>

            <label className="inline-flex items-center gap-2 text-[13px] text-ink-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-[15px] h-[15px] accent-mint"
              />
              <span>Remember me</span>
            </label>

            {(errors.form || serverError) && (
              <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.28)] text-[#c0392b] py-2.5 px-3 rounded-sm text-[13px]">
                {errors.form || serverError}
              </div>
            )}

            <button type="submit" className={authSubmitClass} disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-3 mb-0 text-center text-sm">
            <button
              type="button"
              className="border-none bg-transparent p-0 text-mint font-bold cursor-pointer underline underline-offset-2 hover:text-mint-hover"
              onClick={() => {
                setPanel('forgot');
                setForgotStatus('');
                setErrors({});
              }}
            >
              Forgot password?
            </button>
          </p>
          <p className="mt-[18px] mb-0 text-center text-sm text-ink-secondary">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="border-none bg-transparent p-0 text-mint font-bold cursor-pointer underline underline-offset-2 hover:text-mint-hover"
              onClick={onToggleMode}
            >
              Create one
            </button>
          </p>
        </>
      )}
    </AuthShell>
  );
}
