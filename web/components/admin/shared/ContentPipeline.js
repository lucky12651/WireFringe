import React from 'react';
import { cn } from '../../../lib/utils';

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * News-bot content pipeline: Pending queue → Cache → Bot published.
 * Animates only when bot is ON and there is pending queue work.
 */
export function ContentPipeline({
  queueCount = 0,
  cacheCount = 0,
  botPublishedCount = 0,
  botOn = true,
  className = '',
}) {
  const pending = Number(queueCount) || 0;
  const cache = Number(cacheCount) || 0;
  const published = Number(botPublishedCount) || 0;
  const botEnabled = botOn !== false;
  // Flow only when bot is running AND something is in the queue
  const isProcessing = botEnabled && pending > 0;

  return (
    <section
      className={cn(
        'bg-white/[0.03] border border-white/[0.08] rounded-2xl py-5 px-[26px] max-[720px]:p-4',
        'shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm overflow-visible',
        className
      )}
      aria-label="Content pipeline"
    >
      <div className="flex justify-between items-baseline mb-4 gap-3 flex-wrap">
        <span className="text-[10px] tracking-[0.16em] text-white/35 uppercase font-medium">
          Content pipeline — news bot
        </span>
        <span
          className={cn(
            'text-[10px] flex items-center gap-1.5 tracking-[0.08em] font-medium',
            isProcessing ? 'text-white' : 'text-white/40'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isProcessing
                ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.55)] animate-pulse'
                : !botEnabled
                  ? 'bg-[#ff6b6b]/70'
                  : 'bg-white/25'
            )}
          />
          {!botEnabled ? 'BOT OFF' : isProcessing ? 'PROCESSING' : 'STANDBY'}
        </span>
      </div>

      {/* pt-3 so top badges on circles are not clipped by the card edge */}
      <div className="flex items-center overflow-x-auto overflow-y-visible pt-3 pb-1">
        {/* Pending queue */}
        <div className="flex-none flex flex-col items-center gap-2.5 w-[150px] max-[720px]:w-[120px]">
          <div
            className={cn(
              'relative w-16 h-16 max-[720px]:w-14 max-[720px]:h-14 rounded-full border bg-black/50 flex flex-col items-center justify-center transition-all',
              isProcessing
                ? 'border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.18)] pipeline-node-active'
                : 'border-white/12'
            )}
          >
            <span className="font-semibold text-[19px] max-[720px]:text-base text-white leading-none tracking-tight">
              {pending}
            </span>
            <div
              className={cn(
                'absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black border flex items-center justify-center [&>svg]:w-2.5 [&>svg]:h-2.5',
                isProcessing
                  ? 'border-white/50 [&>svg]:text-white'
                  : 'border-white/12 [&>svg]:text-white/40'
              )}
            >
              <IconClock />
            </div>
          </div>
          <div className="text-center">
            <strong className="block text-[11.5px] font-medium text-white/90">Pending queue</strong>
            <span className="text-[9.5px] text-white/30 uppercase tracking-wide">To process</span>
          </div>
        </div>

        <div
          className={cn('pipeline-connector', isProcessing && 'is-active')}
          aria-hidden="true"
        />

        {/* Cache */}
        <div className="flex-none flex flex-col items-center gap-2.5 w-[150px] max-[720px]:w-[120px]">
          <div
            className={cn(
              'relative w-16 h-16 max-[720px]:w-14 max-[720px]:h-14 rounded-full border bg-black/50 flex flex-col items-center justify-center transition-all',
              isProcessing
                ? 'border-white/70 shadow-[0_0_28px_rgba(255,255,255,0.22)] pipeline-node-active'
                : 'border-white/40 shadow-[0_0_24px_rgba(255,255,255,0.12)]'
            )}
          >
            <span className="font-semibold text-[19px] max-[720px]:text-base text-white leading-none tracking-tight">
              {cache}
            </span>
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black border border-white/40 flex items-center justify-center [&>svg]:w-2.5 [&>svg]:h-2.5 [&>svg]:text-white">
              <IconShield />
            </div>
          </div>
          <div className="text-center">
            <strong className="block text-[11.5px] font-medium text-white/90">Cache</strong>
            <span className="text-[9.5px] text-white/30 uppercase tracking-wide">
              Last {cache || 50} handled
            </span>
          </div>
        </div>

        <div
          className={cn('pipeline-connector', isProcessing && 'is-active')}
          aria-hidden="true"
        />

        {/* Bot published only */}
        <div className="flex-none flex flex-col items-center gap-2.5 w-[150px] max-[720px]:w-[120px]">
          <div className="relative w-16 h-16 max-[720px]:w-14 max-[720px]:h-14 rounded-full border border-white/12 bg-black/50 flex flex-col items-center justify-center">
            <span className="font-semibold text-[19px] max-[720px]:text-base text-white leading-none tracking-tight">
              {published}
            </span>
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black border border-white/12 flex items-center justify-center [&>svg]:w-2.5 [&>svg]:h-2.5 [&>svg]:text-white/40">
              <IconCheck />
            </div>
          </div>
          <div className="text-center">
            <strong className="block text-[11.5px] font-medium text-white/90">Bot published</strong>
            <span className="text-[9.5px] text-white/30 uppercase tracking-wide">Bot posts only</span>
          </div>
        </div>
      </div>
    </section>
  );
}
