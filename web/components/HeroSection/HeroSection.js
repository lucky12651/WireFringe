import Link from 'next/link';
import { postUrl, postExcerpt, formatDateShort } from '../../lib/utils';
import AuthorByline from '../AuthorByline/AuthorByline';

function StoryImage({ post, eager = false }) {
  return post.ogImg ? (
    <img src={post.ogImg} alt="" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} />
  ) : (
    <div className="newsroom-placeholder" aria-hidden="true"><span>W/F</span></div>
  );
}

export default function HeroSection({ posts = [], category = 'All' }) {
  const featured = posts[0];
  const stories = posts.slice(1, 5);

  return (
    <section className="newsroom-front" aria-label="Featured stories">
      <div className="newsroom-edition">
        <span className="newsroom-kicker"><span className="newsroom-dot" /> The WireFringe edit</span>
        {featured ? <a href="#latest-stories" className="newsroom-text-link">Explore the latest <span aria-hidden="true">↗</span></a> : <Link href="/about" className="newsroom-text-link">Meet WireFringe <span aria-hidden="true">↗</span></Link>}
      </div>
      {!featured ? (
        <div className="newsroom-empty">
          <p className="newsroom-kicker">{category === 'All' ? 'From the newsroom' : category}</p>
          <h1>{category === 'All' ? 'The next story starts here.' : 'More to come.'}</h1>
          <p>{category === 'All' ? 'Fresh perspectives on technology, business, and the world in motion. Check back for our latest stories.' : 'There are no published stories in this section yet. Explore the rest of the newsroom.'}</p>
          <Link href={category === 'All' ? '/archives' : '/'} className="newsroom-text-link">{category === 'All' ? 'Browse the archives' : 'See all stories'} <span aria-hidden="true">↗</span></Link>
        </div>
      ) : (
        <>
          <article className="newsroom-lead">
            <div className="newsroom-lead-copy">
              <p className="newsroom-kicker">{featured.bucket || 'In focus'} <span className="newsroom-label">Lead story</span></p>
              <h1><Link href={postUrl(featured)}>{featured.title}</Link></h1>
              {postExcerpt(featured, 210) ? <p className="newsroom-dek">{postExcerpt(featured, 210)}</p> : null}
              <div className="newsroom-meta">
                <AuthorByline post={featured} size="md" />
                {featured.date ? <span>{formatDateShort(featured.date)}</span> : null}
                {featured.readMinutes ? <span>{featured.readMinutes} min read</span> : null}
              </div>
              <Link href={postUrl(featured)} className="newsroom-read">Read the story <span aria-hidden="true">↗</span></Link>
            </div>
            <Link href={postUrl(featured)} className="newsroom-lead-image" aria-label={`Read: ${featured.title}`}>
              <StoryImage post={featured} eager />
              <span className="newsroom-image-index" aria-hidden="true">01 / IN FOCUS</span>
            </Link>
          </article>
          {stories.length ? (
            <div className="newsroom-story-grid">
              {stories.map((post, index) => (
                <article key={post.id} className="newsroom-story-card">
                  <Link href={postUrl(post)} className="newsroom-card-image" aria-label={`Read: ${post.title}`}><StoryImage post={post} /></Link>
                  <p className="newsroom-kicker"><span className="newsroom-card-number">0{index + 2}</span> {post.bucket || 'News'}</p>
                  <h2><Link href={postUrl(post)}>{post.title}</Link></h2>
                  <div className="newsroom-meta"><AuthorByline post={post} size="sm" />{post.readMinutes ? <span>{post.readMinutes} min read</span> : null}</div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
