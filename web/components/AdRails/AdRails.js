import styles from './AdRails.module.css';
import AdsenseAd from '../AdsenseAd/AdsenseAd';

export default function AdRails() {
  return (
    <>
      {/* Left Ad Rail */}
      <aside 
        className={`${styles.adRail} ${styles.adRailLeft}`} 
        aria-label="Side Advertisement Left"
      >
        <div className={styles.adSlot}>
          <AdsenseAd
            slot="4810585579"
            format="auto"
            fullWidthResponsive={false}
            style={{ width: 160, height: 600 }}
          />
        </div>
      </aside>

      {/* Right Ad Rail */}
      <aside 
        className={`${styles.adRail} ${styles.adRailRight}`} 
        aria-label="Side Advertisement Right"
      >
        <div className={styles.adSlot}>
          <AdsenseAd
            slot="4810585579"
            format="auto"
            fullWidthResponsive={false}
            style={{ width: 160, height: 600 }}
          />
        </div>
      </aside>
    </>
  );
}
