import Layout from '../Layout/Layout';
import styles from './StaticPage.module.css';
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
      <article className={styles.page}>
        {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {showUpdated && updated ? (
          <p className={styles.updated}>Last updated: {updated}</p>
        ) : null}
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        <div className={styles.content}>{children}</div>
      </article>
    </Layout>
  );
}
