import Layout from '../Layout/Layout';
import { LAST_UPDATED, SITE_NAME } from '../../lib/site';

/**
 * Shared shell for About / legal / contact pages (AdSense trust pages).
 * No side ad rails — clean, readable policy content.
 */
export default function StaticPage({
  title,
  description,
  kicker = SITE_NAME,
  lead,
  updated = LAST_UPDATED,
  children,
  showUpdated = true,
}) {
  const fullTitle = `${title} – ${SITE_NAME}`;

  return (
    <Layout
      title={fullTitle}
      description={description || `${title} for ${SITE_NAME}`}
      showAdRails={false}
      showInlineAd={false}
    >
      <article className="max-w-[760px] mx-auto pt-10 pb-20 max-sm:pt-7 max-sm:pb-16">
        {kicker ? (
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase text-mint m-0 mb-3">
            {kicker}
          </p>
        ) : null}
        <h1 className="text-[clamp(1.85rem,4vw,2.5rem)] font-black tracking-tight leading-tight text-white m-0 mb-3">
          {title}
        </h1>
        {showUpdated && updated ? (
          <p className="text-[13px] text-[#777] m-0 mb-7">Last updated: {updated}</p>
        ) : null}
        {lead ? (
          <p className="text-[1.1rem] leading-relaxed text-ink-soft m-0 mb-8 pb-7 border-b border-[#222]">
            {lead}
          </p>
        ) : null}
        <div className="static-content">{children}</div>
      </article>
    </Layout>
  );
}
