import { POST_DESIGNS, normalizePostDesign } from '../../../lib/postDesigns';
import { cn } from '../../../lib/utils';

function MiniMagazine() {
  return (
    <div className="flex h-full gap-1.5 bg-[#def23a] p-2">
      <div className="w-[42%] border-[3px] border-black bg-[#1a1a1a]" />
      <div className="flex flex-1 flex-col justify-center gap-1">
        <div className="h-1 w-8 bg-black/40" />
        <div className="h-2 w-full bg-black/80" />
        <div className="h-2 w-4/5 bg-black/80" />
        <div className="h-1 w-full bg-black/30" />
      </div>
    </div>
  );
}

function MiniSplit() {
  return (
    <div className="flex h-full flex-col bg-white p-2">
      <div className="mb-1 h-2 w-4/5 bg-black" />
      <div className="flex flex-1 gap-1.5">
        <div className="w-1/2 bg-[#ddd]" />
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className="h-1 w-full bg-[#ccc]" />
          <div className="h-1 w-3/4 bg-[#ccc]" />
          <div className="h-1 w-1/2 bg-[#eee]" />
        </div>
      </div>
    </div>
  );
}

function MiniBanner() {
  return (
    <div className="flex h-full flex-col bg-[#5b1be4]">
      <div className="flex flex-1 items-end px-2 pb-1">
        <div className="h-3 w-4/5 bg-black" />
      </div>
      <div className="h-[38%] bg-[#1a1a1a]" />
    </div>
  );
}

function MiniDark() {
  return (
    <div className="flex h-full flex-col bg-[#111] p-2">
      <div className="mb-1 h-[36%] bg-[#2a2a2a]" />
      <div className="h-3 w-full bg-white" />
      <div className="mt-1 h-1 w-4/5 bg-[#555]" />
      <div className="mt-0.5 h-1 w-2/3 bg-[#333]" />
    </div>
  );
}

const MINIS = {
  magazine: MiniMagazine,
  split: MiniSplit,
  banner: MiniBanner,
  dark: MiniDark,
};

export default function DesignPicker({ value, onChange }) {
  const selected = normalizePostDesign(value);

  return (
    <div className="grid grid-cols-2 gap-2">
      {POST_DESIGNS.map((d) => {
        const Mini = MINIS[d.id];
        const active = selected === d.id;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(d.id)}
            aria-pressed={active}
            className={cn(
              'overflow-hidden rounded-sm border bg-bg-elevated text-left transition-colors',
              active ? 'border-mint ring-1 ring-mint' : 'border-line hover:border-line-strong'
            )}
          >
            <div className="h-[72px] overflow-hidden border-b border-line">{Mini ? <Mini /> : null}</div>
            <div className="px-2 py-1.5">
              <div className="text-[12px] font-semibold text-ink">{d.name}</div>
              <div className="mt-0.5 text-[10px] leading-snug text-ink-tertiary">{d.blurb}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
