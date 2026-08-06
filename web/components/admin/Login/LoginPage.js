import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import BrandLogo from '../../BrandLogo/BrandLogo';
import { cn } from '../../../lib/utils';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const COLLAGE = [
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=70',
];

const inputClass =
  'w-full h-[46px] px-3 border border-line-strong rounded-sm bg-bg-elevated text-white text-[15px] outline-none transition-[border-color,box-shadow] duration-150 focus:border-mint focus:shadow-[0_0_0_3px_rgba(60,255,208,0.12)]';

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
    <div className="relative min-h-screen min-h-[100dvh] overflow-hidden bg-black text-white font-sans">
      <div
        className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[3px] z-0 max-sm:grid-cols-2 max-sm:grid-rows-4"
        aria-hidden="true"
      >
        {COLLAGE.map((src, i) => (
          <div
            key={i}
            className={cn(
              'relative overflow-hidden bg-[#111]',
              i >= 8 && 'max-sm:hidden'
            )}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover block saturate-[0.85] brightness-[0.55]"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 z-[1] bg-black/55 backdrop-blur-[1px]" aria-hidden="true" />

      <div className="relative z-[2] min-h-screen min-h-[100dvh] flex flex-col items-center justify-center pt-12 px-4 pb-[100px] max-sm:pt-8 max-sm:px-3 max-sm:pb-[110px]">
        <div className="mb-[22px] max-sm:mb-4 [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
          <BrandLogo size="lg" />
        </div>

        <div className="w-[min(440px,100%)] bg-bg-card border border-line rounded p-9 px-8 pb-7 shadow-xl max-sm:p-7 max-sm:px-5 max-sm:pb-[22px]">
          <h1 className="m-0 mb-3 text-center text-[26px] max-sm:text-[22px] font-extrabold leading-tight tracking-tight text-white">
            Sign in or
            <br />
            create an account
          </h1>
          <p className="m-0 mb-6 text-center text-xs leading-normal text-[#888] [&_a]:text-mint [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-mint-hover">
            Your account is used to sign in to Wirefringe. By signing in you agree to our{' '}
            <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-username"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#aaa]"
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
                className={cn(inputClass, errors.username && 'border-[#ff6b6b]')}
              />
              {errors.username ? (
                <span className="text-xs text-[#ff8a8a]">{errors.username}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#aaa]"
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
                  className={cn(inputClass, 'pr-16', errors.password && 'border-[#ff6b6b]')}
                />
                <button
                  type="button"
                  className="absolute right-2 h-8 px-2.5 border-none bg-transparent text-[#888] font-mono text-[11px] font-bold tracking-[0.04em] uppercase cursor-pointer hover:text-mint"
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

            <label className="inline-flex items-center gap-2 text-[13px] text-[#aaa] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-[15px] h-[15px] accent-mint"
              />
              <span>Remember me</span>
            </label>

            {(errors.form || serverError) && (
              <div className="bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.3)] text-[#ff8a8a] py-2.5 px-3 rounded-sm text-[13px]">
                {errors.form || serverError}
              </div>
            )}

            <button
              type="submit"
              className="mt-1 h-12 w-full border-none rounded-sm bg-mint text-black font-mono text-xs font-extrabold tracking-[0.1em] uppercase cursor-pointer transition-all duration-150 enabled:hover:bg-mint-hover enabled:hover:shadow-[0_8px_24px_rgba(60,255,208,0.25)] enabled:hover:-translate-y-px disabled:opacity-55 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-[18px] mb-0 text-center text-sm text-[#888]">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="border-none bg-transparent p-0 text-mint font-bold cursor-pointer underline underline-offset-2 hover:text-mint-hover"
              onClick={onToggleMode}
            >
              Create one
            </button>
          </p>
        </div>
      </div>

      <footer className="absolute left-0 right-0 bottom-0 z-[2] pt-4 px-5 pb-5 text-center">
        <nav
          className="flex flex-wrap justify-center gap-x-3.5 gap-y-2 mb-2 [&_a]:text-white/55 [&_a]:text-[11px] [&_a]:no-underline [&_a]:font-mono [&_a]:tracking-wide hover:[&_a]:text-mint"
          aria-label="Legal"
        >
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Notice</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/about">About</Link>
        </nav>
        <p className="m-0 text-[11px] text-white/35 font-mono">
          © {new Date().getFullYear()} Wirefringe. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
