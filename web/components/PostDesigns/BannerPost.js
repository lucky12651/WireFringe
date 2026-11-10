import Link from 'next/link';
import ArticleBody from '../ArticleBody/ArticleBody';
import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';
import { postExcerpt, stripHtml } from '../../lib/utils';
import { authorPath } from '../../lib/sections';
import { BANNER_ACCENT } from '../../lib/postDesigns';
import {
  AuthorBioRow,
  HeroImage,
  PAGE,
  ShareCluster,
  StoryFlags,
  StoryFooter,
  StoryMeta,
  StoryShell,
  TagPills,
  authorBits,
  readingMinutes,
} from './shared';
import { KeyPoints, UpdatedStamp } from './reading';
import { heroCredit } from '../../lib/articleExtras';

export default function BannerPost({
  post,
  router,
  onOpenComments,
  sidebarPosts,
  moreInBucket,
  headings,
  keyPoints,
  prevPost,
  nextPost,
  bodyHtml,
  onReader,
}) {
  const excerpt = postExcerpt(post, 220);
  const { name } = authorBits(post);

  return (
    <div className="post-design-banner bg-bg text-ink">
      <section className="post-banner-hero relative overflow-hidden" style={{ backgroundColor: BANNER_ACCENT }}>
        <div className={`relative z-[2] ${PAGE} grid grid-cols-1 gap-6 pb-7 pt-10 md:grid-cols-[240px_1fr] md:gap-10`}>
          <div className="pt-1.5">
            {name ? (
              <p className="m-0 mb-0.5 text-[13px] text-ink-secondary">
                By{' '}
                <Link href={authorPath(post)} className="inline-flex items-center font-bold text-ink hover:underline">
                  {name}
                </Link>
              </p>
            ) : null}
            {post.date || readingMinutes(post) ? (
              <p className="mb-3.5 text-[11.5px] text-ink-secondary" suppressHydrationWarning>
                {post.date ? new Date(post.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                {post.date && readingMinutes(post) ? ' · ' : ''}
                {readingMinutes(post) ? `${readingMinutes(post)} min read` : ''}
              </p>
            ) : (
              <StoryMeta post={post} className="mb-3.5" />
            )}
            <ShareCluster
              post={post}
              onOpenComments={onOpenComments}
              commentCount={post.commentCount}
            />
          </div>
          <div>
            <TagPills post={post} />
            <h1 className="banner-hero-title mb-4 font-heading text-[clamp(40px,6.5vw,72px)] font-black leading-[0.94] tracking-[-0.03em] [text-wrap:pretty]">
              {post.title}
            </h1>
            {excerpt ? (
              <p className="banner-hero-dek m-0 max-w-[640px] text-[16.5px] leading-[1.5] [text-wrap:pretty]">{excerpt}</p>
            ) : null}
          </div>
        </div>

        <div className={`${PAGE}`}>
          <HeroImage src={post.ogImg} ratio="16/7.5" credit={heroCredit(post)} />
        </div>
        <div className={`${PAGE} pb-5 pt-2.5`}>
          <p className="m-0 font-mono text-[11px] italic text-ink-secondary">{post.bucket || 'Wirefringe'}</p>
        </div>
      </section>

      <StoryShell post={post} sidebarPosts={sidebarPosts} moreInBucket={moreInBucket} bandTone="plain" headings={headings}>
        <article>
          <UpdatedStamp post={post} />
          <div className="mb-8 border-b border-line pb-5">
            <AuthorBioRow post={post} />
          </div>
          <StoryFlags post={post} />
          <KeyPoints points={keyPoints} />
          <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
          <ArticleBody
            html={bodyHtml || post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
            title={post.title}
            magazine
            className="article-body--banner"
          />
          <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
          <StoryFooter
            post={post}
            router={router}
            onOpenComments={onOpenComments}
            prevPost={prevPost}
            nextPost={nextPost}
            onReader={onReader}
          />
        </article>
      </StoryShell>
    </div>
  );
}
