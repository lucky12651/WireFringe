import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import styles from './BotView.module.css';

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

function formFromSettings(settings) {
  if (!settings) return { ...EMPTY_FORM };
  return {
    enabled: settings.enabled !== false,
    hideArticles: !!settings.hideArticles,
    dailyLimit: Number(settings.dailyLimit) || 12,
    gapMinutes: Number(settings.gapMinutes) ?? 120,
    sleepSeconds: Number(settings.sleepSeconds) || 3600,
    queueCleanupHours: Number(settings.queueCleanupHours) || 24,
    recentCacheHours: Number(settings.recentCacheHours) || 2,
    maxItemsPerFeed: Number(settings.maxItemsPerFeed) || 5,
    processPerCycle: Number(settings.processPerCycle) || 1,
  };
}

function fmtSeconds(s) {
  const n = Number(s) || 0;
  if (n >= 3600) return `${(n / 3600).toFixed(n % 3600 === 0 ? 0 : 1)}h`;
  if (n >= 60) return `${Math.round(n / 60)}m`;
  return `${n}s`;
}

const PowerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 2v10" />
    <path d="M18.4 6.6a9 9 0 11-12.8 0" />
  </svg>
);

const IconSleep = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 3a6 6 0 000 12 6 6 0 006-6 8 8 0 11-6-6z" />
  </svg>
);

const IconFetch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M4 4v6h6M20 20v-6h-6" />
    <path d="M20 9a8 8 0 00-14.4-3.4M4 15a8 8 0 0014.4 3.4" />
  </svg>
);

const IconPublish = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconProcess = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 9h6v6H9z" />
  </svg>
);

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
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [isTogglingPower, setIsTogglingPower] = useState(false);

  // Prevent late refresh responses from overwriting in-progress edits / toggles.
  const dirtyRef = useRef(false);
  const acceptServerRef = useRef(true);
  const formRef = useRef(form);
  formRef.current = form;

  const stats = settings?.stats || {
    totalBotPosts: 0,
    hiddenBotPosts: 0,
    visibleBotPosts: 0,
  };

  useEffect(() => {
    if (!settings) return;
    // Only apply server → form when we asked for it (mount, save, power, refresh).
    // This blocks late/stale GET responses from flipping the switch back after a few seconds.
    if (!acceptServerRef.current) return;
    setForm(formFromSettings(settings));
    dirtyRef.current = false;
    acceptServerRef.current = false;
  }, [settings]);

  useEffect(() => {
    acceptServerRef.current = true;
    onRefresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, value) => {
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
    setHint('');
  };

  const botOn = !!form.enabled;

  const loopVals = useMemo(
    () => ({
      sleep: `${Number(form.sleepSeconds) || 0}s`,
      fetch: `≤${Number(form.maxItemsPerFeed) || 0} / feed`,
      process: `${Number(form.processPerCycle) || 0} / cycle`,
      publish: `${Number(form.gapMinutes) || 0}m gap · ${Number(form.dailyLimit) || 0}/day`,
      cycleTotal: fmtSeconds(form.sleepSeconds),
    }),
    [form.sleepSeconds, form.maxItemsPerFeed, form.processPerCycle, form.gapMinutes, form.dailyLimit]
  );

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    setHint('');
    try {
      acceptServerRef.current = true;
      const result = await onSave(formRef.current);
      if (result?.success) {
        dirtyRef.current = false;
        setHint('Bot settings saved.');
      } else {
        acceptServerRef.current = false;
        setHint(result?.error || 'Failed to save.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  /** Power switch saves immediately so a later refresh cannot flip it back. */
  const handlePowerToggle = async () => {
    if (isTogglingPower || isSaving || isTogglingVisibility) return;
    const next = !formRef.current.enabled;
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, enabled: next }));
    setIsTogglingPower(true);
    setHint('');
    try {
      acceptServerRef.current = true;
      const result = await onSave({ ...formRef.current, enabled: next });
      if (result?.success) {
        dirtyRef.current = false;
        setHint(next ? 'Bot turned ON and saved.' : 'Bot turned OFF and saved.');
      } else {
        acceptServerRef.current = false;
        setForm((prev) => ({ ...prev, enabled: !next }));
        setHint(result?.error || 'Failed to update bot power.');
      }
    } catch (err) {
      acceptServerRef.current = false;
      setForm((prev) => ({ ...prev, enabled: !next }));
      setHint(err?.message || 'Failed to update bot power.');
    } finally {
      setIsTogglingPower(false);
    }
  };

  /** Toggle applies hide/unhide to all bot posts immediately. */
  const handleVisibilityToggle = async () => {
    if (isTogglingVisibility || isSaving || isTogglingPower) return;
    const next = !formRef.current.hideArticles;
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, hideArticles: next }));
    setIsTogglingVisibility(true);
    setHint('');
    try {
      const result = next ? await onHideArticles?.() : await onUnhideArticles?.();
      if (result?.success) {
        // Keep local enabled + other fields; only trust hideArticles from this action.
        // Stats still come from settings; do not let full settings overwrite form.
        acceptServerRef.current = false;
        dirtyRef.current = false;
        setForm((prev) => ({ ...prev, hideArticles: next }));
        const n = result.data?.updated ?? 0;
        setHint(
          next
            ? `Hidden ${n} bot article(s). They no longer appear on the public site.`
            : `Unhid ${n} bot article(s). They are visible on the public site again.`
        );
      } else {
        setForm((prev) => ({ ...prev, hideArticles: !next }));
        setHint(result?.error || (next ? 'Failed to hide articles.' : 'Failed to unhide articles.'));
      }
    } catch (err) {
      setForm((prev) => ({ ...prev, hideArticles: !next }));
      setHint(err?.message || 'Failed to update visibility.');
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const handleRefresh = async () => {
    acceptServerRef.current = true;
    dirtyRef.current = false;
    setHint('');
    await onRefresh?.();
  };

  const hintOk =
    hint &&
    (hint.toLowerCase().includes('saved') ||
      hint.toLowerCase().includes('turned') ||
      hint.toLowerCase().includes('hidden') ||
      hint.toLowerCase().includes('unhid'));

  if (isLoading && !settings) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loadingBox}>
          <EmptyState>Loading bot settings…</EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* Engine console */}
      <section className={styles.console} aria-label="Bot engine console">
        <div className={styles.consolePower}>
          <div className={styles.cLabel}>Power</div>
          <div className={styles.powerRow}>
            <button
              type="button"
              className={`${styles.powerBtn} ${botOn ? styles.powerBtnOn : ''}`}
              role="switch"
              aria-checked={botOn}
              aria-busy={isTogglingPower}
              aria-label="Bot enabled"
              disabled={isTogglingPower || isSaving}
              onClick={() => handlePowerToggle()}
            >
              <PowerIcon />
            </button>
            <div className={styles.powerCopy}>
              <strong>Bot enabled</strong>
              <span>
                {isTogglingPower
                  ? 'Saving power state…'
                  : 'Turn automated article publishing on or off. Saves immediately.'}
              </span>
              <div className={`${styles.powerState} ${botOn ? styles.powerStateOn : ''}`}>
                <span className={styles.powerDot} />
                <span>{botOn ? 'BOT ON' : 'BOT OFF'}</span>
              </div>
            </div>
          </div>
          <p className={styles.powerDesc}>
            When off, the news bot skips gathering feeds and publishing. The loop still sleeps and
            checks this flag each cycle.
          </p>
        </div>

        <div className={styles.consoleStats}>
          <div className={styles.cLabel}>Bot article stats</div>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <div className={styles.statN}>{stats.totalBotPosts}</div>
              <div className={styles.statL}>Total bot posts</div>
              <div className={styles.statS}>All time</div>
            </div>
            <div className={styles.stat}>
              <div className={`${styles.statN} ${styles.statNGood}`}>{stats.visibleBotPosts}</div>
              <div className={styles.statL}>Visible</div>
              <div className={styles.statS}>On site</div>
            </div>
            <div className={styles.stat}>
              <div className={`${styles.statN} ${styles.statNBad}`}>{stats.hiddenBotPosts}</div>
              <div className={styles.statL}>Hidden</div>
              <div className={styles.statS}>Filtered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cycle loop */}
      <section className={styles.loopCard} aria-label="Cycle loop">
        <div className={styles.loopHead}>
          <h2>Cycle loop</h2>
          <span className={styles.loopTot}>
            CYCLE TIME ≈ <strong>{loopVals.cycleTotal}</strong>
          </span>
        </div>
        <p className={styles.loopSub}>
          One pass through the loop. Timing comes from the values below — edit them and the loop
          updates.
        </p>

        <div className={styles.loopWrap}>
          <div className={styles.loopRing}>
            <svg className={styles.track} viewBox="0 0 320 320" aria-hidden>
              <circle className={styles.trackBase} cx="160" cy="160" r="128" />
              <circle
                className={`${styles.trackProgress} ${botOn ? styles.trackProgressLive : ''}`}
                cx="160"
                cy="160"
                r="128"
              />
            </svg>

            <div className={styles.loopCenter}>
              <div
                className={`${styles.loopCenterState} ${
                  botOn ? styles.loopCenterStateLive : ''
                }`}
              >
                {botOn ? 'ACTIVE' : 'DORMANT'}
              </div>
              <div className={styles.loopCenterSub}>
                {botOn ? 'cycling now' : 'bot is off'}
              </div>
            </div>

            <div
              className={`${styles.loopNode} ${styles.nTop} ${
                botOn ? styles.loopNodeLive : ''
              }`}
            >
              <div className={styles.lnChip}>
                <IconSleep />
              </div>
              <div className={styles.lnTitle}>Sleep</div>
              <div className={styles.lnVal}>{loopVals.sleep}</div>
            </div>

            <div
              className={`${styles.loopNode} ${styles.nRight} ${
                botOn ? styles.loopNodeLive : ''
              }`}
            >
              <div className={styles.lnChip}>
                <IconFetch />
              </div>
              <div className={styles.lnTitle}>Fetch</div>
              <div className={styles.lnVal}>{loopVals.fetch}</div>
            </div>

            <div
              className={`${styles.loopNode} ${styles.nBottom} ${
                botOn ? styles.loopNodeLive : ''
              }`}
            >
              <div className={styles.lnChip}>
                <IconPublish />
              </div>
              <div className={styles.lnTitle}>Publish</div>
              <div className={styles.lnVal}>{loopVals.publish}</div>
            </div>

            <div
              className={`${styles.loopNode} ${styles.nLeft} ${
                botOn ? styles.loopNodeLive : ''
              }`}
            >
              <div className={styles.lnChip}>
                <IconProcess />
              </div>
              <div className={styles.lnTitle}>Process</div>
              <div className={styles.lnVal}>{loopVals.process}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Settings grid */}
      <form onSubmit={handleSave} className={styles.grid}>
        <div className={`${styles.card} ${styles.cardFull}`}>
          <h3 className={styles.cardTitle}>Visibility</h3>
          <p className={styles.cardDesc}>
            Hide bot posts from the public site without deleting them. Admins still see them in
            Posts. Toggling applies to all existing bot articles right away.
          </p>

          <div
            className={styles.toggleRow}
            role="switch"
            aria-checked={!!form.hideArticles}
            aria-busy={isTogglingVisibility}
            tabIndex={isTogglingVisibility ? -1 : 0}
            onClick={() => handleVisibilityToggle()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleVisibilityToggle();
              }
            }}
            style={isTogglingVisibility ? { opacity: 0.7, pointerEvents: 'none' } : undefined}
          >
            <div
              className={`${styles.switch} ${form.hideArticles ? styles.switchOn : ''}`}
            />
            <div className={styles.toggleCopy}>
              <strong>
                {isTogglingVisibility
                  ? 'Updating visibility…'
                  : form.hideArticles
                    ? 'Bot articles hidden from public site'
                    : 'Hide all bot articles'}
              </strong>
              <span>
                When on, public feeds exclude bot posts and existing bot articles are hidden. When
                off, they are shown again. New bot posts follow this setting too.
              </span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Publishing limits</h3>
          <div className={styles.field}>
            <label htmlFor="bot-daily">Daily post limit</label>
            <input
              id="bot-daily"
              type="number"
              min={1}
              max={100}
              value={form.dailyLimit}
              onChange={(e) => setField('dailyLimit', e.target.value)}
            />
            <div className={styles.fieldHint}>Max bot posts published per UTC day.</div>
          </div>
          <div className={styles.field}>
            <label htmlFor="bot-gap">Gap between posts (minutes)</label>
            <input
              id="bot-gap"
              type="number"
              min={0}
              max={1440}
              value={form.gapMinutes}
              onChange={(e) => setField('gapMinutes', e.target.value)}
            />
            <div className={styles.fieldHint}>
              Minimum wait between bot publications (0 = no gap).
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="bot-cycle">Articles processed per cycle</label>
            <input
              id="bot-cycle"
              type="number"
              min={1}
              max={10}
              value={form.processPerCycle}
              onChange={(e) => setField('processPerCycle', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Cycle &amp; cleanup</h3>
          <div className={styles.field}>
            <label htmlFor="bot-sleep">Sleep between cycles (seconds)</label>
            <input
              id="bot-sleep"
              type="number"
              min={60}
              max={86400}
              value={form.sleepSeconds}
              onChange={(e) => setField('sleepSeconds', e.target.value)}
            />
            <div className={styles.fieldHint}>Default 3600 (1 hour). Min 60.</div>
          </div>
          <div className={styles.field}>
            <label htmlFor="bot-max">Max items per RSS feed</label>
            <input
              id="bot-max"
              type="number"
              min={1}
              max={50}
              value={form.maxItemsPerFeed}
              onChange={(e) => setField('maxItemsPerFeed', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="bot-queue">Queue cleanup (hours)</label>
            <input
              id="bot-queue"
              type="number"
              min={1}
              max={168}
              value={form.queueCleanupHours}
              onChange={(e) => setField('queueCleanupHours', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="bot-cache">Recent-cache window (hours)</label>
            <input
              id="bot-cache"
              type="number"
              min={1}
              max={72}
              value={form.recentCacheHours}
              onChange={(e) => setField('recentCacheHours', e.target.value)}
            />
            <div className={styles.fieldHint}>Used for duplicate title/URL checks.</div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardFull} ${styles.actionBar}`}>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isSaving || isTogglingVisibility || isTogglingPower}
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
            {isSaving ? 'Saving…' : 'Save bot settings'}
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => handleRefresh()}
            disabled={isLoading || isSaving || isTogglingVisibility || isTogglingPower}
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          {hint ? (
            <span
              className={`${styles.actionNote} ${
                hintOk ? styles.actionNoteOk : styles.actionNoteErr
              }`}
            >
              {hint}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
