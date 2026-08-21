/**
 * Shared API client for Wirefringe
 * DRY: Centralized fetch logic used across all admin components
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Server-side (SSR / getStaticProps) must call FastAPI directly.
 * Prefer INTERNAL_API_URL, then BACKEND_URL, then monorepo default :8000
 * (GridWork / Docker run API on 8000; local can override via env).
 */
function internalApiBase() {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const { skipAuth = false, headers: extraHeaders, ...fetchOptions } = options;
  // Use absolute URL if on server and not a full URL
  const url =
    typeof window === 'undefined' && !path.startsWith('http')
      ? `${internalApiBase()}${path}`
      : path;

  const token =
    !skipAuth && typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(extraHeaders || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers,
    ...fetchOptions,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON:', text);
    throw err;
  }
}

// Fetcher for SWR
export const fetcher = (url) => api(url);

export async function uploadFile(path, file) {
  const fd = new FormData();
  fd.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: fd,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new ApiError(detail, res.status);
  }

  return await res.json();
}

// Auth API
export const authApi = {
  login: (email, password) =>
    api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, username: email, password }),
    }),
  login2fa: (ticket, code) =>
    api('/api/admin/login/2fa', {
      method: 'POST',
      body: JSON.stringify({ ticket, code }),
    }),
  signup: (email, password, displayName) =>
    api('/api/admin/signup', {
      method: 'POST',
      body: JSON.stringify({ email, username: email, password, displayName }),
    }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return api('/api/admin/logout', { method: 'POST' });
  },
  me: () => api('/api/admin/me', { method: 'GET' }),
  updateProfile: (displayNameOrPayload) => {
    const payload =
      displayNameOrPayload && typeof displayNameOrPayload === 'object'
        ? displayNameOrPayload
        : { displayName: displayNameOrPayload };
    return api('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  myComments: () => api('/api/me/comments', { method: 'GET' }),
  uploadPhoto: (file) => uploadFile('/api/admin/profile/photo', file),
  updateBrandByline: (enabled) =>
    api('/api/admin/profile/brand-byline', {
      method: 'PUT',
      body: JSON.stringify({ enabled: !!enabled }),
    }),
  uploadBrandLogo: (file) => uploadFile('/api/admin/profile/brand-logo', file),
  changePassword: (currentPassword, newPassword) =>
    api('/api/admin/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Posts API
export const postsApi = {
  list: () => api('/api/admin/posts', { method: 'GET' }),
  forYou: (limit = 20) => api(`/api/posts/for-you?limit=${limit}`, { method: 'GET' }),
  get: (id) => api(`/api/admin/post?id=${encodeURIComponent(id)}`, { method: 'GET' }),
  create: (payload) =>
    api('/api/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    api(`/api/admin/post?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id) =>
    api(`/api/admin/post?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  publish: (id) =>
    api(`/api/admin/post/publish?id=${encodeURIComponent(id)}`, { method: 'POST' }),
  processQueueItem: (link) =>
    api(`/api/admin/posts/queue/process?link=${encodeURIComponent(link)}`, { method: 'POST' }),
  deleteQueueItem: (link) =>
    api(`/api/admin/posts/queue?link=${encodeURIComponent(link)}`, { method: 'DELETE' }),
  bulkDeleteQueueItems: (links) =>
    api(`/api/admin/posts/queue/bulk-delete`, { method: 'POST', body: JSON.stringify(links) }),
  bulkProcessQueueItems: (links) =>
    api(`/api/admin/posts/queue/bulk-process`, { method: 'POST', body: JSON.stringify(links) }),
  refreshQueueFeeds: () =>
    api(`/api/admin/posts/queue/refresh-feeds`, { method: 'POST' }),
  setStatus: (id, status, scheduledAt) =>
    api(`/api/admin/posts/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, scheduledAt: scheduledAt || null }),
    }),
  revisions: (id) => api(`/api/admin/posts/${encodeURIComponent(id)}/revisions`, { method: 'GET' }),
  rollback: (id, revisionId) =>
    api(`/api/admin/posts/${encodeURIComponent(id)}/revisions/${revisionId}/rollback`, {
      method: 'POST',
    }),
  related: (id) => api(`/api/posts/${encodeURIComponent(id)}/related`, { method: 'GET' }),
  search: (q) => api(`/api/search?q=${encodeURIComponent(q)}`, { method: 'GET' }),
  section: (slug) => api(`/api/section/${encodeURIComponent(slug)}`, { method: 'GET' }),
  author: (slug) => api(`/api/authors/${encodeURIComponent(slug)}`, { method: 'GET' }),
};

export const newsroomApi = {
  catalog: () => api('/api/catalog', { method: 'GET' }),
  getCatalog: () => api('/api/admin/catalog', { method: 'GET' }),
  saveCatalog: (payload) =>
    api('/api/admin/catalog', { method: 'PUT', body: JSON.stringify(payload) }),
  frontpage: () => api('/api/frontpage', { method: 'GET' }),
  saveFrontpage: (payload) =>
    api('/api/admin/frontpage', { method: 'PUT', body: JSON.stringify(payload) }),
  masthead: () => api('/api/masthead', { method: 'GET' }),
  saveMasthead: (payload) =>
    api('/api/admin/masthead', { method: 'PUT', body: JSON.stringify(payload) }),
  subscribe: (email, source) =>
    api('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    }),
  subscribers: () => api('/api/admin/newsletter/subscribers', { method: 'GET' }),
  issues: () => api('/api/admin/newsletter/issues', { method: 'GET' }),
  createIssue: (subject, body) =>
    api('/api/admin/newsletter/issues', {
      method: 'POST',
      body: JSON.stringify({ subject, body }),
    }),
  sendTip: (contact, message) =>
    api('/api/tips', { method: 'POST', body: JSON.stringify({ contact, message }) }),
  tips: () => api('/api/admin/tips', { method: 'GET' }),
  markTipRead: (id) => api(`/api/admin/tips/${id}/read`, { method: 'POST' }),
  deleteTip: (id) => api(`/api/admin/tips/${id}`, { method: 'DELETE' }),
  unreadTips: () => api('/api/admin/tips/unread-count', { method: 'GET' }),
  follows: () => api('/api/me/follows', { method: 'GET' }),
  follow: (kind, target) =>
    api('/api/me/follows', { method: 'POST', body: JSON.stringify({ kind, target }) }),
  unfollow: (kind, target) =>
    api('/api/me/follows', { method: 'DELETE', body: JSON.stringify({ kind, target }) }),
  saveNotify: (payload) =>
    api('/api/me/notifications', { method: 'PUT', body: JSON.stringify(payload) }),
  redirects: () => api('/api/admin/redirects', { method: 'GET' }),
  addRedirect: (fromPath, toPath) =>
    api('/api/admin/redirects', { method: 'POST', body: JSON.stringify({ fromPath, toPath }) }),
  deleteRedirect: (id) => api(`/api/admin/redirects/${id}`, { method: 'DELETE' }),
  analytics: () => api('/api/admin/analytics', { method: 'GET' }),
  forgotPassword: (email) =>
    api('/api/auth/forgot', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, newPassword) =>
    api('/api/auth/reset', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ token, newPassword }),
    }),
  verifyEmail: (token) =>
    api('/api/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  sendVerify: () => api('/api/me/verify-email', { method: 'POST' }),
  setup2fa: () => api('/api/me/2fa/setup', { method: 'POST' }),
  confirm2fa: (code) =>
    api('/api/me/2fa/confirm', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2fa: () => api('/api/me/2fa', { method: 'DELETE' }),
};

// Categories API
export const categoriesApi = {
  list: () => api('/api/categories', { method: 'GET' }),
  listWithCounts: () => api('/api/categories/with-counts', { method: 'GET' }),
  create: (name) =>
    api('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  delete: (id) =>
    api(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// Users API
export const usersApi = {
  list: () => api('/api/admin/users', { method: 'GET' }),
  create: (email, password, role) =>
    api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, username: email, password, role }),
    }),
  setPassword: (id, newPassword) =>
    api(`/api/admin/users/${encodeURIComponent(id)}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    }),
  setRole: (id, role) =>
    api(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  /**
   * Delete a user.
   * @param {number|string} id
   * @param {{ postsAction?: 'delete'|'transfer'|'keep', transferToUserId?: number|null }} [options]
   */
  delete: (id, options = {}) =>
    api(`/api/admin/users/${encodeURIComponent(id)}/delete`, {
      method: 'POST',
      body: JSON.stringify({
        postsAction: options.postsAction || 'transfer',
        transferToUserId:
          options.transferToUserId === undefined || options.transferToUserId === null
            ? null
            : Number(options.transferToUserId),
      }),
    }),
  /** Move one login account's posts to another login. Source user stays. */
  transferPosts: (id, transferToUserId) =>
    api(`/api/admin/users/${encodeURIComponent(id)}/transfer-posts`, {
      method: 'POST',
      body: JSON.stringify({ transferToUserId: Number(transferToUserId) }),
    }),
  /** Create login account for post-creator with no users row (Krishna, Reet, etc.) */
  claimOrphan: (payload) =>
    api('/api/admin/users/orphans/claim', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  /** Move all posts from orphan creator name → existing user */
  reassignOrphan: (creatorName, transferToUserId) =>
    api('/api/admin/users/orphans/reassign', {
      method: 'POST',
      body: JSON.stringify({ creatorName, transferToUserId: Number(transferToUserId) }),
    }),
  /** Delete all posts by a creator name */
  deleteOrphanPosts: (creatorName) =>
    api('/api/admin/users/orphans/delete-posts', {
      method: 'POST',
      body: JSON.stringify({ creatorName }),
    }),
};

// Comments API
export const commentsApi = {
  list: () => api('/api/admin/comments', { method: 'GET' }),
  getPendingCount: () => api('/api/admin/comments/pending-count', { method: 'GET' }),
  getTrending: (days = 15, limit = 8) =>
    api(`/api/admin/comments/trending?days=${days}&limit=${limit}`, { method: 'GET' }),
  approve: (id) =>
    api(`/api/admin/comments/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
  disapprove: (id) =>
    api(`/api/admin/comments/${encodeURIComponent(id)}/disapprove`, { method: 'DELETE' }),
  delete: (id) =>
    api(`/api/admin/comments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  report: (id, reason) =>
    api(`/api/comments/${encodeURIComponent(id)}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  listReports: () => api('/api/admin/comments/reports', { method: 'GET' }),
  dismissReport: (id) =>
    api(`/api/admin/comments/reports/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// Contact API
export const contactApi = {
  submit: (payload) =>
    api('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  list: () => api('/api/admin/contact', { method: 'GET' }),
  unreadCount: () => api('/api/admin/contact/unread-count', { method: 'GET' }),
  markRead: (id) =>
    api(`/api/admin/contact/${encodeURIComponent(id)}/read`, { method: 'POST' }),
  delete: (id) =>
    api(`/api/admin/contact/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// Media API
export const mediaApi = {
  list: () => api('/api/admin/media', { method: 'GET' }),
  upload: (file) => uploadFile('/api/admin/upload-image', file),
};

// Logs API
export const logsApi = {
  list: (skip = 0, limit = 100) => api(`/api/admin/logs?skip=${skip}&limit=${limit}`, { method: 'GET' }),
  clear: () => api('/api/admin/logs', { method: 'DELETE' }),
};

// AdSense settings API
export const adsenseApi = {
  public: () => api('/api/adsense/public', { method: 'GET' }),
  get: () => api('/api/admin/adsense', { method: 'GET' }),
  update: (payload) =>
    api('/api/admin/adsense', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  clear: () => api('/api/admin/adsense', { method: 'DELETE' }),
};

// News bot settings API
export const botApi = {
  get: () => api('/api/admin/bot', { method: 'GET' }),
  update: (payload) =>
    api('/api/admin/bot', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  hideArticles: () => api('/api/admin/bot/hide-articles', { method: 'POST' }),
  unhideArticles: () => api('/api/admin/bot/unhide-articles', { method: 'POST' }),
};
