import { useState } from 'react';
import styles from './NewsletterSignup.module.css';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    // No backend configured here — show a friendly thank you state.
    setSent(true);
  };

  return (
    <div className={styles.card} aria-label="Newsletter signup">
      <h3 className={styles.title}>Get weekly briefings</h3>
      <p className={styles.copy}>Top stories and analysis, delivered to your inbox.</p>

      {sent ? (
        <div className={styles.thanks}>Thanks — check your inbox!</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
          />
          <button className={styles.btn} type="submit">Subscribe</button>
        </form>
      )}
    </div>
  );
}
