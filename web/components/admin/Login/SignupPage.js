import React, { useState } from 'react';
import { z } from 'zod';
import styles from './LoginPage.module.css';

// Zod validation schema
const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
});

export function SignupPage({ onSignup, onToggleMode, error: serverError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    try {
      signupSchema.parse({ username, password, displayName });
      setErrors({});
      return true;
    } catch (err) {
      const formattedErrors = {};
      err.errors.forEach((e) => {
        formattedErrors[e.path[0]] = e.message;
      });
      setErrors(formattedErrors);
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
    <div className={styles.loginContainer}>
      {/* Left Side - Image */}
      <div className={styles.imageSection}>
        <div className={styles.imageOverlay}>
          <div className={styles.imageContent}>
            <h1 className={styles.headline}>Join Coffee n Blog</h1>
            <p className={styles.subheadline}>
              Create an account to start sharing your stories and connecting with others
            </p>
          </div>
        </div>
        <img
          src="https://res.cloudinary.com/djap3kkqi/image/upload/v1773555965/jeremy-bishop-uAfZBP-GtiA-unsplash_converted_1_ptt4fb.avif"
          alt="Coffee and creative workspace"
          className={styles.backgroundImage}
        />
      </div>

      {/* Right Side - Form */}
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.formWrapper}>
            <h2 className={styles.welcomeTitle}>Create Your Account</h2>
            <p className={styles.welcomeSubtitle}>Sign up for free today</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="displayName" className={styles.label}>
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className={`${styles.input} ${errors.displayName ? styles.inputError : ''}`}
                />
                {errors.displayName && (
                  <span className={styles.errorText}>{errors.displayName}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="username" className={styles.label}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                  autoComplete="username"
                />
                {errors.username && (
                  <span className={styles.errorText}>{errors.username}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 8 characters)"
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <span className={styles.errorText}>{errors.password}</span>
                )}
              </div>

              {(errors.form || serverError) && (
                <div className={styles.formError}>{errors.form || serverError}</div>
              )}

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>

              <div className={styles.toggleMode}>
                Already have an account?{' '}
                <span type="button" onClick={onToggleMode} >
                  Sign In
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
