import Link from 'next/link';
import ArticleBody from '../ArticleBody/ArticleBody';
import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';
import { postExcerpt, stripHtml } from '../../lib/utils';
import { authorPath } from '../../lib/sections';
import { SITE_NAME } from '../../lib/site';
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
  onReader,
}) {
  const excerpt = postExcerpt(post, 220);
  const { name } = authorBits(post);

  return (
    <div className="post-design-banner bg-bg text-ink">
      <section className="post-banner-hero relative overflow-hidden bg-[#5b1be4] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-heading text-[100px] font-black italic leading-none tracking-[-0.06em] md:text-[160px]"
          style={{ color: 'transparent', WebkitTextStroke: '2.5px rgba(255,255,255,0.22)' }}
        >
          {SITE_NAME}
        </div>

        <div className={`relative z-[2] ${PAGE} grid grid-cols-1 gap-6 pb-7 pt-10 md:grid-cols-[240px_1fr] md:gap-10`}>
          <div className="pt-1.5">
            {name ? (
              <p className="m-0 mb-0.5 text-[13px] text-white/75">
                By{' '}
                <Link href={authorPath(post)} className="inline-flex items-center font-bold text-white hover:text-[#00d4aa]">
                  {name}
                </Link>
              </p>
            ) : null}
            {post.date || post.readMinutes ? (
              <p className="mb-3.5 text-[11.5px] text-white/55">
                {post.date ? new Date(post.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                {post.date && post.readMinutes ? ' · ' : ''}
                {post.readMinutes ? `${post.readMinutes} min read` : ''}
              </p>
            ) : (
              <StoryMeta post={post} className="mb-3.5 !text-white/55" />
            )}
            <ShareCluster
              post={post}
              onOpenComments={onOpenComments}
              commentCount={post.commentCount}
              tone="purple"
            />
          </div>
          <div>
            <TagPills post={post} tone="purple" />
            <h1 className="banner-hero-title mb-4 font-heading text-[clamp(40px,6.5vw,72px)] font-black leading-[0.94] tracking-[-0.03em] [text-wrap:pretty]">
              {post.title}
            </h1>
            {excerpt ? (
              <p className="banner-hero-dek m-0 max-w-[640px] text-[16.5px] leading-[1.5] [text-wrap:pretty]">{excerpt}</p>
            ) : null}
          </div>
        </div>

        <div className={`${PAGE}`}>
          <HeroImage src={post.ogImg} ratio="16/7.5" credit={heroCredit(post)} creditClassName="text-white/50" />
        </div>
        <div className={`${PAGE} pb-5 pt-2.5`}>
          <p className="m-0 font-mono text-[11px] italic text-white/50">{post.bucket || 'Wirefringe'}</p>
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
            html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
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
