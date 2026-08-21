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

export function hasBotAccess(userOrRole) {
  if (userOrRole && typeof userOrRole === 'object') {
    if (roleOf(userOrRole) === 'admin') return true;
    return Boolean(userOrRole.canRunBot);
  }
  return roleOf(userOrRole) === 'admin';
}

export function canAccessView(userOrRole, viewId) {
  if (viewId === 'bot' || viewId === 'logs') {
    return hasBotAccess(userOrRole);
  }
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
  const botAccess = hasBotAccess(userOrRole);

  return {
    role,
    isAdmin,
    isEditor,
    isAuthor,
    isDesk,
    isNewsroom,
    canAccessView: (viewId) => canAccessView(userOrRole, viewId),
    canManageUsers: isAdmin,
    canManageSystem: isAdmin,
    canRunBot: botAccess,
    canManageAds: isAdmin,
    canManageRedirects: isAdmin,
    canEditMasthead: isAdmin,
    canManageCategories: isDesk,
    canProgramHomepage: isDesk,
    canSeeAnalytics: isDesk,
    canSeeInbox: isDesk,
    canProcessQueue: isDesk || botAccess,
    canPublish: isDesk,
    canUnpublish: isDesk,
    canPin: isDesk,
    canMarkSponsored: isDesk,
    canDeleteAnyPost: isDesk,
    canDeleteOwnDraft: isNewsroom,
    canModerateComments: isDesk,
    canSeeReports: isDesk,
    canSeeBotCache: botAccess,
    dashboard: {
      showSiteStats: isDesk,
      showMyStats: isAuthor,
      showPendingComments: isNewsroom,
      showCategories: isDesk,
      showMedia: isNewsroom,
      showGrowth: isDesk,
      showCommentsTrend: isDesk,
      showBotCache: botAccess,
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
          ? botAccess
            ? 'You run the desk: all stories, comments, contact, tips, front page, and analytics. You can also use the news bot.'
            : 'You run the desk: all stories, comments, contact, tips, front page, and analytics. You cannot manage users or the bot.'
          : isAuthor
            ? botAccess
              ? 'You see your own articles and comments, and you can use the news bot for your account.'
              : 'You see only your own articles and comments. Save as draft or send to review — an editor publishes.'
            : botAccess
              ? 'You can use the news bot from this account.'
              : '',
  };
}
