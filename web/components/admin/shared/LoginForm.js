import React, { useState } from 'react';
import { ActionButton } from './ActionButton';
import { tw } from '../../../lib/tw';
import { cn } from '../../../lib/utils';

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
    <section className={cn(tw.sideCard, 'admin-login')} id="loginCard">
      <div className={tw.sideHeader}>
        <h3 className="m-0 text-[15px] font-extrabold text-white">Login</h3>
        <span className="text-xs text-[#888]">Use your admin/editor account</span>
      </div>

      <form className={tw.form} onSubmit={handleSubmit}>
        <div className={tw.formGroup}>
          <label className={tw.formLabel}>Username</label>
          <input
            className={tw.formInput}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className={tw.formGroup}>
          <label className={tw.formLabel}>Password</label>
          <input
            className={tw.formInput}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ActionButton type="submit">Sign in</ActionButton>
          <div className="text-xs text-[#888]">{localError || error}</div>
        </div>
      </form>
    </section>
  );
}
