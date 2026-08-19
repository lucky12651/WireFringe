import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { ContentPipeline } from '../shared/ContentPipeline';
import { LogsView } from './LogsView';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

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
  autoPublish: false,
  maxAgeHours: 6,
  countries: ['india', 'us', 'uk', 'world'],
  sections: [
    'Tech',
    'AI & Future Tech',
    'Business & Markets',
    'Personal Finance',
    'India News',
    'Sports',
    'World',
  ],
  feeds: [],
  writerPrompt: '',
  focusNote: '',
};

function formFromSettings(settings, fallback = EMPTY_FORM) {
  if (!settings) return { ...fallback };
  return {
    enabled: settings.enabled !== false,
    hideArticles: !!settings.hideArticles,
    autoPublish: !!settings.autoPublish,
    dailyLimit: Number(settings.dailyLimit) || 12,
    gapMinutes: Number(settings.gapMinutes) ?? 120,
    sleepSeconds: Number(settings.sleepSeconds) || 3600,
    queueCleanupHours: Number(settings.queueCleanupHours) || 24,
    recentCacheHours: Number(settings.recentCacheHours) || 2,
    maxItemsPerFeed: Number(settings.maxItemsPerFeed) || 5,
    processPerCycle: Number(settings.processPerCycle) || 1,
    maxAgeHours: Number(settings.maxAgeHours) || 6,
    // Keep empty arrays / blank prompt — do not fall back to defaults after save.
    countries: Array.isArray(settings.countries)
      ? settings.countries
      : [...fallback.countries],
    sections: Array.isArray(settings.sections)
      ? settings.sections
      : [...fallback.sections],
    feeds: Array.isArray(settings.feeds) ? settings.feeds : [...(fallback.feeds || [])],
    writerPrompt: settings.writerPrompt ?? fallback.writerPrompt ?? '',
    focusNote: settings.focusNote ?? fallback.focusNote ?? '',
  };
}

function mergeSavedSettings(local, server) {
  const src = { ...local, ...(server || {}) };
  // If the API omitted editorial keys (stale schema), keep what the editor just saved.
  if (!Array.isArray(server?.countries)) src.countries = local.countries;
  if (!Array.isArray(server?.sections)) src.sections = local.sections;
  if (!Array.isArray(server?.feeds)) src.feeds = local.feeds;
  if (server?.writerPrompt == null) src.writerPrompt = local.writerPrompt;
  if (server?.focusNote == null) src.focusNote = local.focusNote;
  if (server?.maxAgeHours == null) src.maxAgeHours = local.maxAgeHours;
  return formFromSettings(src, local);
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
        on ? 'bg-mint/15 border-mint' : 'bg-bg-hover border-line'
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] left-[3px] w-4 h-4 rounded-full transition-all duration-200',
          on
            ? 'translate-x-[18px] bg-mint shadow-[0_0_8px_rgba(255,255,255,0.35)]'
            : 'bg-[#888]'
        )}
      />
    </div>
  );
}

const fieldLabel =
  'block font-mono text-xs tracking-[0.06em] text-ink-tertiary mb-2 uppercase font-semibold';
const fieldInput =
  'w-full bg-bg-elevated border border-line text-ink font-mono text-[15px] py-3 px-3.5 rounded-md outline-none transition-[border-color,box-shadow] box-border leading-snug focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]';

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
          'w-[54px] h-[54px] rounded-full border-[1.5px] bg-bg-elevated flex items-center justify-center transition-all',
          live ? 'border-mint text-mint' : 'border-line text-ink-muted'
        )}
      >
        {icon}
      </div>
      <div className="text-[13.5px] max-[720px]:text-xs font-semibold text-ink">{title}</div>
      <div className="font-mono text-xs max-[720px]:text-[11px] text-ink-tertiary">{value}</div>
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
  queueCount = 0,
  recentCache = [],
  logs = [],
  onRefreshLogs,
  logsLoading = false,
  initialTab = 'engine',
}) {
  const [activeTab, setActiveTab] = useState(
    initialTab === 'logs' ? 'logs' : 'engine'
  );
  const [form, setForm] = useState(() => formFromSettings(settings));
  const [hint, setHint] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [isTogglingPower, setIsTogglingPower] = useState(false);
  const [customFeed, setCustomFeed] = useState({
    label: '',
    url: '',
    country: 'world',
    section: 'World',
  });

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

  // Allow parent to open Logs tab (e.g. legacy /admin logs nav)
  useEffect(() => {
    if (initialTab === 'logs') setActiveTab('logs');
  }, [initialTab]);

  const setField = (key, value) => {
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
    setHint('');
  };

  const botOn = !!form.enabled;
  const catalog = settings?.catalog || {
    countries: [
      { id: 'india', label: 'India' },
      { id: 'us', label: 'United States' },
      { id: 'uk', label: 'United Kingdom' },
      { id: 'world', label: 'World' },
    ],
    sections: EMPTY_FORM.sections,
  };

  const toggleCountry = (id) => {
    setField(
      'countries',
      form.countries.includes(id)
        ? form.countries.filter((c) => c !== id)
        : [...form.countries, id]
    );
  };

  const toggleSection = (name) => {
    setField(
      'sections',
      form.sections.includes(name)
        ? form.sections.filter((s) => s !== name)
        : [...form.sections, name]
    );
  };

  const toggleFeed = (id) => {
    setField(
      'feeds',
      form.feeds.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const addCustomFeed = () => {
    const url = customFeed.url.trim();
    if (!url.startsWith('http')) {
      setHint('Enter a valid RSS URL starting with http.');
      return;
    }
    const id = `custom-${Date.now()}`;
    setField('feeds', [
      ...form.feeds,
      {
        id,
        url,
        label: customFeed.label.trim() || 'Custom feed',
        country: customFeed.country,
        section: customFeed.section,
        enabled: true,
      },
    ]);
    setCustomFeed({ label: '', url: '', country: 'world', section: 'World' });
  };

  const removeFeed = (id) => {
    setField(
      'feeds',
      form.feeds.filter((f) => f.id !== id)
    );
  };

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
    const snapshot = { ...formRef.current };
    try {
      // Block the settings-sync effect until we merge, so a partial API
      // response cannot wipe countries / prompt / feeds after Save.
      acceptServerRef.current = false;
      const result = await onSave(snapshot);
      if (result?.success) {
        const next = mergeSavedSettings(snapshot, result.data);
        setForm(next);
        formRef.current = next;
        dirtyRef.current = false;
        setHint('Bot settings saved.');
      } else {
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
      acceptServerRef.current = false;
      const snapshot = { ...formRef.current, enabled: next };
      const result = await onSave(snapshot);
      if (result?.success) {
        const merged = mergeSavedSettings(snapshot, result.data);
        setForm(merged);
        formRef.current = merged;
        dirtyRef.current = false;
        setHint(next ? 'Bot turned ON and saved.' : 'Bot turned OFF and saved.');
      } else {
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

  const handleAutoPublishToggle = async () => {
    if (isTogglingPower || isSaving || isTogglingVisibility) return;
    const next = !formRef.current.autoPublish;
    setForm((prev) => ({ ...prev, autoPublish: next }));
    setHint('');
    try {
      acceptServerRef.current = false;
      const snapshot = { ...formRef.current, autoPublish: next };
      const result = await onSave?.({ autoPublish: next });
      if (result?.success) {
        const merged = mergeSavedSettings(snapshot, result.data);
        setForm(merged);
        formRef.current = merged;
        dirtyRef.current = false;
        setHint(next ? 'Auto-publish is ON and saved.' : 'Auto-publish is OFF and saved.');
      } else {
        setForm((prev) => ({ ...prev, autoPublish: !next }));
        setHint(result?.error || 'Failed to save auto-publish.');
      }
    } catch (err) {
      acceptServerRef.current = false;
      setForm((prev) => ({ ...prev, autoPublish: !next }));
      setHint(err?.message || 'Failed to save auto-publish.');
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

  if (isLoading && !settings && activeTab === 'engine') {
    return (
      <div className="flex flex-col w-full animate-fade-up">
        <div className="py-12 text-center text-ink-secondary text-[15px]">
          <EmptyState>Loading bot settings…</EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-5 animate-fade-up motion-reduce:animate-none">
      {/* Tabs — same pattern as Posts (Published / Queue); page title is in TopBar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={tw.tabs} role="tablist" aria-label="News bot sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'engine'}
            className={cn(tw.tab, activeTab === 'engine' && tw.tabActive)}
            onClick={() => setActiveTab('engine')}
          >
            Engine
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'logs'}
            className={cn(tw.tab, activeTab === 'logs' && tw.tabActive)}
            onClick={() => setActiveTab('logs')}
          >
            System Logs
            {Array.isArray(logs) && logs.length > 0 ? (
              <span className="ml-1 opacity-80">{logs.length}</span>
            ) : null}
          </button>
        </div>
      </div>

      {activeTab === 'logs' ? (
        <LogsView
          embedded
          logs={logs}
          onRefresh={onRefreshLogs}
          isLoading={logsLoading}
        />
      ) : (
        <>
      <section
        className="grid grid-cols-1 min-[1051px]:grid-cols-2 gap-8 py-7 border-b border-line"
        aria-label="Bot engine console"
      >
        <div>
          <div className="font-mono text-xs tracking-[0.12em] text-ink-tertiary mb-4 uppercase font-semibold">
            Power
          </div>
          <div className="flex items-center gap-[18px]">
            <button
              type="button"
              className={cn(
                'w-[58px] h-[58px] rounded-full shrink-0 border-2 bg-bg-elevated flex items-center justify-center cursor-pointer transition-all duration-300 p-0',
                botOn
                  ? 'border-mint bg-mint/10 text-mint'
                  : 'border-line text-ink-muted'
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
              <strong className="block text-base font-bold mb-1 text-ink">Bot enabled</strong>
              <span className="text-[13.5px] text-ink-secondary leading-snug">
                {isTogglingPower
                  ? 'Saving power state…'
                  : 'Turn automated article publishing on or off. Saves immediately.'}
              </span>
            </div>
          </div>
          <p className="text-[13.5px] text-ink-tertiary leading-relaxed mt-[18px] mb-0 max-w-[48ch]">
            When off, the news bot skips gathering feeds and publishing. The loop still sleeps and
            checks this flag each cycle.
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <div className="font-mono text-xs tracking-[0.12em] text-ink-tertiary mb-4 uppercase font-semibold">
            Bot article stats
          </div>
          <div className="flex gap-0 flex-wrap">
            <div className="flex-1 text-left pr-5 min-w-[100px]">
              <div className="font-mono font-extrabold text-[32px] leading-none text-ink">
                {stats.totalBotPosts}
              </div>
              <div className="text-[13px] text-ink-secondary mt-2.5 font-medium">Total bot posts</div>
              <div className="text-[11px] text-ink-muted font-mono uppercase tracking-wide mt-0.5">All time</div>
            </div>
            <div className="flex-1 text-left pr-5 min-w-[100px]">
              <div className="font-mono font-extrabold text-[32px] leading-none text-mint">
                {stats.visibleBotPosts}
              </div>
              <div className="text-[13px] text-ink-secondary mt-2.5 font-medium">Visible</div>
              <div className="text-[11px] text-ink-muted font-mono uppercase tracking-wide mt-0.5">On site</div>
            </div>
            <div className="flex-1 text-left pr-5 min-w-[100px]">
              <div className="font-mono font-extrabold text-[32px] leading-none text-[#ff6b6b]">
                {stats.hiddenBotPosts}
              </div>
              <div className="text-[13px] text-ink-secondary mt-2.5 font-medium">Hidden</div>
              <div className="text-[11px] text-ink-muted font-mono uppercase tracking-wide mt-0.5">Filtered</div>
            </div>
          </div>
        </div>
      </section>

      <ContentPipeline
        className="mb-5"
        queueCount={queueCount}
        cacheCount={Array.isArray(recentCache) ? recentCache.length : 0}
        botPublishedCount={stats.totalBotPosts}
        botOn={botOn}
      />

      <section className="py-7 border-b border-line" aria-label="Cycle loop">
        <div className="flex justify-between items-baseline mb-1 gap-3 flex-wrap">
          <h2 className="text-lg m-0 font-bold text-ink tracking-tight">Cycle loop</h2>
          <span className="font-mono text-[12.5px] text-ink-tertiary">
            CYCLE TIME ≈ <strong className="text-ink">{loopVals.cycleTotal}</strong>
          </span>
        </div>
        <p className="text-[13.5px] text-ink-secondary mt-1 mb-6 leading-normal">
          One pass through the loop. Timing comes from the values below — edit them and the loop
          updates.
        </p>

        <div className="flex justify-center">
          <div className="relative w-80 h-80 max-[720px]:w-[280px] max-[720px]:h-[280px]">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320" aria-hidden>
              <circle cx="160" cy="160" r="128" fill="none" stroke="currentColor" className="text-line" strokeWidth="1.5" />
              <circle
                cx="160"
                cy="160"
                r="128"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="6 10"
                className={cn(
                  'origin-center transition-opacity duration-300 text-ink',
                  botOn ? 'opacity-100 animate-spin [animation-duration:6s] motion-reduce:animate-none' : 'opacity-0'
                )}
                style={{ transformOrigin: '160px 160px' }}
              />
            </svg>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-[130px]">
              <div
                className={cn(
                  'font-mono font-extrabold text-sm tracking-[0.06em]',
                  botOn ? 'text-mint' : 'text-ink-muted'
                )}
              >
                {botOn ? 'ACTIVE' : 'DORMANT'}
              </div>
              <div className="text-xs text-ink-muted font-mono mt-1.5">
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

      <form onSubmit={handleSave} className="grid grid-cols-1 min-[721px]:grid-cols-2 gap-x-10 gap-y-8 py-7">
        <div className="col-span-full">
          <h3 className="text-[15px] font-semibold m-0 mb-2 text-ink tracking-tight">Visibility</h3>
          <p className="text-sm text-ink-secondary leading-snug m-0 mb-4 max-w-[62ch]">
            Hide bot posts from the public site without deleting them. Admins still see them in
            Posts. Toggling applies to all existing bot articles right away.
          </p>

          <div className="rounded-lg border border-line bg-bg-elevated/40 divide-y divide-line overflow-hidden">
            <div
              className={cn(
                'flex items-start gap-4 px-4 py-4 cursor-pointer select-none',
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
                  e.stopPropagation();
                  handleVisibilityToggle();
                }
              }}
            >
              <SwitchKnob on={!!form.hideArticles} />
              <div className="min-w-0">
                <strong className="block text-[15px] font-semibold mb-1 text-ink">
                  {isTogglingVisibility
                    ? 'Updating visibility…'
                    : form.hideArticles
                      ? 'Bot articles hidden from public site'
                      : 'Hide all bot articles'}
                </strong>
                <span className="block text-[13.5px] text-ink-secondary leading-snug">
                  When on, public feeds exclude bot posts and existing bot articles are hidden. When
                  off, they are shown again. New bot posts follow this setting too.
                </span>
              </div>
            </div>

            <div
              className="flex items-start gap-4 px-4 py-4 cursor-pointer select-none"
              role="switch"
              aria-checked={!!form.autoPublish}
              tabIndex={0}
              onClick={() => handleAutoPublishToggle()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAutoPublishToggle();
                }
              }}
            >
              <SwitchKnob on={!!form.autoPublish} />
              <div className="min-w-0">
                <strong className="block text-[15px] font-semibold mb-1 text-ink">
                  Auto-publish bot stories
                </strong>
                <span className="block text-[13.5px] text-ink-secondary leading-snug">
                  When on, finished bot stories go live immediately. When off, they wait in Review.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-full">
          <h3 className="text-[15px] font-semibold m-0 mb-2 text-ink tracking-tight">Editorial control</h3>
          <p className="text-sm text-ink-secondary leading-snug m-0 mb-4 max-w-[68ch]">
            Choose which countries and sections the bot may scrape, edit the writing prompt, and
            turn individual RSS feeds on or off. Save bot settings to apply.
          </p>

          <div className="mb-5">
            <div className={fieldLabel}>Countries</div>
            <div className="flex flex-wrap gap-2">
              {catalog.countries.map((c) => {
                const on = form.countries.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCountry(c.id)}
                    className={cn(
                      'h-9 px-3 rounded-md border text-[13px] font-semibold cursor-pointer',
                      on
                        ? 'border-mint bg-mint/15 text-mint'
                        : 'border-line bg-bg-elevated text-ink-secondary'
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <div className={fieldLabel}>Sections to focus</div>
            <div className="flex flex-wrap gap-2">
              {(catalog.sections || EMPTY_FORM.sections).map((name) => {
                const on = form.sections.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleSection(name)}
                    className={cn(
                      'h-9 px-3 rounded-md border text-[13px] font-semibold cursor-pointer',
                      on
                        ? 'border-mint bg-mint/15 text-mint'
                        : 'border-line bg-bg-elevated text-ink-secondary'
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="bot-focus" className={fieldLabel}>Desk focus</label>
            <input
              id="bot-focus"
              className={fieldInput}
              value={form.focusNote}
              onChange={(e) => setField('focusNote', e.target.value)}
              placeholder="e.g. Prioritize AI regulation, cricket, and Indian markets"
            />
            <div className="text-[13px] text-ink-tertiary mt-2">
              Short instruction added to every rewrite. Leave blank for a general desk.
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="bot-prompt" className={fieldLabel}>Writer prompt</label>
            <textarea
              id="bot-prompt"
              className={cn(fieldInput, 'min-h-[140px] resize-y')}
              value={form.writerPrompt}
              onChange={(e) => setField('writerPrompt', e.target.value)}
              placeholder="Voice, tone, what to keep or drop…"
            />
            <div className="text-[13px] text-ink-tertiary mt-2">
              Editorial voice. Formatting and JSON rules stay in the engine so output does not break.
            </div>
          </div>

          <div className="rounded-lg border border-line overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3 flex-wrap">
              <strong className="text-[14px] text-ink">RSS feeds</strong>
              <span className="font-mono text-[11px] text-ink-muted">
                {form.feeds.filter((f) => f.enabled).length} on / {form.feeds.length} total
              </span>
            </div>
            <div className="max-h-[360px] overflow-y-auto divide-y divide-line">
              {form.feeds.map((feed) => {
                const countryOn = form.countries.includes(feed.country);
                const sectionOn = form.sections.includes(feed.section);
                const live = feed.enabled && countryOn && sectionOn;
                return (
                  <div key={feed.id} className="flex items-start gap-3 px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!feed.enabled}
                      onClick={() => toggleFeed(feed.id)}
                      className="shrink-0 bg-transparent border-0 p-0 cursor-pointer"
                    >
                      <SwitchKnob on={!!feed.enabled} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-ink">{feed.label}</span>
                        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                          {feed.country} · {feed.section}
                        </span>
                        {!live ? (
                          <span className="font-mono text-[10px] text-[#ff6b6b]">
                            {!feed.enabled ? 'off' : !countryOn ? 'country off' : 'section off'}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[12px] text-ink-tertiary truncate">{feed.url}</div>
                    </div>
                    {String(feed.id).startsWith('custom-') ? (
                      <button
                        type="button"
                        className="text-[12px] text-[#ff6b6b] bg-transparent border-0 cursor-pointer"
                        onClick={() => removeFeed(feed.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-line grid grid-cols-1 min-[721px]:grid-cols-[1fr_1fr_140px_160px_auto] gap-2 items-end">
              <input
                className={fieldInput}
                placeholder="Feed name"
                value={customFeed.label}
                onChange={(e) => setCustomFeed((p) => ({ ...p, label: e.target.value }))}
              />
              <input
                className={fieldInput}
                placeholder="https://example.com/rss.xml"
                value={customFeed.url}
                onChange={(e) => setCustomFeed((p) => ({ ...p, url: e.target.value }))}
              />
              <select
                className={fieldInput}
                value={customFeed.country}
                onChange={(e) => setCustomFeed((p) => ({ ...p, country: e.target.value }))}
              >
                {catalog.countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                className={fieldInput}
                value={customFeed.section}
                onChange={(e) => setCustomFeed((p) => ({ ...p, section: e.target.value }))}
              >
                {(catalog.sections || EMPTY_FORM.sections).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="button" className={tw.secondaryBtn} onClick={addCustomFeed}>
                Add feed
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold m-0 mb-4 text-ink tracking-tight">Publishing limits</h3>
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
            <div className="text-[13px] text-ink-tertiary mt-2 leading-snug">Max bot posts published per UTC day.</div>
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
            <div className="text-[13px] text-ink-tertiary mt-2 leading-snug">
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

        <div>
          <h3 className="text-[15px] font-semibold m-0 mb-4 text-ink tracking-tight">Cycle &amp; cleanup</h3>
          <div className="mb-[18px]">
            <label htmlFor="bot-age" className={fieldLabel}>Only take stories newer than (hours)</label>
            <input
              id="bot-age"
              type="number"
              min={1}
              max={72}
              value={form.maxAgeHours}
              onChange={(e) => setField('maxAgeHours', e.target.value)}
              className={fieldInput}
            />
            <div className="text-[13px] text-ink-tertiary mt-2 leading-snug">Skip older RSS items. Default 6.</div>
          </div>
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
            <div className="text-[13px] text-ink-tertiary mt-2 leading-snug">Default 3600 (1 hour). Min 60.</div>
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
            <div className="text-[13px] text-ink-tertiary mt-2 leading-snug">Used for duplicate title/URL checks.</div>
          </div>
        </div>

        <div className="col-span-full flex items-center gap-3.5 flex-wrap pt-2 border-t border-line">
          <button
            type="submit"
            className="font-mono font-bold text-sm tracking-[0.03em] bg-ink text-[var(--bg)] border-none rounded-md py-3.5 px-[22px] cursor-pointer inline-flex items-center gap-2 transition-all enabled:hover:opacity-90 disabled:opacity-55 disabled:cursor-not-allowed"
            disabled={isSaving || isTogglingVisibility || isTogglingPower}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
            {isSaving ? 'Saving…' : 'Save bot settings'}
          </button>
          <button
            type="button"
            className="font-mono text-[13px] tracking-[0.04em] text-ink-secondary bg-transparent border border-line rounded-md py-3 px-4 cursor-pointer inline-flex items-center gap-2 font-semibold enabled:hover:border-mint enabled:hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed"
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
        </>
      )}
    </div>
  );
}
