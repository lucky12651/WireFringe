import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import styles from './AdsenseView.module.css';

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

const STEPS = [
  { id: 0, label: 'Status', hint: 'ON / OFF' },
  { id: 1, label: 'Credentials', hint: 'Publisher / client' },
  { id: 2, label: 'Ad slots', hint: 'Slot IDs' },
  { id: 3, label: 'Placement', hint: 'In-article rules' },
  { id: 4, label: 'ads.txt', hint: 'Verification file' },
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
  </svg>
);

function defaultAdsTxt(publisherId) {
  const pub = String(publisherId || '').trim() || 'pub-XXXXXXXXXXXXXXXX';
  return `google.com, ${pub}, DIRECT, f08c47fec0942fa0`;
}

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
  const [step, setStep] = useState(0);
  const [lastSaved, setLastSaved] = useState('');

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
      if (key === 'publisherId') {
        const p = String(value || '').trim();
        if (p && !String(prev.clientId || '').trim()) {
          next.clientId = p.startsWith('ca-') ? p : `ca-${p}`;
        }
        // Keep ads.txt in sync when publisher changes and ads.txt is empty/auto
        const auto = defaultAdsTxt(prev.publisherId);
        if (!prev.adsTxt || prev.adsTxt.trim() === auto.trim() || prev.adsTxt.includes('pub-XXXXXXXX')) {
          next.adsTxt = defaultAdsTxt(p);
        }
      }
      if (key === 'clientId') {
        const c = String(value || '').trim();
        if (c && !String(prev.publisherId || '').trim()) {
          next.publisherId = c.startsWith('ca-') ? c.slice(3) : c;
        }
      }
      return next;
    });
    setHint('');
  };

  const hasCreds = useMemo(
    () =>
      String(form.publisherId || '').trim().length > 0 &&
      String(form.clientId || '').trim().length > 0,
    [form.publisherId, form.clientId]
  );

  const hasSlots = useMemo(
    () =>
      String(form.defaultSlot || '').trim().length > 0 ||
      String(form.slotLeaderboard || '').trim().length > 0 ||
      String(form.slotInArticle || '').trim().length > 0 ||
      String(form.slotSidebar || '').trim().length > 0 ||
      String(form.slotRail || '').trim().length > 0,
    [form.defaultSlot, form.slotLeaderboard, form.slotInArticle, form.slotSidebar, form.slotRail]
  );

  const hasAdsTxt = useMemo(
    () => String(form.adsTxt || '').trim().length > 0,
    [form.adsTxt]
  );

  // Left rail checks + right monitor use the same rules (no false checkmarks).
  const stepComplete = useMemo(
    () => ({
      0: !!form.enabled, // Status — only when ads ON
      1: hasCreds, // Credentials — publisher + client both filled
      2: hasSlots, // Ad slots — at least one slot ID
      3: !!form.inArticleEnabled, // Placement — in-article toggle ON
      4: hasAdsTxt, // ads.txt — body actually filled (not just because creds exist)
    }),
    [form.enabled, form.inArticleEnabled, hasCreds, hasSlots, hasAdsTxt]
  );

  const pipeline = useMemo(() => {
    const liveOk = !!form.enabled && hasCreds;
    let state = 'STANDBY';
    if (liveOk) state = 'LIVE';
    else if (hasCreds) state = 'CONFIGURED';
    return {
      creds: hasCreds,
      slots: hasSlots,
      place: !!form.inArticleEnabled,
      txt: hasAdsTxt,
      live: liveOk,
      state,
      isLive: liveOk,
    };
  }, [form.enabled, form.inArticleEnabled, hasCreds, hasSlots, hasAdsTxt]);

  const adsTxtPreview =
    String(form.adsTxt || '').trim() || defaultAdsTxt(form.publisherId);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    setHint('');
    try {
      const payload = {
        ...form,
        adsTxt: String(form.adsTxt || '').trim() || defaultAdsTxt(form.publisherId),
      };
      const result = await onSave(payload);
      if (result?.success) {
        setHint('AdSense settings saved.');
        setLastSaved(
          `Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        );
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
        setLastSaved('');
        setForm(EMPTY_FORM);
      } else {
        setHint(result?.error || 'Failed to clear credentials.');
      }
    } finally {
      setIsClearing(false);
    }
  };

  const goToStep = (i) => {
    if (i < 0 || i >= STEPS.length) return;
    setStep(i);
  };

  if (isLoading && !settings) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loadingBox}>
          <EmptyState>Loading AdSense settings…</EmptyState>
        </div>
      </div>
    );
  }

  const isComplete = (idx) => !!stepComplete[idx];

  return (
    <div className={styles.wrap}>
      <div className={styles.workspace}>
        {/* Step rail */}
        <nav className={styles.stepRail} aria-label="AdSense setup steps">
          {STEPS.map((s) => {
            const active = step === s.id;
            const complete = isComplete(s.id);
            return (
              <button
                key={s.id}
                type="button"
                className={[
                  styles.step,
                  active ? styles.stepActive : '',
                  complete ? styles.stepComplete : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => goToStep(s.id)}
                aria-current={active ? 'step' : undefined}
              >
                <div className={styles.stepIdx}>
                  <span>{s.id + 1}</span>
                  <CheckIcon />
                </div>
                <div className={styles.stepText}>
                  <strong>{s.label}</strong>
                  <span>{s.hint}</span>
                </div>
              </button>
            );
          })}
          <div className={styles.railDivider} />
          <div className={styles.railNote}>
            Steps auto-mark complete once required fields are filled. Nothing is written until you
            save.
          </div>
        </nav>

        {/* Active panel */}
        <div className={styles.panel}>
          {step === 0 && (
            <section className={styles.panelSection}>
              <div className={styles.panelHead}>
                <h2>Status</h2>
                <p className={styles.panelDesc}>
                  Control whether AdSense loads on the public site. Credentials are stored in the
                  database and used by all ad placements.
                </p>
              </div>
              <div
                className={styles.toggleRow}
                role="switch"
                aria-checked={!!form.enabled}
                tabIndex={0}
                onClick={() => setField('enabled', !form.enabled)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setField('enabled', !form.enabled);
                  }
                }}
              >
                <div className={`${styles.switch} ${form.enabled ? styles.switchOn : ''}`} />
                <div className={styles.toggleCopy}>
                  <strong>Enable AdSense on public site</strong>
                  <span>When off, the AdSense script and ad units will not load.</span>
                </div>
              </div>
              <span
                className={`${styles.statusPill} ${form.enabled ? styles.statusPillOn : ''}`}
              >
                <span className={styles.pillDot} />
                <span>{form.enabled ? 'ADS ON' : 'ADS OFF'}</span>
              </span>
            </section>
          )}

          {step === 1 && (
            <section className={styles.panelSection}>
              <div className={styles.panelHead}>
                <h2>Publisher credentials</h2>
                <p className={styles.panelDesc}>
                  Find these in your AdSense account under{' '}
                  <code className={styles.tag}>Account → Account information</code> /{' '}
                  <code className={styles.tag}>Ads → By ad unit</code>.
                </p>
              </div>
              <div className={styles.field}>
                <label htmlFor="ads-publisher">Publisher ID (pub-…)</label>
                <input
                  id="ads-publisher"
                  type="text"
                  value={form.publisherId}
                  onChange={(e) => setField('publisherId', e.target.value)}
                  placeholder="pub-XXXXXXXXXXXXXXXX"
                  autoComplete="off"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ads-client">Ad client (ca-pub-…)</label>
                <input
                  id="ads-client"
                  type="text"
                  value={form.clientId}
                  onChange={(e) => setField('clientId', e.target.value)}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  autoComplete="off"
                />
                <div className={styles.fieldHint}>Usually ca- + your publisher ID.</div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className={styles.panelSection}>
              <div className={styles.panelHead}>
                <h2>Ad slots</h2>
                <p className={styles.panelDesc}>
                  Slot IDs from <code className={styles.tag}>AdSense → Ads → By ad unit</code>. You
                  can reuse one slot until you create more.
                </p>
              </div>
              <div className={styles.field}>
                <label htmlFor="ads-slot-default">Default slot</label>
                <input
                  id="ads-slot-default"
                  type="text"
                  value={form.defaultSlot}
                  onChange={(e) => setField('defaultSlot', e.target.value)}
                  placeholder="Your AdSense slot ID"
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="ads-slot-leader">Leaderboard</label>
                  <input
                    id="ads-slot-leader"
                    type="text"
                    value={form.slotLeaderboard}
                    onChange={(e) => setField('slotLeaderboard', e.target.value)}
                    placeholder="Same as default if empty"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="ads-slot-inarticle">In-article</label>
                  <input
                    id="ads-slot-inarticle"
                    type="text"
                    value={form.slotInArticle}
                    onChange={(e) => setField('slotInArticle', e.target.value)}
                    placeholder="Same as default if empty"
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="ads-slot-sidebar">Sidebar</label>
                  <input
                    id="ads-slot-sidebar"
                    type="text"
                    value={form.slotSidebar}
                    onChange={(e) => setField('slotSidebar', e.target.value)}
                    placeholder="Same as default if empty"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="ads-slot-rail">Rail</label>
                  <input
                    id="ads-slot-rail"
                    type="text"
                    value={form.slotRail}
                    onChange={(e) => setField('slotRail', e.target.value)}
                    placeholder="Same as default if empty"
                  />
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className={styles.panelSection}>
              <div className={styles.panelHead}>
                <h2>In-article placement</h2>
                <p className={styles.panelDesc}>
                  Rules for how ads are woven between paragraphs on long posts.
                </p>
              </div>
              <div
                className={styles.toggleRow}
                role="switch"
                aria-checked={!!form.inArticleEnabled}
                tabIndex={0}
                onClick={() => setField('inArticleEnabled', !form.inArticleEnabled)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setField('inArticleEnabled', !form.inArticleEnabled);
                  }
                }}
              >
                <div
                  className={`${styles.switch} ${form.inArticleEnabled ? styles.switchOn : ''}`}
                />
                <div className={styles.toggleCopy}>
                  <strong>Insert in-article ads</strong>
                  <span>Place ads between paragraphs on long posts.</span>
                </div>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="ads-every-n">Every N paragraphs</label>
                  <input
                    id="ads-every-n"
                    type="number"
                    min={1}
                    max={20}
                    value={form.inArticleEveryN}
                    onChange={(e) => setField('inArticleEveryN', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="ads-min-before">Min paragraphs before first ad</label>
                  <input
                    id="ads-min-before"
                    type="number"
                    min={0}
                    max={20}
                    value={form.inArticleMinBefore}
                    onChange={(e) => setField('inArticleMinBefore', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="ads-max">Max in-article ads per post</label>
                <input
                  id="ads-max"
                  type="number"
                  min={0}
                  max={20}
                  value={form.inArticleMax}
                  onChange={(e) => setField('inArticleMax', e.target.value)}
                />
              </div>
              <div
                className={styles.toggleRow}
                style={{ marginTop: 6 }}
                role="switch"
                aria-checked={!!form.autoAdsEnabled}
                tabIndex={0}
                onClick={() => setField('autoAdsEnabled', !form.autoAdsEnabled)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setField('autoAdsEnabled', !form.autoAdsEnabled);
                  }
                }}
              >
                <div
                  className={`${styles.switch} ${form.autoAdsEnabled ? styles.switchOn : ''}`}
                />
                <div className={styles.toggleCopy}>
                  <strong>Auto ads flag (stored)</strong>
                  <span>
                    Reserved for Google Auto ads setup in AdSense. Manual slots still use the IDs
                    above.
                  </span>
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className={styles.panelSection}>
              <div className={styles.panelHead}>
                <h2>ads.txt</h2>
                <p className={styles.panelDesc}>
                  Content served at <code className={styles.tag}>/api/adsense/ads.txt</code> (and via
                  the site proxy). Update when you change the publisher ID.
                </p>
              </div>
              <div className={styles.field}>
                <label htmlFor="ads-txt">ads.txt body</label>
                <textarea
                  id="ads-txt"
                  rows={5}
                  value={form.adsTxt}
                  onChange={(e) => setField('adsTxt', e.target.value)}
                  placeholder={defaultAdsTxt(form.publisherId)}
                />
              </div>
            </section>
          )}

          <div className={styles.panelNav}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => goToStep(step - 1)}
              disabled={step === 0}
            >
              <ChevronLeft />
              Back
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => {
                if (step < STEPS.length - 1) goToStep(step + 1);
              }}
            >
              {step === STEPS.length - 1 ? (
                <>
                  Done
                  <CheckIcon />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live monitor */}
        <aside className={styles.monitor} aria-label="Delivery pipeline">
          <div className={styles.monitorLabel}>
            <span>Delivery pipeline</span>
            <span
              className={`${styles.pipelineState} ${pipeline.isLive ? styles.pipelineStateOn : ''}`}
            >
              {pipeline.state}
            </span>
          </div>

          <div className={styles.monitorList}>
            {[
              { key: 'creds', lit: pipeline.creds, title: 'Credentials', sub: 'publisher + client' },
              { key: 'slots', lit: pipeline.slots, title: 'Ad slots', sub: 'slot IDs mapped' },
              { key: 'place', lit: pipeline.place, title: 'Placement', sub: 'in-article rules set' },
              { key: 'txt', lit: pipeline.txt, title: 'ads.txt', sub: 'verification synced' },
              { key: 'live', lit: pipeline.live, title: 'Live on site', sub: 'serving to visitors' },
            ].map((row) => (
              <div
                key={row.key}
                className={`${styles.mRow} ${row.lit ? styles.mRowLit : ''}`}
              >
                <div className={styles.mDot}>
                  <CheckIcon />
                </div>
                <div className={styles.mCopy}>
                  <strong>{row.title}</strong>
                  <span>{row.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.monitorDivider} />

          <span className={`${styles.statusPill} ${form.enabled ? styles.statusPillOn : ''}`}>
            <span className={styles.pillDot} />
            <span>{form.enabled ? 'ADS ON' : 'ADS OFF'}</span>
          </span>

          <div className={styles.monitorBlock}>
            <div className={styles.mbLabel}>Publisher ID</div>
            <div className={`${styles.mbValue} ${styles.mbValueAccent}`}>
              {String(form.publisherId || '').trim() || '—'}
            </div>
          </div>
          <div className={styles.monitorBlock}>
            <div className={styles.mbLabel}>ads.txt preview</div>
            <div className={styles.mbValue}>{adsTxtPreview}</div>
          </div>
        </aside>
      </div>

      {/* Sticky action bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionInner}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={isSaving || isClearing}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              width="14"
              height="14"
              aria-hidden
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            {isSaving ? 'Saving…' : 'Save AdSense settings'}
          </button>

          {!confirmClear ? (
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => setConfirmClear(true)}
              disabled={isSaving || isClearing}
            >
              Delete credentials
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.btnDangerSolid}
                onClick={handleClear}
                disabled={isClearing}
              >
                {isClearing ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setConfirmClear(false)}
                disabled={isClearing}
              >
                Cancel
              </button>
            </>
          )}

          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => onRefresh?.()}
            disabled={isLoading || isSaving || isClearing}
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
            <RefreshIcon />
          </button>

          <span
            className={[
              styles.actionNote,
              hint &&
              (hint.toLowerCase().includes('saved') || hint.toLowerCase().includes('deleted'))
                ? styles.actionNoteOk
                : '',
              hint &&
              !hint.toLowerCase().includes('saved') &&
              !hint.toLowerCase().includes('deleted') &&
              hint
                ? styles.actionNoteErr
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {hint || lastSaved || 'Not saved yet'}
          </span>
        </div>
      </div>
    </div>
  );
}
