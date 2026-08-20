import React, { useEffect, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';
import { ScreenTitle, Notice } from '../wp/ScreenTitle';

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

function defaultAdsTxt(publisherId) {
  const pub = String(publisherId || '').trim() || 'pub-XXXXXXXXXXXXXXXX';
  return `google.com, ${pub}, DIRECT, f08c47fec0942fa0`;
}

function ToggleField({ on, title, description, onToggle }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 select-none">
      <input
        type="checkbox"
        className="mt-1"
        checked={on}
        onChange={() => onToggle(!on)}
      />
      <span>
        <span className="block text-[14px] font-semibold text-ink">{title}</span>
        {description ? (
          <span className="description mt-1 block">{description}</span>
        ) : null}
      </span>
    </label>
  );
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

  if (isLoading && !settings) {
    return (
      <div className="wp-wrap">
        <ScreenTitle title="AdSense" />
        <EmptyState>Loading AdSense settings…</EmptyState>
      </div>
    );
  }

  const inputClass = cn(tw.formInput, 'max-w-md');
  const hintOk =
    hint &&
    (hint.toLowerCase().includes('saved') || hint.toLowerCase().includes('deleted'));

  return (
    <div className="wp-wrap">
      <ScreenTitle title="AdSense" />
      {hint ? <Notice type={hintOk ? 'success' : 'error'}>{hint}</Notice> : null}

      <section className="postbox">
        <h2 className="hndle">Status</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row">Public ads</th>
                <td>
                  <ToggleField
                    on={!!form.enabled}
                    title="Enable AdSense on the public site"
                    description={form.enabled ? 'Ads are on.' : 'AdSense script and ad units will not load.'}
                    onToggle={(next) => setField('enabled', next)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">Credentials</h2>
        <div className="inside">
          <p className="m-0 mb-2 text-ink-secondary">
            Find these in AdSense under Account information / Ads by ad unit.
          </p>
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row"><label htmlFor="ads-publisher">Publisher ID</label></th>
                <td>
                  <input
                    id="ads-publisher"
                    type="text"
                    value={form.publisherId}
                    onChange={(e) => setField('publisherId', e.target.value)}
                    placeholder="pub-XXXXXXXXXXXXXXXX"
                    autoComplete="off"
                    className={inputClass}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="ads-client">Ad client</label></th>
                <td>
                  <input
                    id="ads-client"
                    type="text"
                    value={form.clientId}
                    onChange={(e) => setField('clientId', e.target.value)}
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    autoComplete="off"
                    className={inputClass}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">Ad slots</h2>
        <div className="inside">
          <p className="m-0 mb-2 text-ink-secondary">
            Slot IDs from AdSense. Leave extra slots empty to reuse the default.
          </p>
          <table className="form-table">
            <tbody>
              {[
                ['ads-slot-default', 'Default slot', 'defaultSlot', 'Your AdSense slot ID'],
                ['ads-slot-leader', 'Leaderboard', 'slotLeaderboard', 'Same as default if empty'],
                ['ads-slot-inarticle', 'In-article', 'slotInArticle', 'Same as default if empty'],
                ['ads-slot-sidebar', 'Sidebar', 'slotSidebar', 'Same as default if empty'],
                ['ads-slot-rail', 'Rail', 'slotRail', 'Same as default if empty'],
              ].map(([id, label, key, placeholder]) => (
                <tr key={id}>
                  <th scope="row"><label htmlFor={id}>{label}</label></th>
                  <td>
                    <input
                      id={id}
                      type="text"
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">Placement</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row">In-article ads</th>
                <td>
                  <ToggleField
                    on={!!form.inArticleEnabled}
                    title="Insert ads between paragraphs"
                    description="Place ads on long posts."
                    onToggle={(next) => setField('inArticleEnabled', next)}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="ads-every-n">Every N paragraphs</label></th>
                <td>
                  <input
                    id="ads-every-n"
                    type="number"
                    min={1}
                    max={20}
                    value={form.inArticleEveryN}
                    onChange={(e) => setField('inArticleEveryN', e.target.value)}
                    className={cn(tw.formInput, 'w-24')}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="ads-min-before">Min paragraphs before first</label></th>
                <td>
                  <input
                    id="ads-min-before"
                    type="number"
                    min={0}
                    max={20}
                    value={form.inArticleMinBefore}
                    onChange={(e) => setField('inArticleMinBefore', e.target.value)}
                    className={cn(tw.formInput, 'w-24')}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row"><label htmlFor="ads-max">Max ads per post</label></th>
                <td>
                  <input
                    id="ads-max"
                    type="number"
                    min={0}
                    max={20}
                    value={form.inArticleMax}
                    onChange={(e) => setField('inArticleMax', e.target.value)}
                    className={cn(tw.formInput, 'w-24')}
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">Auto ads</th>
                <td>
                  <ToggleField
                    on={!!form.autoAdsEnabled}
                    title="Store Auto ads flag"
                    description="Manual slots still use the IDs above."
                    onToggle={(next) => setField('autoAdsEnabled', next)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="postbox">
        <h2 className="hndle">ads.txt</h2>
        <div className="inside">
          <table className="form-table">
            <tbody>
              <tr>
                <th scope="row"><label htmlFor="ads-txt">File body</label></th>
                <td>
                  <p className="m-0 mb-2 text-ink-secondary">
                    Served at <code>/ads.txt</code>. Update when the publisher ID changes.
                  </p>
                  <textarea
                    id="ads-txt"
                    rows={5}
                    value={form.adsTxt}
                    onChange={(e) => setField('adsTxt', e.target.value)}
                    placeholder={defaultAdsTxt(form.publisherId)}
                    className={cn(tw.formTextarea, 'max-w-xl')}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="submit flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={tw.primaryBtn}
          onClick={handleSave}
          disabled={isSaving || isClearing}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
        {!confirmClear ? (
          <button
            type="button"
            className={tw.secondaryBtn}
            onClick={() => setConfirmClear(true)}
            disabled={isSaving || isClearing}
          >
            Delete credentials
          </button>
        ) : (
          <>
            <button
              type="button"
              className={tw.secondaryBtn}
              onClick={handleClear}
              disabled={isClearing}
            >
              {isClearing ? 'Deleting…' : 'Confirm delete'}
            </button>
            <button
              type="button"
              className={tw.secondaryBtn}
              onClick={() => setConfirmClear(false)}
              disabled={isClearing}
            >
              Cancel
            </button>
          </>
        )}
        {lastSaved ? <span className="text-[13px] text-ink-secondary">{lastSaved}</span> : null}
      </p>
    </div>
  );
}
