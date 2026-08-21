import ArticleBody from '../ArticleBody/ArticleBody';
import AdUnit from '../AdUnit/AdUnit';
import { AD_SLOTS } from '../../lib/ads';
import { stripHtml } from '../../lib/utils';
import {
  AuthorBioRow,
  ReadingProgress,
  StoryFlags,
  StoryFooter,
  StoryShell,
} from './shared';

export default function MagazinePost({ post, router, onOpenComments, sidebarPosts, moreInBucket }) {
  return (
    <div className="post-design-magazine bg-bg text-ink">
      <ReadingProgress color="var(--mint)" />
      <StoryShell
        post={post}
        sidebarPosts={sidebarPosts}
        moreInBucket={moreInBucket}
        bandTone="plain"
        showMark
      >
        <article>
          <StoryFlags post={post} />
          <div className="mb-8 border-y border-line py-5">
            <AuthorBioRow post={post} />
          </div>
          <AdUnit variant="banner" slot={AD_SLOTS.leaderboard} label="Advertisement" />
          <ArticleBody
            html={post.content || `<p>${stripHtml(post.excerpt || '')}</p>`}
            magazine
            className="article-body--verge"
          />
          <AdUnit variant="multipath" slot={AD_SLOTS.multipath} label="Advertisement" />
          <StoryFooter post={post} router={router} onOpenComments={onOpenComments} />
        </article>
      </StoryShell>
    </div>
  );
}
