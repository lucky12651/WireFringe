import styles from './Loader.module.css';

export default function Loader({ fullPage = false }) {
  return (
    <div className={`${styles.loaderContainer} ${fullPage ? styles.fullPage : ''}`}>
      <div className={styles.spinner} />
    </div>
  );
}
