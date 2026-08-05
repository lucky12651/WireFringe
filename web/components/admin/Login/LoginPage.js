import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import BrandLogo from '../../BrandLogo/BrandLogo';
import styles from './LoginPage.module.css';

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
    <div className={styles.page}>
      <div className={styles.collage} aria-hidden="true">
        {COLLAGE.map((src, i) => (
          <div key={i} className={styles.collageCell}>
            <img src={src} alt="" loading="lazy" />
          </div>
        ))}
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.center}>
        <div className={styles.logoMark}>
          <BrandLogo size="lg" />
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>
            Sign in or
            <br />
            create an account
          </h1>
          <p className={styles.legal}>
            Your account is used to sign in to Wirefringe. By signing in you agree to our{' '}
            <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.
          </p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                autoComplete="username"
                className={errors.username ? styles.inputError : undefined}
              />
              {errors.username ? (
                <span className={styles.fieldError}>{errors.username}</span>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="login-password">Password</label>
              <div className={styles.passwordRow}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  autoComplete="current-password"
                  className={errors.password ? styles.inputError : undefined}
                />
                <button
                  type="button"
                  className={styles.showPass}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password ? (
                <span className={styles.fieldError}>{errors.password}</span>
              ) : null}
            </div>

            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            {(errors.form || serverError) && (
              <div className={styles.formError}>{errors.form || serverError}</div>
            )}

            <button type="submit" className={styles.primaryBtn} disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={styles.switchMode}>
            Don&apos;t have an account?{' '}
            <button type="button" className={styles.linkBtn} onClick={onToggleMode}>
              Create one
            </button>
          </p>
        </div>
      </div>

      <footer className={styles.footer}>
        <nav className={styles.footerLinks} aria-label="Legal">
          <Link href="/terms">Terms of Use</Link>
          <Link href="/privacy">Privacy Notice</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/about">About</Link>
        </nav>
        <p className={styles.copy}>© {new Date().getFullYear()} Wirefringe. All rights reserved.</p>
      </footer>
    </div>
  );
}
