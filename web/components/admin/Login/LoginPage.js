import React, { useState } from 'react';
import { z } from 'zod';
import styles from './LoginPage.module.css';

// Zod validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage({ onLogin, error: serverError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    try {
      loginSchema.parse({ username, password });
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
    const result = await onLogin(username.trim(), password);
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
            <h1 className={styles.headline}>Coffee n Blog</h1>
            <p className={styles.subheadline}>
              Share your stories, insights, and ideas with the world in just a few clicks
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
          {/* Sign In button top right */}
          

          <div className={styles.formWrapper}>
            <h2 className={styles.welcomeTitle}>Welcome Back to Coffee n Blog!</h2>
            <p className={styles.welcomeSubtitle}>Sign in to your account</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="username" className={styles.label}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
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
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <span className={styles.errorText}>{errors.password}</span>
                )}
              </div>

              <div className={styles.optionsRow}>
                <label className={styles.rememberMe}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkmark}></span>
                  <span className={styles.rememberText}>Remember Me</span>
                </label>
                
              </div>

              {(errors.form ) && (
                <div className={styles.formError}>{errors.form || serverError}</div>
              )}

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </form>

           
          </div>
        </div>
      </div>
    </div>
  );
}
