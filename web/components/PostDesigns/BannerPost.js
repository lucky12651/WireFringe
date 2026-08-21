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
  ReadingProgress,
  ShareCluster,
  StickyTitleBar,
  StoryFlags,
  StoryFooter,
  TagPills,
  formatPubDate,
  authorBits,
} from './shared';

export default function BannerPost({ post, router, onOpenComments }) {
  const excerpt = postExcerpt(post, 220);
  const { name } = authorBits(post);

  return (
    <div className="post-design-banner">
      <ReadingProgress color="#00d4aa" />
      <StickyTitleBar title={post.title} tone="purple" />

      <section className="relative overflow-hidden bg-[#5b1be4]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-heading text-[100px] font-black italic leading-none tracking-[-0.06em] md:text-[160px]"
          style={{ color: 'transparent', WebkitTextStroke: '2.5px rgba(0,0,0,0.22)' }}
        >
          {SITE_NAME}
        </div>

        <div className="relative z-[2] mx-auto grid max-w-[900px] grid-cols-1 gap-6 px-6 pb-7 pt-10 md:grid-cols-[220px_1fr] md:gap-6">
          <div className="pt-1.5">
            {name ? (
              <p className="m-0 mb-0.5 text-[13px] text-white/75">
                By{' '}
                <Link href={authorPath(post)} className="inline-flex items-center font-bold text-white">
                  {name}
                </Link>
              </p>
            ) : null}
            {post.date ? <p className="mb-3.5 text-[11.5px] text-white/55">{formatPubDate(post.date)}</p> : null}
            <ShareCluster
              post={post}
              onOpenComments={onOpenComments}
              commentCount={post.commentCount}
              tone="purple"
            />
          </div>
          <div>
            <TagPills post={post} tone="purple" />
            <h1 className="mb-4 font-heading text-[clamp(40px,7vw,72px)] font-black leading-[0.92] tracking-[-0.03em] text-black">
              {post.title}
            </h1>
            {excerpt ? (
              <p className="m-0 max-w-[560px] text-[16.5px] leading-normal text-black/70">{excerpt}</p>
            ) : null}
          </div>
        </div>

        <div className="mx-auto max-w-[900px] px-6">
          <HeroImage src={post.ogImg} ratio="16/7.5" />
        </div>
        <div className="mx-auto max-w-[900px] px-6 pb-4 pt-2.5">
          <p className="m-0 font-mono text-[11px] italic text-black/50">{post.bucket || 'Wirefringe'}</p>
        </div>
      </section>

      <div className="post-design-light bg-white text-[#1a1a1a]">
        <div className="mx-auto flex max-w-[680px] items-center gap-3 border-b border-[#e0e0e0] px-6 py-6">
          <AuthorBioRow post={post} tone="light" />
        </div>
        <div className="mx-auto max-w-[680px] px-6 pb-16 pt-9">
          <StoryFlags post={post} tone="light" />
          <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
          <ArticleBody
            html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
            magazine
            className="article-body--banner"
          />
          <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
          <StoryFooter post={post} router={router} onOpenComments={onOpenComments} tone="light" />
        </div>
      </div>
    </div>
  );
}
