import React, { useState, useEffect } from 'react';
import { initialsFromName } from '../../../lib/utils';
import { MIN_PASSWORD_LENGTH } from '../../../lib/constants';

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
                <span className="initials">
                  {initialsFromName(me?.displayName || me?.username)}
                </span>
              )}
            </div>
            <div className="upload-controls">
              <label className="secondary-btn-v2 upload-btn">
                Change Photo
                <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
              </label>
              <p className="hint-v2">{photoHint || 'JPG, PNG or GIF. Max 5MB. Profile avatar only.'}</p>
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
            <button type="submit" className="primary-btn-v2">
              Save Profile
            </button>
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
            {passwordHint && (
              <p
                className={`form-hint-v2 ${
                  passwordHint.includes('updated') ? 'success' : ''
                }`}
              >
                {passwordHint}
              </p>
            )}
            <button type="submit" className="primary-btn-v2">
              Update Password
            </button>
          </form>
        </div>

        {/* Post brand byline — post author display only */}
        <div className="admin-card-v2 full-width brand-byline-card">
          <h3 className="card-title-v2">Post Brand Logo Byline</h3>
          <p className="card-desc-v2">
            Control how your name appears on <strong>posts only</strong> (home feed, article
            page, stream). This does <strong>not</strong> change the website header, footer, or
            site-wide brand logo.
          </p>

          <div className="brand-byline-layout">
            <div className="brand-byline-preview-block">
              <div className="brand-logo-preview-wrap">
                {brandLogoPreview ? (
                  <img src={brandLogoPreview} alt="Post brand logo preview" />
                ) : (
                  <span className="brand-logo-placeholder">No logo yet</span>
                )}
              </div>
              <p className="hint-v2">Preview used on post bylines when the feature is ON.</p>
              <label className="secondary-btn-v2 upload-btn">
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
                  className={`form-hint-v2 ${
                    brandLogoHint.toLowerCase().includes('updated') ? 'success' : ''
                  }`}
                >
                  {brandLogoHint}
                </p>
              ) : null}
            </div>

            <div className="brand-byline-controls">
              <label className="brand-toggle-row">
                <input
                  type="checkbox"
                  checked={brandEnabled}
                  disabled={isSavingBrand || !onUpdateBrandByline}
                  onChange={(e) => handleBrandToggle(e.target.checked)}
                />
                <span>
                  <span className="option-title">
                    Show brand logo instead of username on posts
                  </span>
                  <span className="option-desc">
                    When ON, readers see your brand logo mark on posts instead of text like
                    “{me?.displayName || me?.username || 'Username'}”. When OFF, normal
                    username text is shown.
                  </span>
                </span>
              </label>

              <div className={`brand-status-pill ${brandEnabled ? 'on' : 'off'}`}>
                {brandEnabled ? 'Feature ON' : 'Feature OFF'}
              </div>

              {brandHint ? (
                <p
                  className={`form-hint-v2 ${
                    brandHint.toLowerCase().includes('on') ||
                    brandHint.toLowerCase().includes('off')
                      ? 'success'
                      : ''
                  }`}
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
