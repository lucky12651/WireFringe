import React, { useEffect, useState } from 'react';
import { EmptyState } from '../shared/EmptyState';
import { cn } from '../../../lib/utils';

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

function StatusPill({ on, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-xs tracking-[0.08em] py-2 px-3.5 rounded-full border font-semibold',
        on ? 'text-mint border-mint' : 'text-ink-secondary border-line'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full inline-block shrink-0',
          on ? 'bg-mint' : 'bg-ink-muted'
        )}
      />
      <span>{children}</span>
    </span>
  );
}

const fieldLabel =
  'block font-mono text-xs tracking-[0.06em] text-ink-tertiary mb-2 uppercase font-semibold';
const fieldControl =
  'w-full bg-bg-elevated border border-line text-ink font-mono text-sm py-2.5 px-3 rounded-md outline-none transition-[border-color,box-shadow] box-border leading-snug placeholder:text-ink-muted focus:border-mint focus:shadow-[0_0_0_3px_var(--mint-dim)]';
const tagClass =
  'font-mono bg-bg-hover border border-line rounded px-1.5 py-0.5 text-[13px] text-ink';
const btnGhost =
  'inline-flex items-center gap-2 font-mono text-[13px] tracking-[0.04em] text-ink-secondary bg-transparent border border-line rounded-md py-2.5 px-4 cursor-pointer transition-colors whitespace-nowrap enabled:hover:border-mint enabled:hover:text-ink disabled:opacity-45 disabled:cursor-not-allowed';
const btnPrimary =
  'font-mono font-bold text-[13px] tracking-[0.03em] bg-ink text-[var(--bg)] border-none rounded-md py-2.5 px-[18px] cursor-pointer inline-flex items-center gap-2 transition-all enabled:hover:opacity-90 disabled:opacity-55 disabled:cursor-not-allowed';
const btnDanger =
  'font-mono font-semibold text-[13px] tracking-[0.03em] bg-transparent text-[#ff6b6b] border border-[rgba(255,107,107,0.35)] rounded-md py-2.5 px-4 cursor-pointer transition-colors enabled:hover:bg-[rgba(255,107,107,0.12)] enabled:hover:border-[#ff6b6b] disabled:opacity-50 disabled:cursor-not-allowed';
const btnDangerSolid =
  'font-mono font-bold text-[13px] tracking-[0.03em] bg-[#ff6b6b] text-black border-none rounded-md py-2.5 px-4 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed';

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
      <div className="py-12 text-center text-ink-secondary text-[15px] animate-fade-up">
        <EmptyState>Loading AdSense settings…</EmptyState>
      </div>
    );
  }

  const toggleRowClass =
    'flex items-start gap-3.5 py-3 mb-2 cursor-pointer select-none';

  return (
    <div className="flex flex-col animate-fade-up">
      <section className="py-7 border-b border-line">
        <h3 className="m-0 mb-1 text-[15px] font-semibold tracking-tight text-ink">Status</h3>
        <p className="m-0 mb-5 text-[13px] leading-relaxed text-ink-secondary max-w-[62ch]">
          Control whether AdSense loads on the public site. Nothing is written until you save.
        </p>
        <div
          className={toggleRowClass}
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
          <SwitchKnob on={!!form.enabled} />
          <div>
            <strong className="block text-[15px] font-semibold mb-1 text-ink">
              Enable AdSense on public site
            </strong>
            <span className="text-[13px] text-ink-secondary">
              When off, the AdSense script and ad units will not load.
            </span>
          </div>
        </div>
        <StatusPill on={!!form.enabled}>{form.enabled ? 'ADS ON' : 'ADS OFF'}</StatusPill>
      </section>

      <section className="py-7 border-b border-line">
        <h3 className="m-0 mb-1 text-[15px] font-semibold tracking-tight text-ink">Credentials</h3>
        <p className="m-0 mb-5 text-[13px] leading-relaxed text-ink-secondary max-w-[62ch]">
          Find these in AdSense under Account information / Ads by ad unit.
        </p>
        <div className="grid grid-cols-1 min-[721px]:grid-cols-2 gap-4 max-w-[720px]">
          <div>
            <label htmlFor="ads-publisher" className={fieldLabel}>Publisher ID (pub-…)</label>
            <input
              id="ads-publisher"
              type="text"
              value={form.publisherId}
              onChange={(e) => setField('publisherId', e.target.value)}
              placeholder="pub-XXXXXXXXXXXXXXXX"
              autoComplete="off"
              className={fieldControl}
            />
          </div>
          <div>
            <label htmlFor="ads-client" className={fieldLabel}>Ad client (ca-pub-…)</label>
            <input
              id="ads-client"
              type="text"
              value={form.clientId}
              onChange={(e) => setField('clientId', e.target.value)}
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              autoComplete="off"
              className={fieldControl}
            />
          </div>
        </div>
      </section>

      <section className="py-7 border-b border-line">
        <h3 className="m-0 mb-1 text-[15px] font-semibold tracking-tight text-ink">Ad slots</h3>
        <p className="m-0 mb-5 text-[13px] leading-relaxed text-ink-secondary max-w-[62ch]">
          Slot IDs from AdSense. You can reuse the default slot until you create more.
        </p>
        <div className="grid grid-cols-1 min-[721px]:grid-cols-2 gap-4 max-w-[720px]">
          <div className="min-[721px]:col-span-2">
            <label htmlFor="ads-slot-default" className={fieldLabel}>Default slot</label>
            <input
              id="ads-slot-default"
              type="text"
              value={form.defaultSlot}
              onChange={(e) => setField('defaultSlot', e.target.value)}
              placeholder="Your AdSense slot ID"
              className={fieldControl}
            />
          </div>
          <div>
            <label htmlFor="ads-slot-leader" className={fieldLabel}>Leaderboard</label>
            <input
              id="ads-slot-leader"
              type="text"
              value={form.slotLeaderboard}
              onChange={(e) => setField('slotLeaderboard', e.target.value)}
              placeholder="Same as default if empty"
              className={fieldControl}
            />
          </div>
          <div>
            <label htmlFor="ads-slot-inarticle" className={fieldLabel}>In-article</label>
            <input
              id="ads-slot-inarticle"
              type="text"
              value={form.slotInArticle}
              onChange={(e) => setField('slotInArticle', e.target.value)}
              placeholder="Same as default if empty"
              className={fieldControl}
            />
          </div>
          <div>
            <label htmlFor="ads-slot-sidebar" className={fieldLabel}>Sidebar</label>
            <input
              id="ads-slot-sidebar"
              type="text"
              value={form.slotSidebar}
              onChange={(e) => setField('slotSidebar', e.target.value)}
              placeholder="Same as default if empty"
              className={fieldControl}
            />
          </div>
          <div>
            <label htmlFor="ads-slot-rail" className={fieldLabel}>Rail</label>
            <input
              id="ads-slot-rail"
              type="text"
              value={form.slotRail}
              onChange={(e) => setField('slotRail', e.target.value)}
              placeholder="Same as default if empty"
              className={fieldControl}
            />
          </div>
        </div>
      </section>

      <section className="py-7 border-b border-line">
        <h3 className="m-0 mb-1 text-[15px] font-semibold tracking-tight text-ink">Placement</h3>
        <p className="m-0 mb-5 text-[13px] leading-relaxed text-ink-secondary max-w-[62ch]">
          Rules for how ads are woven between paragraphs on long posts.
        </p>
        <div
          className={toggleRowClass}
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
          <SwitchKnob on={!!form.inArticleEnabled} />
          <div>
            <strong className="block text-[15px] font-semibold mb-1 text-ink">Insert in-article ads</strong>
            <span className="text-[13px] text-ink-secondary">Place ads between paragraphs on long posts.</span>
          </div>
        </div>
        <div className="grid grid-cols-1 min-[721px]:grid-cols-3 gap-4 max-w-[720px] mt-4">
          <div>
            <label htmlFor="ads-every-n" className={fieldLabel}>Every N paragraphs</label>
            <input
              id="ads-every-n"
              type="number"
              min={1}
              max={20}
              value={form.inArticleEveryN}
              onChange={(e) => setField('inArticleEveryN', e.target.value)}
              className={fieldControl}
            />
          </div>
          <div>
            <label htmlFor="ads-min-before" className={fieldLabel}>Min before first</label>
            <input
              id="ads-min-before"
              type="number"
              min={0}
              max={20}
              value={form.inArticleMinBefore}
              onChange={(e) => setField('inArticleMinBefore', e.target.value)}
              className={fieldControl}
            />
          </div>
          <div>
            <label htmlFor="ads-max" className={fieldLabel}>Max per post</label>
            <input
              id="ads-max"
              type="number"
              min={0}
              max={20}
              value={form.inArticleMax}
              onChange={(e) => setField('inArticleMax', e.target.value)}
              className={fieldControl}
            />
          </div>
        </div>
        <div
          className={cn(toggleRowClass, 'mt-4')}
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
          <SwitchKnob on={!!form.autoAdsEnabled} />
          <div>
            <strong className="block text-[15px] font-semibold mb-1 text-ink">Auto ads flag</strong>
            <span className="text-[13px] text-ink-secondary">
              Stored for Google Auto ads. Manual slots still use the IDs above.
            </span>
          </div>
        </div>
      </section>

      <section className="py-7 border-b border-line">
        <h3 className="m-0 mb-1 text-[15px] font-semibold tracking-tight text-ink">ads.txt</h3>
        <p className="m-0 mb-5 text-[13px] leading-relaxed text-ink-secondary max-w-[62ch]">
          Content served at <code className={tagClass}>/ads.txt</code>. Update when the publisher ID changes.
        </p>
        <label htmlFor="ads-txt" className={fieldLabel}>ads.txt body</label>
        <textarea
          id="ads-txt"
          rows={5}
          value={form.adsTxt}
          onChange={(e) => setField('adsTxt', e.target.value)}
          placeholder={defaultAdsTxt(form.publisherId)}
          className={cn(fieldControl, 'resize-y min-h-[88px] leading-normal text-[13.5px] max-w-[720px]')}
        />
      </section>

      <section className="py-7 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={btnPrimary}
          onClick={handleSave}
          disabled={isSaving || isClearing}
        >
          {isSaving ? 'Saving…' : 'Save settings'}
        </button>
        {!confirmClear ? (
          <button
            type="button"
            className={btnDanger}
            onClick={() => setConfirmClear(true)}
            disabled={isSaving || isClearing}
          >
            Delete credentials
          </button>
        ) : (
          <>
            <button
              type="button"
              className={btnDangerSolid}
              onClick={handleClear}
              disabled={isClearing}
            >
              {isClearing ? 'Deleting…' : 'Confirm delete'}
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setConfirmClear(false)}
              disabled={isClearing}
            >
              Cancel
            </button>
          </>
        )}
        <span
          className={cn(
            'text-[13px] font-mono',
            hint &&
              (hint.toLowerCase().includes('saved') || hint.toLowerCase().includes('deleted')) &&
              'text-mint',
            hint &&
              !hint.toLowerCase().includes('saved') &&
              !hint.toLowerCase().includes('deleted') &&
              'text-[#ff6b6b]',
            !hint && 'text-ink-tertiary'
          )}
        >
          {hint || lastSaved || ''}
        </span>
      </section>
    </div>
  );
}
