import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import BrandLogo from '../../BrandLogo/BrandLogo';
import { cn } from '../../../lib/utils';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const inputClass =
  'w-full h-12 px-4 border border-white/12 rounded-xl bg-white/[0.04] text-white text-[15px] outline-none transition-all duration-200 placeholder:text-white/25 focus:border-white/35 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]';

export function LoginPage({ onLogin, onToggleMode, error: serverError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    try {
      loginSchema.parse({ username, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError || (err && err.errors)) {
        const formattedErrors = {};
        (err.errors || []).forEach((e) => {
          formattedErrors[e.path[0]] = e.message;
        });
        setErrors(formattedErrors);
      } else {
        setErrors({ form: 'Validation failed' });
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await onLogin(username.trim(), password, rememberMe);
    setIsLoading(false);

    if (!result.success && result.error) {
      setErrors({ form: result.error });
    }
  };

  return (
    <div className="admin-xai relative min-h-screen min-h-[100dvh] overflow-hidden bg-black text-white font-sans">
      <div className="admin-xai-noise" aria-hidden="true" />
      {/* Soft radial space glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(255,255,255,0.09), transparent 55%), radial-gradient(ellipse 40% 30% at 85% 70%, rgba(255,255,255,0.04), transparent 50%)',
        }}
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)',
        }}
      />

      <div className="relative z-[2] min-h-screen min-h-[100dvh] flex flex-col items-center justify-center pt-12 px-4 pb-[100px] max-sm:pt-8 max-sm:px-3 max-sm:pb-[110px]">
        <div className="mb-8 max-sm:mb-5">
          <BrandLogo size="lg" />
        </div>

        <div className="w-[min(420px,100%)] rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-9 px-8 pb-7 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)] max-sm:p-7 max-sm:px-5 max-sm:pb-[22px]">
          <p className="m-0 mb-2 text-center text-[11px] font-medium tracking-[0.16em] uppercase text-white/40">
            Admin access
          </p>
          <h1 className="m-0 mb-2 text-center text-[26px] max-sm:text-[22px] font-semibold leading-tight tracking-[-0.03em] text-white">
            Sign in
          </h1>
          <p className="m-0 mb-7 text-center text-[13px] leading-relaxed text-white/40 [&_a]:text-white/70 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-white">
            Sign in to manage Wirefringe. By continuing you agree to our{' '}
            <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-username"
                className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/45"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                autoComplete="username"
                className={cn(inputClass, errors.username && 'border-[#ff6b6b]/60')}
              />
              {errors.username ? (
                <span className="text-xs text-[#ff8a8a]">{errors.username}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/45"
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
                  className={cn(inputClass, 'pr-16', errors.password && 'border-[#ff6b6b]/60')}
                />
                <button
                  type="button"
                  className="absolute right-2 h-8 px-2.5 border-none bg-transparent text-white/40 text-[11px] font-medium tracking-[0.04em] uppercase cursor-pointer hover:text-white transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password ? (
                <span className="text-xs text-[#ff8a8a]">{errors.password}</span>
              ) : null}
            </div>

            <label className="inline-flex items-center gap-2.5 text-[13px] text-white/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-white"
              />
              <span>Remember me</span>
            </label>

            {(errors.form || serverError) && (
              <div className="bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.3)] text-[#ff8a8a] py-2.5 px-3.5 rounded-xl text-[13px]">
                {errors.form || serverError}
              </div>
            )}

            <button
              type="submit"
              className="mt-1 h-12 w-full border-none rounded-xl bg-white text-black text-[13px] font-semibold tracking-wide cursor-pointer transition-all duration-200 enabled:hover:bg-white/90 enabled:hover:shadow-[0_0_32px_rgba(255,255,255,0.18)] enabled:hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 mb-0 text-center text-sm text-white/40">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="border-none bg-transparent p-0 text-white font-medium cursor-pointer underline underline-offset-2 hover:text-white/80 transition-colors"
              onClick={onToggleMode}
            >
              Create one
            </button>
          </p>
        </div>
      </div>

      <footer className="absolute left-0 right-0 bottom-0 z-[2] pt-4 px-5 pb-5 text-center">
        <nav
          className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-2 [&_a]:text-white/40 [&_a]:text-[11px] [&_a]:no-underline [&_a]:tracking-wide hover:[&_a]:text-white transition-colors"
          aria-label="Legal"
        >
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Notice</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/about">About</Link>
        </nav>
        <p className="m-0 text-[11px] text-white/25">
          © {new Date().getFullYear()} Wirefringe. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
