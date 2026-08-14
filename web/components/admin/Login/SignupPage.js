import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import BrandLogo from '../../BrandLogo/BrandLogo';
import { cn } from '../../../lib/utils';

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
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
  'w-full h-[46px] px-3 border border-line-strong rounded-sm bg-bg-elevated text-ink text-[15px] outline-none transition-[border-color,box-shadow] duration-150 focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]';

export function SignupPage({ onSignup, onToggleMode, error: serverError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    try {
      signupSchema.parse({ username, password, displayName });
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
    const result = await onSignup(username.trim(), password, displayName.trim());
    setIsLoading(false);

    if (!result.success && result.error) {
      setErrors({ form: result.error });
    }
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-hidden bg-bg text-ink font-sans">
      <div
        className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[3px] z-0 max-sm:grid-cols-2 max-sm:grid-rows-4"
        aria-hidden="true"
      >
        {COLLAGE.map((src, i) => (
          <div
            key={i}
            className={cn(
              'relative overflow-hidden bg-bg-elevated',
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
        <div className="on-media mb-[22px] max-sm:mb-4 [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
          <BrandLogo size="lg" className="text-white" />
        </div>

        <div className="w-[min(440px,100%)] bg-bg-card text-ink border border-line rounded p-9 px-8 pb-7 shadow-xl max-sm:p-7 max-sm:px-5 max-sm:pb-[22px]">
          <h1 className="m-0 mb-3 text-center text-[26px] max-sm:text-[22px] font-extrabold leading-tight tracking-tight text-ink">
            Create an
            <br />
            account
          </h1>
          <p className="m-0 mb-6 text-center text-xs leading-normal text-ink-secondary [&_a]:text-mint [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-mint-hover">
            Join Wirefringe to follow stories and join the conversation. By signing up you agree
            to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-display"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-tertiary"
              >
                Display name
              </label>
              <input
                id="signup-display"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                className={cn(inputClass, errors.displayName && 'border-[#ff6b6b]')}
              />
              {errors.displayName ? (
                <span className="text-xs text-[#c0392b]">{errors.displayName}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-username"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-tertiary"
              >
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className={cn(inputClass, errors.username && 'border-[#ff6b6b]')}
              />
              {errors.username ? (
                <span className="text-xs text-[#c0392b]">{errors.username}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-password"
                className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-tertiary"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={cn(inputClass, 'pr-16', errors.password && 'border-[#ff6b6b]')}
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
              {errors.password ? (
                <span className="text-xs text-[#c0392b]">{errors.password}</span>
              ) : null}
            </div>

            {(errors.form || serverError) && (
              <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.28)] text-[#c0392b] py-2.5 px-3 rounded-sm text-[13px]">
                {errors.form || serverError}
              </div>
            )}

            <button
              type="submit"
              className="mt-1 h-12 w-full border-none rounded-sm bg-mint text-black font-mono text-xs font-extrabold tracking-[0.1em] uppercase cursor-pointer transition-all duration-150 enabled:hover:bg-mint-hover enabled:hover:shadow-mint enabled:hover:-translate-y-px disabled:opacity-55 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className="mt-[18px] mb-0 text-center text-sm text-ink-secondary">
            Already have an account?{' '}
            <button
              type="button"
              className="border-none bg-transparent p-0 text-mint font-bold cursor-pointer underline underline-offset-2 hover:text-mint-hover"
              onClick={onToggleMode}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      <footer className="on-media absolute left-0 right-0 bottom-0 z-[2] pt-4 px-5 pb-5 text-center">
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
