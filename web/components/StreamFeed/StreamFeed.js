import Link from 'next/link';
import { postUrl } from '../../lib/utils';
import styles from './StreamFeed.module.css';

function author(post) {
  return String(post?.creatorName || post?.creator || 'Staff').toUpperCase();
}

function formatRelative(date) {
  if (!date || Number.isNaN(date.getTime?.())) return '';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 2) return 'JUST NOW';
  if (m < 60) return `${m} MINUTES AGO`;
  if (h === 1) return 'AN HOUR AGO';
  if (h < 24) return `${h} HOURS AGO`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function excerpt(post, max = 180) {
  const raw = String(post?.excerpt || '').trim();
  if (raw) return raw.length > max ? raw.slice(0, max) + '…' : raw;
  return '';
}

function initials(name) {
  const p = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/**
 * Verge-style right stream: LATEST / FOLLOWING with rich post cards
 */
export default function StreamFeed({
  posts = [],
  feedTab = 'latest',
  onTabChange,
  user = null,
  showNewsletter = true,
  NewsletterComponent = null,
}) {
  return (
    <aside className={styles.stream} aria-label="Latest stream">
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${feedTab === 'latest' ? styles.tabActive : ''}`}
          onClick={() => onTabChange?.('latest')}
        >
          LATEST
        </button>
        <button
          type="button"
          className={`${styles.tab} ${feedTab === 'following' ? styles.tabActive : ''}`}
          onClick={() => onTabChange?.('following')}
        >
          FOLLOWING
        </button>
      </div>

      {feedTab === 'following' && !user ? (
        <div className={styles.empty}>
          <p>Sign in to follow writers and topics.</p>
          <Link href="/login" className={styles.signInBtn}>
            SIGN IN
          </Link>
        </div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>No posts yet.</div>
      ) : (
        <div className={styles.list}>
          {posts.map((post, idx) => {
            const mode = idx % 4; // vary card layouts like Verge
            const name = author(post);
            const body = excerpt(post, mode === 1 ? 220 : 140);

            return (
              <article key={post.id} className={styles.item}>
                <div className={styles.authorRow}>
                  <div className={styles.avatar} style={{ '--hue': (idx * 47) % 360 }}>
                    {post.creatorAvatarUrl ? (
                      <img src={post.creatorAvatarUrl} alt="" />
                    ) : (
                      <span>{initials(name)}</span>
                    )}
                  </div>
                  <div className={styles.authorMeta}>
                    <div className={styles.authorName}>{name}</div>
                    <div className={styles.authorTime}>{formatRelative(post.date)}</div>
                  </div>
                </div>

                {/* Layout variants for visual interest */}
                {mode === 0 && (
                  <div className={styles.row}>
                    <div className={styles.main}>
                      <Link href={postUrl(post)} className={styles.title}>
                        {post.title}
                      </Link>
                      {body ? <p className={styles.body}>{body}</p> : null}
                    </div>
                    {post.ogImg ? (
                      <Link href={postUrl(post)} className={styles.thumb}>
                        <img src={post.ogImg} alt="" loading="lazy" />
                      </Link>
                    ) : null}
                  </div>
                )}

                {mode === 1 && (
                  <div className={styles.quick}>
                    <p className={styles.body}>
                      <strong className={styles.inlineTitle}>{post.title}.</strong> {body}
                    </p>
                    {post.link ? (
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.extLink}
                      >
                        {String(post.bucket || 'Source').toUpperCase()}
                      </a>
                    ) : (
                      <Link href={postUrl(post)} className={styles.extLink}>
                        READ MORE
                      </Link>
                    )}
                    {body.length > 80 ? (
                      <blockquote className={styles.quote}>
                        {body.slice(0, 120)}
                        {body.length > 120 ? '…' : ''}
                      </blockquote>
                    ) : null}
                  </div>
                )}

                {mode === 2 && (
                  <>
                    <Link href={postUrl(post)} className={styles.title}>
                      {post.title}
                    </Link>
                    {post.ogImg ? (
                      <Link href={postUrl(post)} className={styles.wideImg}>
                        <img src={post.ogImg} alt="" loading="lazy" />
                      </Link>
                    ) : null}
                    {body ? <p className={styles.body}>{body}</p> : null}
                  </>
                )}

                {mode === 3 && (
                  <div className={styles.row}>
                    <div className={styles.main}>
                      <Link href={postUrl(post)} className={styles.title}>
                        {post.title}
                      </Link>
                      {body ? <p className={styles.body}>{body}</p> : null}
                      {post.link ? (
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.extLink}
                        >
                          [{String(post.bucket || 'SOURCE').toUpperCase()}]
                        </a>
                      ) : null}
                    </div>
                    {post.ogImg ? (
                      <Link href={postUrl(post)} className={styles.thumb}>
                        <img src={post.ogImg} alt="" loading="lazy" />
                      </Link>
                    ) : null}
                  </div>
                )}

                <div className={styles.actions}>
                  <span className={styles.action} title="Comments">
                    <ChatIcon /> {post.readMinutes || 0}
                  </span>
                  <span className={styles.action} title="Share">
                    <ShareIcon />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showNewsletter && NewsletterComponent ? (
        <div id="newsletter" className={styles.newsletter}>
          {NewsletterComponent}
        </div>
      ) : null}
    </aside>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}
