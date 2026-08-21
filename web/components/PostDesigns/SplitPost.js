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

export default function SplitPost({ post, router, onOpenComments }) {
  const excerpt = postExcerpt(post, 220);
  const { name } = authorBits(post);

  return (
    <div className="post-design-split post-design-light bg-white text-[#1a1a1a]">
      <ReadingProgress color="#3ae0b5" />
      <StickyTitleBar title={post.title} tone="light" />
      <Watermark stroke="rgba(58,224,181,0.28)" />

      <header className="mx-auto max-w-[900px] px-6 pt-9">
        <TagPills post={post} tone="light" />
        <h1 className="mb-6 font-heading text-[clamp(34px,5.5vw,56px)] font-black leading-[1] tracking-[-0.03em] text-black">
          {post.title}
        </h1>
      </header>

      <div className="mx-auto grid max-w-[900px] grid-cols-1 items-start gap-8 px-6 md:grid-cols-2 md:gap-8">
        <HeroImage src={post.ogImg} ratio="4/5" />
        <div className="md:pt-5">
          {excerpt ? (
            <p className="mb-7 text-[clamp(20px,3.2vw,28px)] font-normal leading-[1.45] text-[#1a1a1a]">
              <span className="mr-0.5 italic text-[#aaa]">/ </span>
              {excerpt}
            </p>
          ) : null}
          {name ? (
            <p className="m-0 mb-1 text-[13px] text-[#888]">
              By{' '}
              <Link href={authorPath(post)} className="font-bold text-[#1a1a1a]">
                {name}
              </Link>
            </p>
          ) : null}
          {post.date ? (
            <p className="mb-3.5 text-[12px] text-[#888]">{formatPubDate(post.date)}</p>
          ) : null}
          <ShareCluster post={post} onOpenComments={onOpenComments} commentCount={post.commentCount} tone="light" />
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-6 pt-2">
        <p className="m-0 text-[11px] italic text-[#888]">{post.bucket || 'Wirefringe'}</p>
      </div>

      <div className="mx-auto max-w-[900px] px-6 pt-6">
        <div className="grid grid-cols-1 items-center gap-6 border-y border-[#e0e0e0] py-4 md:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#888]">Part of</p>
            <p className="m-0 mb-2 text-[15px] font-extrabold leading-snug text-[#1a1a1a]">
              <Link href={`/?category=${encodeURIComponent(String(post.bucket || 'news').toLowerCase())}`} className="text-[#5b1be4]">
                {post.bucket || 'News'}
              </Link>
            </p>
          </div>
          <AuthorBioRow post={post} tone="light" />
        </div>
      </div>

      <div className="mx-auto max-w-[680px] px-6 pb-16 pt-9">
        <StoryFlags post={post} tone="light" />
        <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
        <ArticleBody
          html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
          magazine
          className="article-body--split"
        />
        <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
        <StoryFooter post={post} router={router} onOpenComments={onOpenComments} tone="light" />
      </div>
    </div>
  );
}
