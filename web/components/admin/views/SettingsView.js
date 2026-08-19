import React, { useState, useEffect } from 'react';
import { initialsFromName, cn } from '../../../lib/utils';
import { MIN_PASSWORD_LENGTH } from '../../../lib/constants';
import { tw } from '../../../lib/tw';
import { newsroomApi } from '../../../lib/api';
import BrandLogo from '../../BrandLogo/BrandLogo';

export function SettingsView({
  me,
  onUpdateProfile,
  onUploadPhoto,
  onUpdateBrandByline,
  onChangePassword,
}) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileHint, setProfileHint] = useState('');
  const [photoHint, setPhotoHint] = useState('');

  const [brandEnabled, setBrandEnabled] = useState(false);
  const [brandHint, setBrandHint] = useState('');
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName || '');
      setBio(me.bio || '');
      setBrandEnabled(!!me.brandBylineEnabled);
      setProfileHint('');
      setPhotoHint('');
      setBrandHint('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint('');
    }
  }, [me?.id, me?.brandBylineEnabled, me?.displayName]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoHint('');
    const result = await onUploadPhoto(file);
    if (result.success) {
      setPhotoHint('Profile photo updated.');
    } else {
      setPhotoHint(result.error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileHint('');

    const result = await onUpdateProfile({ displayName, bio });
    if (result.success) {
      setProfileHint('Saved.');
    } else {
      setProfileHint(result.error);
    }
  };

  const handleBrandToggle = async (next) => {
    if (!onUpdateBrandByline) return;
    setIsSavingBrand(true);
    setBrandHint('');
    setBrandEnabled(next);
    try {
      const result = await onUpdateBrandByline(next);
      if (result.success) {
        setBrandHint(
          next
            ? 'Posts will show the Wirefringe wordmark instead of your name.'
            : 'Posts will show your name again.'
        );
      } else {
        setBrandEnabled(!!me?.brandBylineEnabled);
        setBrandHint(result.error || 'Failed to update setting.');
      }
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordHint('');

    if (!currentPassword) {
      setPasswordHint('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordHint(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordHint('New passwords do not match.');
      return;
    }

    const result = await onChangePassword(currentPassword, newPassword);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint('Password updated.');
    } else {
      setPasswordHint(result.error);
    }
  };

  return (
    <div className={tw.adminView}>
      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Public profile</h3>
        <p className={tw.adminSectionDesc}>
          Name and photo shown on your posts. Email cannot be changed.
        </p>
        <div className="flex items-center gap-4 flex-wrap mb-6">
          <div className="w-16 h-16 rounded-full bg-bg-hover border border-line overflow-hidden flex items-center justify-center shrink-0">
            {me?.avatarUrl ? (
              <img src={me.avatarUrl} alt={me.username} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-mint text-lg">
                {initialsFromName(me?.displayName || me?.username)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={cn(tw.secondaryBtn, 'cursor-pointer')}>
              Change photo
              <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
            </label>
            <p className={tw.formHint}>{photoHint || 'JPG, PNG or GIF. Max 5MB.'}</p>
          </div>
        </div>
        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[720px]">
          <div className={tw.formGroup}>
            <label className={tw.formLabel}>Email</label>
            <input
              type="email"
              value={me?.email || me?.username || ''}
              disabled
              className={cn(tw.formInput, tw.disabledInput)}
            />
          </div>
          <div className={tw.formGroup}>
            <label className={tw.formLabel}>Display name</label>
            <input
              type="text"
              className={tw.formInput}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Name shown on articles"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={tw.formLabel}>Author bio</label>
            <textarea
              className={tw.formTextarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Shown on your public author page"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className={tw.primaryBtn}>
              Save profile
            </button>
            {profileHint ? <p className={tw.formHintSuccess}>{profileHint}</p> : null}
          </div>
        </form>
      </section>

      <TwoFactorBlock enabled={!!me?.totpEnabled} />

      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Security</h3>
        <p className={tw.adminSectionDesc}>Update the password for this account.</p>
        <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[720px]">
          <div className={tw.formGroup}>
            <label className={tw.formLabel}>Current password</label>
            <input
              type="password"
              className={tw.formInput}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className={tw.formGroup}>
            <label className={tw.formLabel}>New password</label>
            <input
              type="password"
              className={tw.formInput}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <div className={tw.formGroup}>
            <label className={tw.formLabel}>Confirm new password</label>
            <input
              type="password"
              className={tw.formInput}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button type="submit" className={tw.primaryBtn}>
              Update password
            </button>
            {passwordHint ? (
              <p className={passwordHint.includes('updated') ? tw.formHintSuccess : tw.formHint}>
                {passwordHint}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className={tw.adminSection}>
        <h3 className={tw.adminSectionTitle}>Post brand byline</h3>
        <p className={tw.adminSectionDesc}>
          Use the same text wordmark as the homepage instead of your name. No photo needed — it
          follows light and dark mode automatically. Header and footer stay unchanged.
        </p>
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="flex flex-col gap-2">
            <div className="min-w-[200px] h-16 px-4 rounded-md border border-line bg-bg-elevated flex items-center justify-center">
              <BrandLogo size="sm" />
            </div>
            <span className="text-[11px] text-ink-muted font-mono">Preview</span>
          </div>
          <div className="flex flex-col gap-3 max-w-[420px]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={brandEnabled}
                disabled={isSavingBrand || !onUpdateBrandByline}
                onChange={(e) => handleBrandToggle(e.target.checked)}
              />
              <span>
                <span className="block font-semibold text-ink text-sm">
                  Show brand logo instead of your name on posts
                </span>
                <span className="block text-xs text-ink-secondary mt-1">
                  When on, readers see Wire
                  <span className="italic text-mint">F</span>
                  ringe instead of &ldquo;{me?.displayName || 'your name'}&rdquo;.
                </span>
              </span>
            </label>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-ink-tertiary">
              {brandEnabled ? 'On' : 'Off'}
            </span>
            {brandHint ? <p className={tw.formHintSuccess}>{brandHint}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function TwoFactorBlock({ enabled }) {
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [hint, setHint] = useState(enabled ? 'Authenticator is on.' : '');
  return (
    <section className={tw.adminSection}>
      <h3 className={tw.adminSectionTitle}>Two-factor authentication</h3>
      <p className={tw.adminSectionDesc}>Use an authenticator app. Turn this on before adding more staff.</p>
      <button
        type="button"
        className={tw.secondaryBtn}
        onClick={async () => {
          const out = await newsroomApi.setup2fa();
          setSecret(out.secret || '');
          setHint(out.otpauth || 'Scan this secret in your app.');
        }}
      >
        Generate secret
      </button>
      {secret ? <p className="text-xs break-all mt-2">{secret}</p> : null}
      <div className="flex gap-2 mt-3 max-w-[360px]">
        <input className={tw.formInput} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
        <button type="button" className={tw.primaryBtn} onClick={() => newsroomApi.confirm2fa(code).then(() => setHint('2FA is on.'))}>
          Confirm
        </button>
      </div>
      <button type="button" className={tw.secondaryBtn + ' mt-3'} onClick={() => newsroomApi.disable2fa().then(() => setHint('2FA is off.'))}>
        Turn off 2FA
      </button>
      {hint ? <p className={tw.formHint}>{hint}</p> : null}
    </section>
  );
}
