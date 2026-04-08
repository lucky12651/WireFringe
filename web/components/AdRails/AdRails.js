import styles from './AdRails.module.css';

export default function AdRails() {
  return (
    <>
      {/* Left Ad Rail */}
      <aside 
        className={`${styles.adRail} ${styles.adRailLeft}`} 
        aria-label="Side Advertisement Left"
      >
        <div className={styles.adSlot}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-9036526646235532"
            data-ad-slot="4810585579"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </aside>

      {/* Right Ad Rail */}
      <aside 
        className={`${styles.adRail} ${styles.adRailRight}`} 
        aria-label="Side Advertisement Right"
      >
        <div className={styles.adSlot}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-9036526646235532"
            data-ad-slot="4810585579"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </aside>
    </>
  );
}
