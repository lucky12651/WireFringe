import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';

export default function AdRails() {
  return (
    <>
      <aside
        className="hidden min-[1500px]:block fixed top-[calc(var(--header-height,84px)+16px)] w-[var(--ad-rail-width,160px)] z-[5] pointer-events-none left-[max(8px,calc((100vw-var(--max-width,1280px))/2-var(--ad-rail-width,160px)-20px))]"
        aria-label="Advertisement left"
      >
        <div className="pointer-events-auto max-h-[calc(100vh-var(--header-height,84px)-32px)] overflow-hidden">
          <AdUnit variant="rail" slot={AD_SLOTS.rail} label="Ad" />
        </div>
      </aside>
      <aside
        className="hidden min-[1500px]:block fixed top-[calc(var(--header-height,84px)+16px)] w-[var(--ad-rail-width,160px)] z-[5] pointer-events-none right-[max(8px,calc((100vw-var(--max-width,1280px))/2-var(--ad-rail-width,160px)-20px))]"
        aria-label="Advertisement right"
      >
        <div className="pointer-events-auto max-h-[calc(100vh-var(--header-height,84px)-32px)] overflow-hidden">
          <AdUnit variant="rail" slot={AD_SLOTS.rail} label="Ad" />
        </div>
      </aside>
    </>
  );
}
