import React, { useState, useEffect } from 'react';
import { PillButton } from '../shared/PillButton';
import { initialsFromName } from '../../../lib/utils';
import { MIN_PASSWORD_LENGTH } from '../../../lib/constants';

export function SettingsView({
  me,
  onUpdateProfile,
  onUploadPhoto,
  onChangePassword,
}) {
  const [displayName, setDisplayName] = useState('');
  const [profileHint, setProfileHint] = useState('');
  const [photoHint, setPhotoHint] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName || '');
      setProfileHint('');
      setPhotoHint('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint('');
    }
  }, [me?.id]);

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
    <>
      <div className="admin-title-row">
        <h2>Settings</h2>
        <div className="accent-line"></div>
      </div>

      {/* Profile Section */}
      <section className="side-card" aria-label="Profile settings">
        <div className="side-header">
          <h3>Profile</h3>
          <span>Shown on posts</span>
        </div>

        <div className="admin-settings-profile">
          <div className="admin-settings-avatar" aria-label="Profile photo">
            {me?.avatarUrl ? (
              <img src={me.avatarUrl} alt="Profile" loading="lazy" />
            ) : (
              <div className="admin-settings-avatar-fallback">
                {initialsFromName(displayName.trim() || me?.displayName || me?.username)}
              </div>
            )}
          </div>

          <div className="admin-settings-profile-body">
            <div className="hint">Profile photo</div>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            {photoHint && <div className="hint">{photoHint}</div>}
          </div>
        </div>

        <form className="admin-form" onSubmit={handleProfileSubmit}>
          <label>
            <span className="label">Display name</span>
            <input
              className="input"
              value={displayName}
              placeholder={me?.username || ''}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="hint">
              Shown as: <strong>{displayName.trim() || me?.username}</strong>
            </div>
          </label>

          <label>
            <span className="label">Username (login)</span>
            <input className="input" value={me?.username || ''} readOnly />
          </label>

          <div className="row">
            <PillButton type="submit">Save profile</PillButton>
            <div className="hint">{profileHint}</div>
          </div>
        </form>
      </section>

      {/* Password Section */}
      <section className="side-card" aria-label="Password settings">
        <div className="side-header">
          <h3>Password</h3>
          <span>Update your password</span>
        </div>

        <form className="admin-form" onSubmit={handlePasswordSubmit}>
          <label>
            <span className="label">Current password</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label>
            <span className="label">New password</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Confirm new password</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <div className="row">
            <PillButton type="submit">Change password</PillButton>
            <div className="hint">{passwordHint}</div>
          </div>
        </form>
      </section>
    </>
  );
}
