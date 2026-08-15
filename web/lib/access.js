/** Newsroom access: who can see which admin view, and who can do what. */

export const ROLES = {
  admin: 'admin',
  editor: 'editor',
  author: 'author',
};

/** Views each role may open in the admin panel. */
export const VIEW_ROLES = {
  dashboard: ['admin', 'editor', 'author'],
  posts: ['admin', 'editor', 'author'],
  media: ['admin', 'editor', 'author'],
  comments: ['admin', 'editor', 'author'],
  settings: ['admin', 'editor', 'author'],
  categories: ['admin', 'editor'],
  contact: ['admin', 'editor'],
  tips: ['admin', 'editor'],
  frontpage: ['admin', 'editor'],
  newsletter: ['admin', 'editor'],
  analytics: ['admin', 'editor'],
  users: ['admin'],
  redirects: ['admin'],
  masthead: ['admin'],
  adsense: ['admin'],
  bot: ['admin'],
  logs: ['admin'],
};

export function roleOf(user) {
  return String(user?.role || user || '').trim().toLowerCase();
}

export function canAccessView(userOrRole, viewId) {
  const role = roleOf(userOrRole);
  const allowed = VIEW_ROLES[viewId];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function accessFor(userOrRole) {
  const role = roleOf(userOrRole);
  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';
  const isAuthor = role === 'author';
  const isDesk = isAdmin || isEditor;
  const isNewsroom = isAdmin || isEditor || isAuthor;

  return {
    role,
    isAdmin,
    isEditor,
    isAuthor,
    isDesk,
    isNewsroom,
    canAccessView: (viewId) => canAccessView(role, viewId),
    canManageUsers: isAdmin,
    canManageSystem: isAdmin,
    canRunBot: isAdmin,
    canManageAds: isAdmin,
    canManageRedirects: isAdmin,
    canEditMasthead: isAdmin,
    canManageCategories: isDesk,
    canProgramHomepage: isDesk,
    canSeeAnalytics: isDesk,
    canSeeInbox: isDesk,
    canProcessQueue: isDesk,
    canPublish: isDesk,
    canUnpublish: isDesk,
    canPin: isDesk,
    canMarkSponsored: isDesk,
    canDeleteAnyPost: isDesk,
    canDeleteOwnDraft: isNewsroom,
    canModerateComments: isDesk,
    canSeeReports: isDesk,
    canSeeBotCache: isAdmin,
    dashboard: {
      showSiteStats: isDesk,
      showMyStats: isAuthor,
      showPendingComments: isNewsroom,
      showCategories: isDesk,
      showMedia: isNewsroom,
      showGrowth: isDesk,
      showCommentsTrend: isDesk,
      showBotCache: isAdmin,
      showMemberStats: isAdmin,
    },
    label:
      isAdmin
        ? 'Admin — full newsroom and system'
        : isEditor
          ? 'Editor — desk: publish, inbox, front page'
          : isAuthor
            ? 'Author — your stories only; editors publish'
            : 'No newsroom access',
    summary:
      isAdmin
        ? 'You can see every dashboard number, manage staff, ads, and the news bot.'
        : isEditor
          ? 'You run the desk: all stories, comments, contact, tips, front page, and analytics. You cannot manage users or the bot.'
          : isAuthor
            ? 'You see only your own articles and comments. Save as draft or send to review — an editor publishes.'
            : '',
  };
}
