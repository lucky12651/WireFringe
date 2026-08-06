import React, { useEffect, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';

const EMPTY_FORM = {
  enabled: true,
  hideArticles: false,
  dailyLimit: 12,
  gapMinutes: 120,
  sleepSeconds: 3600,
  queueCleanupHours: 24,
  recentCacheHours: 2,
  maxItemsPerFeed: 5,
  processPerCycle: 1,
};

export function BotView({
  settings,
  isLoading,
  onRefresh,
  onSave,
  onHideArticles,
  onUnhideArticles,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hint, setHint] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);
  const [confirmUnhide, setConfirmUnhide] = useState(false);

  const stats = settings?.stats || {
    totalBotPosts: 0,
    hiddenBotPosts: 0,
    visibleBotPosts: 0,
  };

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled !== false,
        hideArticles: !!settings.hideArticles,
        dailyLimit: Number(settings.dailyLimit) || 12,
        gapMinutes: Number(settings.gapMinutes) ?? 120,
        sleepSeconds: Number(settings.sleepSeconds) || 3600,
        queueCleanupHours: Number(settings.queueCleanupHours) || 24,
        recentCacheHours: Number(settings.recentCacheHours) || 2,
        maxItemsPerFeed: Number(settings.maxItemsPerFeed) || 5,
        processPerCycle: Number(settings.processPerCycle) || 1,
      });
    }
  }, [settings]);

  useEffect(() => {
    onRefresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHint('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setHint('');
    try {
      const result = await onSave(form);
      if (result?.success) {
        setHint('Bot settings saved.');
      } else {
        setHint(result?.error || 'Failed to save.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleHide = async () => {
    setIsBulk(true);
    setHint('');
    try {
      const result = await onHideArticles();
      if (result?.success) {
        setConfirmHide(false);
        setHint(
          `Hidden ${result.data?.updated ?? 0} bot article(s). They no longer appear on the public site.`
        );
      } else {
        setHint(result?.error || 'Failed to hide articles.');
      }
    } finally {
      setIsBulk(false);
    }
  };

  const handleUnhide = async () => {
    setIsBulk(true);
    setHint('');
    try {
      const result = await onUnhideArticles();
      if (result?.success) {
        setConfirmUnhide(false);
        setHint(
          `Unhid ${result.data?.updated ?? 0} bot article(s). They are visible on the public site again.`
        );
      } else {
        setHint(result?.error || 'Failed to unhide articles.');
      }
    } finally {
      setIsBulk(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="admin-view-container-v2">
        <div className="section-header">
          <h2 className="section-title">News Bot</h2>
        </div>
        <EmptyState>Loading bot settings…</EmptyState>
      </div>
    );
  }

  return (
    <div className="admin-view-container-v2">
      <div className="section-header">
        <h2 className="section-title">News Bot</h2>
        <div className="header-actions-v2">
          <button type="button" className="secondary-btn-v2" onClick={() => onRefresh?.()} disabled={isLoading}>
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="admin-grid-v2">
        {/* Stats */}
        <div className="admin-card-v2 full-width">
          <h3 className="card-title-v2">Bot article stats</h3>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 12 }}>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Total bot posts</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalBotPosts}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Visible</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                {stats.visibleBotPosts}
              </div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Hidden</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>
                {stats.hiddenBotPosts}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'contents' }}>
          <div className="admin-card-v2">
            <h3 className="card-title-v2">Power</h3>
            <p className="card-desc-v2">
              When off, the news bot skips gathering feeds and publishing. The loop still sleeps and
              checks this flag each cycle.
            </p>
            <label className="brand-toggle-row">
              <input
                type="checkbox"
                checked={!!form.enabled}
                onChange={(e) => setField('enabled', e.target.checked)}
              />
              <span>
                <span className="option-title">Bot enabled</span>
                <span className="option-desc">Turn automated article publishing on or off.</span>
              </span>
            </label>
            <div className={`brand-status-pill ${form.enabled ? 'on' : 'off'}`}>
              {form.enabled ? 'Bot ON' : 'Bot OFF'}
            </div>
          </div>

          <div className="admin-card-v2">
            <h3 className="card-title-v2">Visibility</h3>
            <p className="card-desc-v2">
              Hide bot posts from the public site without deleting them. Admins still see them in
              Posts.
            </p>
            <label className="brand-toggle-row">
              <input
                type="checkbox"
                checked={!!form.hideArticles}
                onChange={(e) => setField('hideArticles', e.target.checked)}
              />
              <span>
                <span className="option-title">Hide all bot articles (filter)</span>
                <span className="option-desc">
                  Public feeds exclude bot posts while this is on. New bot posts are also marked
                  hidden when enabled.
                </span>
              </span>
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              {!confirmHide ? (
                <button
                  type="button"
                  className="secondary-btn-v2"
                  onClick={() => {
                    setConfirmHide(true);
                    setConfirmUnhide(false);
                  }}
                  disabled={isBulk}
                >
                  Hide all bot articles now
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="primary-btn-v2"
                    style={{ background: 'var(--danger)' }}
                    onClick={handleHide}
                    disabled={isBulk}
                  >
                    {isBulk ? 'Working…' : 'Confirm hide all'}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn-v2"
                    onClick={() => setConfirmHide(false)}
                    disabled={isBulk}
                  >
                    Cancel
                  </button>
                </>
              )}

              {!confirmUnhide ? (
                <button
                  type="button"
                  className="secondary-btn-v2"
                  onClick={() => {
                    setConfirmUnhide(true);
                    setConfirmHide(false);
                  }}
                  disabled={isBulk}
                >
                  Unhide all bot articles
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="primary-btn-v2"
                    onClick={handleUnhide}
                    disabled={isBulk}
                  >
                    {isBulk ? 'Working…' : 'Confirm unhide all'}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn-v2"
                    onClick={() => setConfirmUnhide(false)}
                    disabled={isBulk}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="admin-card-v2">
            <h3 className="card-title-v2">Publishing limits</h3>
            <div className="v2-form">
              <div className="form-group-v2">
                <label>Daily post limit</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.dailyLimit}
                  onChange={(e) => setField('dailyLimit', e.target.value)}
                />
                <p className="input-hint">Max bot posts published per UTC day.</p>
              </div>
              <div className="form-group-v2">
                <label>Gap between posts (minutes)</label>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={form.gapMinutes}
                  onChange={(e) => setField('gapMinutes', e.target.value)}
                />
                <p className="input-hint">Minimum wait between bot publications (0 = no gap).</p>
              </div>
              <div className="form-group-v2">
                <label>Articles processed per cycle</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.processPerCycle}
                  onChange={(e) => setField('processPerCycle', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="admin-card-v2">
            <h3 className="card-title-v2">Cycle & cleanup</h3>
            <div className="v2-form">
              <div className="form-group-v2">
                <label>Sleep between cycles (seconds)</label>
                <input
                  type="number"
                  min={60}
                  max={86400}
                  value={form.sleepSeconds}
                  onChange={(e) => setField('sleepSeconds', e.target.value)}
                />
                <p className="input-hint">Default 3600 (1 hour). Min 60.</p>
              </div>
              <div className="form-group-v2">
                <label>Max items per RSS feed</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.maxItemsPerFeed}
                  onChange={(e) => setField('maxItemsPerFeed', e.target.value)}
                />
              </div>
              <div className="form-group-v2">
                <label>Queue cleanup (hours)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={form.queueCleanupHours}
                  onChange={(e) => setField('queueCleanupHours', e.target.value)}
                />
              </div>
              <div className="form-group-v2">
                <label>Recent-cache window (hours)</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={form.recentCacheHours}
                  onChange={(e) => setField('recentCacheHours', e.target.value)}
                />
                <p className="input-hint">Used for duplicate title/URL checks.</p>
              </div>
            </div>
          </div>

          <div className="admin-card-v2 full-width">
            <div className="header-actions-v2" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <button type="submit" className="primary-btn-v2" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save bot settings'}
              </button>
              {hint ? (
                <p
                  className={`form-hint-v2 ${
                    hint.toLowerCase().includes('saved') ||
                    hint.toLowerCase().includes('hidden') ||
                    hint.toLowerCase().includes('unhid')
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
    </div>
  );
}
