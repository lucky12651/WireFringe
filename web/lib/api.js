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

export async function api(path, options = {}) {
  // Use absolute URL if on server and not a full URL
  const url =
    typeof window === 'undefined' && !path.startsWith('http')
      ? `${internalApiBase()}${path}`
      : path;

  // Add JWT token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
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

  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return await res.json();
}

// Auth API
export const authApi = {
  login: (username, password) =>
    api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  signup: (username, password, displayName) =>
    api('/api/admin/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return api('/api/admin/logout', { method: 'POST' });
  },
  me: () => api('/api/admin/me', { method: 'GET' }),
  updateProfile: (displayName) =>
    api('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify({ displayName }),
    }),
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
  create: (username, password, role) =>
    api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
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
   * @param {{ postsAction?: 'delete'|'transfer', transferToUserId?: number|null }} [options]
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
