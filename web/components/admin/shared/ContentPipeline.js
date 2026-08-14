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
      className={cn('py-6 border-b border-line overflow-visible', className)}
      aria-label="Content pipeline"
    >
      <div className="flex justify-between items-baseline mb-4 gap-3 flex-wrap">
        <span className="text-[11px] tracking-[0.12em] text-ink-muted uppercase font-medium">
          Content pipeline
        </span>
        <span
          className={cn(
            'text-[11px] flex items-center gap-1.5 tracking-[0.08em] font-medium',
            isProcessing ? 'text-ink' : 'text-ink-muted'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isProcessing
                ? 'bg-mint animate-pulse'
                : !botEnabled
                  ? 'bg-[#ff6b6b]'
                  : 'bg-ink-muted'
            )}
          />
          {!botEnabled ? 'BOT OFF' : isProcessing ? 'PROCESSING' : 'STANDBY'}
        </span>
      </div>

      <div className="flex items-center overflow-x-auto overflow-y-visible pt-3 pb-1">
        <div className="flex-none flex flex-col items-center gap-2.5 w-[150px] max-[720px]:w-[120px]">
          <div
            className={cn(
              'relative w-16 h-16 max-[720px]:w-14 max-[720px]:h-14 rounded-full border bg-bg-elevated flex flex-col items-center justify-center transition-all',
              isProcessing ? 'border-mint pipeline-node-active' : 'border-line'
            )}
          >
            <span className="font-semibold text-[19px] max-[720px]:text-base text-ink leading-none tracking-tight">
              {pending}
            </span>
            <div
              className={cn(
                'absolute -top-2 -right-2 w-5 h-5 rounded-full bg-bg-elevated border flex items-center justify-center [&>svg]:w-2.5 [&>svg]:h-2.5',
                isProcessing ? 'border-mint text-mint' : 'border-line text-ink-muted'
              )}
            >
              <IconClock />
            </div>
          </div>
          <div className="text-center">
            <strong className="block text-[12px] font-medium text-ink">Pending queue</strong>
            <span className="text-[10px] text-ink-muted uppercase tracking-wide">To process</span>
          </div>
        </div>

        <div className={cn('pipeline-connector', isProcessing && 'is-active')} aria-hidden="true" />

        <div className="flex-none flex flex-col items-center gap-2.5 w-[150px] max-[720px]:w-[120px]">
          <div
            className={cn(
              'relative w-16 h-16 max-[720px]:w-14 max-[720px]:h-14 rounded-full border bg-bg-elevated flex flex-col items-center justify-center transition-all',
              isProcessing ? 'border-mint pipeline-node-active' : 'border-line'
            )}
          >
            <span className="font-semibold text-[19px] max-[720px]:text-base text-ink leading-none tracking-tight">
              {cache}
            </span>
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-bg-elevated border border-line text-ink-secondary flex items-center justify-center [&>svg]:w-2.5 [&>svg]:h-2.5">
              <IconShield />
            </div>
          </div>
          <div className="text-center">
            <strong className="block text-[12px] font-medium text-ink">Cache</strong>
            <span className="text-[10px] text-ink-muted uppercase tracking-wide">
              Last {cache || 50} handled
            </span>
          </div>
        </div>

        <div className={cn('pipeline-connector', isProcessing && 'is-active')} aria-hidden="true" />

        <div className="flex-none flex flex-col items-center gap-2.5 w-[150px] max-[720px]:w-[120px]">
          <div className="relative w-16 h-16 max-[720px]:w-14 max-[720px]:h-14 rounded-full border border-line bg-bg-elevated flex flex-col items-center justify-center">
            <span className="font-semibold text-[19px] max-[720px]:text-base text-ink leading-none tracking-tight">
              {published}
            </span>
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-bg-elevated border border-line text-ink-muted flex items-center justify-center [&>svg]:w-2.5 [&>svg]:h-2.5">
              <IconCheck />
            </div>
          </div>
          <div className="text-center">
            <strong className="block text-[12px] font-medium text-ink">Bot published</strong>
            <span className="text-[10px] text-ink-muted uppercase tracking-wide">Bot posts only</span>
          </div>
        </div>
      </div>
    </section>
  );
}
