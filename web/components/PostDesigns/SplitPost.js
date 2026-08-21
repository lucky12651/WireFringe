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
  ReadingProgress,
  ShareCluster,
  StoryFlags,
  StoryFooter,
  StoryMeta,
  StoryShell,
  TagPills,
  Watermark,
  authorBits,
} from './shared';

export default function SplitPost({ post, router, onOpenComments, sidebarPosts, moreInBucket }) {
  const excerpt = postExcerpt(post, 220);
  const { name } = authorBits(post);

  return (
    <div className="post-design-split bg-bg text-ink">
      <ReadingProgress color="var(--mint)" />
      <Watermark />

      <header className={`${PAGE} pt-6 md:pt-8`}>
        <TagPills post={post} />
        <h1 className="mb-6 font-heading text-[clamp(34px,5.2vw,56px)] font-black leading-[1.02] tracking-[-0.03em] text-ink [text-wrap:pretty]">
          {post.title}
        </h1>
      </header>

      <div className={`${PAGE} grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(260px,42%)_1fr] md:gap-12`}>
        <HeroImage src={post.ogImg} ratio="4/5" />
        <div className="md:pt-4">
          {excerpt ? (
            <p className="mb-7 text-[clamp(1.15rem,2.2vw,1.65rem)] font-normal leading-[1.45] text-ink-dek [text-wrap:pretty]">
              <span className="mr-0.5 italic text-ink-tertiary">/ </span>
              {excerpt}
            </p>
          ) : null}
          {name ? (
            <p className="m-0 mb-1 text-[13px] text-ink-secondary">
              By{' '}
              <Link href={authorPath(post)} className="font-bold text-ink hover:text-mint">
                {name}
              </Link>
            </p>
          ) : null}
          <StoryMeta post={post} className="mb-4" />
          <ShareCluster post={post} onOpenComments={onOpenComments} commentCount={post.commentCount} />
        </div>
      </div>

      <div className={`${PAGE} pt-3`}>
        <p className="m-0 text-[11px] italic text-ink-tertiary">{post.bucket || 'Wirefringe'}</p>
      </div>

      <StoryShell post={post} sidebarPosts={sidebarPosts} moreInBucket={moreInBucket} bandTone="plain">
        <article>
          <div className="mb-8 border-y border-line py-5">
            <AuthorBioRow post={post} />
          </div>
          <StoryFlags post={post} />
          <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
          <ArticleBody
            html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
            magazine
            className="article-body--split"
          />
          <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
          <StoryFooter post={post} router={router} onOpenComments={onOpenComments} />
        </article>
      </StoryShell>
    </div>
  );
}
