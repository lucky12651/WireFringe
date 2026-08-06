import React, { useEffect, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';

const EMPTY_FORM = {
  enabled: false,
  publisherId: '',
  clientId: '',
  defaultSlot: '',
  slotLeaderboard: '',
  slotInArticle: '',
  slotSidebar: '',
  slotRail: '',
  adsTxt: '',
  autoAdsEnabled: false,
  inArticleEnabled: true,
  inArticleEveryN: 3,
  inArticleMinBefore: 2,
  inArticleMax: 4,
};

export function AdsenseView({
  settings,
  isLoading,
  onRefresh,
  onSave,
  onClear,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hint, setHint] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: !!settings.enabled,
        publisherId: settings.publisherId || '',
        clientId: settings.clientId || '',
        defaultSlot: settings.defaultSlot || '',
        slotLeaderboard: settings.slotLeaderboard || '',
        slotInArticle: settings.slotInArticle || '',
        slotSidebar: settings.slotSidebar || '',
        slotRail: settings.slotRail || '',
        adsTxt: settings.adsTxt || '',
        autoAdsEnabled: !!settings.autoAdsEnabled,
        inArticleEnabled: settings.inArticleEnabled !== false,
        inArticleEveryN: Number(settings.inArticleEveryN) || 3,
        inArticleMinBefore: Number(settings.inArticleMinBefore) || 2,
        inArticleMax: Number(settings.inArticleMax) || 4,
      });
    }
  }, [settings]);

  useEffect(() => {
    onRefresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Keep pub / client in sync for convenience
      if (key === 'publisherId') {
        const p = String(value || '').trim();
        if (p && !next.clientId) {
          next.clientId = p.startsWith('ca-') ? p : `ca-${p}`;
        }
      }
      if (key === 'clientId') {
        const c = String(value || '').trim();
        if (c && !next.publisherId) {
          next.publisherId = c.startsWith('ca-') ? c.slice(3) : c;
        }
      }
      return next;
    });
    setHint('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setHint('');
    try {
      const result = await onSave(form);
      if (result?.success) {
        setHint('AdSense settings saved.');
      } else {
        setHint(result?.error || 'Failed to save.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    setHint('');
    try {
      const result = await onClear();
      if (result?.success) {
        setConfirmClear(false);
        setHint('All AdSense credentials deleted. Ads are disabled.');
      } else {
        setHint(result?.error || 'Failed to clear credentials.');
      }
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="admin-view-container-v2">
        <div className="section-header">
          <h2 className="section-title">Google AdSense</h2>
        </div>
        <EmptyState>Loading AdSense settings…</EmptyState>
      </div>
    );
  }

  return (
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">Google AdSense</h2>
        <div className="header-actions-v2">
          <button type="button" className="secondary-btn-v2" onClick={() => onRefresh?.()} disabled={isLoading}>
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="admin-grid-v2">
        <div className="admin-card-v2 full-width">
          <h3 className="card-title-v2">Status</h3>
          <p className="card-desc-v2">
            Control whether AdSense loads on the public site. Credentials are stored in the database
            and used by all ad placements.
          </p>
          <label className="brand-toggle-row">
            <input
              type="checkbox"
              checked={!!form.enabled}
              onChange={(e) => setField('enabled', e.target.checked)}
            />
            <span>
              <span className="option-title">Enable AdSense on public site</span>
              <span className="option-desc">
                When off, the AdSense script and ad units will not load.
              </span>
            </span>
          </label>
          <div className={`brand-status-pill ${form.enabled ? 'on' : 'off'}`}>
            {form.enabled ? 'Ads ON' : 'Ads OFF'}
          </div>
        </div>

        <div className="admin-card-v2">
          <h3 className="card-title-v2">Publisher credentials</h3>
          <p className="card-desc-v2">
            Find these in your AdSense account under Account → Account information / Ads → By ad unit.
          </p>
          <div className="v2-form">
            <div className="form-group-v2">
              <label>Publisher ID (pub-…)</label>
              <input
                type="text"
                value={form.publisherId}
                onChange={(e) => setField('publisherId', e.target.value)}
                placeholder="pub-XXXXXXXXXXXXXXXX"
                autoComplete="off"
              />
            </div>
            <div className="form-group-v2">
              <label>Ad client (ca-pub-…)</label>
              <input
                type="text"
                value={form.clientId}
                onChange={(e) => setField('clientId', e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                autoComplete="off"
              />
              <p className="input-hint">Usually ca- + your Publisher ID.</p>
            </div>
          </div>
        </div>

        <div className="admin-card-v2">
          <h3 className="card-title-v2">Ad slots</h3>
          <p className="card-desc-v2">
            Slot IDs from AdSense → Ads → By ad unit. You can reuse one slot until you create more.
          </p>
          <div className="v2-form">
            <div className="form-group-v2">
              <label>Default slot</label>
              <input
                type="text"
                value={form.defaultSlot}
                onChange={(e) => setField('defaultSlot', e.target.value)}
                placeholder="Your AdSense slot ID"
              />
            </div>
            <div className="form-group-v2">
              <label>Leaderboard</label>
              <input
                type="text"
                value={form.slotLeaderboard}
                onChange={(e) => setField('slotLeaderboard', e.target.value)}
                placeholder="Same as default if empty"
              />
            </div>
            <div className="form-group-v2">
              <label>In-article</label>
              <input
                type="text"
                value={form.slotInArticle}
                onChange={(e) => setField('slotInArticle', e.target.value)}
                placeholder="Same as default if empty"
              />
            </div>
            <div className="form-group-v2">
              <label>Sidebar</label>
              <input
                type="text"
                value={form.slotSidebar}
                onChange={(e) => setField('slotSidebar', e.target.value)}
              />
            </div>
            <div className="form-group-v2">
              <label>Rail</label>
              <input
                type="text"
                value={form.slotRail}
                onChange={(e) => setField('slotRail', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-card-v2">
          <h3 className="card-title-v2">In-article placement</h3>
          <div className="v2-form">
            <label className="brand-toggle-row">
              <input
                type="checkbox"
                checked={!!form.inArticleEnabled}
                onChange={(e) => setField('inArticleEnabled', e.target.checked)}
              />
              <span>
                <span className="option-title">Insert in-article ads</span>
                <span className="option-desc">Place ads between paragraphs on long posts.</span>
              </span>
            </label>
            <div className="form-group-v2">
              <label>Every N paragraphs</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.inArticleEveryN}
                onChange={(e) => setField('inArticleEveryN', e.target.value)}
              />
            </div>
            <div className="form-group-v2">
              <label>Min paragraphs before first ad</label>
              <input
                type="number"
                min={0}
                max={20}
                value={form.inArticleMinBefore}
                onChange={(e) => setField('inArticleMinBefore', e.target.value)}
              />
            </div>
            <div className="form-group-v2">
              <label>Max in-article ads per post</label>
              <input
                type="number"
                min={0}
                max={20}
                value={form.inArticleMax}
                onChange={(e) => setField('inArticleMax', e.target.value)}
              />
            </div>
            <label className="brand-toggle-row">
              <input
                type="checkbox"
                checked={!!form.autoAdsEnabled}
                onChange={(e) => setField('autoAdsEnabled', e.target.checked)}
              />
              <span>
                <span className="option-title">Auto ads flag (stored)</span>
                <span className="option-desc">
                  Reserved for Google Auto ads setup in AdSense. Manual slots still use the IDs above.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="admin-card-v2 full-width">
          <h3 className="card-title-v2">ads.txt</h3>
          <p className="card-desc-v2">
            Content served at <code>/api/adsense/ads.txt</code> (and via the site proxy). Update when
            you change publisher ID.
          </p>
          <div className="form-group-v2">
            <label>ads.txt body</label>
            <textarea
              rows={4}
              value={form.adsTxt}
              onChange={(e) => setField('adsTxt', e.target.value)}
              placeholder="google.com, pub-XXXXXXXX, DIRECT, f08c47fec0942fa0"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
            />
          </div>
        </div>

        <div className="admin-card-v2 full-width">
          <div className="header-actions-v2" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="primary-btn-v2" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save AdSense settings'}
              </button>
              {!confirmClear ? (
                <button
                  type="button"
                  className="secondary-btn-v2"
                  style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  onClick={() => setConfirmClear(true)}
                >
                  Delete credentials
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="primary-btn-v2"
                    style={{ background: 'var(--danger)' }}
                    onClick={handleClear}
                    disabled={isClearing}
                  >
                    {isClearing ? 'Deleting…' : 'Confirm delete all credentials'}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn-v2"
                    onClick={() => setConfirmClear(false)}
                    disabled={isClearing}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            {hint ? (
              <p
                className={`form-hint-v2 ${
                  hint.toLowerCase().includes('saved') || hint.toLowerCase().includes('deleted')
                    ? 'success'
                    : ''
                }`}
                style={{ margin: 0 }}
              >
                {hint}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
