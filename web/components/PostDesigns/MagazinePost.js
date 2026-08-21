import Link from 'next/link';
import ArticleBody from '../ArticleBody/ArticleBody';
import AdUnit from '../AdUnit/AdUnit';
import AuthorByline from '../AuthorByline/AuthorByline';
import FollowBar from '../FollowBar/FollowBar';
import { CommentsCta } from '../CommentDrawer/CommentDrawer';
import { AD_SLOTS } from '../../lib/ads';
import { postUrl, stripHtml } from '../../lib/utils';
import { authorPath, sectionPath } from '../../lib/sections';
import { authorBits } from './shared';

export default function MagazinePost({
  post,
  router,
  onOpenComments,
  authorName,
  authorAvatarUrl,
  authorInitials,
  sidebarPosts,
  moreInBucket,
}) {
  const bits = authorBits(post);
  const name = authorName || bits.name;
  const avatar = authorAvatarUrl || bits.avatarUrl;
  const initials = authorInitials || bits.initials;

  return (
    <>
      <div className="max-w-[1360px] mx-auto px-5 md:px-10 pt-12 md:pt-14 pb-6">
        <div className="grid grid-cols-1 min-[1001px]:grid-cols-[minmax(0,1fr)_320px] gap-12 min-[1001px]:gap-[70px] items-start min-[1001px]:items-stretch">
          <article className="min-w-0">
            {post.isBreaking ? (
              <p className="m-0 mb-3 text-[12px] font-bold uppercase tracking-wide text-[#c0392b]">Breaking</p>
            ) : null}
            {post.isSponsored ? (
              <p className="m-0 mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-tertiary">
                Paid / branded content
              </p>
            ) : null}
            {post.correction ? (
              <div className="mb-6 p-4 border border-[#e8b342] bg-[#e8b342]/10 text-[14px] text-ink">
                <strong>Correction</strong>
                {post.correctedAt || post.updatedAt ? (
                  <span className="text-ink-tertiary">
                    {' '}
                    · {new Date(post.correctedAt || post.updatedAt).toLocaleString()}
                  </span>
                ) : null}
                <p className="m-0 mt-2 whitespace-pre-wrap">{post.correction}</p>
              </div>
            ) : null}
            {post.sourceUrl || post.sourceName || post.isBot ? (
              <p className="m-0 mb-5 text-[13px] text-ink-secondary">
                Rewritten from{' '}
                {post.sourceUrl ? (
                  <a href={post.sourceUrl} className="text-mint" target="_blank" rel="noreferrer">
                    {post.sourceName || post.sourceUrl}
                  </a>
                ) : (
                  <span>{post.sourceName || 'a partner wire'}</span>
                )}
                . Editors review these stories before they go live.{' '}
                <Link href="/sourcing">Sourcing policy</Link>
              </p>
            ) : null}
            {name ? (
              <div className="flex gap-3.5 items-start mb-8">
                {avatar ? (
                  <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full shrink-0 bg-mint text-black font-display text-sm flex items-center justify-center">
                    {initials}
                  </div>
                )}
                <p className="m-0 text-[15.5px] leading-relaxed text-ink-dek">
                  <AuthorByline
                    post={post}
                    name={name}
                    avatarUrl={avatar}
                    size="md"
                    label=""
                    className="inline-flex"
                  />{' '}
                  covers <Link href={sectionPath(post.bucket)}>{post.bucket || 'the news'}</Link> at Wirefringe.{' '}
                  <Link href={authorPath(post)}>More by {name}</Link>
                </p>
              </div>
            ) : null}

            <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />

            <ArticleBody
              html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
              magazine
              className="article-body--verge"
            />

            <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />

            <CommentsCta count={post.commentCount} onClick={onOpenComments} />

            {(post.tags || []).length ? (
              <p className="mt-6 text-[13px] text-ink-secondary">
                Tags:{' '}
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="mr-2 text-mint">
                    {tag}
                  </Link>
                ))}
              </p>
            ) : null}

            <FollowBar
              topic={post.bucket || 'News'}
              author={post.creatorName || post.creator}
              loginNext={router.asPath}
            />
          </article>

          <aside className="relative min-w-0 min-[1001px]:self-stretch">
            <AdUnit variant="sidebar" slot={AD_SLOTS.sidebar} label="Advertisement" />
            <div className="relative pt-2 max-[1000px]:static min-[1001px]:sticky min-[1001px]:top-[calc(var(--header-height,96px)+16px)] min-[1001px]:z-[2]">
              <span className="wf-mark pointer-events-none select-none hidden min-[1001px]:flex" aria-hidden="true">
                <span>F</span>
                <span>W</span>
              </span>
              <h3 className="relative z-[1] font-mono text-[13px] tracking-[0.06em] uppercase text-mint font-bold mt-4 mb-1.5">
                Most Popular
              </h3>
              <ol className="relative z-[1] list-none m-0 p-0">
                {sidebarPosts.map((p, index) => (
                  <li key={p.id} className="border-t border-line py-[18px] last:border-b">
                    <Link
                      href={postUrl(p)}
                      className="flex gap-3 no-underline text-ink font-sans font-bold text-base leading-snug hover:text-mint"
                    >
                      <span className="font-mono text-mint font-bold shrink-0">{index + 1}.</span>
                      <span>{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>

      {moreInBucket.length > 0 ? (
        <section className="on-accent bg-[#5FF2C0] text-[#111] py-8 mt-6">
          <div className="max-w-[1360px] mx-auto px-5 md:px-10 grid grid-cols-1 min-[1001px]:grid-cols-[1fr_280px] gap-8 min-[1001px]:gap-12">
            <div>
              <h3 className="text-[14px] font-semibold mb-3.5 text-[#111]">
                More in{' '}
                <Link
                  href={`/?category=${encodeURIComponent(
                    String(post.bucket || '')
                      .toLowerCase()
                      .replace(/ & /g, '-')
                      .replace(/ /g, '-')
                  )}`}
                  className="underline"
                >
                  {post.bucket || 'News'}
                </Link>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 min-[1001px]:grid-cols-3 gap-x-5 gap-y-4">
                {moreInBucket.slice(0, 3).map((p) => (
                  <Link key={p.id} href={postUrl(p)} className="group block text-inherit">
                    <div className="aspect-[16/9] rounded-md mb-2 overflow-hidden bg-[#111]/10">
                      {p.ogImg ? (
                        <img
                          src={p.ogImg}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <h4 className="m-0 font-sans font-extrabold text-sm leading-snug line-clamp-2 text-[#111] group-hover:text-[#0b8f72]">
                      {p.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
            <aside>
              <h3 className="text-[14px] font-extrabold mb-1 text-[#111]">Top Stories</h3>
              <ul className="list-none m-0 p-0">
                {sidebarPosts.slice(0, 3).map((p) => (
                  <li key={p.id} className="border-t border-black/15 py-2.5">
                    {p.date ? (
                      <span className="block font-mono text-[10.5px] text-black/55 mb-0.5">
                        {p.date
                          .toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                          .toUpperCase()}
                      </span>
                    ) : null}
                    <Link
                      href={postUrl(p)}
                      className="font-sans font-extrabold text-sm leading-snug line-clamp-2 hover:text-[#0b8f72]"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      ) : null}
    </>
  );
}
