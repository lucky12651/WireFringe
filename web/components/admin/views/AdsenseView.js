import React, { useEffect, useMemo, useState } from 'react';
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

const STEPS = [
  { id: 0, label: 'Status', hint: 'ON / OFF' },
  { id: 1, label: 'Credentials', hint: 'Publisher / client' },
  { id: 2, label: 'Ad slots', hint: 'Slot IDs' },
  { id: 3, label: 'Placement', hint: 'In-article rules' },
  { id: 4, label: 'ads.txt', hint: 'Verification file' },
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden className="w-3 h-3">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="w-3.5 h-3.5">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="w-3.5 h-3.5">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function defaultAdsTxt(publisherId) {
  const pub = String(publisherId || '').trim() || 'pub-XXXXXXXXXXXXXXXX';
  return `google.com, ${pub}, DIRECT, f08c47fec0942fa0`;
}

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
        on ? 'text-mint border-mint' : 'text-[#c0c0c0] border-line'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full inline-block shrink-0',
          on ? 'bg-mint shadow-[0_0_6px_rgba(255,255,255,0.5)]' : 'bg-[#666]'
        )}
      />
      <span>{children}</span>
    </span>
  );
}

const fieldLabel =
  'block font-mono text-xs tracking-[0.06em] text-[#aaa] mb-2 uppercase font-semibold';
const fieldControl =
  'w-full bg-[#0a0a0a] border border-line text-white font-mono text-sm py-2.5 px-3 rounded-md outline-none transition-[border-color,box-shadow] box-border leading-snug placeholder:text-[#666] focus:border-mint focus:shadow-[0_0_0_3px_rgba(255,255,255,0.2)]';
const tagClass =
  'font-mono bg-[#1a1a1a] border border-line rounded px-1.5 py-0.5 text-[13px] text-mint';
const btnGhost =
  'inline-flex items-center gap-2 font-mono text-[13px] tracking-[0.04em] text-[#c8c8c8] bg-transparent border border-line rounded-md py-2.5 px-4 cursor-pointer transition-colors whitespace-nowrap enabled:hover:border-mint/35 enabled:hover:text-white disabled:opacity-45 disabled:cursor-not-allowed';
const btnPrimary =
  'font-mono font-bold text-[13px] tracking-[0.03em] bg-mint text-black border-none rounded-md py-2.5 px-[18px] cursor-pointer inline-flex items-center gap-2 transition-all enabled:hover:bg-white/90 enabled:hover:-translate-y-px disabled:opacity-55 disabled:cursor-not-allowed';
const btnDanger =
  'font-mono font-semibold text-[13px] tracking-[0.03em] bg-transparent text-[#ff6b6b] border border-[rgba(255,107,107,0.35)] rounded-md py-2.5 px-4 cursor-pointer transition-colors enabled:hover:bg-[rgba(255,107,107,0.12)] enabled:hover:border-[#ff6b6b] disabled:opacity-50 disabled:cursor-not-allowed';
const btnDangerSolid =
  'font-mono font-bold text-[13px] tracking-[0.03em] bg-[#ff6b6b] text-black border-none rounded-md py-2.5 px-4 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed';
const navBtn =
  'font-mono text-[12.5px] tracking-[0.04em] text-[#c8c8c8] bg-[#0a0a0a] border border-line rounded-md py-2 px-3.5 cursor-pointer inline-flex items-center gap-2 font-semibold transition-colors enabled:hover:text-white enabled:hover:border-[#888] disabled:opacity-35 disabled:cursor-not-allowed';

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

  const stepComplete = useMemo(
    () => ({
      0: !!form.enabled,
      1: hasCreds,
      2: hasSlots,
      3: !!form.inArticleEnabled,
      4: hasAdsTxt,
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
      <div className="flex flex-col w-full flex-auto min-h-0 animate-fade-up">
        <div className="border border-line rounded-lg bg-bg-elevated py-9 px-6 text-center text-[#b0b0b0] text-[15px] flex-1 w-full flex items-center justify-center min-h-[280px]">
          <EmptyState>Loading AdSense settings…</EmptyState>
        </div>
      </div>
    );
  }

  const isComplete = (idx) => !!stepComplete[idx];

  const toggleRowClass =
    'flex items-start gap-3.5 bg-[#0a0a0a] border border-line rounded-lg py-3 px-3.5 mb-3.5 cursor-pointer select-none hover:border-mint/20';

  return (
    <div className="flex flex-col gap-0 w-full flex-auto min-h-0 h-auto max-h-[calc(100vh-108px)] max-[720px]:max-h-none max-[720px]:min-h-0 animate-fade-up motion-reduce:animate-none">
      <div
        className={cn(
          'grid gap-0 border border-line rounded-lg overflow-hidden bg-bg-elevated flex-auto w-full',
          'min-h-[360px] h-[calc(100vh-230px)] max-h-[calc(100vh-210px)] items-stretch box-border',
          'grid-cols-1 min-[721px]:grid-cols-[200px_1fr] min-[1101px]:grid-cols-[minmax(200px,240px)_minmax(0,1fr)_minmax(280px,340px)]',
          'max-[720px]:min-h-[320px] max-[720px]:h-auto max-[720px]:max-h-none'
        )}
      >
        {/* Step rail */}
        <nav
          className={cn(
            'border-r border-line p-2 bg-[#101010] h-full min-h-0 flex flex-col overflow-hidden',
            'max-[720px]:border-r-0 max-[720px]:border-b max-[720px]:block max-[720px]:overflow-x-auto'
          )}
          aria-label="AdSense setup steps"
        >
          <div
            className={cn(
              'flex-1 min-h-0 overflow-y-auto',
              'max-[720px]:flex max-[720px]:overflow-x-auto max-[720px]:gap-1'
            )}
          >
            {STEPS.map((s) => {
              const active = step === s.id;
              const complete = isComplete(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={cn(
                    'flex items-center gap-3 py-2.5 px-2.5 rounded-md cursor-pointer mb-0.5 border w-full text-left font-inherit transition-colors',
                    active
                      ? 'bg-[#0a0a0a] border-line'
                      : 'bg-transparent border-transparent hover:bg-[#1a1a1a]',
                    'max-[720px]:flex-none max-[720px]:mb-0'
                  )}
                  onClick={() => goToStep(s.id)}
                  aria-current={active ? 'step' : undefined}
                >
                  <div
                    className={cn(
                      'font-mono text-xs font-bold w-6 h-6 border rounded-full flex items-center justify-center shrink-0',
                      complete
                        ? 'bg-mint/10 border-mint text-mint'
                        : active
                          ? 'text-mint border-mint'
                          : 'text-[#888] border-line'
                    )}
                  >
                    {complete ? <CheckIcon /> : <span>{s.id + 1}</span>}
                  </div>
                  <div>
                    <strong
                      className={cn(
                        'block text-sm font-semibold leading-snug',
                        active ? 'text-mint' : 'text-[#f0f0f0]'
                      )}
                    >
                      {s.label}
                    </strong>
                    <span className="text-xs text-[#888] font-mono mt-0.5 block">{s.hint}</span>
                  </div>
                </button>
              );
            })}
            <div className="h-px bg-line my-3 mx-1 max-[720px]:hidden" />
            <div className="text-[12.5px] text-[#888] py-2.5 px-3 leading-snug max-[720px]:hidden">
              Steps auto-mark complete once required fields are filled. Nothing is written until you
              save.
            </div>
          </div>

          {/* Delete lives at bottom of the step rail card */}
          <div className="shrink-0 pt-2 mt-auto border-t border-line max-[720px]:mt-2">
            {!confirmClear ? (
              <button
                type="button"
                className={cn(btnDanger, 'w-full justify-center')}
                onClick={() => setConfirmClear(true)}
                disabled={isSaving || isClearing}
              >
                Delete credentials
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className={cn(btnDangerSolid, 'w-full justify-center')}
                  onClick={handleClear}
                  disabled={isClearing}
                >
                  {isClearing ? 'Deleting…' : 'Confirm delete'}
                </button>
                <button
                  type="button"
                  className={cn(btnGhost, 'w-full justify-center')}
                  onClick={() => setConfirmClear(false)}
                  disabled={isClearing}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Active panel */}
        <div className="py-[22px] px-[26px] border-r border-line min-h-0 h-full flex flex-col overflow-y-auto max-[720px]:border-r-0 max-[720px]:p-4">
          {step === 0 && (
            <section className="flex-1 animate-fade-up">
              <div className="mb-1.5">
                <h2 className="text-xl m-0 mb-1.5 font-extrabold text-white tracking-tight">Status</h2>
                <p className="text-sm text-[#b5b5b5] leading-snug m-0 mb-[18px] max-w-[60ch]">
                  Control whether AdSense loads on the public site. Credentials are stored in the
                  database and used by all ad placements.
                </p>
              </div>
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
                  <strong className="block text-[15px] font-semibold mb-1 text-white leading-snug">
                    Enable AdSense on public site
                  </strong>
                  <span className="text-[13.5px] text-[#b0b0b0] leading-snug">
                    When off, the AdSense script and ad units will not load.
                  </span>
                </div>
              </div>
              <StatusPill on={!!form.enabled}>{form.enabled ? 'ADS ON' : 'ADS OFF'}</StatusPill>
            </section>
          )}

          {step === 1 && (
            <section className="flex-1 animate-fade-up">
              <div className="mb-1.5">
                <h2 className="text-xl m-0 mb-1.5 font-extrabold text-white tracking-tight">
                  Publisher credentials
                </h2>
                <p className="text-sm text-[#b5b5b5] leading-snug m-0 mb-[18px] max-w-[60ch]">
                  Find these in your AdSense account under{' '}
                  <code className={tagClass}>Account → Account information</code> /{' '}
                  <code className={tagClass}>Ads → By ad unit</code>.
                </p>
              </div>
              <div className="mb-3.5">
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
              <div className="mb-0">
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
                <div className="text-[13px] text-[#888] mt-2 leading-snug">Usually ca- + your publisher ID.</div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="flex-1 animate-fade-up">
              <div className="mb-1.5">
                <h2 className="text-xl m-0 mb-1.5 font-extrabold text-white tracking-tight">Ad slots</h2>
                <p className="text-sm text-[#b5b5b5] leading-snug m-0 mb-[18px] max-w-[60ch]">
                  Slot IDs from <code className={tagClass}>AdSense → Ads → By ad unit</code>. You
                  can reuse one slot until you create more.
                </p>
              </div>
              <div className="mb-3.5">
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
              <div className="grid grid-cols-1 min-[721px]:grid-cols-2 gap-4 mb-3.5">
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
              </div>
              <div className="grid grid-cols-1 min-[721px]:grid-cols-2 gap-4">
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
          )}

          {step === 3 && (
            <section className="flex-1 animate-fade-up">
              <div className="mb-1.5">
                <h2 className="text-xl m-0 mb-1.5 font-extrabold text-white tracking-tight">
                  In-article placement
                </h2>
                <p className="text-sm text-[#b5b5b5] leading-snug m-0 mb-[18px] max-w-[60ch]">
                  Rules for how ads are woven between paragraphs on long posts.
                </p>
              </div>
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
                  <strong className="block text-[15px] font-semibold mb-1 text-white leading-snug">
                    Insert in-article ads
                  </strong>
                  <span className="text-[13.5px] text-[#b0b0b0] leading-snug">
                    Place ads between paragraphs on long posts.
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 min-[721px]:grid-cols-2 gap-4 mb-3.5">
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
                  <label htmlFor="ads-min-before" className={fieldLabel}>Min paragraphs before first ad</label>
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
              </div>
              <div className="mb-3.5">
                <label htmlFor="ads-max" className={fieldLabel}>Max in-article ads per post</label>
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
              <div
                className={cn(toggleRowClass, 'mt-1.5')}
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
                  <strong className="block text-[15px] font-semibold mb-1 text-white leading-snug">
                    Auto ads flag (stored)
                  </strong>
                  <span className="text-[13.5px] text-[#b0b0b0] leading-snug">
                    Reserved for Google Auto ads setup in AdSense. Manual slots still use the IDs
                    above.
                  </span>
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="flex-1 animate-fade-up">
              <div className="mb-1.5">
                <h2 className="text-xl m-0 mb-1.5 font-extrabold text-white tracking-tight">ads.txt</h2>
                <p className="text-sm text-[#b5b5b5] leading-snug m-0 mb-[18px] max-w-[60ch]">
                  Content served at <code className={tagClass}>/api/adsense/ads.txt</code> (and via
                  the site proxy). Update when you change the publisher ID.
                </p>
              </div>
              <div>
                <label htmlFor="ads-txt" className={fieldLabel}>ads.txt body</label>
                <textarea
                  id="ads-txt"
                  rows={5}
                  value={form.adsTxt}
                  onChange={(e) => setField('adsTxt', e.target.value)}
                  placeholder={defaultAdsTxt(form.publisherId)}
                  className={cn(fieldControl, 'resize-y min-h-[72px] leading-normal text-[13.5px]')}
                />
              </div>
            </section>
          )}

          <div className="flex justify-between mt-auto pt-3.5 border-t border-line gap-3 shrink-0">
            <button
              type="button"
              className={navBtn}
              onClick={() => goToStep(step - 1)}
              disabled={step === 0}
            >
              <ChevronLeft />
              Back
            </button>
            <button
              type="button"
              className={navBtn}
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
        <aside
          className="py-4 px-[18px] flex flex-col gap-3 bg-[#101010] h-full min-h-0 overflow-y-auto max-[1100px]:hidden"
          aria-label="Delivery pipeline"
        >
          <div className="font-mono text-xs tracking-[0.12em] text-[#888] flex justify-between items-center uppercase font-semibold">
            <span>Delivery pipeline</span>
            <span
              className={cn(
                'font-mono tracking-[0.06em] text-xs font-bold',
                pipeline.isLive ? 'text-mint' : 'text-[#aaa]'
              )}
            >
              {pipeline.state}
            </span>
          </div>

          <div className="flex flex-col gap-0">
            {[
              { key: 'creds', lit: pipeline.creds, title: 'Credentials', sub: 'publisher + client' },
              { key: 'slots', lit: pipeline.slots, title: 'Ad slots', sub: 'slot IDs mapped' },
              { key: 'place', lit: pipeline.place, title: 'Placement', sub: 'in-article rules set' },
              { key: 'txt', lit: pipeline.txt, title: 'ads.txt', sub: 'verification synced' },
              { key: 'live', lit: pipeline.live, title: 'Live on site', sub: 'serving to visitors' },
            ].map((row, idx, arr) => (
              <div key={row.key} className="flex items-center gap-3 py-2 relative">
                {idx < arr.length - 1 ? (
                  <span className="absolute left-[10px] top-[30px] bottom-[-11px] w-px bg-line" />
                ) : null}
                <div
                  className={cn(
                    'w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 z-[1] transition-all',
                    row.lit
                      ? 'border-mint bg-mint shadow-[0_0_10px_rgba(255,255,255,0.35)] text-black'
                      : 'border-line bg-[#0a0a0a] text-transparent'
                  )}
                >
                  <CheckIcon />
                </div>
                <div className="flex flex-col">
                  <strong
                    className={cn(
                      'text-sm font-semibold leading-snug',
                      row.lit ? 'text-white' : 'text-[#aaa]'
                    )}
                  >
                    {row.title}
                  </strong>
                  <span className="text-xs text-[#777] font-mono mt-0.5">{row.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-line" />

          <StatusPill on={!!form.enabled}>{form.enabled ? 'ADS ON' : 'ADS OFF'}</StatusPill>

          <div className="bg-[#0a0a0a] border border-line rounded-md py-3.5 px-[15px]">
            <div className="font-mono text-[11px] tracking-[0.08em] text-[#888] mb-2 uppercase font-semibold">
              Publisher ID
            </div>
            <div className="font-mono text-sm text-mint font-semibold break-all leading-snug">
              {String(form.publisherId || '').trim() || '—'}
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-line rounded-md py-3.5 px-[15px]">
            <div className="font-mono text-[11px] tracking-[0.08em] text-[#888] mb-2 uppercase font-semibold">
              ads.txt preview
            </div>
            <div className="font-mono text-[13.5px] text-[#d0d0d0] break-all leading-snug">
              {adsTxtPreview}
            </div>
          </div>

          {/* Save lives at bottom of delivery pipeline card */}
          <div className="mt-auto pt-2 border-t border-line flex flex-col gap-2">
            <button
              type="button"
              className={cn(btnPrimary, 'w-full justify-center')}
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
            <span
              className={cn(
                'text-[12px] text-[#888] font-mono font-medium text-center',
                hint &&
                  (hint.toLowerCase().includes('saved') || hint.toLowerCase().includes('deleted')) &&
                  'text-mint',
                hint &&
                  !hint.toLowerCase().includes('saved') &&
                  !hint.toLowerCase().includes('deleted') &&
                  'text-[#ff6b6b]'
              )}
            >
              {hint || lastSaved || 'Not saved yet'}
            </span>
          </div>
        </aside>
      </div>

      {/* Mobile-only actions (delivery pipeline is hidden below 1100px) */}
      <div className="hidden max-[1100px]:flex flex-col gap-2.5 mt-3">
        <button
          type="button"
          className={cn(btnPrimary, 'w-full justify-center')}
          onClick={handleSave}
          disabled={isSaving || isClearing}
        >
          {isSaving ? 'Saving…' : 'Save AdSense settings'}
        </button>
        <span
          className={cn(
            'text-[12px] text-[#888] font-mono font-medium text-center',
            hint &&
              (hint.toLowerCase().includes('saved') || hint.toLowerCase().includes('deleted')) &&
              'text-mint',
            hint &&
              !hint.toLowerCase().includes('saved') &&
              !hint.toLowerCase().includes('deleted') &&
              'text-[#ff6b6b]'
          )}
        >
          {hint || lastSaved || 'Not saved yet'}
        </span>
      </div>
    </div>
  );
}
