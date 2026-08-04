import styles from './Skeleton.module.css';

function Bone({ className = '', style }) {
  return <div className={`${styles.pulse} ${styles.block} ${className}`.trim()} style={style} />;
}

export function HomeSkeleton() {
  return (
    <div className={styles.home} aria-busy="true" aria-label="Loading homepage">
      <div className={styles.homeLeft}>
        <Bone className={styles.heroMedia} />
        <Bone className={styles.heroLine} />
        <Bone className={styles.heroLineShort} />
        <div className={styles.grid2}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.cardRow}>
              <Bone className={styles.thumb} />
              <div>
                <Bone className={styles.line} style={{ width: '90%' }} />
                <Bone className={styles.lineSm} />
                <Bone className={styles.lineSm} style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
        <Bone className={styles.line} style={{ width: '30%', height: 20, marginBottom: 20 }} />
        <div className={styles.grid2}>
          <Bone style={{ height: 220, borderRadius: 6 }} />
          <div>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.cardRow} style={{ marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <Bone className={styles.line} />
                  <Bone className={styles.lineSm} />
                </div>
                <Bone className={styles.streamThumb} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.homeRight}>
        <Bone className={styles.streamTab} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.streamItem}>
            <div>
              <Bone className={styles.lineSm} style={{ width: '35%', marginBottom: 12 }} />
              <Bone className={styles.line} />
              <Bone className={styles.lineSm} style={{ width: '80%' }} />
            </div>
            <Bone className={styles.streamThumb} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className={styles.post} aria-busy="true" aria-label="Loading article">
      <div className={styles.postHeader}>
        <Bone className={styles.postMeta} />
        <Bone className={styles.postTitle} />
        <Bone className={styles.postTitle2} />
        <Bone className={styles.postAuthor} />
      </div>
      <div className={styles.postLayout}>
        <div>
          <Bone className={styles.postHero} />
          {[92, 100, 88, 96, 70, 100, 85, 60].map((w, i) => (
            <Bone key={i} className={styles.postBodyLine} style={{ width: `${w}%` }} />
          ))}
        </div>
        <aside>
          <Bone className={styles.sidebarBox} />
          <Bone className={styles.sidebarList} />
        </aside>
      </div>
    </div>
  );
}

export default function Skeleton({ variant = 'home' }) {
  if (variant === 'post') return <PostSkeleton />;
  return <HomeSkeleton />;
}
