import Link from 'next/link';
import ArticleBody from '../ArticleBody/ArticleBody';
import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';
import { postExcerpt, stripHtml } from '../../lib/utils';
import { authorPath } from '../../lib/sections';
import {
  AuthorBioRow,
  HeroImage,
  ReadingProgress,
  ShareCluster,
  StickyTitleBar,
  StoryFlags,
  StoryFooter,
  TagPills,
  Watermark,
  formatPubDate,
  authorBits,
} from './shared';

export default function DarkPost({ post, router, onOpenComments }) {
  const excerpt = postExcerpt(post, 220);
  const { name } = authorBits(post);

  return (
    <div className="post-design-dark bg-[#111] text-[#f0f0f0]">
      <ReadingProgress color="#00d4aa" />
      <StickyTitleBar title={post.title} tone="dark" />
      <Watermark stroke="#252525" />

      <div className="relative z-[2] mx-auto mt-[-50px] max-w-[900px] px-6">
        <HeroImage src={post.ogImg} ratio="16/7" />
      </div>

      <div className="mx-auto max-w-[900px] px-6">
        <TagPills post={post} tone="dark" />
        <h1 className="mb-[18px] font-heading text-[clamp(42px,8vw,86px)] font-black leading-[0.9] tracking-[-0.03em] text-white">
          {post.title}
        </h1>
        {excerpt ? (
          <p className="mb-[22px] max-w-[720px] text-[17.5px] font-normal leading-[1.55] text-[#ddd]">{excerpt}</p>
        ) : null}
        {name ? (
          <p className="m-0 mb-1 text-[13px] text-[#a0a0a0]">
            By{' '}
            <Link href={authorPath(post)} className="font-semibold text-[#00d4aa]">
              {name}
            </Link>
          </p>
        ) : null}
        {post.date ? <p className="m-0 text-[12px] text-[#6a6a6a]">{formatPubDate(post.date)}</p> : null}
        <p className="mt-2 text-[11px] italic text-[#6a6a6a]">{post.bucket || 'Wirefringe'}</p>
      </div>

      <div className="mx-auto my-7 flex max-w-[900px] flex-col items-start justify-between gap-5 border-y border-[#2a2a2a] px-6 py-4 md:flex-row md:items-center">
        <AuthorBioRow post={post} tone="dark" />
        <ShareCluster
          post={post}
          onOpenComments={onOpenComments}
          commentCount={post.commentCount}
          tone="dark"
        />
      </div>

      <div className="mx-auto max-w-[680px] px-6 pb-16">
        <StoryFlags post={post} tone="dark" />
        <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
        <ArticleBody
          html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
          magazine
          className="article-body--dark"
        />
        <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
        <StoryFooter post={post} router={router} onOpenComments={onOpenComments} tone="dark" />
      </div>
    </div>
  );
}
