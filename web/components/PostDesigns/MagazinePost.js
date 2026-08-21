import ArticleBody from '../ArticleBody/ArticleBody';
import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';
import { stripHtml } from '../../lib/utils';
import {
  AuthorBioRow,
  StoryFlags,
  StoryFooter,
  StoryShell,
} from './shared';
import { KeyPoints, UpdatedStamp } from './reading';

export default function MagazinePost({
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
  return (
    <div className="post-design-magazine bg-bg text-ink">
      <StoryShell
        post={post}
        sidebarPosts={sidebarPosts}
        moreInBucket={moreInBucket}
        bandTone="plain"
        showMark
        headings={headings}
      >
        <article>
          <UpdatedStamp post={post} />
          <StoryFlags post={post} />
          <div className="mb-8 border-y border-line py-5">
            <AuthorBioRow post={post} />
          </div>
          <KeyPoints points={keyPoints} />
          <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
          <ArticleBody
            html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
            magazine
            className="article-body--verge"
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
