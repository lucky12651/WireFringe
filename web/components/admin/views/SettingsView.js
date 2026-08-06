import React, { useState, useEffect } from 'react';
import { initialsFromName, cn } from '../../../lib/utils';
import { MIN_PASSWORD_LENGTH } from '../../../lib/constants';
import { tw } from '../../../lib/tw';

export function SettingsView({
  me,
  onUpdateProfile,
  onUploadPhoto,
  onUpdateBrandByline,
  onUploadBrandLogo,
  onChangePassword,
}) {
  const [displayName, setDisplayName] = useState('');
  const [profileHint, setProfileHint] = useState('');
  const [photoHint, setPhotoHint] = useState('');

  const [brandEnabled, setBrandEnabled] = useState(false);
  const [brandHint, setBrandHint] = useState('');
  const [brandLogoHint, setBrandLogoHint] = useState('');
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName || '');
      setBrandEnabled(!!me.brandBylineEnabled);
      setProfileHint('');
      setPhotoHint('');
      setBrandHint('');
      setBrandLogoHint('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint('');
    }
  }, [me?.id, me?.brandBylineEnabled, me?.brandLogoUrl, me?.displayName]);

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

    const result = await onUpdateProfile(displayName);
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
            ? 'Brand logo byline is ON for your posts.'
            : 'Brand logo byline is OFF — username text will show on posts.'
        );
      } else {
        setBrandEnabled(!!me?.brandBylineEnabled);
        setBrandHint(result.error || 'Failed to update setting.');
      }
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleBrandLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadBrandLogo) return;
    setBrandLogoHint('');
    const result = await onUploadBrandLogo(file);
    if (result.success) {
      setBrandLogoHint('Post brand logo updated. Site header logo is unchanged.');
      if (result.user) {
        setBrandEnabled(!!result.user.brandBylineEnabled);
      }
    } else {
      setBrandLogoHint(result.error || 'Upload failed.');
    }
    e.target.value = '';
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

  const brandLogoPreview =
    me?.brandLogoUrl ||
    (String(me?.username || '').toLowerCase().includes('wirefringe')
      ? '/wirefringe.png'
      : null);

  return (
    <div className={tw.adminView}>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="m-0 text-xl font-extrabold text-white tracking-tight">Account Settings</h2>
      </div>

      <div className={tw.adminGrid}>
        {/* Profile Info Card */}
        <div className={tw.card}>
          <h3 className={tw.cardTitle}>Public Profile</h3>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-line overflow-hidden flex items-center justify-center shrink-0">
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
                Change Photo
                <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
              </label>
              <p className={tw.formHint}>{photoHint || 'JPG, PNG or GIF. Max 5MB. Profile avatar only.'}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className={cn(tw.form, tw.mt32)}>
            <div className={tw.formGroup}>
              <label className={tw.formLabel}>Username</label>
              <input
                type="text"
                value={me?.username || ''}
                disabled
                className={cn(tw.formInput, tw.disabledInput)}
              />
              <p className={tw.formHint}>Username cannot be changed.</p>
            </div>
            <div className={tw.formGroup}>
              <label className={tw.formLabel}>Display Name</label>
              <input
                type="text"
                className={tw.formInput}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Name shown on articles"
              />
            </div>
            {profileHint && <p className={tw.formHintSuccess}>{profileHint}</p>}
            <button type="submit" className={tw.primaryBtn}>
              Save Profile
            </button>
          </form>
        </div>

        {/* Password Security Card */}
        <div className={tw.card}>
          <h3 className={tw.cardTitle}>Security</h3>
          <p className={tw.cardDesc}>Update your password to keep your account secure.</p>

          <form onSubmit={handlePasswordSubmit} className={tw.form}>
            <div className={tw.formGroup}>
              <label className={tw.formLabel}>Current Password</label>
              <input
                type="password"
                className={tw.formInput}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className={tw.formGroup}>
              <label className={tw.formLabel}>New Password</label>
              <input
                type="password"
                className={tw.formInput}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className={tw.formGroup}>
              <label className={tw.formLabel}>Confirm New Password</label>
              <input
                type="password"
                className={tw.formInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {passwordHint && (
              <p
                className={
                  passwordHint.includes('updated') ? tw.formHintSuccess : tw.formHint
                }
              >
                {passwordHint}
              </p>
            )}
            <button type="submit" className={tw.primaryBtn}>
              Update Password
            </button>
          </form>
        </div>

        {/* Post brand byline — post author display only */}
        <div className={tw.cardFull}>
          <h3 className={tw.cardTitle}>Post Brand Logo Byline</h3>
          <p className={tw.cardDesc}>
            Control how your name appears on <strong>posts only</strong> (home feed, article
            page, stream). This does <strong>not</strong> change the website header, footer, or
            site-wide brand logo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col gap-3">
              <div className="w-full max-w-[200px] h-16 rounded-md border border-line bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                {brandLogoPreview ? (
                  <img src={brandLogoPreview} alt="Post brand logo preview" className="max-h-12 max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-[#666]">No logo yet</span>
                )}
              </div>
              <p className={tw.formHint}>Preview used on post bylines when the feature is ON.</p>
              <label className={cn(tw.secondaryBtn, 'cursor-pointer w-fit')}>
                Upload post brand logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleBrandLogoUpload}
                  disabled={!onUploadBrandLogo}
                />
              </label>
              {brandLogoHint ? (
                <p
                  className={
                    brandLogoHint.toLowerCase().includes('updated')
                      ? tw.formHintSuccess
                      : tw.formHint
                  }
                >
                  {brandLogoHint}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={brandEnabled}
                  disabled={isSavingBrand || !onUpdateBrandByline}
                  onChange={(e) => handleBrandToggle(e.target.checked)}
                />
                <span>
                  <span className="block font-semibold text-white text-sm">
                    Show brand logo instead of username on posts
                  </span>
                  <span className="block text-xs text-[#888] mt-1">
                    When ON, readers see your brand logo mark on posts instead of text like
                    &ldquo;{me?.displayName || me?.username || 'Username'}&rdquo;. When OFF, normal
                    username text is shown.
                  </span>
                </span>
              </label>

              <div
                className={cn(
                  'inline-flex w-fit px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wide',
                  brandEnabled
                    ? 'bg-mint/15 text-mint border border-mint/30'
                    : 'bg-[#222] text-[#888] border border-line'
                )}
              >
                {brandEnabled ? 'Feature ON' : 'Feature OFF'}
              </div>

              {brandHint ? (
                <p
                  className={
                    brandHint.toLowerCase().includes('on') ||
                    brandHint.toLowerCase().includes('off')
                      ? tw.formHintSuccess
                      : tw.formHint
                  }
                >
                  {brandHint}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
