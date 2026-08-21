import Link from 'next/link';
import ArticleBody from '../ArticleBody/ArticleBody';
import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';
import { postExcerpt, stripHtml } from '../../lib/utils';
import { authorPath } from '../../lib/sections';
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
  Watermark,
  authorBits,
} from './shared';
import { KeyPoints, UpdatedStamp } from './reading';
import { heroCredit } from '../../lib/articleExtras';

export default function DarkPost({
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
    <div className="post-design-dark bg-bg text-ink">
      <Watermark />

      <div className={`relative z-[2] ${PAGE} mt-[-50px]`}>
        <HeroImage src={post.ogImg} ratio="16/7" credit={heroCredit(post)} />
      </div>

      <div className={`${PAGE} pt-7`}>
        <TagPills post={post} />
        <h1 className="mb-[18px] font-heading text-[clamp(40px,7vw,78px)] font-black leading-[0.92] tracking-[-0.03em] text-ink [text-wrap:pretty]">
          {post.title}
        </h1>
        {excerpt ? (
          <p className="mb-5 max-w-[720px] text-[17.5px] font-normal leading-[1.55] text-ink-dek [text-wrap:pretty]">
            {excerpt}
          </p>
        ) : null}
        {name ? (
          <p className="m-0 mb-1 text-[13px] text-ink-secondary">
            By{' '}
            <Link href={authorPath(post)} className="font-semibold text-mint">
              {name}
            </Link>
          </p>
        ) : null}
        <StoryMeta post={post} />
        <p className="mt-2 text-[11px] italic text-ink-tertiary">{post.bucket || 'Wirefringe'}</p>
      </div>

      <div className={`${PAGE} mt-7 flex flex-col items-start justify-between gap-5 border-y border-line py-4 md:flex-row md:items-center`}>
        <AuthorBioRow post={post} />
        <ShareCluster post={post} onOpenComments={onOpenComments} commentCount={post.commentCount} />
      </div>

      <StoryShell post={post} sidebarPosts={sidebarPosts} moreInBucket={moreInBucket} bandTone="plain" headings={headings}>
        <article>
          <UpdatedStamp post={post} />
          <StoryFlags post={post} />
          <KeyPoints points={keyPoints} />
          <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
          <ArticleBody
            html={bodyHtml || post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
            title={post.title}
            magazine
            className="article-body--dark"
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
