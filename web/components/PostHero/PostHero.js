import Link from 'next/link';
import { postExcerpt, formatDateFull } from '../../lib/utils';
import { sectionPath } from '../../lib/sections';
import AuthorByline from '../AuthorByline/AuthorByline';
import { ShareCluster, readingMinutes } from '../PostDesigns/shared';
import { FadeImg } from '../PostDesigns/reading';
import { heroCredit } from '../../lib/articleExtras';

export default function PostHero({ post, commentCount = 0, onOpenComments }) {
  const bucket = post?.bucket || 'News';
  const excerpt = postExcerpt(post, 240);
  const minutes = readingMinutes(post);
  const published = formatDateFull(post?.date);

  return (
    <section className="newsroom-article-hero">
      <div className="newsroom-article-inner">
        <nav className="newsroom-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">The newsroom</Link><span aria-hidden="true">/</span><Link href={sectionPath(bucket)}>{bucket}</Link>
        </nav>
        <div className={`newsroom-article-heading ${post?.ogImg ? '' : 'newsroom-article-heading--text'}`}>
          <div className="newsroom-article-copy">
            <p className="newsroom-kicker"><span className="newsroom-dot" /> {bucket}</p>
            <h1>{post?.title}</h1>
            {excerpt ? <p className="newsroom-dek">{excerpt}</p> : null}
            <div className="newsroom-article-byline">
              <AuthorByline post={post} size="lg" showAvatar label="By" />
              <div className="newsroom-publication">
                {published ? <time dateTime={new Date(post.date).toISOString()}>{published}</time> : null}
                {minutes ? <span>{minutes} min read</span> : null}
              </div>
            </div>
            <div className="newsroom-article-actions">
              <ShareCluster post={post} onOpenComments={onOpenComments} commentCount={commentCount} />
              <a href="#story-body" className="newsroom-text-link">Start reading <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          {post?.ogImg ? (
            <figure className="newsroom-article-figure">
              <div className="newsroom-article-image"><FadeImg src={post.ogImg} alt="" fetchPriority="high" className="h-full w-full object-cover" /></div>
              <figcaption>{heroCredit(post)}</figcaption>
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}
