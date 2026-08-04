import styles from './AdRails.module.css';
import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';

export default function AdRails() {
  return (
    <>
      <aside className={`${styles.adRail} ${styles.adRailLeft}`} aria-label="Advertisement left">
        <div className={styles.stickyInner}>
          <AdUnit variant="rail" slot={AD_SLOTS.rail} label="Ad" />
        </div>
      </aside>
      <aside className={`${styles.adRail} ${styles.adRailRight}`} aria-label="Advertisement right">
        <div className={styles.stickyInner}>
          <AdUnit variant="rail" slot={AD_SLOTS.rail} label="Ad" />
        </div>
      </aside>
    </>
  );
}
