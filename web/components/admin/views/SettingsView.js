import React, { useState, useEffect } from 'react';
import { initialsFromName, cn } from '../../../lib/utils';
import { MIN_PASSWORD_LENGTH } from '../../../lib/constants';
import { tw } from '../../../lib/tw';
import { newsroomApi } from '../../../lib/api';
import BrandLogo from '../../BrandLogo/BrandLogo';
import { ScreenTitle, Notice, NavTabs } from '../wp/ScreenTitle';

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
  const [tab, setTab] = useState('profile');

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
    <div className="wp-wrap">
      <ScreenTitle title="Settings" />
      <NavTabs
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'security', label: 'Security' },
          { id: 'writing', label: 'Writing' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'profile' ? (
      <section className="postbox">
        <h2 className="hndle">Public profile</h2>
        <div className="inside">
        <p className="mt-0 mb-4 text-[13px] text-ink-secondary">
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
        <form onSubmit={handleProfileSubmit}>
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row"><label htmlFor="profile-email">Email</label></th>
                <td>
                  <input
                    id="profile-email"
                    type="email"
                    value={me?.email || me?.username || ''}
                    disabled
                    className={cn(tw.formInput, tw.disabledInput, 'max-w-md')}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="profile-name">Display name</label></th>
                <td>
                  <input
                    id="profile-name"
                    type="text"
                    className={cn(tw.formInput, 'max-w-md')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Name shown on articles"
                  />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="profile-bio">Biographical info</label></th>
                <td>
                  <textarea
                    id="profile-bio"
                    className={cn(tw.formTextarea, 'max-w-xl')}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Shown on your public author page"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          {profileHint ? <Notice type="success">{profileHint}</Notice> : null}
          <p className="submit">
            <button type="submit" className={tw.primaryBtn}>
              Save Changes
            </button>
          </p>
        </form>
        </div>
      </section>
      ) : null}

      {tab === 'security' ? (
        <>
          <TwoFactorBlock enabled={!!me?.totpEnabled} />
          <section className="postbox">
            <h2 className="hndle">Account password</h2>
            <div className="inside">
            <form onSubmit={handlePasswordSubmit}>
              <table className="form-table">
                <tbody>
                  <tr>
                    <th scope="row"><label>Current password</label></th>
                    <td>
                      <input type="password" className={cn(tw.formInput, 'max-w-md')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row"><label>New password</label></th>
                    <td>
                      <input type="password" className={cn(tw.formInput, 'max-w-md')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      <span className="description">Minimum {MIN_PASSWORD_LENGTH} characters.</span>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row"><label>Confirm new password</label></th>
                    <td>
                      <input type="password" className={cn(tw.formInput, 'max-w-md')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </td>
                  </tr>
                </tbody>
              </table>
              {passwordHint ? (
                <Notice type={passwordHint.includes('updated') ? 'success' : 'error'}>{passwordHint}</Notice>
              ) : null}
              <p className="submit">
                <button type="submit" className={tw.primaryBtn}>Update password</button>
              </p>
            </form>
            </div>
          </section>
        </>
      ) : null}

      {tab === 'writing' ? (
      <section className="postbox">
        <h2 className="hndle">Post byline</h2>
        <div className="inside">
        <p className="mt-0 mb-4 text-[13px] text-ink-secondary">
          Use the homepage wordmark instead of your name on posts.
        </p>
        <table className="form-table">
          <tbody>
            <tr>
              <th scope="row">Brand byline</th>
              <td>
                <div className="mb-3 h-14 max-w-xs border border-line bg-bg-elevated px-4 flex items-center">
                  <BrandLogo size="sm" />
                </div>
                <label className="inline-flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={brandEnabled}
                    disabled={isSavingBrand || !onUpdateBrandByline}
                    onChange={(e) => handleBrandToggle(e.target.checked)}
                  />
                  <span>Show brand logo instead of your name on posts</span>
                </label>
                {brandHint ? <Notice type="success">{brandHint}</Notice> : null}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </section>
      ) : null}
    </div>
  );
}

function TwoFactorBlock({ enabled }) {
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [hint, setHint] = useState(enabled ? 'Authenticator is on.' : '');
  return (
    <section className="postbox">
      <h2 className="hndle">Two-factor authentication</h2>
      <div className="inside">
      <p className="mt-0 mb-4 text-[13px] text-ink-secondary">Use an authenticator app. Turn this on before adding more staff.</p>
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
      </div>
    </section>
  );
}
