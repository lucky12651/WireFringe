import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import BrandLogo from '../../BrandLogo/BrandLogo';
import styles from './LoginPage.module.css';

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
            Create an
            <br />
            account
          </h1>
          <p className={styles.legal}>
            Join Wirefringe to follow stories and join the conversation. By signing up you agree
            to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>.
          </p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="signup-display">Display name</label>
              <input
                id="signup-display"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                className={errors.displayName ? styles.inputError : undefined}
              />
              {errors.displayName ? (
                <span className={styles.fieldError}>{errors.displayName}</span>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-username">Username</label>
              <input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className={errors.username ? styles.inputError : undefined}
              />
              {errors.username ? (
                <span className={styles.fieldError}>{errors.username}</span>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-password">Password</label>
              <div className={styles.passwordRow}>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            {(errors.form || serverError) && (
              <div className={styles.formError}>{errors.form || serverError}</div>
            )}

            <button type="submit" className={styles.primaryBtn} disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className={styles.switchMode}>
            Already have an account?{' '}
            <button type="button" className={styles.linkBtn} onClick={onToggleMode}>
              Sign in
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
