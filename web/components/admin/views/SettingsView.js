import React, { useState, useEffect } from 'react';
import { ActionButton } from '../shared/ActionButton';
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
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">Account Settings</h2>
      </div>

      <div className="admin-grid-v2">
        {/* Profile Info Card */}
        <div className="admin-card-v2 profile-card">
          <h3 className="card-title-v2">Public Profile</h3>
          
          <div className="avatar-upload-section">
            <div className="user-avatar-v2 large">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt={me.username} />
              ) : (
                <span className="initials">{initialsFromName(me?.displayName || me?.username)}</span>
              )}
            </div>
            <div className="upload-controls">
              <label className="secondary-btn-v2 upload-btn">
                Change Photo
                <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
              </label>
              <p className="hint-v2">{photoHint || 'JPG, PNG or GIF. Max 1MB.'}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="v2-form mt-32">
            <div className="form-group-v2">
              <label>Username</label>
              <input type="text" value={me?.username || ''} disabled className="disabled-input" />
              <p className="input-hint">Username cannot be changed.</p>
            </div>
            <div className="form-group-v2">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Name shown on articles"
              />
            </div>
            {profileHint && <p className="form-hint-v2 success">{profileHint}</p>}
            <button type="submit" className="primary-btn-v2">Save Profile</button>
          </form>
        </div>

        {/* Password Security Card */}
        <div className="admin-card-v2 password-card">
          <h3 className="card-title-v2">Security</h3>
          <p className="card-desc-v2">Update your password to keep your account secure.</p>
          
          <form onSubmit={handlePasswordSubmit} className="v2-form">
            <div className="form-group-v2">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group-v2">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="form-group-v2">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {passwordHint && <p className={`form-hint-v2 ${passwordHint.includes('updated') ? 'success' : ''}`}>{passwordHint}</p>}
            <button type="submit" className="primary-btn-v2">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
