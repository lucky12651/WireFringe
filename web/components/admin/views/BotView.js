import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LogsView } from './LogsView';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';
import { ScreenTitle, NavTabs, Notice, ToggleField } from '../wp/ScreenTitle';
import { newsroomApi } from '../../../lib/api';

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
    // Keep empty arrays / blank prompt â€” do not fall back to defaults after save.
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
    sourceName: '',
    destinationCategory: '',
    destinationSection: '',
    sourceCategory: '',
  });
  const [siteCatalog, setSiteCatalog] = useState({ categories: [], sections: [] });

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
    newsroomApi
      .catalog()
      .then((d) => setSiteCatalog({ categories: d.categories || [], sections: d.sections || [] }))
      .catch(() => {});
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
    dirtyRef.current = true;
    setForm((prev) => {
      const feed = prev.feeds.find((f) => f.id === id);
      const enabling = feed && !feed.enabled;
      const feeds = prev.feeds.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f));
      let countries = prev.countries;
      let sections = prev.sections;
      // Enabling a feed must also keep its country/section selected, otherwise
      // the server harvests nothing from it after Save.
      if (enabling && feed) {
        if (feed.country && !countries.includes(feed.country)) {
          countries = [...countries, feed.country];
        }
        if (feed.section && !sections.includes(feed.section)) {
          sections = [...sections, feed.section];
        }
      }
      return { ...prev, feeds, countries, sections };
    });
    setHint('');
  };

  const addCustomFeed = () => {
    const url = customFeed.url.trim();
    if (!url.startsWith('http')) {
      setHint('Enter a valid RSS URL starting with http.');
      return;
    }
    const id = `custom-${Date.now()}`;
    dirtyRef.current = true;
    setForm((prev) => {
      const next = {
        ...prev,
        feeds: [
          ...prev.feeds,
          {
            id,
            url,
            label: customFeed.label.trim() || 'Custom feed',
            country: customFeed.country,
            sourceName: customFeed.sourceName.trim() || customFeed.label.trim(),
            destinationCategory: customFeed.destinationCategory || customFeed.section,
            destinationSection: customFeed.destinationSection || '',
            sourceCategory: customFeed.sourceCategory || '',
            section: customFeed.section,
            enabled: true,
          },
        ],
      };
      if (customFeed.country && !next.countries.includes(customFeed.country)) {
        next.countries = [...next.countries, customFeed.country];
      }
      if (customFeed.section && !next.sections.includes(customFeed.section)) {
        next.sections = [...next.sections, customFeed.section];
      }
      return next;
    });
    setHint('');
    setCustomFeed({
      label: '',
      url: '',
      country: 'world',
      section: 'World',
      sourceName: '',
      destinationCategory: '',
      destinationSection: '',
      sourceCategory: '',
    });
  };

  const patchFeed = (id, field, value) => {
    dirtyRef.current = true;
    setForm((prev) => ({
      ...prev,
      feeds: prev.feeds.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    }));
    setHint('');
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
      fetch: `â‰¤${Number(form.maxItemsPerFeed) || 0} / feed`,
      process: `${Number(form.processPerCycle) || 0} / cycle`,
      publish: `${Number(form.gapMinutes) || 0}m gap Â· ${Number(form.dailyLimit) || 0}/day`,
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
      <div className="wp-wrap">
        <ScreenTitle title="News Bot" />
        <p className="text-ink-secondary">Loading bot settings...</p>
      </div>
    );
  }

  return (
    <div className="wp-wrap">
      <ScreenTitle title="News Bot" />
      {hint ? <Notice type={hintOk ? 'success' : 'error'}>{hint}</Notice> : null}
      <NavTabs
        tabs={[
          { id: 'engine', label: 'Engine' },
          { id: 'logs', label: 'System Logs', count: Array.isArray(logs) ? logs.length : undefined },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'logs' ? (
        <LogsView
          embedded
          logs={logs}
          onRefresh={onRefreshLogs}
          isLoading={logsLoading}
        />
      ) : (
        <>
      <form onSubmit={handleSave}>
      <section className="postbox">
        <h2 className="hndle">Status</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row">Engine</th>
                <td>
                  <ToggleField
                    on={botOn}
                    disabled={isTogglingPower || isSaving}
                    title={isTogglingPower ? 'Savingâ€¦' : 'Bot enabled'}
                    description="When off, the bot skips gathering feeds and publishing."
                    onToggle={() => handlePowerToggle()}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">Visibility</th>
                <td>
                  <ToggleField
                    on={!!form.hideArticles}
                    disabled={isTogglingVisibility}
                    title={form.hideArticles ? 'Bot articles hidden from the public site' : 'Hide all bot articles'}
                    description="Hides existing bot posts immediately. Admins still see them in Posts."
                    onToggle={() => handleVisibilityToggle()}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">Auto-publish</th>
                <td>
                  <ToggleField
                    on={!!form.autoPublish}
                    title="Auto-publish bot stories"
                    description="When off, finished stories wait in Review."
                    onToggle={() => handleAutoPublishToggle()}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <ul className="at-a-glance-list mt-2">
            <li><b>{stats.totalBotPosts}</b> bot posts</li>
            <li><b>{stats.visibleBotPosts}</b> visible</li>
            <li><b>{stats.hiddenBotPosts}</b> hidden</li>
            <li><b>{queueCount}</b> in queue</li>
            <li><b>{loopVals.cycleTotal}</b> cycle</li>
          </ul>
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">Publishing</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row"><label htmlFor="bot-daily">Daily post limit</label></th>
                <td>
                  <input id="bot-daily" type="number" min={1} max={100} value={form.dailyLimit} onChange={(e) => setField('dailyLimit', e.target.value)} className={cn(tw.formInput, 'w-24')} />
                  <span className="description">Max bot posts published per UTC day.</span>
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-gap">Gap between posts</label></th>
                <td>
                  <input id="bot-gap" type="number" min={0} max={1440} value={form.gapMinutes} onChange={(e) => setField('gapMinutes', e.target.value)} className={cn(tw.formInput, 'w-24')} />
                  <span className="description">Minutes to wait between publications (0 = none).</span>
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-cycle">Articles per cycle</label></th>
                <td>
                  <input id="bot-cycle" type="number" min={1} max={10} value={form.processPerCycle} onChange={(e) => setField('processPerCycle', e.target.value)} className={cn(tw.formInput, 'w-24')} />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-age">Only stories newer than</label></th>
                <td>
                  <input id="bot-age" type="number" min={1} max={72} value={form.maxAgeHours} onChange={(e) => setField('maxAgeHours', e.target.value)} className={cn(tw.formInput, 'w-24')} />
                  <span className="description">Hours. Skip older RSS items.</span>
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-sleep">Sleep between cycles</label></th>
                <td>
                  <input id="bot-sleep" type="number" min={60} max={86400} value={form.sleepSeconds} onChange={(e) => setField('sleepSeconds', e.target.value)} className={cn(tw.formInput, 'w-24')} />
                  <span className="description">Seconds. Default 3600. Min 60.</span>
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-max">Max items per feed</label></th>
                <td>
                  <input id="bot-max" type="number" min={1} max={50} value={form.maxItemsPerFeed} onChange={(e) => setField('maxItemsPerFeed', e.target.value)} className={cn(tw.formInput, 'w-24')} />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-queue">Queue cleanup</label></th>
                <td>
                  <input id="bot-queue" type="number" min={1} max={168} value={form.queueCleanupHours} onChange={(e) => setField('queueCleanupHours', e.target.value)} className={cn(tw.formInput, 'w-24')} />
                  <span className="description">Hours.</span>
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-cache">Recent-cache window</label></th>
                <td>
                  <input id="bot-cache" type="number" min={1} max={72} value={form.recentCacheHours} onChange={(e) => setField('recentCacheHours', e.target.value)} className={cn(tw.formInput, 'w-24')} />
                  <span className="description">Hours. Used for duplicate checks.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">Editorial</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row">Countries</th>
                <td>
                  <fieldset>
                    {catalog.countries.map((c) => (
                      <label key={c.id} className="mr-4 inline-flex items-center gap-1.5">
                        <input type="checkbox" checked={form.countries.includes(c.id)} onChange={() => toggleCountry(c.id)} />
                        {c.label}
                      </label>
                    ))}
                  </fieldset>
                </td>
              </tr>
              <tr>
                <th scope="row">Sections</th>
                <td>
                  <fieldset>
                    {(catalog.sections || EMPTY_FORM.sections).map((name) => (
                      <label key={name} className="mb-1 mr-4 inline-flex items-center gap-1.5">
                        <input type="checkbox" checked={form.sections.includes(name)} onChange={() => toggleSection(name)} />
                        {name}
                      </label>
                    ))}
                  </fieldset>
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-focus">Desk focus</label></th>
                <td>
                  <input id="bot-focus" className={cn(tw.formInput, 'max-w-xl')} value={form.focusNote} onChange={(e) => setField('focusNote', e.target.value)} placeholder="e.g. Prioritize AI regulation, cricket, and Indian markets" />
                  <span className="description">Short instruction added to every rewrite.</span>
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="bot-prompt">Writer prompt</label></th>
                <td>
                  <textarea id="bot-prompt" className={cn(tw.formTextarea, 'max-w-xl min-h-[140px]')} value={form.writerPrompt} onChange={(e) => setField('writerPrompt', e.target.value)} placeholder="Voice, tone, what to keep or dropâ€¦" />
                  <span className="description">Editorial voice. Formatting rules stay in the engine.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">RSS feeds</h2>
        <div className="inside">
          <p className="m-0 mb-3 text-ink-secondary">
            {form.feeds.filter((f) => f.enabled).length} on / {form.feeds.length} total
          </p>
          <table className="wp-table">
            <thead>
              <tr>
                <th className="w-10">On</th>
                <th>Feed / source</th>
                <th>Dest. category</th>
                <th>Dest. section</th>
                <th>Source category</th>
                <th>Last fetch</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.feeds.map((feed) => {
                const countryOn = form.countries.includes(feed.country);
                const sectionOn = form.sections.includes(feed.section);
                const live = feed.enabled && countryOn && sectionOn;
                return (
                  <tr key={feed.id}>
                    <td>
                      <input type="checkbox" checked={!!feed.enabled} onChange={() => toggleFeed(feed.id)} aria-label={`Enable ${feed.label}`} />
                    </td>
                    <td>
                      <strong>{feed.label}</strong>
                      {!live ? (
                        <span className="ml-2 text-[12px] text-[var(--danger)]">
                          {!feed.enabled ? 'off' : !countryOn ? 'country off' : 'section off'}
                        </span>
                      ) : null}
                      <div className="text-[12px] text-ink-secondary break-all">{feed.url}</div>
                      <div className="mt-1 text-[12px] text-ink-secondary">
                        Source:{' '}
                        <input
                          className={cn(tw.formInput, 'mt-1 max-w-xs')}
                          value={feed.sourceName || ''}
                          onChange={(e) => patchFeed(feed.id, 'sourceName', e.target.value)}
                          placeholder={feed.label}
                        />
                      </div>
                    </td>
                    <td>
                      <select
                        className={cn(tw.formSelect, 'min-w-[140px]')}
                        value={feed.destinationCategory || feed.section || ''}
                        onChange={(e) => patchFeed(feed.id, 'destinationCategory', e.target.value)}
                      >
                        <option value="">—</option>
                        {(siteCatalog.categories || []).filter((c) => c.enabled !== false).map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        {(catalog.sections || EMPTY_FORM.sections).map((s) => (
                          <option key={`bot-${s}`} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={cn(tw.formSelect, 'min-w-[140px]')}
                        value={feed.destinationSection || ''}
                        onChange={(e) => patchFeed(feed.id, 'destinationSection', e.target.value)}
                      >
                        <option value="">Default from category</option>
                        {(siteCatalog.sections || []).filter((s) => s.enabled !== false && s.kind !== 'stream').map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className={cn(tw.formInput, 'min-w-[120px]')}
                        value={feed.sourceCategory || ''}
                        onChange={(e) => patchFeed(feed.id, 'sourceCategory', e.target.value)}
                        placeholder="optional filter"
                      />
                    </td>
                    <td className="text-[12px] text-ink-secondary whitespace-nowrap">
                      {feed.lastFetch ? String(feed.lastFetch).replace('T', ' ').slice(0, 16) : '—'}
                    </td>
                    <td>
                      {String(feed.id).startsWith('custom-') ? (
                        <button type="button" className="border-0 bg-transparent p-0 text-[var(--danger)]" onClick={() => removeFeed(feed.id)}>
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row">Add feed</th>
                <td>
                  <div className="flex max-w-xl flex-col gap-2">
                    <input className={tw.formInput} placeholder="Feed name" value={customFeed.label} onChange={(e) => setCustomFeed((p) => ({ ...p, label: e.target.value }))} />
                    <input className={tw.formInput} placeholder="https://example.com/rss.xml" value={customFeed.url} onChange={(e) => setCustomFeed((p) => ({ ...p, url: e.target.value }))} />
                    <div className="flex flex-wrap gap-2">
                      <select className={cn(tw.formSelect, 'w-auto')} value={customFeed.country} onChange={(e) => setCustomFeed((p) => ({ ...p, country: e.target.value }))}>
                        {catalog.countries.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      <select className={cn(tw.formSelect, 'w-auto')} value={customFeed.section} onChange={(e) => setCustomFeed((p) => ({ ...p, section: e.target.value }))}>
                        {(catalog.sections || EMPTY_FORM.sections).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <select className={cn(tw.formSelect, 'w-auto')} value={customFeed.destinationCategory} onChange={(e) => setCustomFeed((p) => ({ ...p, destinationCategory: e.target.value }))}>
                        <option value="">Dest. category</option>
                        {(siteCatalog.categories || []).filter((c) => c.enabled !== false).map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <select className={cn(tw.formSelect, 'w-auto')} value={customFeed.destinationSection} onChange={(e) => setCustomFeed((p) => ({ ...p, destinationSection: e.target.value }))}>
                        <option value="">Dest. section</option>
                        {(siteCatalog.sections || []).filter((s) => s.enabled !== false && s.kind !== 'stream').map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button type="button" className={tw.secondaryBtn} onClick={addCustomFeed}>Add feed</button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="submit flex flex-wrap items-center gap-3">
        <button type="submit" className={tw.primaryBtn} disabled={isSaving || isTogglingVisibility || isTogglingPower}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" className={tw.secondaryBtn} onClick={() => handleRefresh()} disabled={isLoading || isSaving || isTogglingVisibility || isTogglingPower}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </p>
      </form>
        </>
      )}
    </div>
  );
}
