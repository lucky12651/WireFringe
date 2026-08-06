import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { cn } from '../../../lib/utils';

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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="w-6 h-6">
    <path d="M12 2v10" />
    <path d="M18.4 6.6a9 9 0 11-12.8 0" />
  </svg>
);

const IconSleep = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="w-[22px] h-[22px]">
    <path d="M12 3a6 6 0 000 12 6 6 0 006-6 8 8 0 11-6-6z" />
  </svg>
);

const IconFetch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="w-[22px] h-[22px]">
    <path d="M4 4v6h6M20 20v-6h-6" />
    <path d="M20 9a8 8 0 00-14.4-3.4M4 15a8 8 0 0014.4 3.4" />
  </svg>
);

const IconPublish = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="w-[22px] h-[22px]">
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconProcess = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="w-[22px] h-[22px]">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 9h6v6H9z" />
  </svg>
);

function SwitchKnob({ on }) {
  return (
    <div
      className={cn(
        'relative shrink-0 w-[42px] h-6 rounded-full border mt-0.5 transition-colors',
        on ? 'bg-mint/15 border-mint' : 'bg-[#1a1a1a] border-line'
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-all duration-200',
          on
            ? 'translate-x-[18px] bg-mint shadow-[0_0_8px_rgba(60,255,208,0.35)]'
            : 'bg-[#888]'
        )}
      />
    </div>
  );
}

const fieldLabel =
  'block font-mono text-xs tracking-[0.06em] text-[#aaa] mb-2 uppercase font-semibold';
const fieldInput =
  'w-full bg-[#0a0a0a] border border-line text-white font-mono text-[15px] py-3 px-3.5 rounded-md outline-none transition-[border-color,box-shadow] box-border leading-snug focus:border-mint focus:shadow-[0_0_0_3px_rgba(60,255,208,0.2)]';
const cardClass =
  'bg-bg-elevated border border-line rounded-lg py-6 px-[26px] pb-[26px] min-w-0 max-[720px]:p-5';

function LoopNode({ live, position, icon, title, value }) {
  return (
    <div
      className={cn(
        'absolute w-[120px] max-[720px]:w-24 flex flex-col items-center gap-2 text-center',
        position
      )}
    >
      <div
        className={cn(
          'w-[54px] h-[54px] rounded-full border-[1.5px] bg-[#0a0a0a] flex items-center justify-center transition-all',
          live ? 'border-mint shadow-[0_0_14px_rgba(60,255,208,0.3)] text-mint' : 'border-line text-[#666]'
        )}
      >
        {icon}
      </div>
      <div className="text-[13.5px] max-[720px]:text-xs font-semibold text-white">{title}</div>
      <div className="font-mono text-xs max-[720px]:text-[11px] text-[#888]">{value}</div>
    </div>
  );
}

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
      <div className="flex flex-col w-full animate-fade-up">
        <div className="border border-line rounded-lg bg-bg-elevated py-12 px-6 text-center text-[#b0b0b0] text-[15px]">
          <EmptyState>Loading bot settings…</EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full animate-fade-up motion-reduce:animate-none">
      <section
        className="grid grid-cols-1 min-[1051px]:grid-cols-2 gap-0 bg-bg-elevated border border-line rounded-lg overflow-hidden mb-5"
        aria-label="Bot engine console"
      >
        <div className="py-[26px] px-[30px] max-[720px]:p-5 min-[1051px]:border-r border-line max-[1050px]:border-b border-line">
          <div className="font-mono text-xs tracking-[0.12em] text-[#888] mb-4 uppercase font-semibold">
            Power
          </div>
          <div className="flex items-center gap-[18px]">
            <button
              type="button"
              className={cn(
                'w-[58px] h-[58px] rounded-full shrink-0 border-2 bg-[#0a0a0a] flex items-center justify-center cursor-pointer transition-all duration-300 p-0',
                botOn
                  ? 'border-mint bg-mint/10 shadow-[0_0_20px_rgba(60,255,208,0.28)] text-mint'
                  : 'border-line text-[#666]'
              )}
              role="switch"
              aria-checked={botOn}
              aria-busy={isTogglingPower}
              aria-label="Bot enabled"
              disabled={isTogglingPower || isSaving}
              onClick={() => handlePowerToggle()}
            >
              <PowerIcon />
            </button>
            <div>
              <strong className="block text-base font-bold mb-1 text-white">Bot enabled</strong>
              <span className="text-[13.5px] text-[#b0b0b0] leading-snug">
                {isTogglingPower
                  ? 'Saving power state…'
                  : 'Turn automated article publishing on or off. Saves immediately.'}
              </span>
              <div
                className={cn(
                  'font-mono text-xs tracking-[0.08em] py-1.5 px-3 rounded-full border inline-flex items-center gap-2 mt-3 font-semibold',
                  botOn ? 'text-mint border-mint' : 'text-[#888] border-line'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full inline-block shrink-0',
                    botOn
                      ? 'bg-mint shadow-[0_0_6px_rgba(60,255,208,0.5)] animate-pulse motion-reduce:animate-none'
                      : 'bg-[#666]'
                  )}
                />
                <span>{botOn ? 'BOT ON' : 'BOT OFF'}</span>
              </div>
            </div>
          </div>
          <p className="text-[13.5px] text-[#888] leading-relaxed mt-[18px] mb-0 max-w-[48ch]">
            When off, the news bot skips gathering feeds and publishing. The loop still sleeps and
            checks this flag each cycle.
          </p>
        </div>

        <div className="py-[26px] px-[30px] max-[720px]:p-5 flex flex-col justify-center">
          <div className="font-mono text-xs tracking-[0.12em] text-[#888] mb-4 uppercase font-semibold">
            Bot article stats
          </div>
          <div className="flex gap-0 flex-wrap">
            <div className="flex-1 text-left pr-5 min-w-[100px]">
              <div className="font-mono font-extrabold text-[32px] leading-none text-white">
                {stats.totalBotPosts}
              </div>
              <div className="text-[13px] text-[#b0b0b0] mt-2.5 font-medium">Total bot posts</div>
              <div className="text-[11px] text-[#666] font-mono uppercase tracking-wide mt-0.5">All time</div>
            </div>
            <div className="flex-1 text-left pr-5 min-w-[100px]">
              <div className="font-mono font-extrabold text-[32px] leading-none text-mint">
                {stats.visibleBotPosts}
              </div>
              <div className="text-[13px] text-[#b0b0b0] mt-2.5 font-medium">Visible</div>
              <div className="text-[11px] text-[#666] font-mono uppercase tracking-wide mt-0.5">On site</div>
            </div>
            <div className="flex-1 text-left pr-5 min-w-[100px]">
              <div className="font-mono font-extrabold text-[32px] leading-none text-[#ff6b6b]">
                {stats.hiddenBotPosts}
              </div>
              <div className="text-[13px] text-[#b0b0b0] mt-2.5 font-medium">Hidden</div>
              <div className="text-[11px] text-[#666] font-mono uppercase tracking-wide mt-0.5">Filtered</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-elevated border border-line rounded-lg py-7 px-[30px] pb-8 mb-5 max-[720px]:p-5" aria-label="Cycle loop">
        <div className="flex justify-between items-baseline mb-1 gap-3 flex-wrap">
          <h2 className="text-lg m-0 font-bold text-white tracking-tight">Cycle loop</h2>
          <span className="font-mono text-[12.5px] text-[#666]">
            CYCLE TIME ≈ <strong className="text-[#c0c0c0]">{loopVals.cycleTotal}</strong>
          </span>
        </div>
        <p className="text-[13.5px] text-[#888] mt-1 mb-6 leading-normal">
          One pass through the loop. Timing comes from the values below — edit them and the loop
          updates.
        </p>

        <div className="flex justify-center">
          <div className="relative w-80 h-80 max-[720px]:w-[280px] max-[720px]:h-[280px]">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320" aria-hidden>
              <circle cx="160" cy="160" r="128" fill="none" stroke="#2a2a2a" strokeWidth="1.5" />
              <circle
                cx="160"
                cy="160"
                r="128"
                fill="none"
                stroke="#3cffd0"
                strokeWidth="1.5"
                strokeDasharray="6 10"
                className={cn(
                  'origin-center transition-opacity duration-300',
                  botOn ? 'opacity-100 animate-spin [animation-duration:6s] motion-reduce:animate-none' : 'opacity-0'
                )}
                style={{ transformOrigin: '160px 160px' }}
              />
            </svg>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-[130px]">
              <div
                className={cn(
                  'font-mono font-extrabold text-sm tracking-[0.06em]',
                  botOn ? 'text-mint' : 'text-[#666]'
                )}
              >
                {botOn ? 'ACTIVE' : 'DORMANT'}
              </div>
              <div className="text-xs text-[#666] font-mono mt-1.5">
                {botOn ? 'cycling now' : 'bot is off'}
              </div>
            </div>

            <LoopNode live={botOn} position="top-0 left-1/2 -translate-x-1/2" icon={<IconSleep />} title="Sleep" value={loopVals.sleep} />
            <LoopNode live={botOn} position="top-1/2 -right-2 -translate-y-1/2" icon={<IconFetch />} title="Fetch" value={loopVals.fetch} />
            <LoopNode live={botOn} position="bottom-0 left-1/2 -translate-x-1/2" icon={<IconPublish />} title="Publish" value={loopVals.publish} />
            <LoopNode live={botOn} position="top-1/2 -left-2 -translate-y-1/2" icon={<IconProcess />} title="Process" value={loopVals.process} />
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="grid grid-cols-1 min-[721px]:grid-cols-2 gap-[18px]">
        <div className={cn(cardClass, 'col-span-full')}>
          <h3 className="text-[17px] font-bold m-0 mb-2 text-white tracking-tight">Visibility</h3>
          <p className="text-sm text-[#b0b0b0] leading-snug m-0 mb-5">
            Hide bot posts from the public site without deleting them. Admins still see them in
            Posts. Toggling applies to all existing bot articles right away.
          </p>

          <div
            className={cn(
              'flex items-start gap-4 bg-[#0a0a0a] border border-line rounded-lg py-4 px-[18px] mb-[18px] cursor-pointer select-none hover:border-mint/20',
              isTogglingVisibility && 'opacity-70 pointer-events-none'
            )}
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
          >
            <SwitchKnob on={!!form.hideArticles} />
            <div>
              <strong className="block text-[15px] font-semibold mb-1 text-white">
                {isTogglingVisibility
                  ? 'Updating visibility…'
                  : form.hideArticles
                    ? 'Bot articles hidden from public site'
                    : 'Hide all bot articles'}
              </strong>
              <span className="text-[13.5px] text-[#b0b0b0] leading-snug">
                When on, public feeds exclude bot posts and existing bot articles are hidden. When
                off, they are shown again. New bot posts follow this setting too.
              </span>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="text-[17px] font-bold m-0 mb-2 text-white tracking-tight">Publishing limits</h3>
          <div className="mb-[18px] last:mb-0">
            <label htmlFor="bot-daily" className={fieldLabel}>Daily post limit</label>
            <input
              id="bot-daily"
              type="number"
              min={1}
              max={100}
              value={form.dailyLimit}
              onChange={(e) => setField('dailyLimit', e.target.value)}
              className={fieldInput}
            />
            <div className="text-[13px] text-[#888] mt-2 leading-snug">Max bot posts published per UTC day.</div>
          </div>
          <div className="mb-[18px] last:mb-0">
            <label htmlFor="bot-gap" className={fieldLabel}>Gap between posts (minutes)</label>
            <input
              id="bot-gap"
              type="number"
              min={0}
              max={1440}
              value={form.gapMinutes}
              onChange={(e) => setField('gapMinutes', e.target.value)}
              className={fieldInput}
            />
            <div className="text-[13px] text-[#888] mt-2 leading-snug">
              Minimum wait between bot publications (0 = no gap).
            </div>
          </div>
          <div className="mb-0">
            <label htmlFor="bot-cycle" className={fieldLabel}>Articles processed per cycle</label>
            <input
              id="bot-cycle"
              type="number"
              min={1}
              max={10}
              value={form.processPerCycle}
              onChange={(e) => setField('processPerCycle', e.target.value)}
              className={fieldInput}
            />
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="text-[17px] font-bold m-0 mb-2 text-white tracking-tight">Cycle &amp; cleanup</h3>
          <div className="mb-[18px]">
            <label htmlFor="bot-sleep" className={fieldLabel}>Sleep between cycles (seconds)</label>
            <input
              id="bot-sleep"
              type="number"
              min={60}
              max={86400}
              value={form.sleepSeconds}
              onChange={(e) => setField('sleepSeconds', e.target.value)}
              className={fieldInput}
            />
            <div className="text-[13px] text-[#888] mt-2 leading-snug">Default 3600 (1 hour). Min 60.</div>
          </div>
          <div className="mb-[18px]">
            <label htmlFor="bot-max" className={fieldLabel}>Max items per RSS feed</label>
            <input
              id="bot-max"
              type="number"
              min={1}
              max={50}
              value={form.maxItemsPerFeed}
              onChange={(e) => setField('maxItemsPerFeed', e.target.value)}
              className={fieldInput}
            />
          </div>
          <div className="mb-[18px]">
            <label htmlFor="bot-queue" className={fieldLabel}>Queue cleanup (hours)</label>
            <input
              id="bot-queue"
              type="number"
              min={1}
              max={168}
              value={form.queueCleanupHours}
              onChange={(e) => setField('queueCleanupHours', e.target.value)}
              className={fieldInput}
            />
          </div>
          <div className="mb-0">
            <label htmlFor="bot-cache" className={fieldLabel}>Recent-cache window (hours)</label>
            <input
              id="bot-cache"
              type="number"
              min={1}
              max={72}
              value={form.recentCacheHours}
              onChange={(e) => setField('recentCacheHours', e.target.value)}
              className={fieldInput}
            />
            <div className="text-[13px] text-[#888] mt-2 leading-snug">Used for duplicate title/URL checks.</div>
          </div>
        </div>

        <div className={cn(cardClass, 'col-span-full flex items-center gap-3.5 flex-wrap')}>
          <button
            type="submit"
            className="font-mono font-bold text-sm tracking-[0.03em] bg-mint text-black border-none rounded-md py-3.5 px-[22px] cursor-pointer inline-flex items-center gap-2 transition-all enabled:hover:bg-[#2ee6b8] enabled:hover:-translate-y-px disabled:opacity-55 disabled:cursor-not-allowed"
            disabled={isSaving || isTogglingVisibility || isTogglingPower}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
            {isSaving ? 'Saving…' : 'Save bot settings'}
          </button>
          <button
            type="button"
            className="font-mono text-[13px] tracking-[0.04em] text-[#c8c8c8] bg-transparent border border-line rounded-md py-3 px-4 cursor-pointer inline-flex items-center gap-2 font-semibold enabled:hover:border-mint/35 enabled:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleRefresh()}
            disabled={isLoading || isSaving || isTogglingVisibility || isTogglingPower}
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          {hint ? (
            <span
              className={cn(
                'text-[13px] ml-auto max-[720px]:ml-0 max-[720px]:w-full font-mono',
                hintOk ? 'text-mint' : 'text-[#ff6b6b]'
              )}
            >
              {hint}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
