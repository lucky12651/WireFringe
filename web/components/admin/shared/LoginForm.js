import React, { useState } from 'react';
import { PillButton } from './PillButton';

export function LoginForm({ onLogin, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username.trim()) {
      setLocalError('Username is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      return;
    }

    const result = await onLogin(username.trim(), password);
    if (!result.success) {
      setLocalError(result.error);
    }
  };

  return (
    <section className="side-card admin-login" id="loginCard">
      <div className="side-header">
        <h3>Login</h3>
        <span>Use your admin/editor account</span>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          <span className="label">Username</span>
          <input
            className="input"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <div className="row">
          <PillButton type="submit">Sign in</PillButton>
          <div className="hint">{localError || error}</div>
        </div>
      </form>
    </section>
  );
}
